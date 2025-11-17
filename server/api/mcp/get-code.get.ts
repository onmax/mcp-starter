import { z } from 'zod'
import type { CodebaseCollectionItem } from '@nuxt/content'
import { queryCollection } from '#imports'

const GetCodeSchema = z.object({
  filepath: z.string().optional(),
  category: z.enum(['routes', 'api-handlers', 'config', 'tests', 'utils']).optional(),
  search_pattern: z.string().optional(),
})

export default defineCachedEventHandler(async (event) => {
  const query = await getValidatedQuery(event, GetCodeSchema.parse)

  // List mode: no params or category filter
  if (!query.filepath && !query.search_pattern) {
    // @ts-ignore - Nuxt Content queryCollection API inconsistency
    const files = await queryCollection('codebase').all() as CodebaseCollectionItem[]

    const filtered = query.category
      ? files.filter((f: CodebaseCollectionItem) => f.category === query.category)
      : files

    return {
      mode: 'list',
      category: query.category || 'all',
      files: filtered.map((f: CodebaseCollectionItem) => ({
        filepath: f.filepath,
        purpose: f.purpose,
        category: f.category,
      }))
    }
  }

  // Get mode: specific filepath
  if (query.filepath) {
    // @ts-ignore - Nuxt Content queryCollection API inconsistency
    const file = await queryCollection('codebase')
      .where('filepath', '=', query.filepath)
      .first() as CodebaseCollectionItem | null

    if (!file) {
      // @ts-ignore - Nuxt Content queryCollection API inconsistency
      const allFiles = await queryCollection('codebase').all() as CodebaseCollectionItem[]
      const available = allFiles.map((f: CodebaseCollectionItem) => f.filepath).join('\n')

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
      content: getMarkdownContent(file as any),
    }
  }

  // Search mode: search_pattern
  if (query.search_pattern) {
    // @ts-ignore - Nuxt Content queryCollection API inconsistency
    const files = await queryCollection('codebase').all() as CodebaseCollectionItem[]

    const matches = files.filter((file: CodebaseCollectionItem) => {
      const searchIn = `${file.filepath} ${file.purpose} ${getMarkdownContent(file as any)}`.toLowerCase()
      return searchIn.includes(query.search_pattern!.toLowerCase())
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
      results: matches.map((f: CodebaseCollectionItem) => ({
        filepath: f.filepath,
        purpose: f.purpose,
        category: f.category,
        matchSnippet: getMarkdownContent(f as any).slice(0, 300) + '...',
      }))
    }
  }
}, {
  maxAge: 60 * 60,
  getKey: (event) => {
    const { filepath, category, search_pattern } = getQuery(event)
    return `code-${filepath || ''}-${category || ''}-${search_pattern || 'list'}`
  }
})
