import { experimental_createMCPClient as createMCPClient } from "@ai-sdk/mcp";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { evalite } from "evalite";
import { wrapAISDKModel } from "evalite/ai-sdk";
import { toolCallAccuracy } from "evalite/scorers";

const SYSTEM_PROMPT =
    "You are a helpful assistant. Today's date is 2024-04-27.";
const MCP_URL = "http://localhost:3000/mcp";
const model = wrapAISDKModel(openai("gpt-5.1-codex-mini"));

evalite("MCP Tools - Get Documentation", {
    data: async () => [
        {
            input: "How do I install and set up this MCP server template?",
            expected: [{ toolName: "get_documentation" }],
        },
        {
            input: "Find documentation about caching patterns in this template",
            expected: [{ toolName: "get_documentation" }],
        },
        {
            input: "Show me the testing documentation",
            expected: [{ toolName: "get_documentation" }],
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

evalite("MCP Tools - Get Code", {
    data: async () => [
        {
            input: "Show me all the API handler files in this codebase",
            expected: [{ toolName: "get_code" }],
        },
        {
            input: "Show me the code for the main MCP server route",
            expected: [{ toolName: "get_code" }],
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

evalite("MCP Tools - Generate Boilerplate", {
    data: async () => [
        {
            input: "Generate TypeScript boilerplate for a tool that searches user profiles by name",
            expected: [{ toolName: "generate_mcp_boilerplate" }],
        },
        {
            input: "Generate boilerplate for a resource that provides an index of user accounts",
            expected: [{ toolName: "generate_mcp_boilerplate" }],
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

evalite("MCP Multi-Step Workflows", {
    data: async () => [
        {
            input: "Find documentation about tools, then show me the code that implements the get_documentation tool",
            expected: [
                { toolName: "get_documentation" },
                { toolName: "get_code" },
            ],
        },
        {
            input: "How does this template approach testing? Show me the testing documentation and the actual test files",
            expected: [
                { toolName: "get_documentation" },
                { toolName: "get_code" },
            ],
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
