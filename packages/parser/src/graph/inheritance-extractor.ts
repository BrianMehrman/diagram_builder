import type { Tree, SyntaxNode } from 'tree-sitter'

/**
 * Represents an inheritance or implementation relationship
 */
export interface InheritanceRelationship {
  /** Child class or interface */
  child: string
  /** Parent class or interface */
  parent: string
  /** Type of relationship (extends or implements) */
  type: 'extends' | 'implements'
  /** Line number where the relationship is declared */
  line: number
  /** Column number where the relationship is declared */
  column: number
}

/**
 * Extracts inheritance and implementation relationships from the AST
 *
 * @param tree - Parsed AST tree
 * @returns Array of inheritance relationships
 */
export function extractInheritance(tree: Tree): InheritanceRelationship[] {
  const relationships: InheritanceRelationship[] = []
  const cursor = tree.walk()

  function traverse(node: SyntaxNode): void {
    // Extract class extends and implements
    if (node.type === 'class_declaration' || node.type === 'class') {
      const className = extractClassName(node)
      if (className) {
        // Extract extends relationships
        const extendsParent = extractExtendsParent(node)
        if (extendsParent) {
          relationships.push({
            child: className,
            parent: extendsParent,
            type: 'extends',
            line: node.startPosition.row + 1,
            column: node.startPosition.column,
          })
        }

        // Extract implements relationships
        const implementsParents = extractImplementsParents(node)
        for (const parent of implementsParents) {
          relationships.push({
            child: className,
            parent,
            type: 'implements',
            line: node.startPosition.row + 1,
            column: node.startPosition.column,
          })
        }
      }
    }

    // Extract interface extends
    if (node.type === 'interface_declaration') {
      const interfaceName = extractInterfaceName(node)
      if (interfaceName) {
        const extendsParents = extractInterfaceExtendsParents(node)
        for (const parent of extendsParents) {
          relationships.push({
            child: interfaceName,
            parent,
            type: 'extends',
            line: node.startPosition.row + 1,
            column: node.startPosition.column,
          })
        }
      }
    }

    // Traverse children
    for (const child of node.children) {
      traverse(child)
    }
  }

  traverse(cursor.currentNode)

  return relationships
}

/**
 * Extracts the class name from a class declaration node
 *
 * @param node - Class declaration node
 * @returns Class name or undefined
 */
function extractClassName(node: SyntaxNode): string | undefined {
  const nameNode = node.childForFieldName('name')
  return nameNode?.text
}

/**
 * Extracts the interface name from an interface declaration node
 *
 * @param node - Interface declaration node
 * @returns Interface name or undefined
 */
function extractInterfaceName(node: SyntaxNode): string | undefined {
  const nameNode = node.childForFieldName('name')
  return nameNode?.text
}

/**
 * Extracts the parent class name from extends clause
 *
 * @param node - Class declaration node
 * @returns Parent class name or undefined
 */
function extractExtendsParent(node: SyntaxNode): string | undefined {
  // Look for class_heritage node
  const heritageNode = findChildByType(node, 'class_heritage')
  if (!heritageNode) {
    return undefined
  }

  // Look for extends_clause node (TypeScript)
  const extendsClause = findChildByType(heritageNode, 'extends_clause')
  if (extendsClause) {
    // Find the identifier in the extends_clause
    for (const child of extendsClause.children) {
      if (child.type === 'identifier' || child.type === 'type_identifier') {
        return child.text
      }
    }
  }

  // Fallback: Find the identifier after 'extends' keyword (JavaScript)
  let foundExtends = false
  for (const child of heritageNode.children) {
    if (child.type === 'extends') {
      foundExtends = true
      continue
    }
    if (foundExtends && (child.type === 'identifier' || child.type === 'type_identifier')) {
      return child.text
    }
  }

  return undefined
}

/**
 * Extracts parent interface names from implements clause
 *
 * @param node - Class declaration node
 * @returns Array of parent interface names
 */
function extractImplementsParents(node: SyntaxNode): string[] {
  const parents: string[] = []

  // Look for class_heritage node
  const heritageNode = findChildByType(node, 'class_heritage')
  if (!heritageNode) {
    return parents
  }

  // Look for implements_clause node (TypeScript)
  const implementsClause = findChildByType(heritageNode, 'implements_clause')
  if (implementsClause) {
    // Find all type identifiers in the implements_clause
    for (const child of implementsClause.children) {
      if (child.type === 'identifier' || child.type === 'type_identifier') {
        parents.push(child.text)
      }
    }
    return parents
  }

  // Fallback: Find all identifiers after 'implements' keyword (JavaScript)
  let foundImplements = false
  for (const child of heritageNode.children) {
    if (child.type === 'implements') {
      foundImplements = true
      continue
    }
    if (foundImplements && (child.type === 'identifier' || child.type === 'type_identifier')) {
      parents.push(child.text)
    }
  }

  return parents
}

/**
 * Extracts parent interface names from interface extends clause
 *
 * @param node - Interface declaration node
 * @returns Array of parent interface names
 */
function extractInterfaceExtendsParents(node: SyntaxNode): string[] {
  const parents: string[] = []

  // Look for extends_clause or extends_type_clause
  const extendsClause = findChildByType(node, 'extends_clause') || findChildByType(node, 'extends_type_clause')
  if (!extendsClause) {
    return parents
  }

  // Extract all type identifiers from the extends clause
  for (const child of extendsClause.children) {
    if (child.type === 'type_identifier' || child.type === 'identifier') {
      parents.push(child.text)
    }
  }

  return parents
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
