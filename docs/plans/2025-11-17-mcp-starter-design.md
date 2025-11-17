# MCP Starter Template - Design Document

**Date:** 2025-11-17
**Status:** Approved

## Purpose

Create a cloneable MCP server template that helps users build their own MCP servers. The template is itself a working MCP server that answers questions about MCP patterns, explores its own codebase, and generates boilerplate code.

## Reference

Based on `~/nimiq/developer-center/server` architecture. Uses same proven patterns: list/search tools, Nuxt Content sources, Evalite testing, resource indexes.

## Architecture

### Tech Stack

- **Nuxt 4.2.1** (already installed)
- **MCP SDK:** `@modelcontextprotocol/sdk@^1.22.0`
- **Content:** `@nuxt/content@3.8.2` with 2 sources
- **Validation:** `zod@^3.25.76`
- **Testing:** `vitest@^4.0.9`
- **Evaluation:** `evalite@1.0.0-beta.13`, `@ai-sdk/mcp@^0.0.8`, `@ai-sdk/openai@3.0.0-beta.60`, `ai@6.0.0-beta.99`

### Project Structure

```
/
├── server/
│   ├── routes/mcp.ts              # Main MCP server (registers tools, resources, prompts)
│   ├── api/mcp/                   # Tool handlers
│   │   ├── get-documentation.get.ts
│   │   ├── get-code.get.ts
│   │   └── generate-mcp-boilerplate.get.ts
│   └── utils/
│       └── content.ts             # Markdown parsing
├── content/
│   └── docs/                      # README sections as .md files
├── tests/mcp/
│   ├── tools.test.ts              # Unit tests
│   ├── resources.test.ts
│   ├── prompts.test.ts
│   └── mcp.eval.ts                # Evalite suite
├── content.config.ts              # 2 sources: local docs + GitHub self-repo
├── evalite.config.ts
└── README.md                      # Comprehensive MCP starter guide
```

## Content Strategy

### Collection 1: Documentation (local)

- **Source:** `content/docs/`
- **Schema:** `{ title: string, description: string, section: string }`
- **Sections:** introduction, setup, architecture, tools, resources, prompts, testing, customization
- Each section is standalone .md extracted from comprehensive README

### Collection 2: Codebase (remote GitHub)

- **Source:** This repo from GitHub (fetched during build)
- **Schema:** `{ filepath: string, purpose: string, category: string }`
- **Categories:** routes, api-handlers, config, tests, utils
- **Exposed files:** Core implementation files users need to understand/modify

## MCP Capabilities

### Resources (2)

1. **`resource://mcp-starter/documentation`**
   - JSON index: all doc sections with title, description, path
   - ~8 sections total

2. **`resource://mcp-starter/codebase`**
   - JSON index: key code files with purpose, category
   - 10-15 essential files

### Tools (3)

Following MCP best practices: consolidate by workflow, not API endpoints.

1. **`get_documentation`**
   - **Params:** `section?: string`, `search_query?: string`
   - **No params:** Returns all sections (list mode)
   - **With `section`:** Returns specific section markdown
   - **With `search_query`:** Searches docs, returns relevant sections

2. **`get_code`**
   - **Params:** `filepath?: string`, `category?: string`, `search_pattern?: string`
   - **No params:** Returns all files by category (list mode)
   - **With `category`:** Filters files (routes|api-handlers|config|tests|utils)
   - **With `filepath`:** Returns source + explanation
   - **With `search_pattern`:** Searches code, returns matching files

3. **`generate_mcp_boilerplate`**
   - **Params:** `type: 'tool'|'resource'|'prompt'`, `description: string`, `format?: 'typescript'|'python'`
   - Generates complete boilerplate based on template patterns
   - Includes validation schema, handler logic, registration code

### Prompts (2)

1. **`customize_template`** - Step-by-step guide for adapting template to use case
2. **`understand_pattern`** - Explains MCP patterns with examples from codebase

## Implementation Details

### API Patterns

All endpoints use developer-center pattern:

```typescript
export default defineCachedEventHandler(async (event) => {
  const { param } = await getValidatedQuery(event, schema.parse)
  // Fetch from queryCollection or filesystem
  return transformedData
}, {
  maxAge: 60 * 60, // 1 hour
  getKey: (event) => `cache-key-${query.param}`
})
```

### Validation

- Zod schemas for all tool params
- Optional params with defaults
- Clear constraints

### Error Handling

LLM-friendly errors guide next steps:

```
"Section 'toolz' not found. Did you mean 'tools'?
Available: introduction, setup, architecture, tools, resources, prompts, testing, customization"
```

Patterns:
- Invalid section → suggest valid options
- File not found → return available files
- Search no results → guide to list mode
- Generation invalid type → show supported types

### Content Parsing

Extract from actual implementation:
- AST parsing for function signatures
- Schema extraction for validation patterns
- Transform with placeholders for generation

## Testing Strategy

### Unit Tests (Vitest)

- Tool registration verification
- Resource schema validation
- Input validation edge cases
- Error message formatting

### Evalite Tests (10 scenarios)

1. Find setup instructions for specific use case
2. Search caching implementation pattern
3. Generate tool boilerplate with validation
4. Find all API handler files
5. Understand list vs search pattern
6. Get specific code file explanation
7. Multi-step: search docs → get code → generate example
8. Edge case: ambiguous search query
9. Generate resource with custom schema
10. Understand testing patterns from codebase

### Scripts

```json
{
  "test": "vitest",
  "eval": "evalite run",
  "eval:ui": "evalite serve",
  "eval:watch": "evalite watch",
  "mcp:studio": "npx @modelcontextprotocol/inspector --server-url http://localhost:3000/mcp"
}
```

## Dependencies

**Production:**
```json
{
  "@modelcontextprotocol/sdk": "^1.22.0",
  "@nuxt/content": "3.8.2",
  "better-sqlite3": "^12.4.1",
  "nuxt": "^4.2.1",
  "zod": "^3.25.76",
  "h3": "^1.15.4"
}
```

**Development:**
```json
{
  "@ai-sdk/mcp": "^0.0.8",
  "@ai-sdk/openai": "3.0.0-beta.60",
  "ai": "6.0.0-beta.99",
  "evalite": "1.0.0-beta.13",
  "vitest": "^4.0.9",
  "dotenv": "^17.2.3"
}
```

## Key Design Decisions

### Why 3 tools instead of 8?

MCP best practices: build for workflows, optimize for limited context. Consolidating related operations (list/get/search) into unified tools reduces context overhead and mirrors how users think.

### Why self-referential GitHub source?

Template learns from itself. Users query the running server to understand how to customize it. Code examples come from actual implementation.

### Why example evals included?

Shows users how to test their own MCP servers. Example evals cover all tool capabilities and edge cases. Users modify, not write from scratch.

### Why minimal tool count?

Fewer tools = faster LLM comprehension. Each tool handles complete workflow. Follows "build for workflows, not endpoints" principle.

## Success Criteria

Users can:
1. Clone template and understand architecture by querying MCP server
2. Generate boilerplate for their own tools/resources/prompts
3. Find implementation patterns by searching codebase
4. Customize template for their use case following guided instructions
5. Run evaluations to verify their changes work

## Next Steps

1. Write comprehensive README (all sections referenced by docs collection)
2. Set up git worktree for implementation
3. Create detailed implementation plan
