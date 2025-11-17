import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const GetDocSchema = z.object({
    section: z.string().optional(),
    search_query: z.string().optional(),
});

const GetCodeSchema = z.object({
    filepath: z.string().optional(),
    category: z
        .enum(["routes", "api-handlers", "config", "tests", "utils"])
        .optional(),
    search_pattern: z.string().optional(),
});

const GenerateSchema = z.object({
    type: z.enum(["tool", "resource", "prompt"]),
    description: z.string(),
    format: z.enum(["typescript", "python"]).optional().default("typescript"),
});

const CustomizePromptSchema = {
    use_case: z.string(),
};

const UnderstandPatternSchema = {
    pattern: z.enum(["list-search", "caching", "validation", "error-handling"]),
};

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

    // Register Resources
    server.registerResource(
        "documentation",
        "resource://mcp-starter/documentation",
        {
            title: "Documentation Index",
            description: "Index of all documentation sections",
        },
        async () => {
            const docs = await $fetch("/api/mcp/get-documentation");
            return {
                contents: [
                    {
                        uri: "resource://mcp-starter/documentation",
                        mimeType: "application/json",
                        text: JSON.stringify(docs, null, 2),
                    },
                ],
            };
        },
    );

    server.registerResource(
        "codebase",
        "resource://mcp-starter/codebase",
        {
            title: "Codebase Index",
            description: "Index of key code files",
        },
        async () => {
            const code = await $fetch("/api/mcp/get-code");
            return {
                contents: [
                    {
                        uri: "resource://mcp-starter/codebase",
                        mimeType: "application/json",
                        text: JSON.stringify(code, null, 2),
                    },
                ],
            };
        },
    );

    // Register Tools
    server.registerTool(
        "get_documentation",
        {
            title: "Get Documentation",
            description: `Query template documentation. Three modes:
- No params: List all sections
- With section: Get specific section markdown
- With search_query: Search across docs

Examples:
- List: {}
- Get: { "section": "architecture" }
- Search: { "search_query": "caching patterns" }`,
            inputSchema: GetDocSchema,
        },
        async (args: any) => {
            const data = await $fetch("/api/mcp/get-documentation", {
                query: args,
            });
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(data, null, 2),
                    },
                ],
            };
        },
    );

    server.registerTool(
        "get_code",
        {
            title: "Get Code",
            description: `Explore template codebase. Four modes:
- No params: List all files by category
- With category: Filter files (routes|api-handlers|config|tests|utils)
- With filepath: Get source code + explanation
- With search_pattern: Search code

Examples:
- List: {}
- Filter: { "category": "api-handlers" }
- Get: { "filepath": "server/routes/mcp.ts" }
- Search: { "search_pattern": "validation" }`,
            inputSchema: GetCodeSchema,
        },
        async (args: any) => {
            const data = await $fetch("/api/mcp/get-code", { query: args });
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(data, null, 2),
                    },
                ],
            };
        },
    );

    server.registerTool(
        "generate_mcp_boilerplate",
        {
            title: "Generate MCP Boilerplate",
            description: `Generate tool/resource/prompt boilerplate code.

Parameters:
- type: "tool" | "resource" | "prompt"
- description: Natural language description of what it should do
- format: "typescript" | "python" (default: typescript)

Returns complete code with:
- Validation schema (Zod/Pydantic)
- Handler function
- Registration code
- Usage comments

Example:
{
  "type": "tool",
  "description": "Search documentation by topic",
  "format": "typescript"
}`,
            inputSchema: GenerateSchema,
        },
        async (args: any) => {
            const data = await $fetch("/api/mcp/generate-mcp-boilerplate", {
                query: args,
            });
            return {
                content: [
                    {
                        type: "text",
                        text: data.code,
                    },
                ],
            };
        },
    );

    // Register Prompts
    server.registerPrompt(
        "customize_template",
        {
            title: "Customize Template",
            description:
                "Step-by-step guide for customizing this template for your use case",
            argsSchema: CustomizePromptSchema,
        },
        async ({ use_case }: any) => ({
            messages: [
                {
                    role: "user",
                    content: {
                        type: "text",
                        text: `You want to customize the MCP Starter template for: "${use_case}"

Here's your step-by-step customization plan:

1. **Update Content Sources** (content.config.ts)
   - Replace 'docs' collection source with your documentation
   - Replace 'codebase' collection with your data source
   - Update schemas to match your data structure

2. **Modify Tools** (server/api/mcp/*.ts)
   - Update get_documentation handler for your docs structure
   - Replace get_code with tool for your data type
   - Keep or modify generate_mcp_boilerplate as needed

3. **Update Resources** (server/routes/mcp.ts)
   - Change URIs to your namespace: resource://your-app/...
   - Update resource data to index your content
   - Keep JSON structure for LLM compatibility

4. **Write Evaluations** (tests/mcp/mcp.eval.ts)
   - Create 10 realistic questions for your use case
   - Verify answers manually first
   - Use toolCallAccuracy scorer

5. **Update Documentation** (content/docs/*.md)
   - Replace with your domain-specific docs
   - Keep structure: introduction, setup, architecture, etc.
   - Include examples relevant to your use case

6. **Test Everything**
   - Run unit tests: pnpm test
   - Run evaluations: pnpm eval
   - Try MCP Inspector: pnpm mcp:studio

Use get_code to explore implementation details and generate_mcp_boilerplate to create new tools.`,
                    },
                },
            ],
        }),
    );

    server.registerPrompt(
        "understand_pattern",
        {
            title: "Understand Pattern",
            description: "Explain MCP pattern with examples from this codebase",
            argsSchema: UnderstandPatternSchema,
        },
        async ({ pattern }: any) => {
            const explanations: Record<string, string> = {
                "list-search": `# List vs Search Pattern

**Concept:** Consolidate related operations (list/get/search) into one tool instead of separate tools for each.

**Why:** Reduces context overhead, mirrors how users think, easier for LLMs to discover.

**Implementation in this template:**

See server/api/mcp/get-documentation.get.ts:
- No params → List mode (all sections)
- section param → Get mode (specific section)
- search_query param → Search mode (find relevant)

Same pattern in get-code.get.ts for codebase exploration.

**When to use:**
- List: Category/module known ("show all API handlers")
- Search: Conceptual topic ("find caching code")

**Benefits:**
- 3 tools instead of 9 (3 operations × 3 data types)
- LLM sees complete capability in one description
- Consistent interface across data types`,

                caching: `# Caching Pattern

**Concept:** Cache API responses to reduce load and improve response times.

**Implementation in this template:**

See server/api/mcp/get-documentation.get.ts:

\`\`\`typescript
export default defineCachedEventHandler(async (event) => {
  // Handler logic
}, {
  maxAge: 60 * 60,  // 1 hour
  getKey: (event) => {
    const { section, search_query } = getQuery(event)
    return \`docs-\${section || ''}-\${search_query || 'list'}\`
  }
})
\`\`\`

**Key points:**
- Cache for 1 hour (content doesn't change often)
- Custom cache key includes query params
- Different params = different cache entries

**When to use:**
- Content that doesn't change frequently
- Expensive queries (database, external API)
- High-traffic endpoints

**Avoid caching:**
- User-specific data
- Real-time data
- Data that changes frequently`,

                validation: `# Input Validation Pattern

**Concept:** Use Zod schemas to validate all tool parameters before processing.

**Implementation in this template:**

See server/api/mcp/get-documentation.get.ts:

\`\`\`typescript
import { z } from 'zod'

const GetDocSchema = z.object({
  section: z.string().optional(),
  search_query: z.string().optional(),
})

const { section, search_query } = await getValidatedQuery(event, GetDocSchema.parse)
\`\`\`

**Benefits:**
- Type safety at runtime
- Clear error messages for LLMs
- Auto-generated documentation
- Prevents invalid queries

**Best practices:**
- Use .optional() for optional params
- Add .default() for sensible defaults
- Use .enum() for fixed options
- Add .min()/.max() for numbers/strings

**MCP Integration:**
Pass same schema to tool registration:

\`\`\`typescript
server.registerTool('tool_name', {
  argsSchema: GetDocSchema,
  // ...
})
\`\`\``,

                "error-handling": `# Error Handling Pattern

**Concept:** Provide LLM-friendly errors that guide toward correct usage.

**Implementation in this template:**

See server/api/mcp/get-documentation.get.ts:

\`\`\`typescript
if (!doc) {
  const allDocs = await queryCollection(event, 'docs').all()
  const available = allDocs.map(d => d.section).join(', ')

  throw createError({
    statusCode: 404,
    message: \`Section '\${query.section}' not found. Available: \${available}\`
  })
}
\`\`\`

**Key principles:**
1. Suggest corrections ("Did you mean X?")
2. Show available options
3. Guide to alternative tools/modes
4. Use natural language

**Bad error:**
"Not found"

**Good error:**
"Section 'toolz' not found. Did you mean 'tools'? Available: introduction, setup, architecture, tools, resources, prompts, testing, customization"

**LLM response:**
LLM can retry with correct section name automatically.`,
            };

            return {
                messages: [
                    {
                        role: "user",
                        content: {
                            type: "text",
                            text: explanations[pattern] || "Unknown pattern",
                        },
                    },
                ],
            };
        },
    );

    return server;
}

export default defineEventHandler(async (event) => {
    if (getHeader(event, "accept")?.includes("text/html")) {
        return sendRedirect(event, "/docs/guide/ai/mcp");
    }

    const server = createServer();

    const transport: StreamableHTTPServerTransport =
        new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

    event.node.res.on("close", () => {
        transport.close();
        server.close();
    });

    await server.connect(transport);

    const body = await readBody(event);

    await transport.handleRequest(event.node.req, event.node.res, body);
});
