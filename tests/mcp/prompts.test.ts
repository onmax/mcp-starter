import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const CustomizePromptSchema = z.object({
  use_case: z.string(),
})

const UnderstandPatternSchema = z.object({
  pattern: z.enum(['list-search', 'caching', 'validation', 'error-handling']),
})

describe('mCP Prompts', () => {
  describe('customize_template prompt', () => {
    it('validates use_case parameter', () => {
      const result = CustomizePromptSchema.parse({ use_case: 'API documentation server' })
      expect(result.use_case).toBe('API documentation server')
    })

    it('rejects missing use_case', () => {
      expect(() => CustomizePromptSchema.parse({})).toThrow()
    })
  })

  describe('understand_pattern prompt', () => {
    it('accepts valid patterns', () => {
      const patterns = ['list-search', 'caching', 'validation', 'error-handling']
      patterns.forEach((pattern) => {
        const result = UnderstandPatternSchema.parse({ pattern })
        expect(result.pattern).toBe(pattern)
      })
    })

    it('rejects invalid pattern', () => {
      expect(() => UnderstandPatternSchema.parse({ pattern: 'invalid' })).toThrow()
    })
  })
})
