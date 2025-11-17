---
filepath: server/api/mcp/generate-mcp-boilerplate.get.ts
purpose: Generate TypeScript or Python boilerplate for MCP primitives
category: api-handlers
---

# Generate Boilerplate Handler

Generates complete, ready-to-use code for MCP tools, resources, and prompts.

## Supported Combinations

- TypeScript: tool, resource, prompt
- Python: tool (basic template)

## Request Schema

```ts
const GenerateSchema = z.object({
  type: z.enum(['tool', 'resource', 'prompt']),
  description: z.string(),
  format: z.enum(['typescript', 'python']).optional().default('typescript'),
})
```

## TypeScript Tool Template

```ts
function generateTypeScriptTool(description: string): string {
  return `// Tool Handler: server/api/mcp/your-tool.get.ts
import { z } from 'zod'

const YourToolSchema = z.object({
  query: z.string(),
  limit: z.number().min(1).max(100).optional().default(10),
})

export default defineCachedEventHandler(async (event) => {
  const { query, limit } = await getValidatedQuery(event, YourToolSchema.parse)

  // TODO: Implement your logic here
  // Description: ${description}

  const results = [] // Your data fetching logic

  return {
    query,
    results: results.slice(0, limit),
  }
}, {
  maxAge: 60 * 60,
  getKey: (event) => {
    const { query } = getQuery(event)
    return \`your-tool-\${query}\`
  }
})

// MCP Registration: server/routes/mcp.ts
server.registerTool(
  'your_tool_name',
  {
    title: 'Your Tool',
    description: '${description}',
    argsSchema: YourToolSchema,
  },
  async (args) => {
    const data = await $fetch('/api/mcp/your-tool', { query: args })
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(data, null, 2)
      }]
    }
  }
)
`
}
```

## TypeScript Resource Template

Includes URI, metadata, and data fetching structure.

```ts
function generateTypeScriptResource(description: string): string {
  return `// Resource Registration: server/routes/mcp.ts

server.registerResource(
  'your_resource',
  'resource://your-namespace/your-resource',
  {
    title: 'Your Resource',
    description: '${description}',
  },
  async (uri) => {
    // TODO: Fetch your data
    const data = {
      items: [],
      // Your resource structure
    }

    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2)
      }]
    }
  }
)
`
}
```

## TypeScript Prompt Template

Provides structured message format for LLM prompts.

```ts
function generateTypeScriptPrompt(description: string): string {
  return `// Prompt Registration: server/routes/mcp.ts
import { z } from 'zod'

const YourPromptSchema = z.object({
  context: z.string(),
})

server.registerPrompt(
  'your_prompt',
  {
    title: 'Your Prompt',
    description: '${description}',
    argsSchema: YourPromptSchema,
  },
  async ({ context }) => ({
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: \`Instructions for LLM based on context: \${context}

TODO: Provide step-by-step guidance
TODO: Reference which tools to use
TODO: Include examples\`
      }
    }]
  })
)
`
}
```

## Python Tool Template

Basic Pydantic-based tool structure.

```python
from mcp.server import Server
from pydantic import BaseModel

class YourToolArgs(BaseModel):
    query: str
    limit: int = 10

@mcp.tool()
async def your_tool(args: YourToolArgs) -> str:
    """
    ${description}
    """
    # TODO: Implement your logic
    results = []

    return json.dumps({
        "query": args.query,
        "results": results[:args.limit]
    })
```

## Caching

Caches by type and format only (not description).

```ts
{
  maxAge: 60 * 60,
  getKey: (event) => {
    const { type, format } = getQuery(event)
    return `generate-${type}-${format}`
  }
}
```
