import { z } from 'zod'

const GenerateSchema = z.object({
  type: z.enum(['tool', 'resource', 'prompt']),
  description: z.string(),
  format: z.enum(['typescript', 'python']).optional().default('typescript'),
})

export default defineCachedEventHandler(async (event) => {
  const { type, description, format } = await getValidatedQuery(event, GenerateSchema.parse)

  if (type === 'tool' && format === 'typescript') {
    return {
      type: 'tool',
      format: 'typescript',
      code: generateTypeScriptTool(description)
    }
  }

  if (type === 'resource' && format === 'typescript') {
    return {
      type: 'resource',
      format: 'typescript',
      code: generateTypeScriptResource(description)
    }
  }

  if (type === 'prompt' && format === 'typescript') {
    return {
      type: 'prompt',
      format: 'typescript',
      code: generateTypeScriptPrompt(description)
    }
  }

  // Python format (basic templates)
  if (format === 'python') {
    return {
      type,
      format: 'python',
      code: generatePythonBoilerplate(type, description)
    }
  }

  throw createError({
    statusCode: 400,
    message: `Unsupported combination: ${type} + ${format}`
  })
}, {
  maxAge: 60 * 60,
  getKey: (event) => {
    const { type, format } = getQuery(event)
    return `generate-${type}-${format}`
  }
})

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

function generatePythonBoilerplate(type: string, description: string): string {
  if (type === 'tool') {
    return `# Python MCP Tool
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
`
  }

  return `# Python MCP ${type} - TODO: Implement`
}
