import Parser from 'tree-sitter'
import JavaScript from 'tree-sitter-javascript'
import TypeScript from 'tree-sitter-typescript'
import { ParserInitError, UnsupportedLanguageError } from './errors'

export type Language = 'javascript' | 'typescript' | 'tsx'

export interface ParserInstance {
  parser: Parser
  language: Language
}

export interface ParserConfig {
  language: Language
}

export interface ParseResult {
  tree: Parser.Tree
  language: Language
  hasErrors: boolean
}

/**
 * Factory function to create Tree-sitter parser instances
 * @param language - The language to parse ('javascript' | 'typescript')
 * @returns ParserInstance with configured parser
 * @throws Error if language is unsupported
 */
export function createParser(language: Language): ParserInstance {
  const parser = new Parser()

  try {
    const grammar = getLanguageGrammar(language)
    parser.setLanguage(grammar)

    return {
      parser,
      language,
    }
  } catch (error) {
    if (error instanceof UnsupportedLanguageError) {
      throw error
    }
    throw new ParserInitError(language, error)
  }
}

/**
 * Get the appropriate Tree-sitter grammar for a language
 * @param language - The language identifier
 * @returns Tree-sitter language grammar
 * @throws Error if language is not supported
 */
function getLanguageGrammar(language: Language): unknown {
  switch (language) {
    case 'javascript':
      return JavaScript
    case 'typescript':
      return TypeScript.typescript
    case 'tsx':
      return TypeScript.tsx
    default:
      throw new UnsupportedLanguageError(language)
  }
}
