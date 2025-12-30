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

// Analysis
export { analyzeFile, analyzeContent } from './analysis/analyzer'
export type { FileAnalysis } from './analysis/analyzer'

// Class extraction
export { extractClasses } from './analysis/class-extractor'
export type { ClassDefinition, MethodDefinition, PropertyDefinition, ParameterDefinition as ClassParameterDefinition } from './analysis/class-extractor'

// Function extraction
export { extractFunctions } from './analysis/function-extractor'
export type { FunctionDefinition, ParameterDefinition as FunctionParameterDefinition } from './analysis/function-extractor'

// Import/Export extraction
export { extractImports, extractExports } from './analysis/import-export-extractor'
export type { ImportStatement, ImportSpecifier, ExportStatement, ExportSpecifier } from './analysis/import-export-extractor'

// Metrics
export { calculateMetrics } from './analysis/metrics-calculator'
export type { CodeMetrics } from './analysis/metrics-calculator'

// Dependency Graph
export { DependencyGraph } from './graph/dependency-graph'
export type { DependencyNode, DependencyEdge, DependencyNodeType, DependencyEdgeType } from './graph/dependency-graph'

// Graph Builder
export { buildDependencyGraph } from './graph/graph-builder'
export type { GraphBuildInput } from './graph/graph-builder'

// Import Resolution
export { resolveImports } from './graph/import-resolver'
export type { ResolvedImport } from './graph/import-resolver'

// Call Extraction
export { extractFunctionCalls } from './graph/call-extractor'
export type { FunctionCall } from './graph/call-extractor'

// Inheritance Extraction
export { extractInheritance } from './graph/inheritance-extractor'
export type { InheritanceRelationship } from './graph/inheritance-extractor'

// Repository Loading
export { loadRepository } from './repository/repository-loader'
export type { RepositoryConfig, RepositoryContext } from './repository/repository-loader'

// Directory Scanner
export { scanDirectory } from './repository/directory-scanner'
export type { ScanOptions } from './repository/directory-scanner'

// Git Cloner
export { cloneRepository, listRemoteBranches, cloneAtCommit, cloneAtTag } from './repository/git-cloner'
export type { CloneOptions } from './repository/git-cloner'
