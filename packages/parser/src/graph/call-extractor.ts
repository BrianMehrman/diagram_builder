import type { Tree, SyntaxNode } from 'tree-sitter'

/**
 * Represents a function call in the code
 */
export interface FunctionCall {
  /** Name of the called function or method */
  callee: string
  /** Receiver object for method calls (e.g., 'obj' in obj.method()) */
  receiver: string | undefined
  /** Number of arguments passed to the call */
  argumentCount: number
  /** True if this is a method call (obj.method()) */
  isMemberCall: boolean
  /** True if this is a constructor call (new ClassName()) */
  isConstructor: boolean
  /** Line number where the call occurs */
  line: number
  /** Column number where the call occurs */
  column: number
}

/**
 * Extracts all function calls from the AST
 *
 * @param tree - Parsed AST tree
 * @returns Array of function call information
 */
export function extractFunctionCalls(tree: Tree): FunctionCall[] {
  const calls: FunctionCall[] = []
  // Handle unsupported languages (null/empty trees)
  if (!tree || !tree.rootNode || tree.rootNode.childCount === 0) {
    return calls
  }
  const cursor = tree.walk()

  function traverse(node: SyntaxNode): void {
    // Handle regular call expressions
    if (node.type === 'call_expression') {
      const callInfo = extractCallInfo(node, false)
      if (callInfo) {
        calls.push(callInfo)
      }
    }

    // Handle new expressions (constructor calls)
    if (node.type === 'new_expression') {
      const callInfo = extractCallInfo(node, true)
      if (callInfo) {
        calls.push(callInfo)
      }
    }

    // Traverse children
    for (const child of node.children) {
      traverse(child)
    }
  }

  traverse(cursor.currentNode)

  return calls
}

/**
 * Extracts call information from a call_expression or new_expression node
 *
 * @param node - AST node representing the call
 * @param isConstructor - True if this is a new expression
 * @returns Function call information
 */
function extractCallInfo(node: SyntaxNode, isConstructor: boolean): FunctionCall | undefined {
  // Find the function/method/constructor being called
  // For call_expression: first child is the function (identifier or member_expression)
  // For new_expression: second child is the constructor (first is 'new' keyword)
  let functionNode: SyntaxNode | undefined

  for (const child of node.children) {
    if (
      child.type === 'identifier' ||
      child.type === 'member_expression' ||
      child.type === 'call_expression'
    ) {
      functionNode = child
      break
    }
  }

  if (!functionNode) {
    return undefined
  }

  // Extract callee name and receiver
  let callee: string | undefined
  let receiver: string | undefined
  let isMemberCall = false

  if (functionNode.type === 'identifier') {
    // Simple function call: foo()
    callee = functionNode.text
  } else if (functionNode.type === 'member_expression') {
    // Member call: obj.method()
    isMemberCall = true

    const propertyNode = functionNode.childForFieldName('property')
    if (propertyNode) {
      callee = propertyNode.text
    }

    const objectNode = functionNode.childForFieldName('object')
    if (objectNode) {
      receiver = extractReceiverName(objectNode)
    }
  } else if (functionNode.type === 'call_expression') {
    // Chained call: obj.foo().bar()
    // The property being called is in the outer call
    // This is handled by recursive traversal
    return undefined
  }

  // If we couldn't extract a callee, skip this call
  if (!callee) {
    return undefined
  }

  // Extract arguments
  const argumentsNode = findChildByType(node, 'arguments')
  const argumentCount = argumentsNode ? countArguments(argumentsNode) : 0

  return {
    callee,
    receiver,
    argumentCount,
    isMemberCall,
    isConstructor,
    line: node.startPosition.row + 1,
    column: node.startPosition.column,
  }
}

/**
 * Extracts the receiver name from a member expression object
 *
 * @param node - AST node representing the object
 * @returns Receiver name
 */
function extractReceiverName(node: SyntaxNode): string {
  if (node.type === 'identifier') {
    return node.text
  } else if (node.type === 'this') {
    return 'this'
  } else if (node.type === 'member_expression') {
    // For nested member expressions like obj.foo.bar(), return the full chain
    const objectNode = node.childForFieldName('object')
    const propertyNode = node.childForFieldName('property')
    if (objectNode && propertyNode) {
      return `${extractReceiverName(objectNode)}.${propertyNode.text}`
    }
  } else if (node.type === 'call_expression') {
    // For chained calls like obj.foo().bar(), return 'foo()'
    const functionNode = node.childForFieldName('function')
    if (functionNode) {
      if (functionNode.type === 'identifier') {
        return `${functionNode.text}()`
      } else if (functionNode.type === 'member_expression') {
        const propertyNode = functionNode.childForFieldName('property')
        if (propertyNode) {
          return `${propertyNode.text}()`
        }
      }
    }
  }

  return node.text
}

/**
 * Counts the number of arguments in an arguments node
 *
 * @param node - AST node representing the arguments list
 * @returns Number of arguments
 */
function countArguments(node: SyntaxNode): number {
  let count = 0

  for (const child of node.children) {
    // Skip parentheses and commas
    if (child.type !== '(' && child.type !== ')' && child.type !== ',') {
      count++
    }
  }

  return count
}

/**
 * Finds a child node by type
 *
 * @param node - Parent node
 * @param type - Type to search for
 * @returns Child node or undefined
 */
function findChildByType(node: SyntaxNode, type: string): SyntaxNode | undefined {
  for (const child of node.children) {
    if (child.type === type) {
      return child
    }
  }
  return undefined
}
