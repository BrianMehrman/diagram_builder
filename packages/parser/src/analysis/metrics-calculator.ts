import type { Tree, SyntaxNode } from 'tree-sitter'
import { extractClasses } from './class-extractor'
import { extractFunctions } from './function-extractor'

export interface CodeMetrics {
  loc: number
  classCount: number
  functionCount: number
  averageComplexity: number
  maxComplexity: number
  maxNestingDepth: number
}

/**
 * Calculate code metrics from a Tree-sitter AST
 * @param tree - Parsed Tree-sitter tree
 * @param content - Source code content
 * @returns Code metrics
 */
export function calculateMetrics(tree: Tree, content: string): CodeMetrics {
  // Calculate lines of code
  const loc = calculateLOC(content)

  // Count classes and functions
  const classes = extractClasses(tree)
  const functions = extractFunctions(tree)

  const classCount = classes.length
  const functionCount = functions.length

  // Calculate complexity metrics
  const complexities = calculateComplexities(tree)
  const averageComplexity =
    complexities.length > 0
      ? Math.round(complexities.reduce((sum, c) => sum + c, 0) / complexities.length)
      : 0
  const maxComplexity = complexities.length > 0 ? Math.max(...complexities) : 0

  // Calculate nesting depth
  const maxNestingDepth = calculateMaxNestingDepth(tree)

  return {
    loc,
    classCount,
    functionCount,
    averageComplexity,
    maxComplexity,
    maxNestingDepth,
  }
}

/**
 * Calculate lines of code (non-empty lines)
 */
function calculateLOC(content: string): number {
  if (!content.trim()) return 0

  const lines = content.split('\n')
  return lines.length
}

/**
 * Calculate cyclomatic complexity for all functions in the tree
 */
function calculateComplexities(tree: Tree): number[] {
  const complexities: number[] = []
  const cursor = tree.walk()

  function traverse(node: SyntaxNode): void {
    // Check if this is a function node
    if (
      node.type === 'function_declaration' ||
      node.type === 'function' ||
      node.type === 'arrow_function' ||
      node.type === 'function_expression' ||
      node.type === 'method_definition'
    ) {
      const complexity = calculateComplexityForFunction(node)
      complexities.push(complexity)
    }

    // Recurse through children
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i)
      if (child) {
        traverse(child)
      }
    }
  }

  traverse(cursor.currentNode)
  return complexities
}

/**
 * Calculate cyclomatic complexity for a single function
 * Complexity = number of decision points + 1
 * Decision points: if, else if, while, for, case, &&, ||, ?, catch
 */
function calculateComplexityForFunction(node: SyntaxNode): number {
  let complexity = 1 // Base complexity

  function countDecisionPoints(n: SyntaxNode): void {
    // Count decision points
    switch (n.type) {
      case 'if_statement':
        complexity++
        break
      case 'else_clause':
        // Only count else if, not plain else
        if (n.children.some(c => c.type === 'if_statement')) {
          complexity++
        }
        break
      case 'while_statement':
      case 'for_statement':
      case 'for_in_statement':
      case 'do_statement':
        complexity++
        break
      case 'case':
      case 'switch_case':
        complexity++
        break
      case 'catch_clause':
        complexity++
        break
      case 'ternary_expression':
      case 'conditional_expression':
        complexity++
        break
      case 'binary_expression':
        // Count logical operators (&& and ||)
        if (n.children.some(c => c.text === '&&' || c.text === '||')) {
          complexity++
        }
        break
    }

    // Recurse through children
    for (let i = 0; i < n.childCount; i++) {
      const child = n.child(i)
      if (child) {
        countDecisionPoints(child)
      }
    }
  }

  countDecisionPoints(node)
  return complexity
}

/**
 * Calculate maximum nesting depth in the tree
 */
function calculateMaxNestingDepth(tree: Tree): number {
  let maxDepth = 0
  const cursor = tree.walk()

  function traverse(node: SyntaxNode, depth: number): void {
    // Count nesting for block statements and control structures
    const nestingNodes = [
      'if_statement',
      'while_statement',
      'for_statement',
      'for_in_statement',
      'do_statement',
      'try_statement',
      'function_declaration',
      'arrow_function',
      'class_declaration',
    ]

    const isNestingNode = nestingNodes.includes(node.type)
    const currentDepth = isNestingNode ? depth + 1 : depth

    if (currentDepth > maxDepth) {
      maxDepth = currentDepth
    }

    // Recurse through children
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i)
      if (child) {
        traverse(child, currentDepth)
      }
    }
  }

  traverse(cursor.currentNode, 0)
  return maxDepth
}
