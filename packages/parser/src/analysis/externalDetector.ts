import type { DependencyNode, DependencyEdge } from '../graph/dependency-graph'

/**
 * Input describing a single import statement from a source file
 */
export interface ExternalImportInfo {
  /** ID of the file node containing the import */
  sourceNodeId: string
  /** The raw import path (e.g., 'express', './utils', 'node:fs') */
  importPath: string
}

/**
 * Optional package.json dependency information
 */
export interface PackageJsonDeps {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

/**
 * Result of external import detection
 */
export interface ExternalDetectionResult {
  /** Stub DependencyNodes for external packages */
  externalNodes: DependencyNode[]
  /** Import edges linking internal files to external nodes */
  externalEdges: DependencyEdge[]
}

/** Node.js built-in module names */
const NODE_BUILTINS = new Set([
  'assert', 'async_hooks', 'buffer', 'child_process', 'cluster',
  'console', 'constants', 'crypto', 'dgram', 'diagnostics_channel',
  'dns', 'domain', 'events', 'fs', 'http', 'http2', 'https',
  'inspector', 'module', 'net', 'os', 'path', 'perf_hooks',
  'process', 'punycode', 'querystring', 'readline', 'repl',
  'stream', 'string_decoder', 'sys', 'timers', 'tls', 'trace_events',
  'tty', 'url', 'util', 'v8', 'vm', 'wasi', 'worker_threads', 'zlib',
])

/**
 * Determines if an import path refers to an external package.
 *
 * External = anything that doesn't start with `.` or `/`.
 * This includes npm packages, scoped packages, and `node:` built-ins.
 *
 * @param importPath - The raw import path string
 * @returns True if the import is external
 */
export function isExternalImport(importPath: string): boolean {
  return !importPath.startsWith('.') && !importPath.startsWith('/')
}

/**
 * Extracts the package name from an import path.
 *
 * Handles:
 * - Simple packages: `'express'` → `'express'`
 * - Deep imports: `'lodash/merge'` → `'lodash'`
 * - Scoped packages: `'@scope/pkg'` → `'@scope/pkg'`
 * - Scoped deep: `'@scope/pkg/sub'` → `'@scope/pkg'`
 * - node: prefix: `'node:fs'` → `'fs'`
 *
 * @param importPath - The raw import path string
 * @returns The package name
 */
export function extractPackageName(importPath: string): string {
  // Strip node: prefix
  const cleaned = importPath.replace(/^node:/, '')

  // Scoped packages: @scope/package
  if (cleaned.startsWith('@')) {
    const parts = cleaned.split('/')
    return parts.slice(0, 2).join('/')
  }

  // Regular packages: first path segment
  return cleaned.split('/')[0]
}

/**
 * Checks if a module name is a Node.js built-in.
 *
 * @param name - Module name (with or without `node:` prefix)
 * @returns True if it's a Node.js built-in
 */
export function isNodeBuiltin(name: string): boolean {
  return NODE_BUILTINS.has(name.replace(/^node:/, ''))
}

/**
 * Detects external imports from a list of import info and creates
 * stub DependencyNodes and import DependencyEdges for each unique
 * external package.
 *
 * @param imports - Array of import info (source node ID + import path)
 * @param packageJson - Optional package.json dependency data
 * @returns External nodes and edges
 */
export function detectExternalImports(
  imports: ExternalImportInfo[],
  packageJson?: PackageJsonDeps
): ExternalDetectionResult {
  const externalPackages = new Map<string, DependencyNode>()
  const externalEdges: DependencyEdge[] = []

  for (const { sourceNodeId, importPath } of imports) {
    if (!isExternalImport(importPath)) continue

    const packageName = extractPackageName(importPath)

    // Create or reuse external node
    if (!externalPackages.has(packageName)) {
      const builtin = isNodeBuiltin(packageName)
      const isDevDep = packageJson?.devDependencies?.[packageName] !== undefined
      const version =
        packageJson?.dependencies?.[packageName] ??
        packageJson?.devDependencies?.[packageName] ??
        'unknown'

      externalPackages.set(packageName, {
        id: `external:${packageName}`,
        type: 'module',
        name: packageName,
        path: packageName,
        metadata: {
          isExternal: true,
          isBuiltin: builtin,
          isDevDependency: isDevDep,
          packageVersion: version,
        },
      })
    }

    // Create import edge from source file to external node
    externalEdges.push({
      source: sourceNodeId,
      target: `external:${packageName}`,
      type: 'imports',
      metadata: {
        isExternal: true,
        importPath,
      },
    })
  }

  return {
    externalNodes: Array.from(externalPackages.values()),
    externalEdges,
  }
}
