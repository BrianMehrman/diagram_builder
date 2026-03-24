import { scanDirectory, type ScanOptions } from './directory-scanner'
import { cloneRepository, type CloneOptions } from './git-cloner'
import fs from 'fs/promises'
import path from 'path'
import { logger, logOperation } from '../logger'

/**
 * Repository configuration for loading
 */
export interface RepositoryConfig {
  /** Local directory path OR Git repository URL */
  path?: string
  /** Git repository URL */
  url?: string
  /** Branch name (for Git repositories) */
  branch?: string
  /** File extensions to scan */
  extensions?: string[]
  /** Ignore patterns */
  ignorePatterns?: string[]
  /** Authentication */
  auth?: {
    token?: string
    sshKeyPath?: string
  }
}

/**
 * Repository context containing loaded files and metadata
 */
export interface RepositoryContext {
  /** Absolute path to repository */
  path: string
  /** Array of absolute file paths */
  files: string[]
  /** Repository metadata */
  metadata: {
    /** Repository type */
    type: 'local' | 'git'
    /** Git repository URL (if applicable) */
    url?: string
    /** Branch name (if applicable) */
    branch?: string
    /** Number of files found */
    fileCount: number
    /** Timestamp when repository was scanned */
    scannedAt: Date
  }
  /** Cleanup function (only for Git repositories) */
  cleanup?: () => Promise<void>
}

/**
 * Loads a repository from a local path or Git URL
 *
 * @param source - Local path, Git URL, or repository configuration
 * @param options - Scan options (optional)
 * @returns Repository context
 */
export async function loadRepository(
  source: string | RepositoryConfig,
  options?: ScanOptions
): Promise<RepositoryContext> {
  const startTime = Date.now()
  const op = logOperation('loadRepository', {
    source: typeof source === 'string' ? source : source.path || source.url,
    options,
  })

  try {
    // Normalize source to config
    const config = typeof source === 'string' ? parseSource(source) : source

    // Determine if this is a local path or Git repository
    let result: RepositoryContext
    if (config.url) {
      result = await loadGitRepository(config, options)
    } else if (config.path) {
      result = await loadLocalDirectory(config.path, config, options)
    } else {
      throw new Error('Repository source must specify either path or url')
    }

    op.timing(startTime, {
      fileCount: result.files.length,
      type: result.metadata.type,
      path: result.path,
    })

    return result
  } catch (error) {
    op.fail(error as Error, {
      source: typeof source === 'string' ? source : source.path || source.url,
    })
    throw error
  }
}

/**
 * Parses a string source into a repository config
 *
 * @param source - Source string
 * @returns Repository config
 */
function parseSource(source: string): RepositoryConfig {
  // Check if this looks like a Git URL
  if (isGitUrl(source)) {
    return { url: source }
  } else {
    return { path: source }
  }
}

/**
 * Checks if a string is a Git repository URL
 *
 * @param str - String to check
 * @returns True if Git URL
 */
function isGitUrl(str: string): boolean {
  // Check for common Git URL patterns
  const patterns = [
    /^https?:\/\/.+\.git$/,
    /^git@.+:.+\.git$/,
    /^https?:\/\/(github|gitlab|bitbucket)\.(com|org)\/.+\/.+/,
  ]

  return patterns.some((pattern) => pattern.test(str))
}

/**
 * Iterates over a scanned file list and logs progress milestones at 25%, 50%, 75%.
 *
 * @param files - Array of file paths returned by scanDirectory
 * @param source - Human-readable source label for log context
 */
function logFileProgress(files: string[], source: string | undefined): void {
  const total = files.length
  const loopStart = Date.now()
  logger.info('Parser start', { total, source: source ?? 'unknown' })
  const milestones = new Set([25, 50, 75])
  let processed = 0

  for (let i = 0; i < files.length; i++) {
    processed++
    if (total > 20) {
      const pct = Math.floor((processed / total) * 100)
      const milestone = [25, 50, 75].find((m) => milestones.has(m) && pct >= m)
      if (milestone !== undefined) {
        milestones.delete(milestone)
        logger.info('Parser progress', { processed, total, pct: `${milestone}%` })
      }
    }
  }

  logger.info('Parser complete', { processed, total, durationMs: Date.now() - loopStart })
}

/**
 * Loads a local directory
 *
 * @param dirPath - Directory path
 * @param config - Repository config
 * @param options - Scan options
 * @returns Repository context
 */
async function loadLocalDirectory(
  dirPath: string,
  config: RepositoryConfig,
  options?: ScanOptions
): Promise<RepositoryContext> {
  // Resolve to absolute path
  const absolutePath = path.resolve(dirPath)

  // Verify directory exists
  try {
    const stats = await fs.stat(absolutePath)
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${absolutePath}`)
    }
  } catch (err) {
    logger.error('Directory not found or inaccessible', {
      category: 'parser',
      dirPath: absolutePath,
      error: (err as Error).message,
    })
    throw new Error(`Directory not found: ${absolutePath}`)
  }

  // Scan directory with merged options
  const scanOptions: ScanOptions = {
    ...options,
  }

  if (config.extensions) {
    scanOptions.extensions = config.extensions
  } else if (options?.extensions) {
    scanOptions.extensions = options.extensions
  }

  if (config.ignorePatterns) {
    scanOptions.ignorePatterns = config.ignorePatterns
  } else if (options?.ignorePatterns) {
    scanOptions.ignorePatterns = options.ignorePatterns
  }

  const files = await scanDirectory(absolutePath, scanOptions)

  logFileProgress(files, config.path ?? absolutePath)

  return {
    path: absolutePath,
    files,
    metadata: {
      type: 'local',
      fileCount: files.length,
      scannedAt: new Date(),
    },
  }
}

/**
 * Loads a Git repository
 *
 * @param config - Repository config
 * @param options - Scan options
 * @returns Repository context
 */
async function loadGitRepository(
  config: RepositoryConfig,
  options?: ScanOptions
): Promise<RepositoryContext> {
  if (!config.url) {
    throw new Error('Git repository URL is required')
  }

  // Clone repository
  const cloneOptions: CloneOptions = {}

  if (config.branch) {
    cloneOptions.branch = config.branch
  }

  if (config.auth) {
    cloneOptions.auth = config.auth
  }

  const clonePath = await cloneRepository(config.url, cloneOptions)

  // Scan cloned repository
  const scanOptions: ScanOptions = {
    ...options,
  }

  if (config.extensions) {
    scanOptions.extensions = config.extensions
  } else if (options?.extensions) {
    scanOptions.extensions = options.extensions
  }

  if (config.ignorePatterns) {
    scanOptions.ignorePatterns = config.ignorePatterns
  } else if (options?.ignorePatterns) {
    scanOptions.ignorePatterns = options.ignorePatterns
  }

  const files = await scanDirectory(clonePath, scanOptions)

  logFileProgress(files, config.url)

  // Create cleanup function
  const cleanup = async (): Promise<void> => {
    try {
      await fs.rm(clonePath, { recursive: true, force: true })
    } catch (err) {
      logger.warn('Failed to clean up cloned repository, skipping', {
        category: 'parser',
        clonePath,
        error: (err as Error).message,
      })
    }
  }

  const metadata: RepositoryContext['metadata'] = {
    type: 'git',
    url: config.url,
    fileCount: files.length,
    scannedAt: new Date(),
  }

  if (config.branch) {
    metadata.branch = config.branch
  }

  return {
    path: clonePath,
    files,
    metadata,
    cleanup,
  }
}
