import path from 'path'
import type { ImportStatement } from '../analysis/import-export-extractor'

/**
 * Represents a resolved import with full path information
 */
export interface ResolvedImport {
  /** Original import source string from the import statement */
  source: string
  /** Absolute resolved path (undefined for external packages) */
  resolvedPath: string | undefined
  /** True if this is an external package (node_modules) */
  isExternal: boolean
  /** Imported symbols from the import statement */
  importedSymbols: {
    defaultImport: string | undefined
    namespaceImport: string | undefined
    specifiers: Array<{ imported: string; local: string }>
  }
}

/**
 * Resolves import statements to absolute file paths
 *
 * @param sourceFile - Absolute path to the file containing the imports
 * @param imports - Array of import statements to resolve
 * @returns Array of resolved imports with path information
 */
export function resolveImports(
  sourceFile: string,
  imports: ImportStatement[]
): ResolvedImport[] {
  return imports.map(importStmt => {
    const { source, defaultImport, namespaceImport, specifiers } = importStmt

    // Check if this is an external package
    const isExternal = isExternalPackage(source)

    // Resolve the path if it's a relative import
    const resolvedPath = isExternal ? undefined : resolveRelativePath(sourceFile, source)

    return {
      source,
      resolvedPath,
      isExternal,
      importedSymbols: {
        defaultImport,
        namespaceImport,
        specifiers: specifiers.map(spec => ({
          imported: spec.imported,
          local: spec.local,
        })),
      },
    }
  })
}

/**
 * Determines if an import source is an external package
 *
 * @param source - Import source string
 * @returns True if the source is an external package
 */
function isExternalPackage(source: string): boolean {
  // External packages don't start with . or /
  // They are either bare module specifiers (react) or scoped packages (@org/package)
  return !source.startsWith('.') && !source.startsWith('/')
}

/**
 * Resolves a relative import path to an absolute path
 *
 * @param sourceFile - Absolute path to the file containing the import
 * @param importSource - Relative import path
 * @returns Absolute resolved path
 */
function resolveRelativePath(sourceFile: string, importSource: string): string {
  const sourceDir = path.dirname(sourceFile)

  // If the import already has an extension, resolve directly
  if (hasFileExtension(importSource)) {
    return path.resolve(sourceDir, importSource)
  }

  // Otherwise, try common extensions (.ts, .js, .tsx, .jsx)
  // For now, we'll append the most likely extension based on the source file
  const sourceExt = path.extname(sourceFile)
  const resolvedBase = path.resolve(sourceDir, importSource)

  // Use the same extension as the source file if available
  if (sourceExt === '.ts' || sourceExt === '.tsx' || sourceExt === '.js' || sourceExt === '.jsx') {
    return resolvedBase + sourceExt
  }

  // Default to .ts if we can't determine
  return resolvedBase + '.ts'
}

/**
 * Checks if a path has a file extension
 *
 * @param filePath - Path to check
 * @returns True if the path has a file extension
 */
function hasFileExtension(filePath: string): boolean {
  const ext = path.extname(filePath)
  return ext !== ''
}
