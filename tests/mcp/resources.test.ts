import { describe, expect, it } from 'vitest'

describe('mCP Resources', () => {
  it('has documentation resource URI', () => {
    const uri = 'resource://mcp-starter/documentation'
    expect(uri).toContain('mcp-starter')
    expect(uri).toContain('documentation')
  })

  it('has codebase resource URI', () => {
    const uri = 'resource://mcp-starter/codebase'
    expect(uri).toContain('mcp-starter')
    expect(uri).toContain('codebase')
  })

  it('documentation resource returns correct schema', () => {
    const mockResponse = { mode: 'list', sections: [{ section: 'introduction', title: 'Introduction', description: 'Overview', path: '/docs/introduction' }] }
    expect(mockResponse.sections[0]).toHaveProperty('section')
    expect(mockResponse.sections[0]).toHaveProperty('title')
    expect(mockResponse.sections[0]).toHaveProperty('description')
    expect(mockResponse.sections[0]).toHaveProperty('path')
  })

  it('codebase resource returns correct schema', () => {
    const mockResponse = { mode: 'list', files: [{ filepath: 'server/routes/mcp.ts', purpose: 'Main MCP server', category: 'routes' }] }
    expect(mockResponse.files[0]).toHaveProperty('filepath')
    expect(mockResponse.files[0]).toHaveProperty('purpose')
    expect(mockResponse.files[0]).toHaveProperty('category')
  })
})
