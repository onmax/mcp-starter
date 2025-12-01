/* eslint-disable no-template-curly-in-string */
import { z } from 'zod'

function generateProjectCode(dataSource: string, useCase: string, authRequired: boolean): string {
  const toolName = useCase.replace(/\s+/g, '-')
  const authParam = authRequired ? `\n    api_key: z.string().optional().describe('API key for authentication'),` : ''
  const authCheck = authRequired
    ? `
    // Authenticate
    const apiKey = api_key || process.env.API_KEY
    if (!apiKey) {
      return { content: [{ type: 'text', text: 'API key required. Provide via api_key or set API_KEY env var.' }], isError: true }
    }
`
    : ''

  const dataFetching = {
    api: `const response = await $fetch('https://api.example.com/endpoint', {
      query: { query },
      headers: ${authRequired ? '{ Authorization: `Bearer ${apiKey}` }' : '{}'}
    })
    return { content: [{ type: 'text', text: JSON.stringify({ data: response }) }] }`,
    database: `const db = useDatabase()
    const results = await db.query('SELECT * FROM items WHERE name LIKE ?', [\`%\${query}%\`])
    return { content: [{ type: 'text', text: JSON.stringify({ results }) }] }`,
    file: `const data = await queryCollection('${toolName}').all()
    const filtered = query
      ? data.filter(item => JSON.stringify(item).toLowerCase().includes(query.toLowerCase()))
      : data
    return { content: [{ type: 'text', text: JSON.stringify({ results: filtered }) }] }`,
    custom: `// TODO: Implement your custom data fetching logic
    const data = await yourDataSource(query)
    return { content: [{ type: 'text', text: JSON.stringify({ data }) }] }`,
  }

  return `// Generated Nuxt MCP Project for: ${useCase}
// Uses @nuxtjs/mcp-toolkit for zero-config MCP server

// 1. Create Nuxt project
// npm create nuxt@latest ${toolName}-mcp
// cd ${toolName}-mcp
// pnpm add @nuxtjs/mcp-toolkit zod

// 2. Configure nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/mcp-toolkit'],
  mcp: {
    name: '${toolName}-mcp',
    browserRedirect: '/'
  }
})

// 3. Create tool (server/mcp/tools/${toolName}.ts)
import { z } from 'zod'

export default defineMcpTool({
  description: 'Search and retrieve ${useCase}',
  inputSchema: {
    query: z.string().describe('Search query'),${authParam}
    limit: z.number().min(1).max(100).optional().default(10).describe('Max results'),
  },
  ${authRequired ? '' : 'cache: \'1h\','}
  handler: async ({ query, ${authRequired ? 'api_key, ' : ''}limit }) => {
    ${authCheck}
    ${dataFetching[dataSource as keyof typeof dataFetching]}
  }
})

// That's it! The toolkit auto-registers tools, resources, and prompts
// from server/mcp/tools/, server/mcp/resources/, and server/mcp/prompts/

// 4. Test with MCP Inspector
// pnpm dev
// Open Claude Desktop -> Settings -> Developer -> Add Server:
// {
//   "mcpServers": {
//     "${toolName}": {
//       "url": "http://localhost:3000/mcp"
//     }
//   }
// }

// 5. Create evaluation (tests/mcp/mcp.eval.ts)
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
    expected: [{ toolName: '${toolName}', args: { query: '${useCase}' } }],
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

export default defineMcpTool({
  description: `Generate a complete, ready-to-use Nuxt MCP project using @nuxtjs/mcp-toolkit. Includes tool definition, config, and evaluation tests. Specify data source type ("api" for REST APIs, "database" for SQL/NoSQL, "file" for files), a short use case description (e.g., "recipe API", "GitHub API"), and whether authentication is needed. Returns full project code.`,
  inputSchema: {
    data_source: z.enum(['api', 'database', 'file', 'custom']).describe('Data source type: "api" for REST APIs, "database" for SQL/NoSQL, "file" for markdown/JSON files, "custom" for other'),
    use_case: z.string().describe('What the MCP does in 2-5 words. Examples: "recipe API", "GitHub API", "Stripe payments", "PostgreSQL queries"'),
    auth_required: z.boolean().optional().default(false).describe('Set true if API requires authentication/API keys'),
  },
  handler: async ({ data_source, use_case, auth_required }) => {
    const code = generateProjectCode(data_source, use_case, auth_required)

    return {
      content: [{
        type: 'text',
        text: `# Generated Nuxt MCP Project: ${use_case}

**Configuration:**
- Data Source: ${data_source}
- Auth Required: ${auth_required}

**Next Steps:**
1. Copy code to your Nuxt project
2. Customize data fetching logic
3. Run pnpm dev
4. Test with MCP Inspector or Claude Desktop
5. Write evaluations

---

${code}`,
      }],
    }
  },
})
