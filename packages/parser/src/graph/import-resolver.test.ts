import { describe, it, expect } from 'vitest'
import type { ImportStatement } from '../analysis/import-export-extractor'
import { resolveImports } from './import-resolver'

describe('Import Resolver', () => {
  describe('resolveImports', () => {
    it('should resolve relative import with .js extension', () => {
      const sourceFile = '/project/src/index.js'
      const imports: ImportStatement[] = [
        {
          source: './utils.js',
          defaultImport: undefined,
          namespaceImport: undefined,
          specifiers: [{ imported: 'helper', local: 'helper' }],
        },
      ]

      const resolved = resolveImports(sourceFile, imports)

      expect(resolved).toHaveLength(1)
      expect(resolved[0].source).toBe('./utils.js')
      expect(resolved[0].resolvedPath).toBe('/project/src/utils.js')
      expect(resolved[0].isExternal).toBe(false)
    })

    it('should resolve relative import without extension', () => {
      const sourceFile = '/project/src/index.ts'
      const imports: ImportStatement[] = [
        {
          source: './utils',
          defaultImport: undefined,
          namespaceImport: undefined,
          specifiers: [],
        },
      ]

      const resolved = resolveImports(sourceFile, imports)

      expect(resolved).toHaveLength(1)
      expect(resolved[0].resolvedPath).toMatch(/\/project\/src\/utils\.(ts|js)/)
      expect(resolved[0].isExternal).toBe(false)
    })

    it('should resolve parent directory import', () => {
      const sourceFile = '/project/src/components/Button.ts'
      const imports: ImportStatement[] = [
        {
          source: '../utils/helper',
          defaultImport: undefined,
          namespaceImport: undefined,
          specifiers: [],
        },
      ]

      const resolved = resolveImports(sourceFile, imports)

      expect(resolved).toHaveLength(1)
      expect(resolved[0].resolvedPath).toMatch(/\/project\/src\/utils\/helper/)
    })

    it('should mark node_modules imports as external', () => {
      const sourceFile = '/project/src/index.ts'
      const imports: ImportStatement[] = [
        {
          source: 'react',
          defaultImport: 'React',
          namespaceImport: undefined,
          specifiers: [],
        },
      ]

      const resolved = resolveImports(sourceFile, imports)

      expect(resolved).toHaveLength(1)
      expect(resolved[0].source).toBe('react')
      expect(resolved[0].isExternal).toBe(true)
      expect(resolved[0].resolvedPath).toBeUndefined()
    })

    it('should mark scoped packages as external', () => {
      const sourceFile = '/project/src/index.ts'
      const imports: ImportStatement[] = [
        {
          source: '@testing-library/react',
          defaultImport: undefined,
          namespaceImport: undefined,
          specifiers: [],
        },
      ]

      const resolved = resolveImports(sourceFile, imports)

      expect(resolved).toHaveLength(1)
      expect(resolved[0].isExternal).toBe(true)
    })

    it('should preserve imported symbols', () => {
      const sourceFile = '/project/src/index.ts'
      const imports: ImportStatement[] = [
        {
          source: './utils',
          defaultImport: 'Utils',
          namespaceImport: undefined,
          specifiers: [
            { imported: 'helper', local: 'helper' },
            { imported: 'formatter', local: 'fmt' },
          ],
        },
      ]

      const resolved = resolveImports(sourceFile, imports)

      expect(resolved).toHaveLength(1)
      expect(resolved[0].importedSymbols.defaultImport).toBe('Utils')
      expect(resolved[0].importedSymbols.specifiers).toHaveLength(2)
    })

    it('should handle multiple imports', () => {
      const sourceFile = '/project/src/index.ts'
      const imports: ImportStatement[] = [
        { source: './utils', defaultImport: undefined, namespaceImport: undefined, specifiers: [] },
        { source: 'react', defaultImport: 'React', namespaceImport: undefined, specifiers: [] },
        { source: '../components/Button', defaultImport: undefined, namespaceImport: undefined, specifiers: [] },
      ]

      const resolved = resolveImports(sourceFile, imports)

      expect(resolved).toHaveLength(3)
      expect(resolved.filter(r => r.isExternal)).toHaveLength(1)
      expect(resolved.filter(r => !r.isExternal)).toHaveLength(2)
    })

    it('should handle empty imports array', () => {
      const sourceFile = '/project/src/index.ts'
      const imports: ImportStatement[] = []

      const resolved = resolveImports(sourceFile, imports)

      expect(resolved).toHaveLength(0)
    })
  })
})
