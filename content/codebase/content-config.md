---
filepath: content.config.ts
purpose: Defines content collections and schemas for docs and codebase
category: config
---

# Content Configuration

Defines two content collections: docs and codebase, both using local markdown sources.

## Collections

### docs Collection

Documentation sections (introduction, setup, architecture, etc.)

```ts
const docsSchema = z.object({
  title: z.string(),
  description: z.string(),
  section: z.string(),
})

docs: defineCollection({
  type: 'page',
  source: 'content/docs/**/*.md',
  schema: docsSchema,
})
```

**Required frontmatter:**

```yaml
---
title: Architecture Overview
description: High-level architecture explanation
section: architecture
---
```

### codebase Collection

Documentation of key source files with code examples.

```ts
const codebaseSchema = z.object({
  filepath: z.string(),
  purpose: z.string(),
  category: z.enum(['routes', 'api-handlers', 'config', 'tests', 'utils']),
})

codebase: defineCollection({
  type: 'page',
  source: 'content/codebase/**/*.md',
  schema: codebaseSchema,
})
```

**Required frontmatter:**

```yaml
---
filepath: server/routes/mcp.ts
purpose: Main MCP server route
category: routes
---
```

## Design Decision

Uses local markdown instead of GitHub remote source.

**Why?** Fork-and-customize model works better with local files:

- Users edit docs alongside code
- No GitHub API dependencies
- Easier to customize
- Faster iteration

**Implementation:** Markdown files document source code with frontmatter metadata and code snippets in content.

## Categories

Source files organized into five categories:

- **routes**: Server routes (e.g., `server/routes/mcp.ts`)
- **api-handlers**: API endpoints (e.g., `server/api/mcp/*.get.ts`)
- **config**: Configuration (e.g., `content.config.ts`, `evalite.config.ts`)
- **tests**: Test files (e.g., `tests/mcp/mcp.eval.ts`)
- **utils**: Utilities (e.g., `server/utils/content.ts`)

## Usage

Queried via Nuxt Content in API handlers:

```ts
// Get all docs
const docs = await queryCollection(event, 'docs').all()

// Get specific section
const doc = await queryCollection(event, 'docs')
  .where({ section: 'architecture' })
  .first()

// Get all codebase files
const files = await queryCollection(event, 'codebase').all()

// Filter by category
const apiHandlers = await queryCollection(event, 'codebase')
  .where({ category: 'api-handlers' })
  .all()
```
