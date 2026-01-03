import type { Tree, SyntaxNode } from 'tree-sitter'

export interface ParameterDefinition {
  name: string
  type: string | undefined
}

export interface FunctionDefinition {
  name: string
  parameters: ParameterDefinition[]
  returnType: string | undefined
  isAsync: boolean
  isGenerator: boolean
  isArrow: boolean
  isTopLevel: boolean
}

/**
 * Extract function definitions from a Tree-sitter AST
 * @param tree - Parsed Tree-sitter tree
 * @returns Array of function definitions
 */
export function extractFunctions(tree: Tree): FunctionDefinition[] {
  const functions: FunctionDefinition[] = []

  // Handle unsupported languages (null/empty trees)
  if (!tree || !tree.rootNode || tree.rootNode.childCount === 0) {
    return functions
  }

  const cursor = tree.walk()

  function traverse(node: SyntaxNode, depth: number = 0): void {
    // Check if this is a function node
    if (
      node.type === 'function_declaration' ||
      node.type === 'function' ||
      node.type === 'arrow_function' ||
      node.type === 'function_expression' ||
      node.type === 'generator_function_declaration' ||
      node.type === 'generator_function'
    ) {
      const funcDef = extractFunctionDefinition(node, depth)
      if (funcDef) {
        functions.push(funcDef)
      }
    }

    // Also check for variable declarations with arrow functions or function expressions
    if (node.type === 'lexical_declaration' || node.type === 'variable_declaration') {
      const declarator = node.children.find((c) => c.type === 'variable_declarator')
      if (declarator) {
        const value = declarator.childForFieldName('value')
        if (
          value &&
          (value.type === 'arrow_function' ||
            value.type === 'function' ||
            value.type === 'function_expression')
        ) {
          const nameNode = declarator.childForFieldName('name')
          if (nameNode) {
            const funcDef = extractFunctionDefinition(value, depth, nameNode.text)
            if (funcDef) {
              functions.push(funcDef)
            }
          }
        }
      }
    }

    // Recurse through children
    for (let i = 0; i < node.childCount; i++) {
      const child = node.child(i)
      if (child) {
        // Skip function bodies to avoid double-counting nested functions
        if (
          node.type === 'function_declaration' ||
          node.type === 'arrow_function' ||
          node.type === 'function_expression'
        ) {
          // Still traverse nested functions, but increase depth
          if (child.type !== 'statement_block') {
            traverse(child, depth)
          } else {
            // Traverse statement block but mark as nested
            traverse(child, depth + 1)
          }
        } else {
          traverse(child, depth)
        }
      }
    }
  }

  traverse(cursor.currentNode)
  return functions
}

/**
 * Extract a single function definition from a function node
 */
function extractFunctionDefinition(
  node: SyntaxNode,
  depth: number,
  explicitName?: string
): FunctionDefinition | undefined {
  // Get function name
  let name: string

  if (explicitName) {
    name = explicitName
  } else {
    const nameNode = node.childForFieldName('name')
    if (!nameNode) {
      // Anonymous function - skip it
      return undefined
    }
    name = nameNode.text
  }

  // Extract parameters
  const parameters = extractParameters(node)

  // Extract return type
  const returnType = extractReturnType(node)

  // Check for modifiers
  const isAsync =
    node.type.includes('async') ||
    node.children.some((c) => c.type === 'async' || c.text === 'async') ||
    node.parent?.children.some((c) => c.type === 'async' || c.text === 'async')

  const isGenerator =
    node.type.includes('generator') ||
    node.children.some((c) => c.text === '*') ||
    node.parent?.children.some((c) => c.text === '*')

  const isArrow = node.type === 'arrow_function'

  // Top-level is depth 0
  const isTopLevel = depth === 0

  return {
    name,
    parameters,
    returnType,
    isAsync: isAsync || false,
    isGenerator: isGenerator || false,
    isArrow,
    isTopLevel,
  }
}

/**
 * Extract parameters from a function node
 */
function extractParameters(node: SyntaxNode): ParameterDefinition[] {
  const parameters: ParameterDefinition[] = []
  const paramsNode = node.childForFieldName('parameters')

  if (!paramsNode) return parameters

  for (let i = 0; i < paramsNode.childCount; i++) {
    const param = paramsNode.child(i)
    if (!param) continue

    if (
      param.type === 'required_parameter' ||
      param.type === 'optional_parameter' ||
      param.type === 'identifier'
    ) {
      const paramName = param.childForFieldName('pattern') || param
      const paramType = extractTypeAnnotation(param)

      if (paramName && paramName.type === 'identifier') {
        parameters.push({
          name: paramName.text,
          type: paramType,
        })
      }
    }
  }

  return parameters
}

/**
 * Extract return type annotation from a function node
 */
function extractReturnType(node: SyntaxNode): string | undefined {
  const typeNode = node.childForFieldName('return_type')
  if (!typeNode) return undefined

  // Skip the colon and get the actual type
  const typeText = typeNode.text
  if (typeText.startsWith(':')) {
    return typeText.substring(1).trim()
  }

  return typeText.trim()
}

/**
 * Extract type annotation from a node
 */
function extractTypeAnnotation(node: SyntaxNode): string | undefined {
  const typeNode = node.childForFieldName('type')
  if (!typeNode) return undefined

  // Skip the colon and get the actual type
  const typeText = typeNode.text
  if (typeText.startsWith(':')) {
    return typeText.substring(1).trim()
  }

  return typeText.trim()
}
