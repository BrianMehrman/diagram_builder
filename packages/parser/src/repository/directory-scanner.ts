import fs from 'fs/promises'
import path from 'path'
import ignore, { type Ignore } from 'ignore'

/**
 * Options for directory scanning
 */
export interface ScanOptions {
  /** File extensions to include (e.g., ['.js', '.ts']) */
  extensions?: string[]
  /** Ignore patterns (glob patterns like .gitignore) */
  ignorePatterns?: string[]
  /** Maximum depth to scan (undefined = unlimited) */
  maxDepth?: number
}

/**
 * Default file extensions to scan
 */
const DEFAULT_EXTENSIONS = ['.js', '.ts', '.tsx', '.jsx', '.d.ts']

/**
 * Default ignore patterns
 */
const DEFAULT_IGNORE_PATTERNS = [
  'node_modules/',
  '.git/',
  'dist/',
  'build/',
  'coverage/',
  '.next/',
  '.nuxt/',
  'out/',
  '.cache/',
]

/**
 * Scans a directory for JavaScript/TypeScript files
 *
 * @param dirPath - Absolute path to directory to scan
 * @param options - Scan options
 * @returns Array of absolute file paths
 */
export async function scanDirectory(
  dirPath: string,
  options: ScanOptions = {}
): Promise<string[]> {
  const extensions = options.extensions || DEFAULT_EXTENSIONS
  const maxDepth = options.maxDepth

  // Initialize ignore matcher
  const ig = await createIgnoreMatcher(dirPath, options.ignorePatterns)

  // Scan recursively
  const files = await scanRecursive(dirPath, dirPath, extensions, ig, 0, maxDepth)

  return files
}

/**
 * Creates an ignore matcher from .gitignore and custom patterns
 *
 * @param rootPath - Root directory path
 * @param customPatterns - Custom ignore patterns
 * @returns Ignore matcher
 */
async function createIgnoreMatcher(
  rootPath: string,
  customPatterns: string[] = []
): Promise<Ignore> {
  const ig = ignore()

  // Add default patterns
  ig.add(DEFAULT_IGNORE_PATTERNS)

  // Add custom patterns
  if (customPatterns.length > 0) {
    ig.add(customPatterns)
  }

  // Read .gitignore if it exists
  const gitignorePath = path.join(rootPath, '.gitignore')
  try {
    const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8')
    ig.add(gitignoreContent)
  } catch {
    // .gitignore doesn't exist, skip
  }

  return ig
}

/**
 * Recursively scans a directory
 *
 * @param rootPath - Root directory being scanned
 * @param currentPath - Current directory path
 * @param extensions - File extensions to include
 * @param ig - Ignore matcher
 * @param currentDepth - Current depth level
 * @param maxDepth - Maximum depth to scan
 * @returns Array of file paths
 */
async function scanRecursive(
  rootPath: string,
  currentPath: string,
  extensions: string[],
  ig: Ignore,
  currentDepth: number,
  maxDepth: number | undefined
): Promise<string[]> {
  const files: string[] = []

  // Check depth limit
  if (maxDepth !== undefined && currentDepth > maxDepth) {
    return files
  }

  try {
    const entries = await fs.readdir(currentPath, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name)
      const relativePath = path.relative(rootPath, fullPath)

      // Check if this path should be ignored
      if (ig.ignores(relativePath) || ig.ignores(relativePath + '/')) {
        continue
      }

      if (entry.isDirectory()) {
        // Recursively scan subdirectory
        const subFiles = await scanRecursive(
          rootPath,
          fullPath,
          extensions,
          ig,
          currentDepth + 1,
          maxDepth
        )
        files.push(...subFiles)
      } else if (entry.isFile()) {
        // Check if file extension matches
        if (matchesExtension(entry.name, extensions)) {
          files.push(fullPath)
        }
      }
    }
  } catch {
    // Skip directories that can't be read (permissions, etc.)
    // Silently ignore - this is expected for inaccessible directories
  }

  return files
}

/**
 * Checks if a filename matches any of the target extensions
 *
 * @param filename - Filename to check
 * @param extensions - Array of extensions to match
 * @returns True if filename matches
 */
function matchesExtension(filename: string, extensions: string[]): boolean {
  const ext = path.extname(filename)
  return extensions.some(targetExt => {
    // Handle both .d.ts and .ts cases
    if (targetExt === '.d.ts' && filename.endsWith('.d.ts')) {
      return true
    }
    return ext === targetExt
  })
}
