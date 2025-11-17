---
filepath: server/utils/content.ts
purpose: Helper functions for extracting content from Nuxt Content AST
category: utils
---

# Content Utilities

Functions for extracting text from Nuxt Content's markdown AST structure.

## extractTitle

Finds first H1 heading in document.

```ts
export function extractTitle(doc: ParsedContent): string | undefined {
  if (!doc.body?.children) return undefined

  const h1 = doc.body.children.find(
    (node: any) => node.tag === 'h1'
  )

  if (!h1?.children?.[0]) return undefined
  return h1.children[0].value
}
```

**Usage:**

```ts
const doc = await queryCollection(event, 'docs').first()
const title = extractTitle(doc) // "Architecture Overview"
```

## extractDescription

Gets first paragraph as description.

```ts
export function extractDescription(doc: ParsedContent): string | undefined {
  if (!doc.body?.children) return undefined

  const firstP = doc.body.children.find(
    (node: any) => node.tag === 'p'
  )

  if (!firstP?.children?.[0]) return undefined
  return firstP.children[0].value
}
```

**Usage:**

```ts
const description = extractDescription(doc)
// "This document explains the high-level architecture..."
```

## getMarkdownContent

Extracts full text content from AST, joining nodes with double newlines.

```ts
export function getMarkdownContent(doc: ParsedContent): string {
  if (!doc.body) return ''

  // Simple extraction - you could use remark/rehype for better results
  const extractText = (node: any): string => {
    if (typeof node === 'string') return node
    if (node.value) return node.value
    if (node.children) {
      return node.children.map(extractText).join('')
    }
    return ''
  }

  return doc.body.children?.map(extractText).join('\n\n') || ''
}
```

**Usage:**

```ts
const fullContent = getMarkdownContent(doc)
// Full markdown content as plain text
```

## Why These Exist

Nuxt Content stores markdown as AST (Abstract Syntax Tree), not plain text. These utilities convert AST back to strings for:

- Full-text search (search_query mode)
- Returning content snippets
- LLM consumption via MCP tools

## Improvement Opportunities

Current implementation is simple text extraction. For better results:

- Use remark/rehype for proper markdown handling
- Preserve code blocks with syntax info
- Handle links, images, tables
- Include frontmatter in search

Example with remark:

```ts
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'

export function getMarkdownContent(doc: ParsedContent): string {
  const processor = unified()
    .use(remarkParse)
    .use(remarkStringify)

  return processor.stringify(doc.body)
}
```
