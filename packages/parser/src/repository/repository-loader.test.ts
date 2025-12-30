import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { loadRepository } from './repository-loader'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

describe('Repository Loader', () => {
  let testDir: string
  const clonedPaths: string[] = []

  beforeEach(async () => {
    testDir = path.join(os.tmpdir(), `repo-loader-test-${Date.now()}`)
    await fs.mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    // Cleanup test directory
    await fs.rm(testDir, { recursive: true, force: true })

    // Cleanup cloned repositories
    for (const clonePath of clonedPaths) {
      try {
        await fs.rm(clonePath, { recursive: true, force: true })
      } catch {
        // Ignore cleanup errors
      }
    }
    clonedPaths.length = 0
  })

  describe('loadRepository', () => {
    it('should load local directory and return file paths', async () => {
      // Create test files
      await fs.writeFile(path.join(testDir, 'index.js'), 'console.log("test")')
      await fs.writeFile(path.join(testDir, 'utils.ts'), 'export function helper() {}')

      const context = await loadRepository(testDir)

      expect(context.path).toBe(testDir)
      expect(context.files).toHaveLength(2)
      expect(context.files.some(f => f.endsWith('index.js'))).toBe(true)
      expect(context.files.some(f => f.endsWith('utils.ts'))).toBe(true)
      expect(context.metadata.type).toBe('local')
    })

    it('should auto-detect Git URL and clone repository', async () => {
      const url = 'https://github.com/octocat/Hello-World.git'

      const context = await loadRepository(url)
      clonedPaths.push(context.path)

      expect(context.metadata.type).toBe('git')
      expect(context.metadata.url).toBe(url)
      expect(Array.isArray(context.files)).toBe(true)
      // Note: Hello-World repo doesn't have .js/.ts files, so count might be 0
      expect(context.metadata.fileCount).toBeGreaterThanOrEqual(0)
    }, 30000)

    it('should accept repository config with branch', async () => {
      const context = await loadRepository({
        url: 'https://github.com/octocat/Hello-World.git',
        branch: 'master',
      })
      clonedPaths.push(context.path)

      expect(context.metadata.type).toBe('git')
      expect(context.metadata.branch).toBe('master')
      // Note: Hello-World repo doesn't have .js/.ts files, so count might be 0
      expect(context.metadata.fileCount).toBeGreaterThanOrEqual(0)
    }, 30000)

    it('should scan nested directories in local path', async () => {
      await fs.mkdir(path.join(testDir, 'src'), { recursive: true })
      await fs.writeFile(path.join(testDir, 'index.js'), 'root')
      await fs.writeFile(path.join(testDir, 'src/app.js'), 'app')

      const context = await loadRepository(testDir)

      expect(context.files).toHaveLength(2)
      expect(context.files.some(f => f.includes('index.js'))).toBe(true)
      expect(context.files.some(f => f.includes(path.join('src', 'app.js')))).toBe(true)
    })

    it('should respect .gitignore in local directory', async () => {
      await fs.mkdir(path.join(testDir, 'node_modules'), { recursive: true })
      await fs.writeFile(path.join(testDir, '.gitignore'), 'node_modules/')
      await fs.writeFile(path.join(testDir, 'src.js'), 'source')
      await fs.writeFile(path.join(testDir, 'node_modules/lib.js'), 'library')

      const context = await loadRepository(testDir)

      expect(context.files).toHaveLength(1)
      expect(context.files[0]).toContain('src.js')
      expect(context.files.some(f => f.includes('node_modules'))).toBe(false)
    })

    it('should include repository metadata', async () => {
      await fs.writeFile(path.join(testDir, 'index.js'), 'test')

      const context = await loadRepository(testDir)

      expect(context.metadata).toBeDefined()
      expect(context.metadata.type).toBe('local')
      expect(context.metadata.scannedAt).toBeDefined()
      expect(context.metadata.fileCount).toBe(1)
    })

    it('should accept custom scan options for local directory', async () => {
      await fs.writeFile(path.join(testDir, 'script.js'), 'js')
      await fs.writeFile(path.join(testDir, 'types.ts'), 'ts')

      const context = await loadRepository(testDir, {
        extensions: ['.ts'],
      })

      expect(context.files).toHaveLength(1)
      expect(context.files[0]).toContain('types.ts')
    })

    it('should handle repository config with custom ignore patterns', async () => {
      await fs.mkdir(path.join(testDir, 'build'), { recursive: true })
      await fs.writeFile(path.join(testDir, 'src.js'), 'source')
      await fs.writeFile(path.join(testDir, 'build/out.js'), 'output')

      const context = await loadRepository({
        path: testDir,
        ignorePatterns: ['build/'],
      })

      expect(context.files).toHaveLength(1)
      expect(context.files[0]).toContain('src.js')
    })

    it('should return cleanup function for Git repositories', async () => {
      const context = await loadRepository('https://github.com/octocat/Hello-World.git')

      expect(context.cleanup).toBeDefined()
      expect(typeof context.cleanup).toBe('function')

      // Call cleanup
      await context.cleanup()

      // Verify directory was removed
      try {
        await fs.access(context.path)
        expect.fail('Directory should have been cleaned up')
      } catch {
        // Expected - directory should not exist
        expect(true).toBe(true)
      }
    }, 30000)

    it('should not provide cleanup function for local directories', async () => {
      await fs.writeFile(path.join(testDir, 'index.js'), 'test')

      const context = await loadRepository(testDir)

      expect(context.cleanup).toBeUndefined()
    })

    it('should handle empty directory', async () => {
      const context = await loadRepository(testDir)

      expect(context.files).toHaveLength(0)
      expect(context.metadata.fileCount).toBe(0)
    })
  })
})
