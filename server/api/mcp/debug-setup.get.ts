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
      '5. Verify tools are registered: Check server.registerTool() is called',
      '6. Test with MCP Inspector: npx @modelcontextprotocol/inspector http://localhost:3000/mcp',
    ]
  },
  
  'cors-error': {
    diagnosis: 'CORS errors when connecting to MCP server',
    solutions: [
      '1. MCP uses Server-Sent Events (SSE), not browser fetch - CORS should not apply',
      '2. If testing in browser, redirect HTML requests in your handler:',
      '   if (getHeader(event, "accept")?.includes("text/html")) {',
      '     return sendRedirect(event, "/docs")',
      '   }',
      '3. For HTTP transport, ensure StreamableHTTPServerTransport is used:',
      '   const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })',
      '4. Verify Content-Type headers are set correctly by SDK (automatic)',
      '5. Check firewall/proxy is not blocking SSE connections',
    ]
  },
  
  'schema-validation': {
    diagnosis: 'Zod schema validation failing',
    solutions: [
      '1. Check schema matches tool registration:',
      '   const Schema = z.object({ param: z.string() })',
      '   server.registerTool("tool", { inputSchema: Schema, ... })',
      '2. Ensure handler uses same schema:',
      '   await getValidatedQuery(event, Schema.parse)',
      '3. Common mistakes:',
      '   - Using argsSchema instead of inputSchema in registerTool',
      '   - Schema mismatch between handler and registration',
      '   - Missing .optional() for optional parameters',
      '4. Test schema separately:',
      '   const result = Schema.safeParse({ param: "value" })',
      '   console.log(result.success, result.error)',
      '5. Add .describe() to all schema fields for better LLM understanding',
    ]
  },
  
  'transport-setup': {
    diagnosis: 'MCP transport connection issues',
    solutions: [
      '1. For HTTP/SSE transport (recommended for Nuxt):',
      '   import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"',
      '   const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })',
      '2. Cleanup on connection close to prevent memory leaks:',
      '   event.node.res.on("close", () => {',
      '     transport.close()',
      '     server.close()',
      '   })',
      '3. Handle request body properly:',
      '   const body = await readBody(event)',
      '   await transport.handleRequest(event.node.req, event.node.res, body)',
      '4. For stdio transport (desktop apps):',
      '   Use StdioServerTransport instead',
      '5. Verify endpoint returns 200 OK for health checks',
    ]
  },
  
  'general': {
    diagnosis: 'General MCP setup troubleshooting',
    solutions: [
      '1. Verify all dependencies installed:',
      '   pnpm add @modelcontextprotocol/sdk zod',
      '2. Check server initialization:',
      '   const server = new McpServer({ name: "...", version: "1.0.0" }, { capabilities: { tools: {} } })',
      '3. Ensure tools are registered before connecting transport:',
      '   server.registerTool(...) // Register all tools',
      '   await server.connect(transport) // Then connect',
      '4. Test endpoint manually:',
      '   curl http://localhost:3000/mcp',
      '5. Enable debug logging:',
      '   Add console.log in handlers to trace execution',
      '6. Check Node version: Node 18+ required',
      '7. Verify Nuxt dev server is running: pnpm dev',
      '8. Review Nuxt server logs for errors',
      '9. Test with MCP Inspector for detailed diagnostics',
      '10. Check official docs: https://modelcontextprotocol.io',
    ]
  },
}

export default defineCachedEventHandler(async (event) => {
  const { issue, error_message } = await getValidatedQuery(event, DebugSetupSchema.parse)

  const debug = DEBUG_SOLUTIONS[issue]

  if (!debug) {
    const available = Object.keys(DEBUG_SOLUTIONS).join(', ')
    throw createError({
      statusCode: 404,
      message: `Issue '${issue}' not found. Available: ${available}`
    })
  }

  return {
    issue,
    error_message: error_message || 'No error message provided',
    diagnosis: debug.diagnosis,
    solutions: debug.solutions,
    additional_resources: [
      'MCP Docs: https://modelcontextprotocol.io',
      'MCP Inspector: npx @modelcontextprotocol/inspector http://localhost:3000/mcp',
      'Nuxt MCP Guide: https://nuxt.com/blog/building-nuxt-mcp',
      'SDK Reference: https://github.com/modelcontextprotocol/sdk',
    ]
  }
}, {
  maxAge: 60 * 60 * 24, // Debug solutions don't change
  getKey: (event) => {
    const { issue } = getQuery(event)
    return `debug-${issue}`
  }
})
