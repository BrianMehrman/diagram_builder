import { parseContent } from '../parser/file-parser'
import { analyzeContent } from '../analysis/analyzer'
import { resolveImports } from './import-resolver'
import { extractFunctionCalls } from './call-extractor'
import { extractInheritance } from './inheritance-extractor'
import { DependencyGraph, type DependencyNode, type DependencyEdge } from './dependency-graph'
import type { Language } from '../parser/parser-factory'
import { logger } from '../logger'
import path from 'path'

/**
 * Input for building dependency graph
 */
export interface GraphBuildInput {
  /** Absolute file path */
  filePath: string
  /** File content */
  content: string
}

/**
 * Builds a dependency graph from source files
 *
 * @param files - Array of files with content
 * @returns Dependency graph
 */
export function buildDependencyGraph(files: GraphBuildInput[]): DependencyGraph {
  logger.debug('Building dependency graph', { fileCount: files.length });

  const graph = new DependencyGraph()

  // Map to store file path to file node ID
  const filePathToNodeId = new Map<string, string>()

  // Track files that failed to parse (to skip in second pass)
  const failedFiles = new Set<string>()

  // First pass: Create file nodes and analyze each file
  for (const file of files) {
    const language = detectLanguage(file.filePath)

    let analysis;
    try {
      analysis = analyzeContent(file.content, language)
    } catch (err) {
      logger.warn('Failed to analyze file, creating minimal node', {
        filePath: file.filePath,
        language,
        error: (err as Error).message
      });
      // Track failed file to skip in second pass
      failedFiles.add(file.filePath)
      // Create minimal file node for failed analysis
      const fileNodeId = createNodeId('file', file.filePath)
      filePathToNodeId.set(file.filePath, fileNodeId)
      const fileNode: DependencyNode = {
        id: fileNodeId,
        type: 'file',
        name: path.basename(file.filePath),
        path: file.filePath,
        metadata: {
          language,
          metrics: { loc: file.content.split('\n').length, classCount: 0, functionCount: 0, averageComplexity: 1, maxComplexity: 1, maxNestingDepth: 0 },
          parseError: (err as Error).message,
        },
      }
      graph.addNode(fileNode)
      continue;
    }

    // Create file node
    const fileNodeId = createNodeId('file', file.filePath)
    filePathToNodeId.set(file.filePath, fileNodeId)

    const fileNode: DependencyNode = {
      id: fileNodeId,
      type: 'file',
      name: path.basename(file.filePath),
      path: file.filePath,
      metadata: {
        language,
        metrics: analysis.metrics,
      },
    }
    graph.addNode(fileNode)

    // Create class nodes
    for (const classInfo of analysis.classes) {
      const classNodeId = createNodeId('class', `${file.filePath}:${classInfo.name}`)
      const classNode: DependencyNode = {
        id: classNodeId,
        type: 'class',
        name: classInfo.name,
        path: file.filePath,
        metadata: {
          methods: classInfo.methods.map((m) => m.name),
          properties: classInfo.properties.map((p) => p.name),
          isAbstract: classInfo.isAbstract,
        },
      }
      graph.addNode(classNode)

      // Create edge from file to class
      graph.addEdge({
        source: fileNodeId,
        target: classNodeId,
        type: 'exports',
        metadata: {},
      })
    }

    // Create function nodes (only top-level functions)
    for (const functionInfo of analysis.functions.filter((f) => f.isTopLevel)) {
      const functionNodeId = createNodeId('function', `${file.filePath}:${functionInfo.name}`)
      const functionNode: DependencyNode = {
        id: functionNodeId,
        type: 'function',
        name: functionInfo.name,
        path: file.filePath,
        metadata: {
          parameters: functionInfo.parameters.length,
          isAsync: functionInfo.isAsync,
          isGenerator: functionInfo.isGenerator,
        },
      }
      graph.addNode(functionNode)

      // Create edge from file to function
      graph.addEdge({
        source: fileNodeId,
        target: functionNodeId,
        type: 'exports',
        metadata: {},
      })
    }
  }

  // Second pass: Create edges for dependencies
  for (const file of files) {
    // Skip files that failed to parse in first pass
    if (failedFiles.has(file.filePath)) {
      continue
    }

    const language = detectLanguage(file.filePath)

    let parseResult;
    let analysis;
    try {
      parseResult = parseContent(file.content, language)
      analysis = analyzeContent(file.content, language)
    } catch (err) {
      logger.warn('Failed to parse file in second pass, skipping edges', {
        filePath: file.filePath,
        language,
        error: (err as Error).message
      });
      continue
    }

    const fileNodeId = filePathToNodeId.get(file.filePath)

    if (!fileNodeId) continue

    // Create import edges between files
    const resolvedImports = resolveImports(file.filePath, analysis.imports)
    for (const importInfo of resolvedImports) {
      if (!importInfo.isExternal && importInfo.resolvedPath) {
        const targetFileNodeId = filePathToNodeId.get(importInfo.resolvedPath)
        if (targetFileNodeId) {
          const importEdge: DependencyEdge = {
            source: fileNodeId,
            target: targetFileNodeId,
            type: 'imports',
            metadata: {
              importedSymbols: importInfo.importedSymbols,
            },
          }
          graph.addEdge(importEdge)
        }
      }
    }

    // Create inheritance edges
    const inheritance = extractInheritance(parseResult.tree)
    for (const relation of inheritance) {
      const childNodeId = findNodeIdByName(graph, relation.child, file.filePath)
      const parentNodeId = findNodeIdByName(graph, relation.parent, file.filePath)

      if (childNodeId && parentNodeId) {
        const inheritanceEdge: DependencyEdge = {
          source: childNodeId,
          target: parentNodeId,
          type: relation.type === 'extends' ? 'extends' : 'implements',
          metadata: {},
        }
        graph.addEdge(inheritanceEdge)
      }
    }

    // Create call edges
    const calls = extractFunctionCalls(parseResult.tree)
    for (const call of calls) {
      // Try to find the called function node
      const calleeNodeId = findNodeIdByName(graph, call.callee, file.filePath)

      // For now, we'll create a generic metadata entry
      // In a more sophisticated implementation, we would:
      // 1. Track which function/method the call is made from
      // 2. Create edges between function/method nodes
      if (calleeNodeId) {
        // This is a simplified version - we're not tracking the caller precisely
        // In a full implementation, we'd need to track calling context
        const callEdge: DependencyEdge = {
          source: fileNodeId,
          target: calleeNodeId,
          type: 'calls',
          metadata: {
            callee: call.callee,
            argumentCount: call.argumentCount,
            line: call.line,
          },
        }
        graph.addEdge(callEdge)
      }
    }
  }

  logger.debug('Dependency graph built', {
    nodeCount: graph.getNodes().length,
    edgeCount: graph.getEdges().length
  });

  return graph
}

