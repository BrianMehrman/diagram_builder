import { describe, it, expect } from 'vitest'
import { tmpdir } from 'os'
import { join } from 'path'
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'fs'
import { loadRepository } from '../repository/repository-loader'
import { buildDependencyGraph } from '../graph/graph-builder'
import { convertToIVM } from '../ivm/ivm-converter'

describe('full-pipeline integration', () => {
  it('should process a TypeScript project end-to-end', async () => {
    // Step 1: Create a temporary test project
    const testDir = join(tmpdir(), `test-project-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })

    try {
      // Create test files
      const indexPath = join(testDir, 'index.ts')
      writeFileSync(
        indexPath,
        `
        import { greet } from './greet'

        export function main() {
          console.log(greet('World'))
        }

        main()
        `
      )

      const greetPath = join(testDir, 'greet.ts')
      writeFileSync(
        greetPath,
        `
        export function greet(name: string): string {
          return 'Hello, ' + name + '!'
        }
        `
      )

      const utilsPath = join(testDir, 'utils.ts')
      writeFileSync(
        utilsPath,
        `
        export class StringUtils {
          static reverse(str: string): string {
            return str.split('').reverse().join('')
          }
        }
        `
      )

      // Step 2: Load repository
      const repoContext = await loadRepository(testDir, {
        extensions: ['.ts'],
      })

      expect(repoContext.files).toHaveLength(3)
      expect(repoContext.metadata.type).toBe('local')

      // Step 3: Read file contents
      const fileInputs = repoContext.files.map(filePath => ({
        filePath,
        content: readFileSync(filePath, 'utf-8'),
      }))

      expect(fileInputs).toHaveLength(3)

      // Step 4: Build dependency graph
      const depGraph = buildDependencyGraph(fileInputs)

      const nodes = depGraph.getNodes()
      const edges = depGraph.getEdges()

      expect(nodes.length).toBeGreaterThan(0)

      // Should have file nodes
      const fileNodes = nodes.filter(n => n.type === 'file')
      expect(fileNodes.length).toBe(3)

      // Should have function nodes
      const functionNodes = nodes.filter(n => n.type === 'function')
      expect(functionNodes.length).toBeGreaterThanOrEqual(2) // main, greet

      // Should have class nodes
      const classNodes = nodes.filter(n => n.type === 'class')
      expect(classNodes.length).toBeGreaterThanOrEqual(1) // StringUtils

      // Should have import edges
      const importEdges = edges.filter(e => e.type === 'imports')
      expect(importEdges.length).toBeGreaterThanOrEqual(1) // index imports greet

      // Step 5: Convert to IVM
      const ivm = convertToIVM(depGraph, repoContext, {
        name: 'test-project',
      })

      expect(ivm.nodes.length).toBe(nodes.length)
      expect(ivm.edges.length).toBe(edges.length)
      expect(ivm.metadata.name).toBe('test-project')
      expect(ivm.metadata.rootPath).toBe(testDir)
      expect(ivm.metadata.schemaVersion).toBe('1.0.0')

      // Verify all nodes have required IVM properties
      for (const node of ivm.nodes) {
        expect(node.id).toBeDefined()
        expect(node.type).toBeDefined()
        expect(node.position).toBeDefined()
        expect(node.position.x).toBeDefined()
        expect(node.position.y).toBeDefined()
        expect(node.position.z).toBeDefined()
        expect(node.lod).toBeGreaterThanOrEqual(0)
        expect(node.lod).toBeLessThanOrEqual(5)
        expect(node.metadata.label).toBeDefined()
        expect(node.metadata.path).toBeDefined()
      }

      // Verify all edges reference existing nodes
      const nodeIds = new Set(ivm.nodes.map(n => n.id))
      for (const edge of ivm.edges) {
        expect(nodeIds.has(edge.source)).toBe(true)
        expect(nodeIds.has(edge.target)).toBe(true)
        expect(edge.lod).toBeGreaterThanOrEqual(0)
        expect(edge.lod).toBeLessThanOrEqual(5)
      }

      // Verify bounding box
      expect(ivm.bounds).toBeDefined()
      expect(ivm.bounds.min).toBeDefined()
      expect(ivm.bounds.max).toBeDefined()

      // Verify statistics
      expect(ivm.metadata.stats.totalNodes).toBe(ivm.nodes.length)
      expect(ivm.metadata.stats.totalEdges).toBe(ivm.edges.length)
      expect(ivm.metadata.stats.nodesByType).toBeDefined()
      expect(ivm.metadata.stats.edgesByType).toBeDefined()
    } finally {
      // Cleanup
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('should handle JavaScript files', async () => {
    const testDir = join(tmpdir(), `test-js-project-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })

    try {
      const indexPath = join(testDir, 'index.js')
      writeFileSync(
        indexPath,
        `
        function calculate(a, b) {
          return a + b
        }

        module.exports = { calculate }
        `
      )

      const repoContext = await loadRepository(testDir, {
        extensions: ['.js'],
      })

      expect(repoContext.files).toHaveLength(1)

      const fileInputs = repoContext.files.map(filePath => ({
        filePath,
        content: readFileSync(filePath, 'utf-8'),
      }))

      const depGraph = buildDependencyGraph(fileInputs)
      const ivm = convertToIVM(depGraph, repoContext, { name: 'js-project' })

      expect(ivm.nodes.length).toBeGreaterThan(0)
      expect(ivm.metadata.name).toBe('js-project')

      // Should detect JavaScript language
      const fileNode = ivm.nodes.find(n => n.type === 'file')
      expect(fileNode).toBeDefined()
    } finally {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('should handle projects with classes and inheritance', async () => {
    const testDir = join(tmpdir(), `test-inheritance-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })

    try {
      const basePath = join(testDir, 'base.ts')
      writeFileSync(
        basePath,
        `
        export abstract class Animal {
          abstract makeSound(): string
        }
        `
      )

      const dogPath = join(testDir, 'dog.ts')
      writeFileSync(
        dogPath,
        `
        import { Animal } from './base'

        export class Dog extends Animal {
          makeSound(): string {
            return 'Woof!'
          }
        }
        `
      )

      const repoContext = await loadRepository(testDir, { extensions: ['.ts'] })
      const fileInputs = repoContext.files.map(filePath => ({
        filePath,
        content: readFileSync(filePath, 'utf-8'),
      }))
      const depGraph = buildDependencyGraph(fileInputs)
      const ivm = convertToIVM(depGraph, repoContext, { name: 'inheritance-test' })

      // Should have import edges (Dog imports Animal)
      const importEdges = ivm.edges.filter(e => e.type === 'imports')
      expect(importEdges.length).toBeGreaterThanOrEqual(1)

      // Should have class nodes
      const classNodes = ivm.nodes.filter(n => n.type === 'class')
      expect(classNodes.length).toBeGreaterThanOrEqual(1) // At least Dog or Animal

      // Verify the IVM structure is valid
      expect(ivm.nodes.length).toBeGreaterThan(0)
      expect(ivm.metadata.name).toBe('inheritance-test')
    } finally {
      rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('should handle empty projects', async () => {
    const testDir = join(tmpdir(), `test-empty-${Date.now()}`)
    mkdirSync(testDir, { recursive: true })

    try {
      const repoContext = await loadRepository(testDir, { extensions: ['.ts'] })
      const depGraph = buildDependencyGraph([])
      const ivm = convertToIVM(depGraph, repoContext, { name: 'empty-project' })

      expect(ivm.nodes).toHaveLength(0)
      expect(ivm.edges).toHaveLength(0)
      expect(ivm.metadata.name).toBe('empty-project')
      expect(ivm.metadata.stats.totalNodes).toBe(0)
      expect(ivm.metadata.stats.totalEdges).toBe(0)
    } finally {
      rmSync(testDir, { recursive: true, force: true })
    }
  })
})
