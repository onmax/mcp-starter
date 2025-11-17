import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const GetDocSchema = z.object({
  section: z.string().optional(),
  search_query: z.string().optional(),
})

const GetCodeSchema = z.object({
  filepath: z.string().optional(),
  category: z.enum(['routes', 'api-handlers', 'config', 'tests', 'utils']).optional(),
  search_pattern: z.string().optional(),
})

const GenerateSchema = z.object({
  type: z.enum(['tool', 'resource', 'prompt']),
  description: z.string(),
  format: z.enum(['typescript', 'python']).optional().default('typescript'),
})

describe('mCP Tool Schemas', () => {
  describe('get_documentation schema', () => {
    it('accepts no params', () => {
      const result = GetDocSchema.parse({})
      expect(result).toEqual({})
    })

    it('accepts section param', () => {
      const result = GetDocSchema.parse({ section: 'architecture' })
      expect(result.section).toBe('architecture')
    })

    it('accepts search_query param', () => {
      const result = GetDocSchema.parse({ search_query: 'caching' })
      expect(result.search_query).toBe('caching')
    })

    it('rejects invalid section type', () => {
      expect(() => GetDocSchema.parse({ section: 123 })).toThrow()
    })
  })

  describe('get_code schema', () => {
    it('accepts category enum', () => {
      const result = GetCodeSchema.parse({ category: 'api-handlers' })
      expect(result.category).toBe('api-handlers')
    })

    it('rejects invalid category', () => {
      expect(() => GetCodeSchema.parse({ category: 'invalid' })).toThrow()
    })

    it('accepts filepath', () => {
      const result = GetCodeSchema.parse({ filepath: 'server/routes/mcp.ts' })
      expect(result.filepath).toBe('server/routes/mcp.ts')
    })
  })

  describe('generate_mcp_boilerplate schema', () => {
    it('requires type and description', () => {
      const result = GenerateSchema.parse({ type: 'tool', description: 'Test tool' })
      expect(result.type).toBe('tool')
      expect(result.format).toBe('typescript') // default
    })

    it('accepts python format', () => {
      const result = GenerateSchema.parse({ type: 'resource', description: 'Test', format: 'python' })
      expect(result.format).toBe('python')
    })

    it('rejects invalid type', () => {
      expect(() => GenerateSchema.parse({ type: 'invalid', description: 'Test' })).toThrow()
    })
  })
})
