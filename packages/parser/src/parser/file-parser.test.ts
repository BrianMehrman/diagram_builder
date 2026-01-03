import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as fs from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { parseFile, parseContent } from './file-parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('File Parser', () => {
  const testDir = path.join(__dirname, '__test-fixtures__')
  const jsTestFile = path.join(testDir, 'test.js')
  const tsTestFile = path.join(testDir, 'test.ts')
  const tsxTestFile = path.join(testDir, 'test.tsx')

  beforeAll(async () => {
    // Create test fixtures directory
    await fs.mkdir(testDir, { recursive: true })

    // Create JavaScript test file
    await fs.writeFile(
      jsTestFile,
      `function greet(name) {
  return 'Hello, ' + name;
}

export { greet };
`
    )

    // Create TypeScript test file
    await fs.writeFile(
      tsTestFile,
      `function greet(name: string): string {
  return \`Hello, \${name}\`;
}

export { greet };
`
    )

    // Create TSX test file
    await fs.writeFile(
      tsxTestFile,
      `import React from 'react';

export function Greeting({ name }: { name: string }) {
  return <div>Hello, {name}</div>;
}
`
    )
  })

  afterAll(async () => {
    // Cleanup test fixtures
    await fs.rm(testDir, { recursive: true, force: true })
  })

  describe('parseFile', () => {
    it('should parse JavaScript file', async () => {
      const result = await parseFile(jsTestFile)

      expect(result).toBeDefined()
      expect(result.language).toBe('javascript')
      expect(result.tree).toBeDefined()
      expect(result.hasErrors).toBe(false)
    })

    it('should parse TypeScript file', async () => {
      const result = await parseFile(tsTestFile)

      expect(result).toBeDefined()
      expect(result.language).toBe('typescript')
      expect(result.tree).toBeDefined()
      expect(result.hasErrors).toBe(false)
    })

    it('should parse TSX file', async () => {
      const result = await parseFile(tsxTestFile)

      expect(result).toBeDefined()
      expect(result.language).toBe('tsx')
      expect(result.tree).toBeDefined()
      expect(result.hasErrors).toBe(false)
    })

    it('should detect syntax errors', async () => {
      const malformedFile = path.join(testDir, 'malformed.js')
      await fs.writeFile(malformedFile, 'function broken( { return "missing brace" }')

      const result = await parseFile(malformedFile)

      expect(result.hasErrors).toBe(true)

      await fs.unlink(malformedFile)
    })

    it('should throw error for missing file', async () => {
      await expect(parseFile('/nonexistent/file.js')).rejects.toThrow()
    })

    it('should parse Python file without throwing (limited support)', async () => {
      const pythonFile = path.join(testDir, 'test.py')
      await fs.writeFile(pythonFile, 'def hello(): pass')

      // Python is now supported but returns minimal tree (no grammar installed)
      const result = await parseFile(pythonFile)
      expect(result.language).toBe('python')
      expect(result.tree).toBeDefined()

      await fs.unlink(pythonFile)
    })
  })

  describe('parseContent', () => {
    it('should parse JavaScript content', () => {
      const jsCode = 'const x = 42;'
      const result = parseContent(jsCode, 'javascript')

      expect(result).toBeDefined()
      expect(result.language).toBe('javascript')
      expect(result.tree).toBeDefined()
      expect(result.hasErrors).toBe(false)
    })

    it('should parse TypeScript content', () => {
      const tsCode = 'const x: number = 42;'
      const result = parseContent(tsCode, 'typescript')

      expect(result).toBeDefined()
      expect(result.language).toBe('typescript')
      expect(result.tree).toBeDefined()
      expect(result.hasErrors).toBe(false)
    })

    it('should detect syntax errors in content', () => {
      const malformedCode = 'function broken( {'
      const result = parseContent(malformedCode, 'javascript')

      expect(result.hasErrors).toBe(true)
    })

    it('should handle empty content', () => {
      const result = parseContent('', 'javascript')

      expect(result).toBeDefined()
      expect(result.hasErrors).toBe(false)
    })
  })
})
