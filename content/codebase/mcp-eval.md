---
filepath: tests/mcp/mcp.eval.ts
purpose: Evalite tests verifying MCP server tool calling accuracy
category: tests
---

# MCP Evaluation Tests

Uses Evalite to test MCP server with realistic LLM queries and tool calls.

## Test Setup

```ts
import { createMCPClient } from '@ai-sdk/mcp'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { evalite } from 'evalite'
import { toolCallAccuracy } from 'evalite/scorers'

const client = createMCPClient({
  name: 'mcp-starter',
  version: '1.0.0',
  transport: {
    type: 'http',
    url: 'http://localhost:3000/mcp'
  }
})

const mcpTools = await client.tools()
```

## Test Categories

### Documentation Access

**List sections:**

```ts
evalite('Find setup instructions', {
  task: async ({ provider }) => {
    const result = await generateText({
      model: provider('openai:gpt-4o-mini'),
      tools: mcpTools,
      prompt: 'How do I install and set up this MCP server template?'
    })
    return result.text
  },
  scorers: [toolCallAccuracy()]
})
```

**Search docs:**

```ts
evalite('Search caching pattern', {
  task: async ({ provider }) => {
    const result = await generateText({
      model: provider('openai:gpt-4o-mini'),
      tools: mcpTools,
      prompt: 'Find documentation about caching patterns in this template'
    })
    return result.text
  },
  scorers: [toolCallAccuracy()]
})
```

### Code Exploration

**List by category:**

```ts
evalite('Find API handler files', {
  task: async ({ provider }) => {
    const result = await generateText({
      model: provider('openai:gpt-4o-mini'),
      tools: mcpTools,
      prompt: 'Show me all the API handler files in this codebase'
    })
    return result.text
  },
  scorers: [toolCallAccuracy()]
})
```

**Get specific file:**

```ts
evalite('Get specific code file', {
  task: async ({ provider }) => {
    const result = await generateText({
      model: provider('openai:gpt-4o-mini'),
      tools: mcpTools,
      prompt: 'Show me the code for the main MCP server route and explain what it does'
    })
    return result.text
  },
  scorers: [toolCallAccuracy()]
})
```

### Code Generation

```ts
evalite('Generate tool boilerplate', {
  task: async ({ provider }) => {
    const result = await generateText({
      model: provider('openai:gpt-4o-mini'),
      tools: mcpTools,
      prompt: 'Generate TypeScript boilerplate for a tool that searches user profiles by name'
    })
    return result.text
  },
  scorers: [toolCallAccuracy()]
})
```

### Pattern Understanding

```ts
evalite('Understand list vs search', {
  task: async ({ provider }) => {
    const result = await generateText({
      model: provider('openai:gpt-4o-mini'),
      tools: mcpTools,
      prompt: 'Explain the difference between list and search patterns in this template'
    })
    return result.text
  },
  scorers: [toolCallAccuracy()]
})
```

### Multi-Step Workflows

Tests complex queries requiring multiple tool calls:

```ts
evalite('Multi-step workflow', {
  task: async ({ provider }) => {
    const result = await generateText({
      model: provider('openai:gpt-4o-mini'),
      tools: mcpTools,
      prompt: 'Find documentation about tools, then show me the code that implements the get_documentation tool, then generate a similar tool for searching users'
    })
    return result.text
  },
  scorers: [toolCallAccuracy()]
})
```

### Ambiguous Queries

Tests LLM's ability to handle vague requests:

```ts
evalite('Ambiguous search query', {
  task: async ({ provider }) => {
    const result = await generateText({
      model: provider('openai:gpt-4o-mini'),
      tools: mcpTools,
      prompt: 'Find stuff about testing'
    })
    return result.text
  },
  scorers: [toolCallAccuracy()]
})
```

## Running Tests

```bash
pnpm eval
```

Requires:

- Server running at `http://localhost:3000`
- `OPENAI_API_KEY` in `.env`

## Scoring

Uses `toolCallAccuracy` scorer to verify:

- Correct tools called
- Appropriate parameters passed
- Successful responses returned
