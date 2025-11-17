import { z } from 'zod'
import type { DocsCollectionItem } from '@nuxt/content'
import { queryCollection } from '#imports'

const GetDocSchema = z.object({
  section: z.string().optional(),
  search_query: z.string().optional(),
})

export default defineCachedEventHandler(async (event) => {
  const query = await getValidatedQuery(event, GetDocSchema.parse)

  // List mode: no params
  if (!query.section && !query.search_query) {
    // @ts-ignore - Nuxt Content queryCollection API inconsistency
    // @ts-ignore - Nuxt Content queryCollection API inconsistency
    const docs = await queryCollection('docs').all() as DocsCollectionItem[]
    return {
      mode: 'list',
      sections: docs.map((doc: DocsCollectionItem) => ({
        section: doc.section,
        title: doc.title,
        description: doc.description,
        path: doc.path,
      }))
    }
  }

  // Get mode: specific section
  if (query.section) {
    // @ts-ignore - Nuxt Content queryCollection API inconsistency
    const doc = await queryCollection('docs')
      .where('section', '=', query.section)
      .first() as DocsCollectionItem | null

    if (!doc) {
      // @ts-ignore - Nuxt Content queryCollection API inconsistency
      const allDocs = await queryCollection('docs').all() as DocsCollectionItem[]
      const available = allDocs.map((d: DocsCollectionItem) => d.section).join(', ')

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

  // Search mode: search_query
  if (query.search_query) {
    // @ts-ignore - Nuxt Content queryCollection API inconsistency
    const docs = await queryCollection('docs').all() as DocsCollectionItem[]

    // Simple text search - could use better search library
    const matches = docs.filter((doc: DocsCollectionItem) => {
      const searchIn = `${doc.title} ${doc.description} ${getMarkdownContent(doc as any)}`.toLowerCase()
      return searchIn.includes(query.search_query!.toLowerCase())
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
      results: matches.map((doc: DocsCollectionItem) => ({
        section: doc.section,
        title: doc.title,
        description: doc.description,
        relevantContent: getMarkdownContent(doc as any).slice(0, 500) + '...',
      }))
    }
  }
}, {
  maxAge: 60 * 60,
  getKey: (event) => {
    const { section, search_query } = getQuery(event)
    return `docs-${section || ''}-${search_query || 'list'}`
  }
})
