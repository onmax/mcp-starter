import { defineCollection, defineContentConfig } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    // README as single doc source
    docs: defineCollection({
      type: 'page',
      source: 'README.md',
    }),
    // Local codebase (switch to GitHub remote after publishing)
    codebase: defineCollection({
      type: 'page',
      source: '{server/{routes,api/mcp,utils}/**/*.ts,tests/**/*.ts,*.config.ts}',
      // To use GitHub remote instead:
      // source: {
      //   repository: 'https://github.com/your-org/your-repo',
      //   include: 'server/**/*.ts',
      // },
    }),
  },
})