/**
 * Detects language from file extension
 *
 * @param filePath - File path
 * @returns Language
 */
function detectLanguage(filePath: string): Language {
  const ext = path.extname(filePath)

  // TypeScript/JavaScript
  if (ext === '.tsx') return 'tsx'
  if (ext === '.ts' || ext === '.d.ts') return 'typescript'
  if (ext === '.js' || ext === '.jsx' || ext === '.mjs' || ext === '.cjs') return 'javascript'

  // Python
  if (ext === '.py') return 'python'

  // Java
  if (ext === '.java') return 'java'

  // Go
  if (ext === '.go') return 'go'

  // C/C++
  if (ext === '.c' || ext === '.h') return 'c'
  if (ext === '.cpp' || ext === '.cc' || ext === '.cxx' || ext === '.hpp') return 'cpp'

  // Default to javascript for unknown extensions
  return 'javascript'
}

/**
 * Creates a unique node ID
 *
 * @param type - Node type
 * @param identifier - Unique identifier
 * @returns Node ID
 */
function createNodeId(type: string, identifier: string): string {
  return `${type}:${identifier}`
}

/**
 * Finds a node ID by name and file path
 *
 * @param graph - Dependency graph
 * @param name - Node name to search for
 * @param filePath - File path context
 * @returns Node ID or undefined
 */
function findNodeIdByName(
  graph: DependencyGraph,
  name: string,
  filePath: string
): string | undefined {
  const nodes = graph.getNodes()

  // First try to find in the same file
  const sameFileNode = nodes.find((n) => n.name === name && n.path === filePath)
  if (sameFileNode) {
    return sameFileNode.id
  }

  // Then try to find in any file
  const anyNode = nodes.find((n) => n.name === name)
  if (anyNode) {
    return anyNode.id
  }

  return undefined
}
