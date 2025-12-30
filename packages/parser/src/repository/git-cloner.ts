import simpleGit from 'simple-git'
import os from 'os'
import path from 'path'

/**
 * Options for cloning a repository
 */
export interface CloneOptions {
  /** Branch name to clone */
  branch?: string
  /** Target directory (defaults to temp directory) */
  targetDir?: string
  /** Clone depth (1 for shallow clone) */
  depth?: number
  /** Authentication configuration */
  auth?: {
    /** OAuth token */
    token?: string
    /** SSH key path */
    sshKeyPath?: string
  }
}

/**
 * Clones a Git repository to a local directory
 *
 * @param url - Repository URL (HTTPS or SSH)
 * @param options - Clone options
 * @returns Absolute path to cloned repository
 */
export async function cloneRepository(
  url: string,
  options: CloneOptions = {}
): Promise<string> {
  const targetPath = options.targetDir || generateTempPath()
  const depth = options.depth ?? 1 // Default to shallow clone

  const git = simpleGit()

  // Build clone options
  const cloneArgs: string[] = []

  if (options.branch) {
    cloneArgs.push('--branch', options.branch)
  }

  if (depth > 0) {
    cloneArgs.push('--depth', depth.toString())
  }

  // Handle authentication if provided
  let authUrl = url
  if (options.auth?.token && url.startsWith('https://')) {
    // Insert token into HTTPS URL
    authUrl = insertTokenIntoUrl(url, options.auth.token)
  }

  try {
    await git.clone(authUrl, targetPath, cloneArgs)
    return targetPath
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to clone repository ${url}: ${message}`)
  }
}

/**
 * Lists remote branches for a repository
 *
 * @param url - Repository URL
 * @returns Array of branch names
 */
export async function listRemoteBranches(url: string): Promise<string[]> {
  const git = simpleGit()

  try {
    const result = await git.listRemote(['--heads', url])

    // Parse the output to extract branch names
    // Format: <hash>\trefs/heads/<branch-name>
    const lines = result.split('\n').filter(line => line.trim())
    const branches = lines.map(line => {
      const match = line.match(/refs\/heads\/(.+)$/)
      return match ? match[1] : null
    }).filter((branch): branch is string => branch !== null)

    return branches
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to list remote branches for ${url}: ${message}`)
  }
}

/**
 * Clones a repository at a specific commit SHA
 *
 * @param url - Repository URL
 * @param commitSha - Commit SHA
 * @param targetDir - Target directory
 * @returns Absolute path to cloned repository
 */
export async function cloneAtCommit(
  url: string,
  commitSha: string,
  targetDir?: string
): Promise<string> {
  const targetPath = targetDir || generateTempPath()

  const git = simpleGit()

  try {
    // Clone without checking out
    await git.clone(url, targetPath, ['--no-checkout'])

    // Checkout specific commit
    const repoGit = simpleGit(targetPath)
    await repoGit.checkout(commitSha)

    return targetPath
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to clone repository at commit ${commitSha}: ${message}`)
  }
}

/**
 * Clones a repository at a specific tag
 *
 * @param url - Repository URL
 * @param tag - Tag name
 * @param targetDir - Target directory
 * @returns Absolute path to cloned repository
 */
export async function cloneAtTag(
  url: string,
  tag: string,
  targetDir?: string
): Promise<string> {
  const options: CloneOptions = {
    branch: tag,
  }

  if (targetDir) {
    options.targetDir = targetDir
  }

  return cloneRepository(url, options)
}

/**
 * Generates a temporary directory path for cloning
 *
 * @returns Absolute path to temp directory
 */
function generateTempPath(): string {
  const tmpDir = os.tmpdir()
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  return path.join(tmpDir, `diagram-builder-${timestamp}-${randomSuffix}`)
}

/**
 * Inserts an OAuth token into an HTTPS URL
 *
 * @param url - Original URL
 * @param token - OAuth token
 * @returns URL with token
 */
function insertTokenIntoUrl(url: string, token: string): string {
  // Format: https://token@github.com/user/repo.git
  const urlObj = new globalThis.URL(url)
  urlObj.username = token
  return urlObj.toString()
}
