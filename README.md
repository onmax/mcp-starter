# Nuxt MCP Starter

Nuxt 4 template for building production-ready MCP servers. Learn MCP patterns by querying this server itself.

## What This Is

A Nuxt MCP server that teaches you how to build MCP servers with Nuxt. Query it to:
- Get working code examples for MCP patterns
- Generate complete Nuxt MCP projects
- Debug common MCP setup issues
- Learn best practices through guided workflows

## Quick Start

### Prerequisites

- Node.js 18+ (`fnm use 24`)
- pnpm
- OpenAI API key (for evaluations)

### Installation

```bash
pnpm install
cp .env.example .env  # Add OPENAI_API_KEY
pnpm dev
```

MCP server runs at: `http://localhost:3000/mcp`

### Testing

```bash
npx @modelcontextprotocol/inspector http://localhost:3000/mcp  # MCP Inspector
pnpm eval        # Run evaluations
pnpm eval:ui     # View results
```

## Architecture

**Clean separation: Protocol → Handlers → Data**

```
server/
  routes/mcp.ts           # MCP protocol (tools, resources, prompts)
  api/mcp/
    get-pattern.get.ts    # Pattern examples handler
    create-nuxt-project.get.ts  # Project generator
    debug-setup.get.ts    # Debug helper
  utils/
    schemas.ts            # Zod schemas (autoimported)
tests/mcp/
  mcp.eval.ts            # Evaluations
```

### MCP Primitives

Following MCP spec:

1. **Resources** - Static data indexes (patterns, examples)
2. **Tools** - Parameterized operations (get_pattern, create_nuxt_project, debug_setup)
3. **Prompts** - Guided workflows (scaffold_for_api, add_tool)

## MCP Capabilities

### Resources (2)

Browse available data:

- **`resource://nuxt-mcp-starter/patterns`** - Index of 6 MCP patterns (list-search, caching, validation, error-handling, pagination, auth)
- **`resource://nuxt-mcp-starter/examples`** - Example projects (Recipe API, Database, File Search)

### Tools (3)

Core functionality:

**`get_pattern`** - Get MCP implementation patterns with working code
- Params: `pattern` (list-search | caching | validation | error-handling | pagination | auth), `format` (code | explanation | both)
- Returns: Code examples + explanations for Nuxt MCP patterns

**`create_nuxt_project`** - Generate complete Nuxt MCP project
- Params: `data_source` (api | database | file | custom), `use_case` (description), `auth_required` (boolean)
- Returns: Complete project code with handlers, schemas, MCP registration, evaluations

**`debug_setup`** - Troubleshoot MCP setup issues
- Params: `issue` (tools-not-showing | cors-error | schema-validation | transport-setup | general), `error_message` (optional)
- Returns: Diagnosis, solutions, troubleshooting steps

### Prompts (2)

Guided workflows:

**`scaffold_for_api`** - Step-by-step guide for wrapping an API with MCP
- Param: `api_description` (e.g., "GitHub REST API")
- Returns: 7-step guide from generation to deployment

**`add_tool`** - Guide for adding a tool to existing MCP server
- Param: `tool_purpose` (what the tool should do)
- Returns: Step-by-step implementation guide

## Usage Examples

### Creating a New MCP Project

```
User: I want to create a Nuxt MCP that queries a recipe API
MCP: [Uses create_nuxt_project with data_source: 'api', use_case: 'recipe API']
      [Returns complete project code with:
       - Zod schemas for validation
       - API handler with caching
       - MCP tool registration
       - Evaluation test cases]
```

### Learning Patterns

```
User: Show me how to implement caching in my MCP
MCP: [Uses get_pattern with pattern: 'caching']
     [Returns code example + explanation of caching strategy]
```

### Debugging

```
User: My tools aren't showing up in Claude Desktop
MCP: [Uses debug_setup with issue: 'tools-not-showing']
     [Returns 6 troubleshooting steps with specific fixes]
```

## MCP Best Practices

