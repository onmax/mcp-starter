---
filepath: server/routes/mcp.ts
purpose: Main MCP server route with tools, resources, and prompts registration
category: routes
---

# MCP Server Route

Main HTTP endpoint that creates and configures the MCP server with all capabilities.

## Key Features

- **Browser redirect**: Redirects browsers to docs, allows MCP clients through
- **Server setup**: Creates MCP server instance with capabilities
- **Tools registration**: get_documentation, get_code, generate_mcp_boilerplate
- **Resources registration**: documentation and codebase indexes
- **Prompts registration**: customize_template, understand_pattern

## Validation Schemas

```ts
const GetDocSchema = z.object({
  section: z.string().optional(),
  search_query: z.string().optional(),
})

const GetCodeSchema = z.object({
  filepath: z.string().optional(),
  category: z.enum(['routes', 'api-handlers', 'config', 'tests', 'utils']).optional(),
  search_pattern: z.string().optional(),
})

const GenerateSchema = z.object({
  type: z.enum(['tool', 'resource', 'prompt']),
  description: z.string(),
  format: z.enum(['typescript', 'python']).optional().default('typescript'),
})
```

## Resources

### Documentation Resource

```ts
server.registerResource(
  'documentation',
  'resource://mcp-starter/documentation',
  {
    title: 'Documentation Index',
    description: 'Index of all documentation sections',
  },
  async (uri) => {
    const docs = await $fetch('/api/mcp/get-documentation')
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(docs, null, 2)
      }]
    }
  }
)
```

### Codebase Resource

```ts
server.registerResource(
  'codebase',
  'resource://mcp-starter/codebase',
  {
    title: 'Codebase Index',
    description: 'Index of key code files',
  },
  async (uri) => {
    const code = await $fetch('/api/mcp/get-code')
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(code, null, 2)
      }]
    }
  }
)
```

## Tools

All tools delegate to API handlers for business logic, keeping route focused on MCP protocol concerns.

### get_documentation

Three modes: list all sections, get specific section, search across docs.

### get_code

Four modes: list all files, filter by category, get specific file, search code.

### generate_mcp_boilerplate

Generates TypeScript or Python boilerplate for tools, resources, or prompts.

## Prompts

### customize_template

Step-by-step guide for customizing template for specific use case.

### understand_pattern

Explains MCP patterns (list-search, caching, validation, error-handling) with codebase examples.

## Transport Setup

Uses StreamableHTTPServerTransport for SSE-based communication over HTTP.

```ts
const transport = new StreamableHTTPServerTransport('/mcp', event.node.req, event.node.res)
await server.connect(transport)

// Cleanup on close
event.node.res.on('close', () => {
  server.close()
})
```
