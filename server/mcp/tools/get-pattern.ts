import { z } from 'zod'

const PATTERNS: Record<string, { code: string, explanation: string }> = {
  'list-search': {
    code: `// server/mcp/tools/items.ts - Consolidated list/get/search
export default defineMcpTool({
  description: 'Search, list, or get items. Use without params to list all, with id to get one, with query to search.',
  inputSchema: {
    id: z.string().optional().describe('Specific item ID to retrieve'),
    query: z.string().optional().describe('Search query to filter results'),
  },
  cache: '1h',
  handler: async ({ id, query }) => {
    const allItems = await queryCollection('items').all()

    // List mode - no params
    if (!id && !query) {
      return { content: [{ type: 'text', text: JSON.stringify({ mode: 'list', items: allItems.map(i => ({ id: i.id, name: i.name })) }) }] }
    }

    // Get mode - specific ID
    if (id) {
      const item = allItems.find(i => i.id === id)
      if (!item) {
        const available = allItems.map(i => i.id).join(', ')
        return { content: [{ type: 'text', text: \`ID '\${id}' not found. Available: \${available}\` }], isError: true }
      }
      return { content: [{ type: 'text', text: JSON.stringify({ mode: 'get', item }) }] }
    }

    // Search mode - query term
    const matches = allItems.filter(i => JSON.stringify(i).toLowerCase().includes(query!.toLowerCase()))
    return { content: [{ type: 'text', text: JSON.stringify({ mode: 'search', query, results: matches }) }] }
  }
})`,
    explanation: `**List-Search Pattern**

Consolidate list/get/search into ONE tool instead of three separate tools.

**Why:**
- Reduces context overhead (1 tool vs 3)
- LLM discovers all capabilities in one description
- Mirrors how users think ("I need to find X")

**When to use:**
- List: User knows category ("show all recipes")
- Get: User has ID ("get recipe 123")
- Search: User has topic ("find dessert recipes")

**Benefits:**
- 70% fewer tools in your MCP
- Consistent interface across data types
- Natural for LLMs to use`,
  },

  'caching': {
    code: `// server/mcp/tools/expensive-query.ts - Cached tool
export default defineMcpTool({
  description: 'Run expensive query with automatic caching',
  inputSchema: {
    query: z.string().describe('Query to execute'),
  },
  cache: '1h',  // Cache for 1 hour - toolkit handles cache key automatically
  handler: async ({ query }) => {
    // Expensive operation (DB query, API call, etc.)
    const results = await expensiveQuery(query)
    return { content: [{ type: 'text', text: JSON.stringify({ results }) }] }
  }
})`,
    explanation: `**Caching Pattern**

Cache responses to reduce load and improve speed.

**Configuration:**
- \`cache: '1h'\` - Cache duration (supports '1h', '24h', '5m', etc.)
- Toolkit auto-generates cache key from tool name + params

**When to cache:**
- Content that changes infrequently
- Expensive operations (DB, external API)
- High-traffic endpoints

**Cache duration guide:**
- Static content: '24h'
- Reference data: '1h'
- User data: '5m'
- Real-time data: Don't use cache

**Toolkit auto-invalidates cache on server restart.**`,
  },

  'validation': {
    code: `// server/mcp/tools/validated.ts - With Zod validation
import { z } from 'zod'

export default defineMcpTool({
  description: 'Example with comprehensive input validation',
  inputSchema: {
    name: z.string().min(1).max(100).describe('User name (required, 1-100 chars)'),
    age: z.number().min(0).max(150).describe('User age (0-150)'),
    role: z.enum(['user', 'admin']).describe('User role'),
    email: z.string().email().optional().describe('Optional email address'),
    limit: z.number().min(1).max(100).optional().default(10).describe('Max results (default: 10)'),
  },
  handler: async (validated) => {
    // validated is fully typed and guaranteed valid
    // TypeScript knows: { name: string, age: number, role: 'user' | 'admin', email?: string, limit: number }
    return { content: [{ type: 'text', text: JSON.stringify({ success: true, data: validated }) }] }
  }
})`,
    explanation: `**Validation Pattern**

Use Zod schemas in inputSchema for automatic validation.

**Benefits:**
- Runtime type safety
- Auto-generated error messages
- Self-documenting schemas
- TypeScript inference in handler

**Best practices:**
- Use \`.describe()\` for clear param docs (LLMs read these!)
- Add constraints (\`.min()\`, \`.max()\`, \`.email()\`)
- Use \`.optional()\` with \`.default()\` for optional params

**Common validators:**
- \`.string().min(1)\` - Required string
- \`.number().int().positive()\` - Positive integer
- \`.enum(['a', 'b'])\` - Fixed options
- \`.array(z.string())\` - String array`,
  },

  'error-handling': {
    code: `// server/mcp/tools/with-errors.ts - Actionable error messages
export default defineMcpTool({
  description: 'Tool demonstrating LLM-friendly error handling',
  inputSchema: {
    id: z.string().describe('Item ID to retrieve'),
  },
  handler: async ({ id }) => {
    const allItems = await getAllItems()
    const item = allItems.find(i => i.id === id)

    if (!item) {
      // Show available options
      const available = allItems.map(i => i.id).join(', ')

      // Suggest corrections
      const similar = allItems.find(i => levenshteinDistance(i.id, id) < 3)
      const suggestion = similar
        ? \`Did you mean '\${similar.id}'?\`
        : \`Available: \${available}\`

      return {
        content: [{ type: 'text', text: \`Item '\${id}' not found. \${suggestion}\` }],
        isError: true
      }
    }

    return { content: [{ type: 'text', text: JSON.stringify({ item }) }] }
  }
})`,
    explanation: `**Error Handling Pattern**

Provide actionable errors that guide LLMs toward correct usage.

**Principles:**
1. Show available options
2. Suggest corrections ("Did you mean X?")
3. Guide to alternative modes/tools
4. Use natural language

**Bad error:**
"Not found"

**Good error:**
"Item 'recipez' not found. Did you mean 'recipes'? Available: recipes, ingredients, users"

**LLM behavior:**
LLM will retry with suggested correction automatically.

**Use isError: true:**
Signals to MCP client this is an error response.`,
  },

  'pagination': {
    code: `// server/mcp/tools/paginated.ts - Handle large datasets
export default defineMcpTool({
  description: 'List items with pagination. Returns hasMore and nextOffset for continuation.',
  inputSchema: {
    limit: z.number().min(1).max(100).optional().default(10).describe('Items per page (default: 10, max: 100)'),
    offset: z.number().min(0).optional().default(0).describe('Starting position (default: 0)'),
  },
  cache: '5m',
  handler: async ({ limit, offset }) => {
    const allItems = await queryCollection('items').all()
    const total = allItems.length
    const items = allItems.slice(offset, offset + limit)

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          items,
          pagination: {
            limit,
            offset,
            total,
            hasMore: offset + limit < total,
            nextOffset: offset + limit < total ? offset + limit : null,
          }
        })
      }]
    }
  }
})`,
    explanation: `**Pagination Pattern**

Handle large datasets by returning data in chunks.

**Key components:**
- \`limit\`: Items per page (default 10, max 100)
- \`offset\`: Starting position (default 0)
- \`total\`: Total items available
- \`hasMore\`: Boolean for next page
- \`nextOffset\`: Offset for next page (null if done)

**Best practices:**
- Set reasonable max limit (50-100)
- Provide sensible defaults (10-20)
- Include pagination metadata in response
- Cache paginated results

**LLM usage:**
LLM will automatically request next page if \`hasMore: true\`.`,
  },

  'auth': {
    code: `// server/mcp/tools/authenticated.ts - API key handling
export default defineMcpTool({
  description: 'Tool requiring authentication. Provide api_key or set API_KEY env var.',
  inputSchema: {
    query: z.string().describe('Search query'),
    api_key: z.string().optional().describe('API key (optional if API_KEY env var set)'),
  },
  // Don't cache authenticated requests
  handler: async ({ query, api_key }) => {
    // Get API key from param or environment
    const key = api_key || process.env.API_KEY

    if (!key) {
      return {
        content: [{ type: 'text', text: 'API key required. Provide via api_key parameter or set API_KEY environment variable.' }],
        isError: true
      }
    }

    // Validate API key
    const isValid = await validateApiKey(key)
    if (!isValid) {
      return {
        content: [{ type: 'text', text: 'Invalid API key. Check your credentials.' }],
        isError: true
      }
    }

    // Make authenticated request
    const data = await fetchWithAuth(key, query)
    return { content: [{ type: 'text', text: JSON.stringify({ data }) }] }
  }
})`,
    explanation: `**Authentication Pattern**

Handle API keys and authentication for external services.

**Approaches:**
1. **Environment variables** (recommended for production)
   - Set in \`.env\`: \`API_KEY=xxx\`
   - Access via \`process.env.API_KEY\`

2. **Tool parameters** (for user-provided keys)
   - Accept \`api_key\` in inputSchema
   - LLM provides key from Claude Desktop config

3. **Hybrid** (fallback chain)
   - Try param first, then env var

**Security:**
- Never cache authenticated requests (omit cache property)
- Validate keys before using
- Use HTTPS in production
- Don't log keys

**Error messages:**
- Guide users to config location
- Distinguish between "missing" vs "invalid"`,
  },
}

