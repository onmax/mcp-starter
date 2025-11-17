---
title: MCP Tools
description: Available tools and usage patterns
section: tools
---

# MCP Tools

## Overview

3 consolidated tools following workflow-based design:

1. `get_documentation` - Unified doc access
2. `get_code` - Unified code exploration
3. `generate_mcp_boilerplate` - Example generation

## get_documentation

**Purpose:** Query template documentation

**Parameters:**

- `section?: string` - Specific section name
- `search_query?: string` - Search across docs

**Modes:**

- No params: List all sections
- With `section`: Get specific section markdown
- With `search_query`: Search and return relevant sections

**Example:**

```ts
// List mode
await get_documentation({})

// Get mode
await get_documentation({ section: 'architecture' })

// Search mode
await get_documentation({ search_query: 'caching patterns' })
```

**Returns:** Markdown content or section list

## get_code

**Purpose:** Explore template codebase

**Parameters:**

- `filepath?: string` - Specific file path
- `category?: string` - Filter by category (routes|api-handlers|config|tests|utils)
- `search_pattern?: string` - Search code

**Modes:**

- No params: List all files by category
- With `category`: Filter files
- With `filepath`: Get source + explanation
- With `search_pattern`: Search and return matches

**Example:**

```ts
// List mode
await get_code({})

// Category filter
await get_code({ category: 'api-handlers' })

// Get file
await get_code({ filepath: 'server/routes/mcp.ts' })

// Search
await get_code({ search_pattern: 'validation' })
```

**Returns:** Source code with explanations or file list

## generate_mcp_boilerplate

**Purpose:** Generate tool/resource/prompt boilerplate

**Parameters:**

- `type: 'tool' | 'resource' | 'prompt'` - What to generate
- `description: string` - Natural language description
- `format?: 'typescript' | 'python'` - Output format (default: typescript)

**Example:**

```ts
await generate_mcp_boilerplate({
  type: 'tool',
  description: 'Search documentation by topic and return relevant sections',
  format: 'typescript'
})
```

**Returns:** Complete boilerplate code with:

- Zod schema (TypeScript) or Pydantic model (Python)
- Handler function
- Registration code
- Usage comments

## Design Principles

### Workflow Consolidation

Each tool handles a complete workflow (list/get/search) instead of separate tools for each operation. Reduces context overhead.

### Optional Parameters

All params optional with sensible defaults. Makes tools easier to discover and use.

### Clear Modes

Tool behavior changes based on which params provided. LLM can easily understand when to use each mode.

### LLM-Friendly Errors

Error messages suggest corrections:

```
"Section 'toolz' not found. Did you mean 'tools'?
Available: introduction, setup, architecture, tools, resources, prompts, testing, customization"
```
