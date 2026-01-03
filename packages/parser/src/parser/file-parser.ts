import * as fs from 'fs/promises'
import * as path from 'path'
import { createParser, type Language, type ParseResult } from './parser-factory'
import { ParseError, UnsupportedFileExtensionError } from './errors'

/**
 * Parse a file from disk and return the AST
 * @param filePath - Absolute path to the file to parse
 * @returns ParseResult containing the syntax tree and metadata
 * @throws Error if file cannot be read or language is unsupported
 */
export async function parseFile(filePath: string): Promise<ParseResult> {
  // Read file content
  let content: string
  try {
    content = await fs.readFile(filePath, 'utf-8')
  } catch (error) {
    throw new ParseError('Failed to read file', {
      filePath,
      cause: error,
    })
  }

  // Detect language from file extension
  const language = detectLanguageFromExtension(filePath)

  // Parse content
  return parseContent(content, language)
}

/**
 * Parse code content and return the AST
 * @param content - Source code string to parse
 * @param language - Language of the content ('javascript' | 'typescript')
 * @returns ParseResult containing the syntax tree and metadata
 */
export function parseContent(content: string, language: Language): ParseResult {
  const { parser } = createParser(language)

  try {
    // For languages without full parser support, create a minimal tree
    // This allows file discovery without full AST parsing
    const unsupportedLanguages: Language[] = ['python', 'java', 'go', 'c', 'cpp']

    if (unsupportedLanguages.includes(language)) {
      // Create a minimal parse result for unsupported languages
      // The tree will be empty, but we can still track the file
      const emptyTree = parser.parse('')
      return {
        tree: emptyTree,
        language,
        hasErrors: false,
      }
    }

    const tree = parser.parse(content)
    const hasErrors = checkForErrors(tree)

    return {
      tree,
      language,
      hasErrors,
    }
  } finally {
    // Note: Tree-sitter parser cleanup is handled by garbage collection
    // No explicit cleanup needed for parser instances
  }
}

/**
 * Detect programming language from file extension
 * @param filePath - Path to the file
 * @returns Language identifier
 * @throws Error if extension is not supported
 */
function detectLanguageFromExtension(filePath: string): Language {
  const ext = path.extname(filePath).toLowerCase()

  switch (ext) {
    case '.js':
    case '.jsx':
    case '.mjs':
    case '.cjs':
      return 'javascript'
    case '.tsx':
      return 'tsx'
    case '.ts':
    case '.mts':
    case '.cts':
      return 'typescript'
    case '.py':
      return 'python'
    case '.java':
      return 'java'
    case '.go':
      return 'go'
    case '.c':
    case '.h':
      return 'c'
    case '.cpp':
    case '.cc':
    case '.cxx':
    case '.hpp':
      return 'cpp'
    default:
      throw new UnsupportedFileExtensionError(filePath, ext)
  }
}

/**
 * Check if the parse tree contains any error nodes
 * @param tree - Tree-sitter parse tree
 * @returns True if tree contains errors, false otherwise
 */
function checkForErrors(tree: import('tree-sitter').Tree): boolean {
  const cursor = tree.walk()

  // Check if root node has error
  if (cursor.nodeType === 'ERROR') {
    return true
  }

  // Traverse tree to find error nodes
  return findErrorNodes(cursor)
}

/**
 * Recursively traverse tree to find error nodes
 * @param cursor - Tree-sitter tree cursor
 * @returns True if error nodes found, false otherwise
 */
function findErrorNodes(cursor: import('tree-sitter').TreeCursor): boolean {
  // Check current node
  if (cursor.nodeType === 'ERROR') {
    return true
  }

  // Check if node has missing or unexpected tokens
  if (cursor.currentNode.hasError) {
    return true
  }

  // Traverse children
  if (cursor.gotoFirstChild()) {
    do {
      if (findErrorNodes(cursor)) {
        return true
      }
    } while (cursor.gotoNextSibling())
    cursor.gotoParent()
  }

  return false
}
