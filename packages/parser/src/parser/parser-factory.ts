import Parser from 'tree-sitter'
import JavaScript from 'tree-sitter-javascript'
import TypeScript from 'tree-sitter-typescript'
import { ParserInitError, UnsupportedLanguageError } from './errors'

export type Language = 'javascript' | 'typescript' | 'tsx' | 'python' | 'java' | 'go' | 'c' | 'cpp'

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

    // For unsupported languages, we'll still return a parser instance
    // but it won't have a valid grammar. This allows basic file scanning
    // without full AST parsing
    if (grammar) {
      parser.setLanguage(grammar as Parameters<typeof parser.setLanguage>[0])
    } else {
      console.warn(`[createParser] No grammar available for language: ${language}`)
    }

    return {
      parser,
      language,
    }
  } catch (error) {
    console.error(`[createParser] Error creating parser for ${language}:`, error)
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
    case 'python':
    case 'java':
    case 'go':
    case 'c':
    case 'cpp':
      // These languages are recognized but don't have parsers installed yet
      // Return null to indicate no grammar available - files will still be scanned
      // but won't be fully parsed
      return null
    default:
      throw new UnsupportedLanguageError(language)
  }
}
