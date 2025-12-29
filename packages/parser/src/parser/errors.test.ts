import { describe, it, expect } from 'vitest'
import {
  ParserError,
  ParserInitError,
  ParseError,
  UnsupportedLanguageError,
  UnsupportedFileExtensionError,
} from './errors'

describe('Parser Errors', () => {
  describe('ParserError', () => {
    it('should create base parser error', () => {
      const error = new ParserError('Test error')

      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(ParserError)
      expect(error.name).toBe('ParserError')
      expect(error.message).toBe('Test error')
    })
  })

  describe('ParserInitError', () => {
    it('should create parser init error', () => {
      const error = new ParserInitError('python')

      expect(error).toBeInstanceOf(ParserError)
      expect(error.name).toBe('ParserInitError')
      expect(error.message).toContain('python')
      expect(error.message).toContain('Failed to initialize parser')
    })

    it('should include cause in message', () => {
      const cause = new Error('Grammar not found')
      const error = new ParserInitError('python', cause)

      expect(error.message).toContain('Grammar not found')
    })
  })

  describe('ParseError', () => {
    it('should create parse error with file location', () => {
      const error = new ParseError('Syntax error', {
        filePath: '/path/to/file.js',
        lineNumber: 42,
        column: 10,
      })

      expect(error).toBeInstanceOf(ParserError)
      expect(error.name).toBe('ParseError')
      expect(error.message).toContain('Syntax error')
      expect(error.message).toContain('/path/to/file.js:42:10')
      expect(error.filePath).toBe('/path/to/file.js')
      expect(error.lineNumber).toBe(42)
      expect(error.column).toBe(10)
    })

    it('should create parse error without location', () => {
      const error = new ParseError('Syntax error')

      expect(error.message).toBe('Syntax error')
      expect(error.filePath).toBeUndefined()
      expect(error.lineNumber).toBeUndefined()
      expect(error.column).toBeUndefined()
    })

    it('should include cause in message', () => {
      const cause = new Error('Unexpected token')
      const error = new ParseError('Parse failed', { cause })

      expect(error.message).toContain('Unexpected token')
    })
  })

  describe('UnsupportedLanguageError', () => {
    it('should create unsupported language error', () => {
      const error = new UnsupportedLanguageError('python')

      expect(error).toBeInstanceOf(ParserError)
      expect(error.name).toBe('UnsupportedLanguageError')
      expect(error.message).toContain('python')
      expect(error.message).toContain('Unsupported language')
      expect(error.language).toBe('python')
      expect(error.supportedLanguages).toEqual(['javascript', 'typescript', 'tsx'])
    })

    it('should accept custom supported languages', () => {
      const error = new UnsupportedLanguageError('python', ['javascript', 'typescript'])

      expect(error.supportedLanguages).toEqual(['javascript', 'typescript'])
      expect(error.message).toContain('javascript, typescript')
    })
  })

  describe('UnsupportedFileExtensionError', () => {
    it('should create unsupported file extension error', () => {
      const error = new UnsupportedFileExtensionError('/path/to/file.py', '.py')

      expect(error).toBeInstanceOf(ParserError)
      expect(error.name).toBe('UnsupportedFileExtensionError')
      expect(error.message).toContain('.py')
      expect(error.message).toContain('/path/to/file.py')
      expect(error.message).toContain('Unsupported file extension')
      expect(error.extension).toBe('.py')
      expect(error.filePath).toBe('/path/to/file.py')
    })
  })
})
