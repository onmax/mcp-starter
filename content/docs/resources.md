---
title: MCP Resources
description: Available resources and their schemas
section: resources
---

# MCP Resources

## Overview

Resources provide indexes of available content for LLMs to understand what data exists before making specific queries.

## resource://mcp-starter/documentation

**URI:** `resource://mcp-starter/documentation`

**Purpose:** Index of all documentation sections

**Schema:**

```ts
{
  sections: Array<{
    section: string
    title: string
    description: string
    path: string
  }>
}
```

**Usage:** LLMs query this first to see available documentation before calling `get_documentation` with specific section.

**Example Response:**

```json
{
  "sections": [
    {
      "section": "introduction",
      "title": "Introduction to MCP Starter",
      "description": "Overview of the MCP Starter template and its purpose",
      "path": "/docs/introduction"
    },
    ...
  ]
}
```

## resource://mcp-starter/codebase

**URI:** `resource://mcp-starter/codebase`

**Purpose:** Index of key code files

**Schema:**

```ts
{
  files: Array<{
    filepath: string
    purpose: string
    category: 'routes' | 'api-handlers' | 'config' | 'tests' | 'utils'
  }>
}
```

**Usage:** LLMs browse file structure before requesting specific file contents with `get_code`.

**Example Response:**

```json
{
  "files": [
    {
      "filepath": "server/routes/mcp.ts",
      "purpose": "Main MCP server route with tool/resource/prompt registration",
      "category": "routes"
    },
    ...
  ]
}
```

## Why Resources?

Resources enable LLMs to:

1. Discover available content without guessing
2. Understand structure before querying
3. Make informed decisions about which tools to call
4. Reduce failed queries from invalid parameters

## Best Practices

- Keep resource responses under 25KB
- Update indexes when content changes
- Include enough metadata for LLM decisions
- Use consistent schema across similar resources
