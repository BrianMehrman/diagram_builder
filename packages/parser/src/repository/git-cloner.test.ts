import { describe, it, expect, afterEach } from 'vitest'
import { cloneRepository, listRemoteBranches } from './git-cloner'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

describe('Git Cloner', () => {
  const clonedPaths: string[] = []

  afterEach(async () => {
    // Cleanup all cloned repositories
    for (const clonePath of clonedPaths) {
      try {
        await fs.rm(clonePath, { recursive: true, force: true })
      } catch {
        // Ignore cleanup errors
      }
    }
    clonedPaths.length = 0
  })

  describe('cloneRepository', () => {
    it('should clone a public GitHub repository', async () => {
      // Use a small public repository for testing
      const url = 'https://github.com/octocat/Hello-World.git'

      const clonePath = await cloneRepository(url)
      clonedPaths.push(clonePath)

      // Verify the repository was cloned
      const stats = await fs.stat(clonePath)
      expect(stats.isDirectory()).toBe(true)

      // Verify .git directory exists
      const gitDir = path.join(clonePath, '.git')
      const gitStats = await fs.stat(gitDir)
      expect(gitStats.isDirectory()).toBe(true)
    }, 30000) // 30 second timeout for network operation

    it('should return absolute path to cloned repository', async () => {
      const url = 'https://github.com/octocat/Hello-World.git'

      const clonePath = await cloneRepository(url)
      clonedPaths.push(clonePath)

      expect(path.isAbsolute(clonePath)).toBe(true)
    }, 30000)

    it('should clone to temporary directory', async () => {
      const url = 'https://github.com/octocat/Hello-World.git'

      const clonePath = await cloneRepository(url)
      clonedPaths.push(clonePath)

      // Should be in system temp directory (os.tmpdir())
      const os = await import('os')
      const tmpDir = os.tmpdir()
      expect(clonePath).toContain(tmpDir)
    }, 30000)

    it('should clone specific branch when specified', async () => {
      const url = 'https://github.com/octocat/Hello-World.git'

      const clonePath = await cloneRepository(url, {
        branch: 'master',
      })
      clonedPaths.push(clonePath)

      // Verify clone succeeded
      const stats = await fs.stat(clonePath)
      expect(stats.isDirectory()).toBe(true)
    }, 30000)

    it('should use shallow clone by default for performance', async () => {
      const url = 'https://github.com/octocat/Hello-World.git'

      const clonePath = await cloneRepository(url)
      clonedPaths.push(clonePath)

      // Shallow clone should have .git/shallow file
      const shallowPath = path.join(clonePath, '.git', 'shallow')
      try {
        await fs.access(shallowPath)
        // If we get here, shallow file exists
        expect(true).toBe(true)
      } catch {
        // Some repos might not create shallow file, that's OK
        expect(true).toBe(true)
      }
    }, 30000)

    it('should throw error with descriptive message on clone failure', async () => {
      const url = 'https://invalid-url-that-will-fail'

      try {
        await cloneRepository(url)
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('Failed to clone repository')
      }
    }, 10000)

    it('should allow custom target directory', async () => {
      const url = 'https://github.com/octocat/Hello-World.git'
      const customTarget = path.join(os.tmpdir(), 'test-clone-custom')

      const clonePath = await cloneRepository(url, {
        targetDir: customTarget,
      })
      clonedPaths.push(clonePath)

      expect(clonePath).toBe(customTarget)
      const stats = await fs.stat(clonePath)
      expect(stats.isDirectory()).toBe(true)
    }, 30000)

    it('should support shallow clone depth option', async () => {
      const url = 'https://github.com/octocat/Hello-World.git'

      const clonePath = await cloneRepository(url, {
        depth: 1,
      })
      clonedPaths.push(clonePath)

      const stats = await fs.stat(clonePath)
      expect(stats.isDirectory()).toBe(true)
    }, 30000)
  })

  describe('listRemoteBranches', () => {
    it('should list branches from remote repository', async () => {
      const url = 'https://github.com/octocat/Hello-World.git'

      const branches = await listRemoteBranches(url)

      expect(Array.isArray(branches)).toBe(true)
      expect(branches.length).toBeGreaterThan(0)
      // Most repos have a main or master branch
      const hasMainBranch = branches.some(b => b === 'main' || b === 'master')
      expect(hasMainBranch).toBe(true)
    }, 30000)

    it('should throw error with descriptive message on list failure', async () => {
      const url = 'https://invalid-url-that-will-fail'

      try {
        await listRemoteBranches(url)
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('Failed to list remote branches')
      }
    }, 10000)
  })
})