export default defineMcpTool({
  description: `Get working TypeScript code + explanation for a specific Nuxt MCP implementation pattern using @nuxtjs/mcp-toolkit. Returns complete code examples you can copy-paste. Available patterns: "validation" (Zod input validation), "caching" (response caching), "auth" (API key authentication), "error-handling" (actionable error messages), "pagination" (large datasets), "list-search" (consolidate list/get/search operations).`,
  inputSchema: {
    pattern: z.enum(['list-search', 'caching', 'validation', 'error-handling', 'pagination', 'auth']).describe('Which MCP pattern to get. Examples: "validation" for Zod schemas, "auth" for API key handling, "caching" for response caching'),
    format: z.enum(['code', 'explanation', 'both']).optional().default('both').describe('Return format: "code" for code only, "explanation" for docs only, "both" for complete guide'),
  },
  cache: '24h',
  handler: async ({ pattern, format }) => {
    const patternData = PATTERNS[pattern]

    if (!patternData) {
      const available = Object.keys(PATTERNS).join(', ')
      return { content: [{ type: 'text', text: `Pattern '${pattern}' not found. Available: ${available}` }], isError: true }
    }

    if (format === 'code') {
      return { content: [{ type: 'text', text: patternData.code }] }
    }

    if (format === 'explanation') {
      return { content: [{ type: 'text', text: patternData.explanation }] }
    }

    return {
      content: [{
        type: 'text',
        text: `# ${pattern}\n\n${patternData.explanation}\n\n## Implementation\n\n\`\`\`typescript\n${patternData.code}\n\`\`\``,
      }],
    }
  },
})
