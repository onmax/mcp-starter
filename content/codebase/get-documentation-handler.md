---
filepath: server/api/mcp/get-documentation.get.ts
purpose: List/search pattern implementation for documentation access
category: api-handlers
---

# Documentation Handler

API handler implementing list/get/search pattern for documentation queries.

## Three Operating Modes

### List Mode (no params)

Returns all documentation sections with metadata.

```ts
if (!query.section && !query.search_query) {
  const docs = await queryCollection(event, 'docs').all()
  return {
    mode: 'list',
    sections: docs.map(doc => ({
      section: doc.section,
      title: doc.title,
      description: doc.description,
      path: doc._path,
    }))
  }
}
```

### Get Mode (specific section)

Returns full content for one section.

```ts
if (query.section) {
  const doc = await queryCollection(event, 'docs')
    .where({ section: query.section })
    .first()

  if (!doc) {
    const allDocs = await queryCollection(event, 'docs').all()
    const available = allDocs.map(d => d.section).join(', ')

    throw createError({
      statusCode: 404,
      message: `Section '${query.section}' not found. Available: ${available}`
    })
  }

  return {
    mode: 'get',
    section: doc.section,
    title: doc.title,
    content: getMarkdownContent(doc),
  }
}
```

### Search Mode (search_query)

Simple text search across all documentation.

```ts
if (query.search_query) {
  const docs = await queryCollection(event, 'docs').all()

  const matches = docs.filter(doc => {
    const searchIn = `${doc.title} ${doc.description} ${getMarkdownContent(doc)}`.toLowerCase()
    return searchIn.includes(query.search_query.toLowerCase())
  })

  if (matches.length === 0) {
    return {
      mode: 'search',
      query: query.search_query,
      results: [],
      suggestion: 'Try broader search terms or use list mode to see all sections'
    }
  }

  return {
    mode: 'search',
    query: query.search_query,
    results: matches.map(doc => ({
      section: doc.section,
      title: doc.title,
      description: doc.description,
      relevantContent: getMarkdownContent(doc).slice(0, 500) + '...',
    }))
  }
}
```

## Caching

Uses Nuxt's defineCachedEventHandler with 1-hour cache.

```ts
export default defineCachedEventHandler(async (event) => {
  // handler logic
}, {
  maxAge: 60 * 60,
  getKey: (event) => {
    const { section, search_query } = getQuery(event)
    return `docs-${section || ''}-${search_query || 'list'}`
  }
})
```

## Validation

Zod schema validates optional params:

```ts
const GetDocSchema = z.object({
  section: z.string().optional(),
  search_query: z.string().optional(),
})

const query = await getValidatedQuery(event, GetDocSchema.parse)
```

## Error Handling

Suggests corrections when section not found:

```ts
throw createError({
  statusCode: 404,
  message: `Section '${query.section}' not found. Available: ${available}`
})
```
