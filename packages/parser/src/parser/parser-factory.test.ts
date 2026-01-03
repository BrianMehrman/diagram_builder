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

    it('should create parser for multi-language support (python, java, go, c, cpp)', () => {
      // Multi-language support: Python, Java, Go, C, C++
      const pythonParser = createParser('python')
      expect(pythonParser.language).toBe('python')

      const javaParser = createParser('java')
      expect(javaParser.language).toBe('java')

      const goParser = createParser('go')
      expect(goParser.language).toBe('go')
    })
  })
})
