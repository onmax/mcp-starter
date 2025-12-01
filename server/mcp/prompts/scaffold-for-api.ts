import { z } from 'zod'

export default defineMcpPrompt({
  description: '**USE THIS when user wants to wrap/integrate an API**. Complete 7-step guide from project generation to deployment for wrapping external APIs with Nuxt MCP using @nuxtjs/mcp-toolkit.',
  inputSchema: {
    api_description: z.string().describe('Description of the API to wrap (e.g., "GitHub REST API", "recipe search API")'),
  },
  handler: async ({ api_description }) => ({
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: `You want to create a Nuxt MCP server for: "${api_description}"

**Step-by-step guide:**

1. **Generate starter project**
   - Use create_nuxt_project tool
   - Set data_source: 'api'
   - Set use_case: "${api_description}"
   - Set auth_required: true (if API needs key)

2. **Study the API documentation**
   - Identify core endpoints to expose
   - Note required parameters
   - Check authentication method
   - Review rate limits

3. **Design your tools**
   - Follow list-search pattern: consolidate operations
   - Use get_pattern tool to see examples
   - Plan tool names (action-oriented, kebab-case file names)
   - Map API endpoints to tool operations

4. **Implement tools** (server/mcp/tools/)
   \`\`\`typescript
   // server/mcp/tools/search-api.ts
   export default defineMcpTool({
     description: 'What it does and when to use it',
     inputSchema: {
       query: z.string().describe('Search query'),
       // Use get_pattern for validation examples
     },
     cache: '1h', // Omit for authenticated requests
     handler: async ({ query }) => {
       const data = await $fetch('https://api.example.com/search', { query: { q: query } })
       return { content: [{ type: 'text', text: JSON.stringify(data) }] }
     }
   })
   \`\`\`

5. **Handle authentication**
   - Use get_pattern with pattern: 'auth'
   - Accept API key as parameter or env var
   - Don't cache authenticated requests (omit cache property)
   - Provide clear error messages

6. **Test with evaluations**
   - Write 10 realistic scenarios
   - Test tool selection accuracy
   - Verify multi-step workflows
   - Check error handling

7. **Debug issues**
   - Use debug_setup tool for common problems
   - Test with MCP Inspector
   - Check Claude Desktop integration

**Next steps:**
Use create_nuxt_project to generate starter code, then use get_pattern to implement specific features.`,
      },
    }],
  }),
})
