import { describe, it, expect } from 'vitest'
import {
  isExternalImport,
  extractPackageName,
  isNodeBuiltin,
  detectExternalImports,
  type ExternalImportInfo,
  type ExternalDetectionResult,
  type PackageJsonDeps,
} from './externalDetector'

describe('externalDetector', () => {
  describe('isExternalImport', () => {
    it('should return false for relative imports starting with ./', () => {
      expect(isExternalImport('./utils')).toBe(false)
      expect(isExternalImport('./components/Button')).toBe(false)
    })

    it('should return false for relative imports starting with ../', () => {
      expect(isExternalImport('../shared/types')).toBe(false)
      expect(isExternalImport('../../lib/helpers')).toBe(false)
    })

    it('should return false for absolute imports starting with /', () => {
      expect(isExternalImport('/src/utils')).toBe(false)
    })

    it('should return true for bare module specifiers', () => {
      expect(isExternalImport('express')).toBe(true)
      expect(isExternalImport('react')).toBe(true)
      expect(isExternalImport('lodash')).toBe(true)
    })

    it('should return true for scoped packages', () => {
      expect(isExternalImport('@types/node')).toBe(true)
      expect(isExternalImport('@react-three/fiber')).toBe(true)
    })

    it('should return true for node: protocol imports', () => {
      expect(isExternalImport('node:fs')).toBe(true)
      expect(isExternalImport('node:path')).toBe(true)
    })

    it('should return true for deep package imports', () => {
      expect(isExternalImport('lodash/merge')).toBe(true)
      expect(isExternalImport('react/jsx-runtime')).toBe(true)
    })
  })

  describe('extractPackageName', () => {
    it('should extract simple package names', () => {
      expect(extractPackageName('express')).toBe('express')
      expect(extractPackageName('react')).toBe('react')
    })

    it('should extract package name from deep imports', () => {
      expect(extractPackageName('lodash/merge')).toBe('lodash')
      expect(extractPackageName('react/jsx-runtime')).toBe('react')
    })

    it('should extract scoped package names', () => {
      expect(extractPackageName('@types/node')).toBe('@types/node')
      expect(extractPackageName('@react-three/fiber')).toBe('@react-three/fiber')
    })

    it('should extract scoped package name from deep imports', () => {
      expect(extractPackageName('@react-three/fiber/native')).toBe('@react-three/fiber')
    })

    it('should strip node: prefix', () => {
      expect(extractPackageName('node:fs')).toBe('fs')
      expect(extractPackageName('node:path')).toBe('path')
    })
  })

  describe('isNodeBuiltin', () => {
    it('should return true for common Node.js built-ins', () => {
      expect(isNodeBuiltin('fs')).toBe(true)
      expect(isNodeBuiltin('path')).toBe(true)
      expect(isNodeBuiltin('http')).toBe(true)
      expect(isNodeBuiltin('crypto')).toBe(true)
      expect(isNodeBuiltin('os')).toBe(true)
      expect(isNodeBuiltin('stream')).toBe(true)
      expect(isNodeBuiltin('events')).toBe(true)
      expect(isNodeBuiltin('util')).toBe(true)
    })

    it('should return true with node: prefix', () => {
      expect(isNodeBuiltin('node:fs')).toBe(true)
      expect(isNodeBuiltin('node:path')).toBe(true)
    })

    it('should return false for npm packages', () => {
      expect(isNodeBuiltin('express')).toBe(false)
      expect(isNodeBuiltin('react')).toBe(false)
      expect(isNodeBuiltin('lodash')).toBe(false)
    })
  })

  describe('detectExternalImports', () => {
    it('should skip relative imports', () => {
      const imports: ExternalImportInfo[] = [
        { sourceNodeId: 'file:src/app.ts', importPath: './utils' },
        { sourceNodeId: 'file:src/app.ts', importPath: '../shared/types' },
      ]

      const result = detectExternalImports(imports)

      expect(result.externalNodes).toHaveLength(0)
      expect(result.externalEdges).toHaveLength(0)
    })

    it('should create stub nodes for npm packages', () => {
      const imports: ExternalImportInfo[] = [
        { sourceNodeId: 'file:src/app.ts', importPath: 'express' },
        { sourceNodeId: 'file:src/app.ts', importPath: 'react' },
      ]

      const result = detectExternalImports(imports)

      expect(result.externalNodes).toHaveLength(2)

      const expressNode = result.externalNodes.find(n => n.name === 'express')
      expect(expressNode).toBeDefined()
      expect(expressNode!.id).toBe('external:express')
      expect(expressNode!.type).toBe('module')
      expect(expressNode!.metadata.isExternal).toBe(true)
      expect(expressNode!.metadata.isBuiltin).toBe(false)

      const reactNode = result.externalNodes.find(n => n.name === 'react')
      expect(reactNode).toBeDefined()
      expect(reactNode!.id).toBe('external:react')
    })

    it('should create import edges from source to external node', () => {
      const imports: ExternalImportInfo[] = [
        { sourceNodeId: 'file:src/app.ts', importPath: 'express' },
      ]

      const result = detectExternalImports(imports)

      expect(result.externalEdges).toHaveLength(1)
      expect(result.externalEdges[0].source).toBe('file:src/app.ts')
      expect(result.externalEdges[0].target).toBe('external:express')
      expect(result.externalEdges[0].type).toBe('imports')
      expect(result.externalEdges[0].metadata.isExternal).toBe(true)
      expect(result.externalEdges[0].metadata.importPath).toBe('express')
    })

    it('should deduplicate external nodes when multiple files import same package', () => {
      const imports: ExternalImportInfo[] = [
        { sourceNodeId: 'file:src/app.ts', importPath: 'express' },
        { sourceNodeId: 'file:src/server.ts', importPath: 'express' },
        { sourceNodeId: 'file:src/routes.ts', importPath: 'express' },
      ]

      const result = detectExternalImports(imports)

      // Only one external node for express
      expect(result.externalNodes).toHaveLength(1)
      expect(result.externalNodes[0].name).toBe('express')

      // But three edges (one per importing file)
      expect(result.externalEdges).toHaveLength(3)
    })

    it('should detect Node.js built-ins and mark them', () => {
      const imports: ExternalImportInfo[] = [
        { sourceNodeId: 'file:src/io.ts', importPath: 'node:fs' },
        { sourceNodeId: 'file:src/io.ts', importPath: 'path' },
      ]

      const result = detectExternalImports(imports)

      expect(result.externalNodes).toHaveLength(2)

      const fsNode = result.externalNodes.find(n => n.name === 'fs')
      expect(fsNode).toBeDefined()
      expect(fsNode!.id).toBe('external:fs')
      expect(fsNode!.metadata.isBuiltin).toBe(true)
      expect(fsNode!.metadata.isExternal).toBe(true)

      const pathNode = result.externalNodes.find(n => n.name === 'path')
      expect(pathNode).toBeDefined()
      expect(pathNode!.metadata.isBuiltin).toBe(true)
    })

    it('should handle scoped packages', () => {
      const imports: ExternalImportInfo[] = [
        { sourceNodeId: 'file:src/scene.ts', importPath: '@react-three/fiber' },
        { sourceNodeId: 'file:src/scene.ts', importPath: '@react-three/fiber/native' },
      ]

      const result = detectExternalImports(imports)

      // Both deep imports resolve to the same package
      expect(result.externalNodes).toHaveLength(1)
      expect(result.externalNodes[0].name).toBe('@react-three/fiber')
      expect(result.externalNodes[0].id).toBe('external:@react-three/fiber')

      // Two edges (one per import statement)
      expect(result.externalEdges).toHaveLength(2)
    })

    it('should cross-reference package.json for version info', () => {
      const imports: ExternalImportInfo[] = [
        { sourceNodeId: 'file:src/app.ts', importPath: 'express' },
        { sourceNodeId: 'file:src/app.ts', importPath: 'jest' },
      ]

      const packageJson: PackageJsonDeps = {
        dependencies: { express: '^4.18.0' },
        devDependencies: { jest: '^29.0.0' },
      }

      const result = detectExternalImports(imports, packageJson)

      const expressNode = result.externalNodes.find(n => n.name === 'express')
      expect(expressNode!.metadata.packageVersion).toBe('^4.18.0')
      expect(expressNode!.metadata.isDevDependency).toBe(false)

      const jestNode = result.externalNodes.find(n => n.name === 'jest')
      expect(jestNode!.metadata.packageVersion).toBe('^29.0.0')
      expect(jestNode!.metadata.isDevDependency).toBe(true)
    })

    it('should handle missing package.json gracefully', () => {
      const imports: ExternalImportInfo[] = [
        { sourceNodeId: 'file:src/app.ts', importPath: 'express' },
      ]

      const result = detectExternalImports(imports)

      const node = result.externalNodes[0]
      expect(node.metadata.packageVersion).toBe('unknown')
      expect(node.metadata.isDevDependency).toBe(false)
    })

    it('should return empty result for empty input', () => {
      const result = detectExternalImports([])

      expect(result.externalNodes).toHaveLength(0)
      expect(result.externalEdges).toHaveLength(0)
    })

    it('should handle mixed internal and external imports', () => {
      const imports: ExternalImportInfo[] = [
        { sourceNodeId: 'file:src/app.ts', importPath: './utils' },
        { sourceNodeId: 'file:src/app.ts', importPath: 'express' },
        { sourceNodeId: 'file:src/app.ts', importPath: '../config' },
        { sourceNodeId: 'file:src/app.ts', importPath: 'node:fs' },
      ]

      const result = detectExternalImports(imports)

      // Only 2 external: express and fs
      expect(result.externalNodes).toHaveLength(2)
      expect(result.externalEdges).toHaveLength(2)
    })
  })
})
