---
title: Customization Guide
description: How to adapt this template for your use case
section: customization
---

# Customization Guide

## Overview

This template is designed to be forked and customized. Here's how to adapt it for your MCP server.

## Step 1: Update Content Sources

Edit `content.config.ts`:

```ts
export default defineContentConfig({
  collections: {
    // Keep docs collection for your documentation
    docs: defineCollection({
      type: 'page',
      source: 'docs/**/*.md', // Your docs here
      schema: z.object({
        title: z.string(),
        description: z.string(),
        category: z.string(), // Customize schema
      }),
    }),

    // Replace or remove codebase collection
    yourData: defineCollection({
      type: 'page',
      source: 'data/**/*.json', // Your data source
      schema: z.object({
        // Your schema here
      }),
    }),
  },
})
```

## Step 2: Modify Tools

Each tool in `server/api/mcp/*.ts`:

**Update Zod Schema:**

```ts
const YourToolSchema = z.object({
  your_param: z.string().optional(),
  another_param: z.enum(['option1', 'option2']).optional(),
})
```

**Update Handler Logic:**

```ts
export default defineCachedEventHandler(async (event) => {
  const { your_param } = await getValidatedQuery(event, YourToolSchema.parse)

  // Fetch from your content collection
  const data = await queryCollection(event, 'yourData')
    .where({ field: your_param })
    .find()

  return { results: data }
}, {
  maxAge: 60 * 60,
  getKey: event => `your-tool-${query.your_param}`
})
```

**Update MCP Registration** in `server/routes/mcp.ts`:

```ts
server.registerTool(
  'your_tool_name',
  {
    title: 'Your Tool Title',
    description: 'Clear description of what this tool does and when to use it',
    argsSchema: YourToolSchema,
  },
  async (args) => {
    const data = await $fetch('/api/mcp/your-tool', { query: args })
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(data, null, 2)
      }]
    }
  }
)
```

## Step 3: Update Resources

Edit resource registration in `server/routes/mcp.ts`:

```ts
server.registerResource(
  'your_resource_name',
  'resource://your-namespace/your-resource',
  {
    title: 'Your Resource',
    description: 'What this resource indexes'
  },
  async (uri) => {
    const data = await $fetch('/api/mcp/your-resource-handler')
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(data)
      }]
    }
  }
)
```

## Step 4: Write Your Evaluations

Copy `tests/mcp/mcp.eval.ts` structure:

```ts
evalite('Your use case', {
  task: async ({ provider }) => {
    const result = await generateText({
      model: provider('openai:gpt-4o-mini'),
      tools: { ...mcpTools },
      prompt: 'Realistic question a user would ask'
    })
    return result.text
  },
  scorers: [toolCallAccuracy()]
})
```

**Create 10+ scenarios covering:**

- Common use cases
- Edge cases
- Multi-step workflows
- Error handling

## Step 5: Update Documentation

Replace `content/docs/*.md` with your own:

- Introduction to your domain
- Setup instructions for your server
- Tool usage examples
- Best practices

## Step 6: Update README

Edit `README.md`:

- Replace "MCP Starter" with your server name
- Update description and use cases
- Modify quick start for your setup
- Add domain-specific examples

## Common Patterns

### Adding API Integration

```ts
// server/utils/api-client.ts
export async function callExternalAPI(params) {
  const response = await fetch('https://api.yourservice.com/endpoint', {
    headers: { Authorization: `Bearer ${process.env.API_KEY}` }
  })
  return response.json()
}

// Use in tool handler
const data = await callExternalAPI(args)
```

### Adding Search Tool

```ts
server.registerTool('search_your_data', ..., async ({ query }) => {
  const results = await $fetch('/api/mcp/search', { query: { q: query } })

  // Return prompt for LLM to process results
  const prompt = `Find information about "${query}" from: ${JSON.stringify(results)}`

  return {
    content: [{ type: 'text', text: prompt }]
  }
})
```

### Adding Prompt

```ts
server.registerPrompt(
  'your_workflow',
  { description: 'Guide through your workflow', argsSchema: z.object({ param: z.string() }) },
  async ({ param }) => ({
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: `Step-by-step instructions using param: ${param}`
      }
    }]
  })
)
```

## Testing Your Changes

After customization:

1. **Unit tests pass:** `pnpm test`
2. **Evaluations pass:** `pnpm eval`
3. **MCP Inspector works:** `pnpm mcp:studio`
4. **Manual testing:** Try realistic queries

## Deployment

This template runs as standard Nuxt app:

- **Vercel:** `vercel deploy`
- **Netlify:** Configure build command `pnpm build`
- **Docker:** Use Nuxt Dockerfile
- **NuxtHub:** `npx nuxthub deploy`

MCP route available at `/mcp` on deployed URL.
