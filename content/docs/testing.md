---
title: Testing Strategy
description: Unit tests and Evalite evaluation approach
section: testing
---

# Testing

## Overview

Two-layer testing:

1. **Unit Tests**: Vitest for registration and validation
2. **Evaluations**: Evalite for LLM behavior

## Unit Tests

**Run:**

```bash
pnpm test
```

**Coverage:**

- Tool registration verification
- Resource schema validation
- Input validation edge cases
- Error message formatting
- Utility function behavior

**Example:**

```ts
import { describe, expect, it } from 'vitest'

describe('MCP Tools', () => {
  it('registers all tools correctly', () => {
    expect(server.listTools()).toHaveLength(3)
  })

  it('validates get_documentation params', () => {
    expect(() => GetDocSchema.parse({ section: 123 })).toThrow()
  })
})
```

## Evaluations

**Run:**

```bash
pnpm eval        # Run once
pnpm eval:ui     # View results UI
pnpm eval:watch  # Watch mode
```

**Purpose:** Verify LLMs can effectively use your MCP server

**10 Scenarios:**

1. Find setup instructions for specific use case
2. Search for caching implementation pattern
3. Generate tool boilerplate with validation
4. Find all API handler files
5. Understand list vs search pattern
6. Get specific code file explanation
7. Multi-step: search docs → get code → generate example
8. Edge case: ambiguous search query
9. Generate resource with custom schema
10. Understand testing patterns from codebase

## Writing Evaluations

**Structure:**

```ts
evalite('Find caching pattern', {
  task: async ({ provider }) => {
    const result = await generateText({
      model: provider('openai:gpt-4o-mini'),
      tools: { ...mcpTools },
      prompt: 'How does this template implement caching? Show me the code.'
    })
    return result.text
  },
  scorers: [toolCallAccuracy()]
})
```

**Best Practices:**

- Realistic questions users would ask
- Verify with `toolCallAccuracy` scorer
- Test edge cases and failures
- Include multi-step workflows
- Keep queries independent

## CI Integration

Add to `.github/workflows/test.yml`:

```yaml
- name: Run unit tests
  run: pnpm test

- name: Run evaluations
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  run: pnpm eval
```
