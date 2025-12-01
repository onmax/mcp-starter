export default defineMcpResource({
  uri: 'resource://nuxt-mcp-starter/patterns',
  title: 'MCP Patterns Index',
  description: 'Index of available Nuxt MCP implementation patterns using @nuxtjs/mcp-toolkit',
  handler: async () => {
    const patterns = [
      { id: 'list-search', name: 'List-Search Consolidation', description: 'Combine list/get/search in one tool' },
      { id: 'caching', name: 'Response Caching', description: 'Cache expensive operations with cache property' },
      { id: 'validation', name: 'Input Validation', description: 'Zod schema validation in inputSchema' },
      { id: 'error-handling', name: 'Actionable Errors', description: 'LLM-friendly error messages with isError' },
      { id: 'pagination', name: 'Result Pagination', description: 'Handle large datasets with hasMore/nextOffset' },
      { id: 'auth', name: 'Authentication', description: 'API key and auth handling without caching' },
    ]

    return {
      contents: [{
        uri: 'resource://nuxt-mcp-starter/patterns',
        mimeType: 'application/json',
        text: JSON.stringify(patterns, null, 2),
      }],
    }
  },
})
