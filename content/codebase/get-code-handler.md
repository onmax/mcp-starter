---
filepath: server/api/mcp/get-code.get.ts
purpose: List/search pattern implementation for codebase exploration
category: api-handlers
---

# Code Handler

API handler for exploring codebase with list/filter/get/search modes.

## Four Operating Modes

### List Mode (no params or category filter)

Returns all files, optionally filtered by category.

```ts
if (!query.filepath && !query.search_pattern) {
  const files = await queryCollection(event, 'codebase').all()

  const filtered = query.category
    ? files.filter(f => f.category === query.category)
    : files

  return {
    mode: 'list',
    category: query.category || 'all',
    files: filtered.map(f => ({
      filepath: f.filepath,
      purpose: f.purpose,
      category: f.category,
    }))
  }
}
```

### Get Mode (specific filepath)

Returns full source code and explanation for one file.

```ts
if (query.filepath) {
  const file = await queryCollection(event, 'codebase')
    .where({ filepath: query.filepath })
    .first()

  if (!file) {
    const allFiles = await queryCollection(event, 'codebase').all()
    const available = allFiles.map(f => f.filepath).join('\n')

    throw createError({
      statusCode: 404,
      message: `File '${query.filepath}' not found.\n\nAvailable files:\n${available}`
    })
  }

  return {
    mode: 'get',
    filepath: file.filepath,
    purpose: file.purpose,
    category: file.category,
    content: getMarkdownContent(file),
  }
}
```

### Search Mode (search_pattern)

Search across filepath, purpose, and content.

```ts
if (query.search_pattern) {
  const files = await queryCollection(event, 'codebase').all()

  const matches = files.filter(file => {
    const searchIn = `${file.filepath} ${file.purpose} ${getMarkdownContent(file)}`.toLowerCase()
    return searchIn.includes(query.search_pattern.toLowerCase())
  })

  if (matches.length === 0) {
    return {
      mode: 'search',
      pattern: query.search_pattern,
      results: [],
      suggestion: 'Try broader search terms or use list mode to see all files'
    }
  }

  return {
    mode: 'search',
    pattern: query.search_pattern,
    results: matches.map(f => ({
      filepath: f.filepath,
      purpose: f.purpose,
      category: f.category,
      matchSnippet: getMarkdownContent(f).slice(0, 300) + '...',
    }))
  }
}
```

## Categories

Files organized by category:

- `routes`: Server routes (e.g., mcp.ts)
- `api-handlers`: API endpoints (e.g., get-documentation.get.ts)
- `config`: Configuration files (e.g., content.config.ts)
- `tests`: Test files (e.g., mcp.eval.ts)
- `utils`: Utility functions (e.g., content.ts)

## Caching

```ts
export default defineCachedEventHandler(async (event) => {
  // handler logic
}, {
  maxAge: 60 * 60,
  getKey: (event) => {
    const { filepath, category, search_pattern } = getQuery(event)
    return `code-${filepath || ''}-${category || ''}-${search_pattern || 'list'}`
  }
})
```

## Validation

```ts
const GetCodeSchema = z.object({
  filepath: z.string().optional(),
  category: z.enum(['routes', 'api-handlers', 'config', 'tests', 'utils']).optional(),
  search_pattern: z.string().optional(),
})

const query = await getValidatedQuery(event, GetCodeSchema.parse)
```
