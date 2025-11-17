const PATTERNS: Record<string, { code: string, explanation: string }> = {
  'list-search': {
    code: `// Consolidated tool: list/get/search in one
export default defineCachedEventHandler(async (event) => {
  const { id, search_query } = await getValidatedQuery(event, ToolSchema.parse)
  const allItems = await queryCollection('items').all()

  // List mode - no params
  if (!id && !search_query) {
    return { mode: 'list', items: allItems.map(i => ({ id: i.id, name: i.name })) }
  }

  // Get mode - specific ID
  if (id) {
    const item = allItems.find(i => i.id === id)
    if (!item) {
      const available = allItems.map(i => i.id).join(', ')
      throw createError({ statusCode: 404, message: \`ID '\${id}' not found. Available: \${available}\` })
    }
    return { mode: 'get', item }
  }

  // Search mode - query term
  if (search_query) {
    const matches = allItems.filter(i => 
      JSON.stringify(i).toLowerCase().includes(search_query.toLowerCase())
    )
    return { mode: 'search', query: search_query, results: matches }
  }
}, {
  maxAge: 60 * 60,
  getKey: (event) => {
    const { id, search_query } = getQuery(event)
    return \`tool-\${id || ''}-\${search_query || 'list'}\`
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
- Natural for LLMs to use`
  },

  'caching': {
    code: `// Cache expensive operations
export default defineCachedEventHandler(async (event) => {
  const { query } = await getValidatedQuery(event, ToolSchema.parse)
  
  // Expensive operation (DB query, API call, etc.)
  const results = await expensiveQuery(query)
  
  return { results }
}, {
  maxAge: 60 * 60,  // Cache for 1 hour
  getKey: (event) => {
    const { query } = getQuery(event)
    return \`expensive-\${query}\`
  }
})`,
    explanation: `**Caching Pattern**

Cache responses to reduce load and improve speed.

**Configuration:**
- \`maxAge\`: How long to cache (seconds)
- \`getKey\`: Custom cache key per query params

**When to cache:**
- Content that changes infrequently
- Expensive operations (DB, external API)
- High-traffic endpoints

**Cache duration guide:**
- Static content: 24 hours
- Reference data: 1 hour
- User data: 5 minutes
- Real-time data: Don't cache

**Nuxt auto-invalidates cache on redeploy.**`
  },

  'validation': {
    code: `import { z } from 'zod'

// Define schema
const ToolSchema = z.object({
  name: z.string().min(1).max(100),
  age: z.number().min(0).max(150),
  role: z.enum(['user', 'admin']),
  email: z.string().email().optional(),
})

// Use in handler
export default defineCachedEventHandler(async (event) => {
  const validated = await getValidatedQuery(event, ToolSchema.parse)
  
  // validated is fully typed and guaranteed valid
  return { success: true, data: validated }
}, {
  maxAge: 60,
  getKey: (event) => 'validation-example'
})

// Register tool with same schema
server.registerTool('tool_name', {
  argsSchema: ToolSchema,
  // ...
})`,
    explanation: `**Validation Pattern**

Use Zod schemas to validate all input parameters.

**Benefits:**
- Runtime type safety
- Auto-generated error messages
- Self-documenting schemas
- TypeScript inference

**Best practices:**
- Define in \`server/utils/schemas.ts\`
- Use \`.describe()\` for clear param docs
- Add constraints (\`.min()\`, \`.max()\`, \`.email()\`)
- Share schema between handler and MCP registration
- Use \`.optional()\` with \`.default()\` for optional params

**Common validators:**
- \`.string().min(1)\` - Required string
- \`.number().int().positive()\` - Positive integer
- \`.enum(['a', 'b'])\` - Fixed options
- \`.array(z.string())\` - String array`
  },

  'error-handling': {
    code: `export default defineCachedEventHandler(async (event) => {
  const { id } = await getValidatedQuery(event, ToolSchema.parse)
  
  const item = await findItem(id)
  
  if (!item) {
    // Show available options
    const allItems = await getAllItems()
    const available = allItems.map(i => i.id).join(', ')
    
    // Suggest corrections
    const similar = allItems.find(i => 
      levenshteinDistance(i.id, id) < 3
    )
    
    const suggestion = similar 
      ? \`Did you mean '\${similar.id}'?\` 
      : \`Available: \${available}\`
    
    throw createError({
      statusCode: 404,
      message: \`Item '\${id}' not found. \${suggestion}\`
    })
  }
  
  return { item }
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

**Additional tips:**
- Include error codes for programmatic handling
- Provide next steps in error message
- Log errors server-side for debugging
- Use \`createError()\` for consistent format`
  },

  'pagination': {
    code: `const PaginatedSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(10),
  offset: z.number().min(0).optional().default(0),
})

export default defineCachedEventHandler(async (event) => {
  const { limit, offset } = await getValidatedQuery(event, PaginatedSchema.parse)
  
  const allItems = await queryCollection('items').all()
  const total = allItems.length
  const items = allItems.slice(offset, offset + limit)
  
  return {
    items,
    pagination: {
      limit,
      offset,
      total,
      hasMore: offset + limit < total,
      nextOffset: offset + limit < total ? offset + limit : null,
    }
  }
}, {
  maxAge: 60 * 5,
  getKey: (event) => {
    const { limit, offset } = getQuery(event)
    return \`paginated-\${limit}-\${offset}\`
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
- Cache paginated results separately
- Consider cursor-based pagination for large datasets

**LLM usage:**
LLM will automatically request next page if \`hasMore: true\`.`
  },

  'auth': {
    code: `const AuthSchema = z.object({
  api_key: z.string().optional(),
})

export default defineCachedEventHandler(async (event) => {
  const { api_key } = await getValidatedQuery(event, AuthSchema.parse)
  
  // Get API key from query param or environment
  const key = api_key || process.env.API_KEY
  
  if (!key) {
    throw createError({
      statusCode: 401,
      message: 'API key required. Provide via api_key parameter or set API_KEY environment variable.'
    })
  }
  
  // Validate API key
  const isValid = await validateApiKey(key)
  
  if (!isValid) {
    throw createError({
      statusCode: 403,
      message: 'Invalid API key. Check your credentials.'
    })
  }
  
  // Make authenticated request
  const data = await fetchWithAuth(key)
  
  return { data }
}, {
  maxAge: 0,  // Don't cache authenticated requests
})`,
    explanation: `**Authentication Pattern**

Handle API keys and authentication for external services.

**Approaches:**
1. **Environment variables** (recommended for production)
   - Set in \`.env\`: \`API_KEY=xxx\`
   - Access via \`process.env.API_KEY\`

2. **Query parameters** (for user-provided keys)
   - Accept \`api_key\` in tool params
   - LLM provides key from Claude Desktop config

3. **Hybrid** (fallback chain)
   - Try param first, then env var

**Security:**
- Never cache authenticated requests (\`maxAge: 0\`)
- Validate keys before using
- Use HTTPS in production
- Don't log keys

**Error messages:**
- Guide users to config location
- Distinguish between "missing" vs "invalid"`
  },
}

export default defineCachedEventHandler(async (event) => {
  const { pattern, format } = await getValidatedQuery(event, GetPatternSchema.parse)

  const patternData = PATTERNS[pattern]

  if (!patternData) {
    const available = Object.keys(PATTERNS).join(', ')
    throw createError({
      statusCode: 404,
      message: `Pattern '${pattern}' not found. Available: ${available}`
    })
  }

  if (format === 'code') {
    return { pattern, code: patternData.code }
  }

  if (format === 'explanation') {
    return { pattern, explanation: patternData.explanation }
  }

  return { pattern, ...patternData }
}, {
  maxAge: 60 * 60 * 24, // Patterns don't change
  getKey: (event) => {
    const { pattern, format } = getQuery(event)
    return `pattern-${pattern}-${format || 'both'}`
  }
})
