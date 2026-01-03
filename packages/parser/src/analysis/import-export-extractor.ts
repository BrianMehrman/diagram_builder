import type { Tree, SyntaxNode } from 'tree-sitter'

export interface ImportSpecifier {
  imported: string
  local: string
}

export interface ImportStatement {
  source: string
  defaultImport: string | undefined
  namespaceImport: string | undefined
  specifiers: ImportSpecifier[]
}

export interface ExportSpecifier {
  local: string
  exported: string
}

export interface ExportStatement {
  source: string | undefined
  isDefault: boolean
  exportAll: boolean
  specifiers: ExportSpecifier[]
}

/**
 * Extract import statements from a Tree-sitter AST
 * @param tree - Parsed Tree-sitter tree
 * @returns Array of import statements
 */
export function extractImports(tree: Tree): ImportStatement[] {
  const imports: ImportStatement[] = []

  // Handle unsupported languages (null/empty trees)
  if (!tree || !tree.rootNode || tree.rootNode.childCount === 0) {
    return imports
  }

  const cursor = tree.walk()

  function traverse(node: SyntaxNode): void {
    if (node.type === 'import_statement') {
      const importStmt = extractImportStatement(node)
      if (importStmt) {
        imports.push(importStmt)
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
  return imports
}

/**
 * Extract export statements from a Tree-sitter AST
 * @param tree - Parsed Tree-sitter tree
 * @returns Array of export statements
 */
export function extractExports(tree: Tree): ExportStatement[] {
  const exports: ExportStatement[] = []

  // Handle unsupported languages (null/empty trees)
  if (!tree || !tree.rootNode || tree.rootNode.childCount === 0) {
    return exports
  }

  const cursor = tree.walk()

  function traverse(node: SyntaxNode): void {
    if (node.type === 'export_statement') {
      const exportStmt = extractExportStatement(node)
      if (exportStmt) {
        exports.push(exportStmt)
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
  return exports
}

/**
 * Extract a single import statement
 */
function extractImportStatement(node: SyntaxNode): ImportStatement | undefined {
  // Extract source
  const sourceNode = node.childForFieldName('source')
  if (!sourceNode) return undefined

  const source = sourceNode.text.replace(/['"]/g, '')

  let defaultImport: string | undefined
  let namespaceImport: string | undefined
  const specifiers: ImportSpecifier[] = []

  // Check for import clause
  const importClause = node.children.find(
    (c) => c.type === 'import_clause' || c.type === 'named_imports'
  )

  if (importClause) {
    // Check for default import (identifier before curly braces or alone)
    const defaultId = importClause.children.find((c) => c.type === 'identifier')
    if (defaultId) {
      defaultImport = defaultId.text
    }

    // Check for namespace import (* as name)
    const namespaceClause = importClause.children.find((c) => c.type === 'namespace_import')
    if (namespaceClause) {
      const nameId = namespaceClause.children.find((c) => c.type === 'identifier')
      if (nameId) {
        namespaceImport = nameId.text
      }
    }

    // Check for named imports
    const namedImports = importClause.children.find((c) => c.type === 'named_imports')
    if (namedImports) {
      for (const child of namedImports.children) {
        if (child.type === 'import_specifier') {
          const imported = child.childForFieldName('name')
          const alias = child.childForFieldName('alias')

          if (imported) {
            specifiers.push({
              imported: imported.text,
              local: alias ? alias.text : imported.text,
            })
          }
        }
      }
    }
  }

  return {
    source,
    defaultImport,
    namespaceImport,
    specifiers,
  }
}

/**
 * Extract a single export statement
 */
function extractExportStatement(node: SyntaxNode): ExportStatement | undefined {
  let source: string | undefined
  let isDefault = false
  let exportAll = false
  const specifiers: ExportSpecifier[] = []

  // Check for source (in case of re-export)
  const sourceNode = node.childForFieldName('source')
  if (sourceNode) {
    source = sourceNode.text.replace(/['"]/g, '')
  }

  // Check for default export
  if (node.children.some((c) => c.type === 'default' || c.text === 'default')) {
    isDefault = true
  }

  // Check for export all (export *)
  if (node.children.some((c) => c.text === '*')) {
    exportAll = true
    return { source, isDefault, exportAll, specifiers }
  }

  // Check for export clause (named exports)
  const exportClause = node.children.find((c) => c.type === 'export_clause')
  if (exportClause) {
    for (const child of exportClause.children) {
      if (child.type === 'export_specifier') {
        const name = child.childForFieldName('name')
        const alias = child.childForFieldName('alias')

        if (name) {
          specifiers.push({
            local: name.text,
            exported: alias ? alias.text : name.text,
          })
        }
      }
    }
  }

  // Check for declaration export (export function/class/const/etc.)
  const declaration = node.childForFieldName('declaration')
  if (declaration) {
    // Extract name from declaration
    let declarationName: string | undefined

    if (declaration.type === 'function_declaration' || declaration.type === 'class_declaration') {
      const nameNode = declaration.childForFieldName('name')
      if (nameNode) {
        declarationName = nameNode.text
      }
    } else if (
      declaration.type === 'lexical_declaration' ||
      declaration.type === 'variable_declaration'
    ) {
      // Extract variable names
      for (const child of declaration.children) {
        if (child.type === 'variable_declarator') {
          const nameNode = child.childForFieldName('name')
          if (nameNode) {
            specifiers.push({
              local: nameNode.text,
              exported: nameNode.text,
            })
          }
        }
      }
    }

    if (declarationName) {
      specifiers.push({
        local: declarationName,
        exported: declarationName,
      })
    }
  }

  return {
    source,
    isDefault,
    exportAll,
    specifiers,
  }
}
