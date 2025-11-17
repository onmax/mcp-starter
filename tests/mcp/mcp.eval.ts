import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { evalite } from "evalite";
import { wrapAISDKModel } from "evalite/ai-sdk";
import { toolCallAccuracy } from "evalite/scorers";

const SYSTEM_PROMPT = "You are a helpful assistant. Today's date is 2024-04-27.";
const MCP_URL = "http://localhost:3000/mcp";
const model = wrapAISDKModel(openai("gpt-4o-mini"));

evalite("Nuxt MCP Starter - Single Tool Calls", {
    data: async () => [
        // Pattern examples
        {
            input: "Show me how to implement the list-search pattern in Nuxt MCP",
            expected: [{ toolName: "get_pattern", args: { pattern: "list-search" } }],
        },
        {
            input: "I need an example of caching in MCP servers",
            expected: [{ toolName: "get_pattern", args: { pattern: "caching" } }],
        },
        {
            input: "How do I validate input parameters with Zod?",
            expected: [{ toolName: "get_pattern", args: { pattern: "validation" } }],
        },
        {
            input: "Show me the code for implementing pagination",
            expected: [{ toolName: "get_pattern", args: { pattern: "pagination", format: "code" } }],
        },
        {
            input: "How should I handle authentication in my MCP?",
            expected: [{ toolName: "get_pattern", args: { pattern: "auth" } }],
        },
        
        // Project generation
        {
            input: "I want to create a Nuxt MCP that queries a recipe API",
            expected: [{ toolName: "create_nuxt_project", args: { data_source: "api", use_case: "query recipe API", auth_required: false } }],
        },
        {
            input: "Generate a Nuxt MCP project for searching a local PostgreSQL database with authentication",
            expected: [{ toolName: "create_nuxt_project", args: { data_source: "database", use_case: "search PostgreSQL", auth_required: true } }],
        },
        {
            input: "Create an MCP server that searches markdown documentation files",
            expected: [{ toolName: "create_nuxt_project", args: { data_source: "file", use_case: "search markdown docs" } }],
        },
        
        // Debugging
        {
            input: "My MCP tools aren't showing up in Claude Desktop, help me debug",
            expected: [{ toolName: "debug_setup", args: { issue: "tools-not-showing" } }],
        },
        {
            input: "I'm getting CORS errors when trying to connect to my MCP server",
            expected: [{ toolName: "debug_setup", args: { issue: "cors-error" } }],
        },
        {
            input: "My Zod schema validation keeps failing with errors",
            expected: [{ toolName: "debug_setup", args: { issue: "schema-validation" } }],
        },
        {
            input: "The MCP transport connection isn't working properly",
            expected: [{ toolName: "debug_setup", args: { issue: "transport-setup" } }],
        },
        
        // Pattern requests phrased as questions
        {
            input: "How do I validate input parameters with Zod in my MCP server?",
            expected: [{ toolName: "get_pattern", args: { pattern: "validation" } }],
        },
        {
            input: "Show me how to implement error handling with actionable messages",
            expected: [{ toolName: "get_pattern", args: { pattern: "error-handling" } }],
        },
    ],
    task: async (input) => {
        const mcpClient = await createMCPClient({
            transport: { type: "http", url: MCP_URL },
        });
        const result = await generateText({
            system: SYSTEM_PROMPT,
            model,
            prompt: input,
            tools: await mcpClient.tools(),
        });
        return result.toolCalls;
    },
    scorers: [
        async ({ output, expected }) =>
            await toolCallAccuracy({
                actualCalls: output,
                expectedCalls: expected,
            }),
    ],
});

evalite("Nuxt MCP Starter - Multi-Step Workflows", {
    data: async () => [
        {
            input: "I want to create an MCP for a recipe API. First show me how to scaffold it, then show me the caching pattern",
            expected: [
                { toolName: "create_nuxt_project", args: { data_source: "api", use_case: "recipe API" } },
                { toolName: "get_pattern", args: { pattern: "caching" } },
            ],
        },
        {
            input: "Show me the validation pattern and then help me debug schema issues",
            expected: [
                { toolName: "get_pattern", args: { pattern: "validation" } },
                { toolName: "debug_setup", args: { issue: "schema-validation" } },
            ],
        },
        {
            input: "Show me how to implement pagination in Nuxt MCP",
            expected: [{ toolName: "get_pattern", args: { pattern: "pagination" } }],
        },
        {
            input: "I want to create an MCP for GitHub API with authentication",
            expected: [{ toolName: "create_nuxt_project", args: { data_source: "api", use_case: "GitHub API", auth_required: true } }],
        },
        {
            input: "Generate an MCP server that wraps the Stripe API",
            expected: [{ toolName: "create_nuxt_project", args: { data_source: "api", use_case: "Stripe API" } }],
        },
    ],
    task: async (input) => {
        const mcpClient = await createMCPClient({
            transport: { type: "http", url: MCP_URL },
        });
        const result = await generateText({
            system: SYSTEM_PROMPT,
            model,
            prompt: input,
            tools: await mcpClient.tools(),
            maxSteps: 5,
        });
        return result.toolCalls;
    },
    scorers: [
        async ({ output, expected }) =>
            await toolCallAccuracy({
                actualCalls: output,
                expectedCalls: expected,
            }),
    ],
});
