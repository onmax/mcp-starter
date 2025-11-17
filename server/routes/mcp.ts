import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

function createServer() {
    const server = new McpServer(
        {
            name: "mcp-starter-server",
            version: "1.0.0",
        },
        {
            capabilities: {
                resources: {},
                tools: {},
                prompts: {},
            },
        },
    );

    // Resources expose data indexes for LLM browsing
    server.registerResource(
        "patterns",
        "resource://nuxt-mcp-starter/patterns",
        {
            title: "MCP Patterns Index",
            description: "Index of available Nuxt MCP implementation patterns",
        },
        async () => {
            const patterns = [
                { id: 'list-search', name: 'List-Search Consolidation', description: 'Combine list/get/search in one tool' },
                { id: 'caching', name: 'Response Caching', description: 'Cache expensive operations' },
                { id: 'validation', name: 'Input Validation', description: 'Zod schema validation' },
                { id: 'error-handling', name: 'Actionable Errors', description: 'LLM-friendly error messages' },
                { id: 'pagination', name: 'Result Pagination', description: 'Handle large datasets' },
                { id: 'auth', name: 'Authentication', description: 'API key and auth handling' },
            ]
            return {
                contents: [
                    {
                        uri: "resource://nuxt-mcp-starter/patterns",
                        mimeType: "application/json",
                        text: JSON.stringify(patterns, null, 2),
                    },
                ],
            };
        },
    );

    server.registerResource(
        "examples",
        "resource://nuxt-mcp-starter/examples",
        {
            title: "Example Projects",
            description: "Real-world Nuxt MCP project examples",
        },
        async () => {
            const examples = [
                { name: 'Recipe API MCP', dataSource: 'api', useCase: 'Search recipes from external API', auth: false },
                { name: 'Database Query MCP', dataSource: 'database', useCase: 'Query local database', auth: true },
                { name: 'File Content MCP', dataSource: 'file', useCase: 'Search markdown documentation', auth: false },
            ]
            return {
                contents: [
                    {
                        uri: "resource://nuxt-mcp-starter/examples",
                        mimeType: "application/json",
                        text: JSON.stringify(examples, null, 2),
                    },
                ],
            };
        },
    );

    // Tools enable parameterized queries
    server.registerTool(
        "get_pattern",
        {
            title: "Get MCP Pattern",
            description: `Get working TypeScript code + explanation for a specific Nuxt MCP implementation pattern. Returns complete code examples you can copy-paste. Available patterns: "validation" (Zod input validation), "caching" (response caching), "auth" (API key authentication), "error-handling" (actionable error messages), "pagination" (large datasets), "list-search" (consolidate list/get/search operations).`,
            inputSchema: GetPatternSchema,
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
        },
        async (args: any) => {
            const data = await $fetch("/api/mcp/get-pattern", {
                query: args,
            }) as any;
            return {
                content: [
                    {
                        type: "text",
                        text: args.format === 'code' 
                            ? data.code 
                            : `# ${data.pattern}\n\n${data.explanation}\n\n## Implementation\n\n\`\`\`typescript\n${data.code}\n\`\`\``,
                    },
                ],
            };
        },
    );

    server.registerTool(
        "create_nuxt_project",
        {
            title: "Create Nuxt MCP Project",
            description: `Generate a complete, ready-to-use Nuxt MCP project with all necessary files: Zod schemas, API handlers with caching, MCP tool registration, and evaluation tests. Specify data source type ("api" for REST APIs, "database" for SQL/NoSQL, "file" for files), a short use case description (e.g., "recipe API", "GitHub API"), and whether authentication is needed. Returns full project code including npm create command.`,
            inputSchema: CreateProjectSchema,
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
        },
        async (args: any) => {
            const data = await $fetch("/api/mcp/create-nuxt-project", {
                query: args,
            });
            return {
                content: [
                    {
                        type: "text",
                        text: `# Generated Nuxt MCP Project: ${data.use_case}\n\n**Configuration:**\n- Data Source: ${data.data_source}\n- Auth Required: ${data.auth_required}\n\n**Next Steps:**\n${data.next_steps.map((s: string, i: number) => `${i + 1}. ${s}`).join('\n')}\n\n---\n\n${data.code}`,
                    },
                ],
            };
        },
    );

    server.registerTool(
        "debug_setup",
        {
            title: "Debug MCP Setup",
            description: `Get troubleshooting help for common MCP server setup problems. Returns diagnosis and specific solutions with code examples. Issue types: "tools-not-showing" (tools don't appear in Claude Desktop), "cors-error" (CORS/connection errors), "schema-validation" (Zod schema validation failures), "transport-setup" (MCP transport connection issues), "general" (other setup problems). Optionally include error message for better diagnosis.`,
            inputSchema: DebugSetupSchema,
            annotations: {
                readOnlyHint: true,
                destructiveHint: false,
                idempotentHint: true,
                openWorldHint: false,
            },
        },
        async (args: any) => {
            const data = await $fetch("/api/mcp/debug-setup", {
                query: args,
            });
            return {
                content: [
                    {
                        type: "text",
                        text: `# ${data.diagnosis}\n\n**Error:** ${data.error_message}\n\n## Solutions\n\n${data.solutions.join('\n\n')}\n\n## Additional Resources\n\n${data.additional_resources.map((r: string) => `- ${r}`).join('\n')}`,
                    },
                ],
            };
        },
    );

    // Prompts provide guided workflows for common tasks
    server.registerPrompt(
        "scaffold_for_api",
        {
            title: "Scaffold MCP for API",
            description:
                "**USE THIS when user wants to wrap/integrate an API**. Complete 7-step guide from project generation to deployment for wrapping external APIs with Nuxt MCP.",
            argsSchema: ScaffoldApiPromptSchema.shape,
        },
        async ({ api_description }: any) => ({
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
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
   - Plan tool names (action-oriented, snake_case)
   - Map API endpoints to tool operations

4. **Implement tools**
   - Create schemas in server/utils/schemas.ts
   - Create handlers in server/api/mcp/*.ts
   - Register tools in server/routes/mcp.ts
   - Use get_pattern for validation, caching, error-handling

5. **Handle authentication**
   - Use get_pattern with pattern: 'auth'
   - Accept API key as parameter or env var
   - Don't cache authenticated requests
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
                },
            ],
        }),
    );

    server.registerPrompt(
        "add_tool",
        {
            title: "Add Tool to MCP Server",
            description: "**USE THIS when user asks how to add/create a new tool**. Step-by-step guide for implementing a new tool in existing Nuxt MCP server (schema → handler → registration → tests).",
            argsSchema: AddToolPromptSchema.shape,
        },
        async ({ tool_purpose }: any) => ({
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `You want to add a tool that: "${tool_purpose}"

**Step-by-step guide:**

1. **Define the schema** (server/utils/schemas.ts)
   \`\`\`typescript
   export const YourToolSchema = z.object({
     param: z.string().describe('Description'),
     limit: z.number().min(1).max(100).optional().default(10),
   })
   \`\`\`

2. **Create API handler** (server/api/mcp/your-tool.get.ts)
   - Use get_pattern with pattern: 'list-search' for consolidation
   - Use get_pattern with pattern: 'caching' for performance
   - Use get_pattern with pattern: 'validation' for schemas
   - Use get_pattern with pattern: 'error-handling' for errors

3. **Register tool** (server/routes/mcp.ts)
   \`\`\`typescript
   server.registerTool('your_tool', {
     title: 'Your Tool',
     description: 'What it does and when to use it',
     inputSchema: YourToolSchema,
     annotations: {
       readOnlyHint: true,
       destructiveHint: false,
       idempotentHint: true,
       openWorldHint: false,
     },
   }, async (args) => {
     const data = await $fetch('/api/mcp/your-tool', { query: args })
     return { content: [{ type: 'text', text: JSON.stringify(data) }] }
   })
   \`\`\`

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

**Troubleshooting:**
If you encounter issues, use debug_setup tool with the appropriate issue type.`,
                    },
                },
            ],
        }),
    );

    return server;
}

export default defineEventHandler(async (event) => {
    // Browser requests redirected to docs - MCP requires SSE transport
    if (getHeader(event, "accept")?.includes("text/html")) {
        return sendRedirect(event, "/docs/guide/ai/mcp");
    }

    const server = createServer();

    const transport: StreamableHTTPServerTransport =
        new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    // Cleanup on connection close - prevents memory leaks
    event.node.res.on("close", () => {
        transport.close();
        server.close();
    });

    await server.connect(transport);

    const body = await readBody(event);

    await transport.handleRequest(event.node.req, event.node.res, body);
});
