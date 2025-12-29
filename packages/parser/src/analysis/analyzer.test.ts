import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as fs from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { analyzeFile, analyzeContent } from './analyzer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('Analyzer', () => {
  const testDir = path.join(__dirname, '__test-fixtures__')
  const testFile = path.join(testDir, 'sample.ts')

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true })
    await fs.writeFile(
      testFile,
      `
import { useState } from 'react';
import * as utils from './utils';

export class User {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  greet(): string {
    return 'Hello, ' + this.name;
  }
}

export function createUser(name: string): User {
  return new User(name);
}

export const helper = () => 42;
`
    )
  })

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true })
  })

  describe('analyzeFile', () => {
    it('should analyze a TypeScript file', async () => {
      const analysis = await analyzeFile(testFile)

      expect(analysis).toBeDefined()
      expect(analysis.filePath).toBe(testFile)
      expect(analysis.language).toBe('typescript')
    })

    it('should extract classes', async () => {
      const analysis = await analyzeFile(testFile)

      expect(analysis.classes).toHaveLength(1)
      expect(analysis.classes[0].name).toBe('User')
      expect(analysis.classes[0].methods).toHaveLength(2)
    })

    it('should extract functions', async () => {
      const analysis = await analyzeFile(testFile)

      expect(analysis.functions.length).toBeGreaterThan(0)
      const createUserFunc = analysis.functions.find(f => f.name === 'createUser')
      expect(createUserFunc).toBeDefined()
    })

    it('should extract imports', async () => {
      const analysis = await analyzeFile(testFile)

      expect(analysis.imports).toHaveLength(2)
      const reactImport = analysis.imports.find(i => i.source === 'react')
      expect(reactImport).toBeDefined()
      expect(reactImport?.specifiers).toHaveLength(1)
    })

    it('should extract exports', async () => {
      const analysis = await analyzeFile(testFile)

      expect(analysis.exports.length).toBeGreaterThan(0)
    })

    it('should calculate metrics', async () => {
      const analysis = await analyzeFile(testFile)

      expect(analysis.metrics).toBeDefined()
      expect(analysis.metrics.loc).toBeGreaterThan(0)
      expect(analysis.metrics.classCount).toBe(1)
    })
  })

  describe('analyzeContent', () => {
    it('should analyze code content', () => {
      const code = `
function greet(name: string): string {
  return 'Hello, ' + name;
}
`
      const analysis = analyzeContent(code, 'typescript')

      expect(analysis).toBeDefined()
      expect(analysis.language).toBe('typescript')
      expect(analysis.functions).toHaveLength(1)
      expect(analysis.functions[0].name).toBe('greet')
    })

    it('should work with JavaScript', () => {
      const code = `
class User {
  greet() {
    return 'hello';
  }
}
`
      const analysis = analyzeContent(code, 'javascript')

      expect(analysis).toBeDefined()
      expect(analysis.language).toBe('javascript')
      expect(analysis.classes).toHaveLength(1)
    })

    it('should handle empty content', () => {
      const analysis = analyzeContent('', 'javascript')

      expect(analysis).toBeDefined()
      expect(analysis.classes).toHaveLength(0)
      expect(analysis.functions).toHaveLength(0)
      expect(analysis.metrics.loc).toBe(0)
    })
  })
})