Following [MCP SDK guidelines](https://modelcontextprotocol.io):

### 1. Build for Workflows, Not API Endpoints

Consolidate related operations into single tools:

```typescript
// ❌ BAD: 3 separate tools
list_items()
get_item(id)
search_items(query)

// ✅ GOOD: 1 consolidated tool
get_items({ id?, query? })
  // No params → list all
  // id param → get specific
  // query param → search
```

### 2. Optimize for Limited Context

- Concise tool descriptions (20-30 words)
- High-signal responses, not data dumps
- Human-readable identifiers (names over IDs)
- Pagination for large datasets

### 3. Design Actionable Error Messages

```typescript
// ❌ BAD
throw createError({ statusCode: 404, message: 'Not found' })

// ✅ GOOD
const available = items.map(i => i.id).join(', ')
throw createError({ 
  statusCode: 404, 
  message: `Item '${id}' not found. Available: ${available}` 
})
```

### 4. Tool Annotations

Always include annotations:

```typescript
server.registerTool('tool_name', {
  // ...
  annotations: {
    readOnlyHint: true,        // Read-only operation
    destructiveHint: false,    // Non-destructive
    idempotentHint: true,      // Repeatable with same result
    openWorldHint: false,      // Internal data (true for external APIs)
  }
})
```

### 5. Input Validation with Zod

Define schemas in `server/utils/schemas.ts`:

```typescript
export const ToolSchema = z.object({
  query: z.string().describe('Search query'),
  limit: z.number().min(1).max(100).optional().default(10),
  category: z.enum(['all', 'active', 'archived']).optional(),
})
```

Use in handlers AND tool registration:

```typescript
// Handler
const args = await getValidatedQuery(event, ToolSchema.parse)

// MCP registration
server.registerTool('tool', { inputSchema: ToolSchema, ... })
```

### 6. Response Caching

Cache expensive operations:

```typescript
defineCachedEventHandler(async (event) => {
  // Handler logic
}, {
  maxAge: 60 * 60,  // 1 hour for stable content
  getKey: (event) => {
    const { query } = getQuery(event)
    return `tool-${query || 'default'}`
  }
})
```

**When to cache:**
- Static content: 24h
- Reference data: 1h
- User-specific: 5min
- Real-time: Don't cache
- Authenticated: `maxAge: 0`

## Implementation Guide

### 1. Define Schema

`server/utils/schemas.ts`:

```typescript
import { z } from 'zod'

export const SearchSchema = z.object({
  query: z.string().describe('Search term'),
  limit: z.number().min(1).max(100).optional().default(10),
})
```

### 2. Create Handler

`server/api/mcp/search.get.ts`:

```typescript
export default defineCachedEventHandler(async (event) => {
  const { query, limit } = await getValidatedQuery(event, SearchSchema.parse)
  
  const results = await yourDataSource.search(query)
  
  return { 
    query, 
    results: results.slice(0, limit),
    total: results.length 
  }
}, {
  maxAge: 60 * 5,
  getKey: (event) => {
    const { query } = getQuery(event)
    return `search-${query}`
  }
})
```

### 3. Register Tool

`server/routes/mcp.ts`:

```typescript
server.registerTool('search', {
  title: 'Search Items',
  description: 'Search items by query term with pagination',
  inputSchema: SearchSchema,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
}, async (args: any) => {
  const data = await $fetch('/api/mcp/search', { query: args })
  return { 
    content: [{ 
      type: 'text', 
      text: JSON.stringify(data, null, 2) 
    }] 
  }
})
```

### 4. Write Evaluations

`tests/mcp/mcp.eval.ts`:

```typescript
evalite('Search Tool', {
  data: async () => [{
    input: 'Search for recipes containing chocolate',
    expected: [{ toolName: 'search', args: { query: 'chocolate' } }],
  }],
  task: async (input) => {
    const mcpClient = await createMCPClient({ 
      transport: { type: 'http', url: 'http://localhost:3000/mcp' } 
    })
    const result = await generateText({ 
      model, 
      prompt: input, 
      tools: await mcpClient.tools() 
    })
    return result.toolCalls
  },
  scorers: [toolCallAccuracy]
})
```

## Patterns Reference

Use `get_pattern` tool to see full implementations.

### List-Search Pattern

Consolidate list/get/search into one tool with optional params.

### Caching Pattern

Cache responses with custom keys and TTL based on data volatility.

### Validation Pattern

Zod schemas for runtime validation and TypeScript inference.

### Error-Handling Pattern

Actionable errors with suggestions and available options.

### Pagination Pattern

Handle large datasets with limit/offset and hasMore metadata.

### Auth Pattern

API key validation with env var fallback and clear error messages.

## Deployment

Standard Nuxt deployment with MCP route at `/mcp`:

```bash
# Vercel
vercel deploy

# NuxtHub
npx nuxthub deploy

# Netlify
pnpm build
```

**Configure Claude Desktop** (`~/.config/claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "nuxt-mcp-starter": {
      "url": "https://your-domain.com/mcp"
    }
  }
}
```

## File Structure

```
server/
  routes/mcp.ts                    # MCP server + tool/resource/prompt registration
  api/mcp/
    get-pattern.get.ts             # Pattern examples with code
    create-nuxt-project.get.ts     # Project generator
    debug-setup.get.ts             # Debug helper
  utils/
    schemas.ts                     # Zod schemas (autoimported globally)
tests/mcp/
  mcp.eval.ts                      # Evaluation test suites
```

## Troubleshooting

Use `debug_setup` tool for common issues:

**Tools not showing in Claude Desktop:**
1. Verify server running at `http://localhost:3000/mcp`
2. Check `claude_desktop_config.json` has correct URL
3. Restart Claude Desktop completely
4. Test with MCP Inspector

**Schema validation errors:**
1. Ensure schema matches between handler and registration
2. Use `inputSchema` (not `argsSchema`) in `registerTool`
3. Test schema separately: `Schema.safeParse({ ... })`

**Transport/connection issues:**
1. Use `StreamableHTTPServerTransport` for HTTP
2. Add cleanup: `event.node.res.on('close', () => { transport.close(); server.close() })`
3. Read body: `await readBody(event)`

## Resources

- [MCP Protocol Spec](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Nuxt Documentation](https://nuxt.com)
- [Evalite Testing](https://evalite.dev)
- [Building Nuxt MCP Guide](https://nuxt.com/blog/building-nuxt-mcp)

## License

MIT
