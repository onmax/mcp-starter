function generateProjectCode(dataSource: string, useCase: string, authRequired: boolean): string {
  const authImport = authRequired ? `\nimport { validateApiKey } from '~/server/utils/auth'` : ''
  const authParam = authRequired ? `\n  api_key: z.string().optional().describe('API key for authentication'),` : ''
  const authCheck = authRequired ? `
  // Authenticate
  const apiKey = args.api_key || process.env.API_KEY
  if (!apiKey) {
    throw createError({ statusCode: 401, message: 'API key required' })
  }
  const isValid = await validateApiKey(apiKey)
  if (!isValid) {
    throw createError({ statusCode: 403, message: 'Invalid API key' })
  }
` : ''

  const dataFetching = {
    api: `const response = await $fetch('https://api.example.com/endpoint', { 
    query: { ...args },
    headers: ${authRequired ? '{ Authorization: `Bearer ${apiKey}` }' : '{}'}
  })
  return { data: response }`,
    database: `const db = useDatabase()
  const results = await db.query('SELECT * FROM items WHERE name LIKE ?', [\`%\${args.query}%\`])
  return { results }`,
    file: `const data = await queryCollection('${useCase.replace(/\s+/g, '-')}').all()
  const filtered = args.query 
    ? data.filter(item => JSON.stringify(item).toLowerCase().includes(args.query.toLowerCase()))
    : data
  return { results: filtered }`,
    custom: `// TODO: Implement your custom data fetching logic
  const data = await yourDataSource(args)
  return { data }`
  }

  return `// Generated Nuxt MCP Project for: ${useCase}

// 1. Create Nuxt project
// npm create nuxt@latest ${useCase.replace(/\s+/g, '-')}-mcp
// cd ${useCase.replace(/\s+/g, '-')}-mcp
// pnpm add @modelcontextprotocol/sdk zod

// 2. Create schema (server/utils/schemas.ts)
import { z } from 'zod'

export const YourToolSchema = z.object({
  query: z.string().describe('Search query'),${authParam}
  limit: z.number().min(1).max(100).optional().default(10).describe('Max results'),
})

// 3. Create API handler (server/api/mcp/your-tool.get.ts)
${authImport}

export default defineCachedEventHandler(async (event) => {
  const args = await getValidatedQuery(event, YourToolSchema.parse)
  ${authCheck}
  ${dataFetching[dataSource as keyof typeof dataFetching]}
}, {
  maxAge: ${authRequired ? '0' : '60 * 60'},
  getKey: (event) => {
    const { query } = getQuery(event)
    return \`your-tool-\${query || 'all'}\`
  }
})

// 4. Register MCP server (server/routes/mcp.ts)
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

function createServer() {
  const server = new McpServer(
    { name: '${useCase.replace(/\s+/g, '-')}-mcp', version: '1.0.0' },
    { capabilities: { tools: {} } }
  )

  server.registerTool('${useCase.replace(/\s+/g, '_')}', {
    title: '${useCase.charAt(0).toUpperCase() + useCase.slice(1)}',
    description: 'Search and retrieve ${useCase}',
    inputSchema: YourToolSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: ${dataSource === 'api'},
    },
  }, async (args: any) => {
    const data = await $fetch('/api/mcp/your-tool', { query: args })
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }]
    }
  })

  return server
}

export default defineEventHandler(async (event) => {
  if (getHeader(event, 'accept')?.includes('text/html')) {
    return sendRedirect(event, '/')
  }

  const server = createServer()
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })

  event.node.res.on('close', () => {
    transport.close()
    server.close()
  })

  await server.connect(transport)
  const body = await readBody(event)
  await transport.handleRequest(event.node.req, event.node.res, body)
})

// 5. Test with MCP Inspector
// pnpm dev
// Open Claude Desktop -> Settings -> Developer -> Add Server:
// {
//   "mcpServers": {
//     "${useCase.replace(/\s+/g, '-')}": {
//       "url": "http://localhost:3000/mcp"
//     }
//   }
// }

// 6. Create evaluation (tests/mcp/mcp.eval.ts)
import { evalite } from 'evalite'
import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { wrapAISDKModel } from 'evalite/ai-sdk'
import { toolCallAccuracy } from 'evalite/scorers'

const model = wrapAISDKModel(openai('gpt-4o-mini'))

evalite('${useCase} MCP', {
  data: async () => [{
    input: 'Search for ${useCase}',
    expected: [{ toolName: '${useCase.replace(/\s+/g, '_')}', args: { query: '${useCase}' } }],
  }],
  task: async (input) => {
    const mcpClient = await createMCPClient({ transport: { type: 'http', url: 'http://localhost:3000/mcp' } })
    const result = await generateText({ model, prompt: input, tools: await mcpClient.tools() })
    return result.toolCalls
  },
  scorers: [toolCallAccuracy]
})

// Run: pnpm eval
`
}

export default defineCachedEventHandler(async (event) => {
  const { data_source, use_case, auth_required } = await getValidatedQuery(event, CreateProjectSchema.parse)

  const code = generateProjectCode(data_source, use_case, auth_required)

  return {
    use_case,
    data_source,
    auth_required,
    code,
    next_steps: [
      'Copy code to your Nuxt project',
      'Customize data fetching logic',
      'Run pnpm dev',
      'Test with MCP Inspector or Claude Desktop',
      'Write evaluations',
    ]
  }
}, {
  maxAge: 0, // Don't cache - each generation is unique
})
