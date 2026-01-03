import { parseFile, parseContent } from '../parser/file-parser'
import type { Language } from '../parser/parser-factory'
import { extractClasses, type ClassDefinition } from './class-extractor'
import { extractFunctions, type FunctionDefinition } from './function-extractor'
import {
  extractImports,
  extractExports,
  type ImportStatement,
  type ExportStatement,
} from './import-export-extractor'
import { calculateMetrics, type CodeMetrics } from './metrics-calculator'

export interface FileAnalysis {
  filePath: string | undefined
  language: Language
  classes: ClassDefinition[]
  functions: FunctionDefinition[]
  imports: ImportStatement[]
  exports: ExportStatement[]
  metrics: CodeMetrics
}

/**
 * Analyze a file and extract all code structure and metrics
 * @param filePath - Path to the file to analyze
 * @returns Complete file analysis
 */
export async function analyzeFile(filePath: string): Promise<FileAnalysis> {
  const { tree, language } = await parseFile(filePath)
  const content = await import('fs/promises').then((fs) => fs.readFile(filePath, 'utf-8'))

  return {
    filePath,
    language,
    classes: extractClasses(tree),
    functions: extractFunctions(tree),
    imports: extractImports(tree),
    exports: extractExports(tree),
    metrics: calculateMetrics(tree, content),
  }
}

/**
 * Analyze code content and extract all code structure and metrics
 * @param content - Source code content
 * @param language - Programming language
 * @returns Complete file analysis
 */
export function analyzeContent(content: string, language: Language): FileAnalysis {
  const { tree } = parseContent(content, language)

  // For languages without full parser support, return minimal analysis
  const unsupportedLanguages: Language[] = ['python', 'java', 'go', 'c', 'cpp']

  if (unsupportedLanguages.includes(language)) {
    // Return minimal analysis with just basic metrics
    return {
      filePath: undefined,
      language,
      classes: [],
      functions: [],
      imports: [],
      exports: [],
      metrics: {
        loc: content.split('\n').length,
        classCount: 0,
        functionCount: 0,
        averageComplexity: 1,
        maxComplexity: 1,
        maxNestingDepth: 0,
      },
    }
  }

  return {
    filePath: undefined,
    language,
    classes: extractClasses(tree),
    functions: extractFunctions(tree),
    imports: extractImports(tree),
    exports: extractExports(tree),
    metrics: calculateMetrics(tree, content),
  }
}
