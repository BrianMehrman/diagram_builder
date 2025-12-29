import type { Tree, SyntaxNode } from 'tree-sitter'

export interface ParameterDefinition {
  name: string
  type: string | undefined
}

export interface MethodDefinition {
  name: string
  parameters: ParameterDefinition[]
  returnType: string | undefined
  visibility: 'public' | 'private' | 'protected' | undefined
  isAsync: boolean
  isGenerator: boolean
  isStatic: boolean
}

export interface PropertyDefinition {
  name: string
  type: string | undefined
  visibility: 'public' | 'private' | 'protected' | undefined
  isStatic: boolean
  isReadonly: boolean
}

export interface ClassDefinition {
  name: string
  methods: MethodDefinition[]
  properties: PropertyDefinition[]
  extends: string | undefined
  implements: string[]
  isAbstract: boolean
}

/**
 * Extract class definitions from a Tree-sitter AST
 * @param tree - Parsed Tree-sitter tree
 * @returns Array of class definitions
 */
export function extractClasses(tree: Tree): ClassDefinition[] {
  const classes: ClassDefinition[] = []
  const cursor = tree.walk()

  function traverse(node: SyntaxNode): void {
    if (node.type === 'class_declaration' || node.type === 'class') {
      const classDef = extractClassDefinition(node)
      if (classDef) {
        classes.push(classDef)
      }
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
  return classes
}

/**
 * Extract a single class definition from a class_declaration node
 */
function extractClassDefinition(node: SyntaxNode): ClassDefinition | undefined {
  const nameNode = node.childForFieldName('name')
  if (!nameNode) return undefined

  const name = nameNode.text

  // Extract heritage (extends/implements)
  let extendsName: string | undefined
  const implementsList: string[] = []

  // Look for class_heritage node (JavaScript/TypeScript)
  const heritageNode = findChildByType(node, 'class_heritage')

  if (heritageNode) {
    // In JavaScript, class_heritage contains "extends" keyword followed by identifier
    // In TypeScript, it may also contain implements clause
    const extendsIdentifier = heritageNode.children.find(
      c => c.type === 'identifier' || c.type === 'type_identifier'
    )
    if (extendsIdentifier) {
      extendsName = extendsIdentifier.text
    }

    // Look for implements clause in TypeScript
    const implementsClause = findChildByType(heritageNode, 'implements_clause') ||
      findChildByType(heritageNode, 'class_implements_clause')

    if (implementsClause) {
      const typeList = implementsClause.children.filter(
        c => c.type === 'type_identifier' || c.type === 'identifier'
      )
      implementsList.push(...typeList.map(t => t.text))
    }
  }

  // Extract class body
  const bodyNode = node.childForFieldName('body')
  const methods: MethodDefinition[] = []
  const properties: PropertyDefinition[] = []

  if (bodyNode) {
    for (let i = 0; i < bodyNode.childCount; i++) {
      const member = bodyNode.child(i)
      if (!member) continue

      if (member.type === 'method_definition') {
        const method = extractMethodDefinition(member)
        if (method) {
          methods.push(method)
        }
      } else if (
        member.type === 'public_field_definition' ||
        member.type === 'field_definition' ||
        member.type === 'property_declaration'
      ) {
        const property = extractPropertyDefinition(member)
        if (property) {
          properties.push(property)
        }
      }
    }
  }

  // Check for abstract modifier
  const isAbstract = node.children.some(c => c.type === 'abstract' || c.text === 'abstract')

  return {
    name,
    methods,
    properties,
    extends: extendsName,
    implements: implementsList,
    isAbstract,
  }
}

/**
 * Extract method definition from method_definition node
 */
function extractMethodDefinition(node: SyntaxNode): MethodDefinition | undefined {
  const nameNode = node.childForFieldName('name')
  if (!nameNode) return undefined

  const name = nameNode.text
  const parameters = extractParameters(node)
  const returnType = extractReturnType(node)
  const visibility = extractVisibility(node)

  // Check for async/generator/static modifiers
  const isAsync = node.children.some(c => c.type === 'async' || c.text === 'async')
  const isGenerator = node.children.some(c => c.type === 'generator' || c.text === '*')
  const isStatic = node.children.some(c => c.type === 'static' || c.text === 'static')

  return {
    name,
    parameters,
    returnType,
    visibility,
    isAsync,
    isGenerator,
    isStatic,
  }
}

/**
 * Extract property definition from field/property node
 */
function extractPropertyDefinition(node: SyntaxNode): PropertyDefinition | undefined {
  const nameNode = node.childForFieldName('name') || node.childForFieldName('property')
  if (!nameNode) return undefined

  const name = nameNode.text
  const type = extractTypeAnnotation(node)
  const visibility = extractVisibility(node)

  const isStatic = node.children.some(c => c.type === 'static' || c.text === 'static')
  const isReadonly = node.children.some(c => c.type === 'readonly' || c.text === 'readonly')

  return {
    name,
    type,
    visibility,
    isStatic,
    isReadonly,
  }
}

/**
 * Extract parameters from a function/method node
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

      if (paramName) {
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
 * Extract return type annotation from a function/method node
 */
function extractReturnType(node: SyntaxNode): string | undefined {
  const typeNode = node.childForFieldName('return_type')
  if (!typeNode) return undefined

  // Skip the colon and get the actual type
  const typeChild = typeNode.children.find(c => c.type !== ':')
  return typeChild?.text
}

/**
 * Extract type annotation from a node
 */
function extractTypeAnnotation(node: SyntaxNode): string | undefined {
  const typeNode = node.childForFieldName('type')
  if (!typeNode) return undefined

  // Skip the colon and get the actual type
  const typeChild = typeNode.children.find(c => c.type !== ':')
  return typeChild?.text
}

/**
 * Extract visibility modifier (public/private/protected)
 */
function extractVisibility(
  node: SyntaxNode
): 'public' | 'private' | 'protected' | undefined {
  const accessibilityModifier = node.children.find(
    c =>
      c.type === 'accessibility_modifier' ||
      c.text === 'public' ||
      c.text === 'private' ||
      c.text === 'protected'
  )

  if (!accessibilityModifier) return undefined

  const text = accessibilityModifier.text
  if (text === 'public' || text === 'private' || text === 'protected') {
    return text
  }

  return undefined
}

/**
 * Find a child node by type
 */
function findChildByType(node: SyntaxNode, type: string): SyntaxNode | undefined {
  return node.children.find(c => c.type === type)
}
