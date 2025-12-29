import { describe, it, expect } from 'vitest'
import { parseContent } from '../parser/file-parser'
import { extractImports, extractExports } from './import-export-extractor'

describe('Import/Export Extractor', () => {
  describe('extractImports', () => {
    it('should extract named import', () => {
      const code = `import { useState, useEffect } from 'react';`
      const { tree } = parseContent(code, 'javascript')
      const imports = extractImports(tree)

      expect(imports).toHaveLength(1)
      expect(imports[0].source).toBe('react')
      expect(imports[0].specifiers).toHaveLength(2)
      expect(imports[0].specifiers.map(s => s.imported)).toContain('useState')
      expect(imports[0].specifiers.map(s => s.imported)).toContain('useEffect')
    })

    it('should extract default import', () => {
      const code = `import React from 'react';`
      const { tree } = parseContent(code, 'javascript')
      const imports = extractImports(tree)

      expect(imports).toHaveLength(1)
      expect(imports[0].source).toBe('react')
      expect(imports[0].defaultImport).toBe('React')
    })

    it('should extract namespace import', () => {
      const code = `import * as fs from 'fs';`
      const { tree } = parseContent(code, 'javascript')
      const imports = extractImports(tree)

      expect(imports).toHaveLength(1)
      expect(imports[0].source).toBe('fs')
      expect(imports[0].namespaceImport).toBe('fs')
    })

    it('should extract mixed import', () => {
      const code = `import React, { useState, useEffect } from 'react';`
      const { tree } = parseContent(code, 'javascript')
      const imports = extractImports(tree)

      expect(imports).toHaveLength(1)
      expect(imports[0].source).toBe('react')
      expect(imports[0].defaultImport).toBe('React')
      expect(imports[0].specifiers).toHaveLength(2)
    })

    it('should extract aliased import', () => {
      const code = `import { readFile as read } from 'fs';`
      const { tree } = parseContent(code, 'javascript')
      const imports = extractImports(tree)

      expect(imports).toHaveLength(1)
      const specifier = imports[0].specifiers[0]
      expect(specifier.imported).toBe('readFile')
      expect(specifier.local).toBe('read')
    })

    it('should extract multiple imports', () => {
      const code = `
import React from 'react';
import { readFile } from 'fs';
import * as path from 'path';
`
      const { tree } = parseContent(code, 'javascript')
      const imports = extractImports(tree)

      expect(imports).toHaveLength(3)
      expect(imports.map(i => i.source)).toEqual(['react', 'fs', 'path'])
    })

    it('should handle side-effect import', () => {
      const code = `import './styles.css';`
      const { tree } = parseContent(code, 'javascript')
      const imports = extractImports(tree)

      expect(imports).toHaveLength(1)
      expect(imports[0].source).toBe('./styles.css')
      expect(imports[0].specifiers).toHaveLength(0)
    })

    it('should return empty array when no imports', () => {
      const code = `const x = 42;`
      const { tree } = parseContent(code, 'javascript')
      const imports = extractImports(tree)

      expect(imports).toHaveLength(0)
    })
  })

  describe('extractExports', () => {
    it('should extract named export', () => {
      const code = `export { greet, farewell };`
      const { tree } = parseContent(code, 'javascript')
      const exports = extractExports(tree)

      expect(exports).toHaveLength(1)
      expect(exports[0].specifiers).toHaveLength(2)
      expect(exports[0].specifiers.map(s => s.exported)).toContain('greet')
      expect(exports[0].specifiers.map(s => s.exported)).toContain('farewell')
    })

    it('should extract default export', () => {
      const code = `export default function greet() {}`
      const { tree } = parseContent(code, 'javascript')
      const exports = extractExports(tree)

      expect(exports).toHaveLength(1)
      expect(exports[0].isDefault).toBe(true)
    })

    it('should extract export declaration', () => {
      const code = `export function greet(name) { return 'Hello'; }`
      const { tree } = parseContent(code, 'javascript')
      const exports = extractExports(tree)

      expect(exports).toHaveLength(1)
      expect(exports[0].specifiers).toHaveLength(1)
      expect(exports[0].specifiers[0].exported).toBe('greet')
    })

    it('should extract re-export', () => {
      const code = `export { greet } from './greet';`
      const { tree } = parseContent(code, 'javascript')
      const exports = extractExports(tree)

      expect(exports).toHaveLength(1)
      expect(exports[0].source).toBe('./greet')
      expect(exports[0].specifiers).toHaveLength(1)
      expect(exports[0].specifiers[0].exported).toBe('greet')
    })

    it('should extract export all', () => {
      const code = `export * from './utils';`
      const { tree } = parseContent(code, 'javascript')
      const exports = extractExports(tree)

      expect(exports).toHaveLength(1)
      expect(exports[0].source).toBe('./utils')
      expect(exports[0].exportAll).toBe(true)
    })

    it('should extract aliased export', () => {
      const code = `export { greet as hello };`
      const { tree } = parseContent(code, 'javascript')
      const exports = extractExports(tree)

      expect(exports).toHaveLength(1)
      const specifier = exports[0].specifiers[0]
      expect(specifier.local).toBe('greet')
      expect(specifier.exported).toBe('hello')
    })

    it('should return empty array when no exports', () => {
      const code = `const x = 42;`
      const { tree } = parseContent(code, 'javascript')
      const exports = extractExports(tree)

      expect(exports).toHaveLength(0)
    })
  })
})
