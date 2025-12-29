import { describe, it, expect } from 'vitest'
import { createParser } from './parser-factory'

describe('Parser Factory', () => {
  describe('createParser', () => {
    it('should create JavaScript parser instance', () => {
      const parser = createParser('javascript')

      expect(parser).toBeDefined()
      expect(parser.language).toBe('javascript')
      expect(parser.parser).toBeDefined()
    })

    it('should create TypeScript parser instance', () => {
      const parser = createParser('typescript')

      expect(parser).toBeDefined()
      expect(parser.language).toBe('typescript')
      expect(parser.parser).toBeDefined()
    })

    it('should create different parser instances for different languages', () => {
      const jsParser = createParser('javascript')
      const tsParser = createParser('typescript')

      expect(jsParser).not.toBe(tsParser)
      expect(jsParser.language).not.toBe(tsParser.language)
    })

    it('should throw error for unsupported language', () => {
      // @ts-expect-error Testing invalid language
      expect(() => createParser('python')).toThrow()
    })
  })
})
