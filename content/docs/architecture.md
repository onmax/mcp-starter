---
title: Architecture Overview
description: System design and component organization
section: architecture
---

# Architecture

## System Design

```
┌─────────────────────────────────────┐
│         Nuxt 4 Application          │
├─────────────────────────────────────┤
│  /mcp route (StreamableHTTP)        │
│  ├── Resources (2)                  │
│  ├── Tools (3)                      │
│  └── Prompts (2)                    │
├─────────────────────────────────────┤
│      Nuxt Content Collections       │
│  ├── docs/ (local markdown)         │
│  └── codebase/ (GitHub remote)      │
└─────────────────────────────────────┘
```

## Components

### MCP Server (`server/routes/mcp.ts`)

- Registers tools, resources, prompts
- Handles StreamableHTTPServerTransport
- Delegates to API handlers via $fetch

### API Handlers (`server/api/mcp/*.ts`)

- One file per tool
- Zod validation
- 1-hour caching
- Error handling

### Content Collections

- **docs**: README sections as queryable markdown
- **codebase**: Template source from GitHub

### Utilities (`server/utils/content.ts`)

- Markdown AST parsing
- Extract H1 titles
- Extract descriptions from first paragraph

## Data Flow

1. LLM calls tool via MCP protocol
2. MCP route validates input with Zod
3. Handler fetches from Nuxt Content
4. Response cached for 1 hour
5. Formatted result returned to LLM

## Caching Strategy

All content endpoints cached 1 hour:

- Reduces Nuxt Content queries
- Faster response times
- Content doesn't change frequently

Custom cache keys include query params to ensure correct invalidation.
