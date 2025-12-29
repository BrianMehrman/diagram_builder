// Parser factory and types
export { createParser } from './parser/parser-factory'
export type { Language, ParserInstance, ParserConfig, ParseResult } from './parser/parser-factory'

// File parsing
export { parseFile, parseContent } from './parser/file-parser'

// Error classes
export {
  ParserError,
  ParserInitError,
  ParseError,
  UnsupportedLanguageError,
  UnsupportedFileExtensionError,
} from './parser/errors'
