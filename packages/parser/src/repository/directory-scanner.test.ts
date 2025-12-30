import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { scanDirectory } from './directory-scanner'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

describe('Directory Scanner', () => {
  let testDir: string

  beforeEach(async () => {
    // Create a temporary test directory
    testDir = path.join(os.tmpdir(), `scanner-test-${Date.now()}`)
    await fs.mkdir(testDir, { recursive: true })
  })

  afterEach(async () => {
    // Cleanup test directory
    await fs.rm(testDir, { recursive: true, force: true })
  })

  describe('scanDirectory', () => {
    it('should scan directory and return JavaScript files', async () => {
      // Create test files
      await fs.writeFile(path.join(testDir, 'index.js'), 'console.log("test")')
      await fs.writeFile(path.join(testDir, 'utils.js'), 'export function helper() {}')
      await fs.writeFile(path.join(testDir, 'readme.md'), '# README')

      const files = await scanDirectory(testDir)

      expect(files).toHaveLength(2)
      expect(files.some(f => f.endsWith('index.js'))).toBe(true)
      expect(files.some(f => f.endsWith('utils.js'))).toBe(true)
      expect(files.some(f => f.endsWith('readme.md'))).toBe(false)
    })

    it('should scan directory and return TypeScript files', async () => {
      await fs.writeFile(path.join(testDir, 'index.ts'), 'const x: number = 1')
      await fs.writeFile(path.join(testDir, 'types.d.ts'), 'export type Foo = string')
      await fs.writeFile(path.join(testDir, 'component.tsx'), 'export const App = () => <div/>')

      const files = await scanDirectory(testDir)

      expect(files).toHaveLength(3)
      expect(files.some(f => f.endsWith('index.ts'))).toBe(true)
      expect(files.some(f => f.endsWith('types.d.ts'))).toBe(true)
      expect(files.some(f => f.endsWith('component.tsx'))).toBe(true)
    })

    it('should recursively scan nested directories', async () => {
      await fs.mkdir(path.join(testDir, 'src'), { recursive: true })
      await fs.mkdir(path.join(testDir, 'src/components'), { recursive: true })

      await fs.writeFile(path.join(testDir, 'index.js'), 'root file')
      await fs.writeFile(path.join(testDir, 'src/app.js'), 'src file')
      await fs.writeFile(path.join(testDir, 'src/components/button.js'), 'component file')

      const files = await scanDirectory(testDir)

      expect(files).toHaveLength(3)
      expect(files.some(f => f.includes('index.js'))).toBe(true)
      expect(files.some(f => f.includes(path.join('src', 'app.js')))).toBe(true)
      expect(files.some(f => f.includes(path.join('src', 'components', 'button.js')))).toBe(true)
    })

    it('should respect .gitignore patterns from file', async () => {
      await fs.mkdir(path.join(testDir, 'node_modules'), { recursive: true })
      await fs.mkdir(path.join(testDir, 'src'), { recursive: true })

      await fs.writeFile(path.join(testDir, '.gitignore'), 'node_modules/\ndist/')
      await fs.writeFile(path.join(testDir, 'src/index.js'), 'source file')
      await fs.writeFile(path.join(testDir, 'node_modules/package.js'), 'ignored file')

      const files = await scanDirectory(testDir)

      expect(files).toHaveLength(1)
      expect(files[0]).toContain('src')
      expect(files.some(f => f.includes('node_modules'))).toBe(false)
    })

    it('should respect custom ignore patterns', async () => {
      await fs.mkdir(path.join(testDir, 'build'), { recursive: true })
      await fs.writeFile(path.join(testDir, 'src.js'), 'source')
      await fs.writeFile(path.join(testDir, 'build/output.js'), 'build output')

      const files = await scanDirectory(testDir, {
        ignorePatterns: ['build/'],
      })

      expect(files).toHaveLength(1)
      expect(files[0]).toContain('src.js')
      expect(files.some(f => f.includes('build'))).toBe(false)
    })

    it('should filter by specific file extensions', async () => {
      await fs.writeFile(path.join(testDir, 'script.js'), 'js file')
      await fs.writeFile(path.join(testDir, 'types.ts'), 'ts file')
      await fs.writeFile(path.join(testDir, 'component.tsx'), 'tsx file')
      await fs.writeFile(path.join(testDir, 'styles.css'), 'css file')

      const files = await scanDirectory(testDir, {
        extensions: ['.ts', '.tsx'],
      })

      expect(files).toHaveLength(2)
      expect(files.some(f => f.endsWith('.ts'))).toBe(true)
      expect(files.some(f => f.endsWith('.tsx'))).toBe(true)
      expect(files.some(f => f.endsWith('.js'))).toBe(false)
      expect(files.some(f => f.endsWith('.css'))).toBe(false)
    })

    it('should return absolute file paths', async () => {
      await fs.writeFile(path.join(testDir, 'index.js'), 'test')

      const files = await scanDirectory(testDir)

      expect(files).toHaveLength(1)
      expect(path.isAbsolute(files[0])).toBe(true)
    })

    it('should handle empty directories', async () => {
      const files = await scanDirectory(testDir)

      expect(files).toHaveLength(0)
    })

    it('should handle directories with only non-matching files', async () => {
      await fs.writeFile(path.join(testDir, 'readme.md'), '# README')
      await fs.writeFile(path.join(testDir, 'package.json'), '{}')

      const files = await scanDirectory(testDir)

      expect(files).toHaveLength(0)
    })

    it('should respect maxDepth option', async () => {
      await fs.mkdir(path.join(testDir, 'level1'), { recursive: true })
      await fs.mkdir(path.join(testDir, 'level1/level2'), { recursive: true })
      await fs.mkdir(path.join(testDir, 'level1/level2/level3'), { recursive: true })

      await fs.writeFile(path.join(testDir, 'root.js'), 'root')
      await fs.writeFile(path.join(testDir, 'level1/file1.js'), 'level1')
      await fs.writeFile(path.join(testDir, 'level1/level2/file2.js'), 'level2')
      await fs.writeFile(path.join(testDir, 'level1/level2/level3/file3.js'), 'level3')

      const files = await scanDirectory(testDir, {
        maxDepth: 2,
      })

      expect(files).toHaveLength(3)
      expect(files.some(f => f.includes('root.js'))).toBe(true)
      expect(files.some(f => f.includes('file1.js'))).toBe(true)
      expect(files.some(f => f.includes('file2.js'))).toBe(true)
      expect(files.some(f => f.includes('file3.js'))).toBe(false)
    })
  })
})
