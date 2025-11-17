---
title: MCP Prompts
description: Available prompts and their use cases
section: prompts
---

# MCP Prompts

## Overview

Prompts guide LLMs through complex multi-step workflows. Think of them as "super tools" that orchestrate multiple tool calls.

## customize_template

**Purpose:** Guide user through customizing this template for their use case

**Arguments:**

- `use_case: string` - Description of what MCP server should do

**Returns:** Step-by-step customization instructions

**Example:**

```ts
await customize_template({
  use_case: 'MCP server for exploring Python codebases with search and documentation'
})
```

**Output:** Detailed plan covering:

1. Content sources to configure
2. Tools to modify
3. Resources to update
4. Evaluations to write
5. Testing strategy

## understand_pattern

**Purpose:** Explain MCP pattern with examples from this codebase

**Arguments:**

- `pattern: string` - Pattern name (list-search, caching, validation, error-handling)

**Returns:** Explanation with code examples

**Example:**

```ts
await understand_pattern({
  pattern: 'list-search'
})
```

**Output:**

- Pattern description
- When to use
- Code examples from template
- Common pitfalls
- Best practices

## Why Prompts?

Prompts provide:

- **Workflow Guidance**: Multi-step processes in single invocation
- **Context Assembly**: Orchestrate multiple tool calls
- **Domain Knowledge**: Inject expertise into LLM reasoning
- **Consistency**: Standardized approaches to common tasks

## Best Practices

- Return instructions for LLM to execute, not just information
- Reference specific tools LLM should call
- Include examples and code snippets
- Guide through verification steps
