import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const docsSchema = z.object({
  title: z.string(),
  description: z.string(),
  section: z.string(),
})

const codebaseSchema = z.object({
  filepath: z.string(),
  purpose: z.string(),
  category: z.enum(['routes', 'api-handlers', 'config', 'tests', 'utils']),
})

// Note: Using local markdown sources for codebase collection instead of GitHub remote.
// This approach better supports the template's fork-and-customize model, where users
// can directly edit documentation alongside code. The codebase collection will contain
// markdown files with code examples and explanations extracted from the actual source files.
export default defineContentConfig({
  collections: {
    docs: defineCollection({
      type: 'page',
      source: 'content/docs/**/*.md',
      schema: docsSchema,
    }),
    codebase: defineCollection({
      type: 'page',
      source: 'content/codebase/**/*.md',
      schema: codebaseSchema,
    }),
  },
})
