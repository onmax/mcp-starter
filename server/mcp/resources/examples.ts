export default defineMcpResource({
  uri: 'resource://nuxt-mcp-starter/examples',
  title: 'Example Projects',
  description: 'Real-world Nuxt MCP project examples using @nuxtjs/mcp-toolkit',
  handler: async () => {
    const examples = [
      { name: 'Recipe API MCP', dataSource: 'api', useCase: 'Search recipes from external API', auth: false },
      { name: 'Database Query MCP', dataSource: 'database', useCase: 'Query local database', auth: true },
      { name: 'File Content MCP', dataSource: 'file', useCase: 'Search markdown documentation', auth: false },
    ]

    return {
      contents: [{
        uri: 'resource://nuxt-mcp-starter/examples',
        mimeType: 'application/json',
        text: JSON.stringify(examples, null, 2),
      }],
    }
  },
})
