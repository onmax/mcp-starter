import { z } from 'zod'

const DEBUG_SOLUTIONS: Record<string, { diagnosis: string, solutions: string[] }> = {
  'tools-not-showing': {
    diagnosis: 'Tools not appearing in Claude Desktop',
    solutions: [
      '1. Verify MCP server is running: Check http://localhost:3000/mcp returns 200',
      '2. Check Claude Desktop config (~/.config/claude/claude_desktop_config.json):',
      '   {',
      '     "mcpServers": {',
      '       "your-server": {',
      '         "url": "http://localhost:3000/mcp"',
      '       }',
      '     }',
      '   }',
      '3. Restart Claude Desktop completely (quit and reopen)',
      '4. Check server logs for errors: Look for MCP connection messages',
      '5. Verify tool files exist in server/mcp/tools/ and export default defineMcpTool({...})',
      '6. Test with MCP Inspector: npx @modelcontextprotocol/inspector http://localhost:3000/mcp',
      '7. Check nuxt.config.ts has mcp-toolkit module: modules: ["@nuxtjs/mcp-toolkit"]',
    ],
  },

  'cors-error': {
    diagnosis: 'CORS errors when connecting to MCP server',
    solutions: [
      '1. MCP uses Server-Sent Events (SSE), not browser fetch - CORS should not apply',
      '2. mcp-toolkit handles browser redirects automatically via browserRedirect config:',
      '   mcp: { browserRedirect: "/docs" }',
      '3. If testing in browser, verify browserRedirect is set in nuxt.config.ts',
      '4. For HTTP transport, toolkit handles StreamableHTTPServerTransport automatically',
      '5. Check firewall/proxy is not blocking SSE connections',
      '6. Verify Content-Type headers are set correctly (toolkit handles this)',
    ],
  },

  'schema-validation': {
    diagnosis: 'Zod schema validation failing',
    solutions: [
      '1. Check inputSchema in your defineMcpTool matches expected params:',
      '   export default defineMcpTool({',
      '     inputSchema: { param: z.string().describe("...") },',
      '     handler: async ({ param }) => { ... }',
      '   })',
      '2. Common mistakes:',
      '   - Missing .describe() on schema fields (LLMs need these!)',
      '   - Using object key names that differ from handler destructuring',
      '   - Missing .optional() for optional parameters',
      '3. Test schema separately:',
      '   const Schema = z.object({ param: z.string() })',
      '   const result = Schema.safeParse({ param: "value" })',
      '   console.log(result.success, result.error)',
      '4. Add .describe() to ALL schema fields for better LLM understanding',
      '5. Use .default() with .optional() for params with default values',
    ],
  },

  'transport-setup': {
    diagnosis: 'MCP transport connection issues',
    solutions: [
      '1. mcp-toolkit handles transport setup automatically - no manual config needed',
      '2. Verify module is properly installed: pnpm add @nuxtjs/mcp-toolkit',
      '3. Check nuxt.config.ts:',
      '   export default defineNuxtConfig({',
      '     modules: ["@nuxtjs/mcp-toolkit"],',
      '     mcp: { name: "my-server" }',
      '   })',
      '4. Default endpoint is /mcp - configure with mcp.route if needed',
      '5. Verify endpoint returns 200 OK: curl http://localhost:3000/mcp',
      '6. Check Nuxt dev server is running: pnpm dev',
      '7. For custom handlers, use defineMcpHandler() in server/mcp/ directory',
    ],
  },

  'general': {
    diagnosis: 'General MCP setup troubleshooting',
    solutions: [
      '1. Verify dependencies: pnpm add @nuxtjs/mcp-toolkit zod',
      '2. Check nuxt.config.ts has module configured:',
      '   modules: ["@nuxtjs/mcp-toolkit"],',
      '   mcp: { name: "my-server" }',
      '3. File structure for auto-discovery:',
      '   server/mcp/',
      '   ├── tools/       # defineMcpTool exports',
      '   ├── resources/   # defineMcpResource exports',
      '   └── prompts/     # defineMcpPrompt exports',
      '4. Each file should: export default defineMcpTool({ ... })',
      '5. Test endpoint: curl http://localhost:3000/mcp',
      '6. Enable debug logging: Add console.log in handlers',
      '7. Check Node version: Node 18+ required',
      '8. Verify Nuxt dev server is running: pnpm dev',
      '9. Test with MCP Inspector for detailed diagnostics',
      '10. Check official docs: https://mcp-toolkit.nuxt.dev',
    ],
  },
}

export default defineMcpTool({
  description: `Get troubleshooting help for common MCP server setup problems with @nuxtjs/mcp-toolkit. Returns diagnosis and specific solutions with code examples. Issue types: "tools-not-showing" (tools don't appear in Claude Desktop), "cors-error" (CORS/connection errors), "schema-validation" (Zod schema validation failures), "transport-setup" (MCP transport connection issues), "general" (other setup problems). Optionally include error message for better diagnosis.`,
  inputSchema: {
    issue: z.enum(['tools-not-showing', 'cors-error', 'schema-validation', 'transport-setup', 'general']).describe('Issue type: "tools-not-showing" if tools missing in Claude, "cors-error" for CORS issues, "schema-validation" for Zod errors, "transport-setup" for connection problems, "general" for other'),
    error_message: z.string().optional().describe('Copy of actual error message (optional but helpful for better diagnosis)'),
  },
  cache: '24h',
  handler: async ({ issue, error_message }) => {
    const debug = DEBUG_SOLUTIONS[issue]

    if (!debug) {
      const available = Object.keys(DEBUG_SOLUTIONS).join(', ')
      return { content: [{ type: 'text', text: `Issue '${issue}' not found. Available: ${available}` }], isError: true }
    }

    return {
      content: [{
        type: 'text',
        text: `# ${debug.diagnosis}

**Error:** ${error_message || 'No error message provided'}

## Solutions

${debug.solutions.join('\n')}

## Additional Resources

- MCP Toolkit Docs: https://mcp-toolkit.nuxt.dev
- MCP Inspector: npx @modelcontextprotocol/inspector http://localhost:3000/mcp
- Nuxt MCP Guide: https://nuxt.com/blog/building-nuxt-mcp
- MCP Protocol Docs: https://modelcontextprotocol.io`,
      }],
    }
  },
})
