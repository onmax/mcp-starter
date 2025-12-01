import { z } from 'zod'

export default defineMcpPrompt({
  description: '**USE THIS when user asks how to add/create a new tool**. Step-by-step guide for implementing a new tool in existing Nuxt MCP server using @nuxtjs/mcp-toolkit (create file → define tool → test).',
  inputSchema: {
    tool_purpose: z.string().describe('What the new tool should do'),
  },
  handler: async ({ tool_purpose }) => ({
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: `You want to add a tool that: "${tool_purpose}"

**Step-by-step guide:**

1. **Create tool file** (server/mcp/tools/your-tool.ts)
   \`\`\`typescript
   import { z } from 'zod'

   export default defineMcpTool({
     description: 'What it does and when to use it',
     inputSchema: {
       param: z.string().describe('Description for LLM'),
       limit: z.number().min(1).max(100).optional().default(10).describe('Max results'),
     },
     cache: '1h', // Optional: omit for dynamic/authenticated data
     handler: async ({ param, limit }) => {
       // Your implementation
       const data = await fetchData(param, limit)
       return { content: [{ type: 'text', text: JSON.stringify(data) }] }
     }
   })
   \`\`\`

2. **Use patterns** (call get_pattern tool)
   - \`list-search\` - Consolidate list/get/search operations
   - \`caching\` - Cache expensive operations
   - \`validation\` - Comprehensive Zod schemas
   - \`error-handling\` - Actionable error messages
   - \`pagination\` - Handle large datasets
   - \`auth\` - API key handling

3. **Tool auto-registers**
   - mcp-toolkit automatically discovers files in server/mcp/tools/
   - Tool name derived from file name (your-tool.ts → your-tool)
   - No manual registration needed!

4. **Write evaluations** (tests/mcp/mcp.eval.ts)
   - Add realistic test cases
   - Verify tool selection
   - Test parameter handling
   - Check error scenarios

5. **Test the tool**
   - Run pnpm dev
   - Use MCP Inspector: npx @modelcontextprotocol/inspector http://localhost:3000/mcp
   - Test in Claude Desktop
   - Run evaluations: pnpm eval

**Key differences from manual SDK:**
- No server.registerTool() needed
- File-based auto-discovery
- cache property instead of defineCachedEventHandler
- Return { content: [...], isError?: boolean } from handler

**Troubleshooting:**
If you encounter issues, use debug_setup tool with the appropriate issue type.`,
      },
    }],
  }),
})
