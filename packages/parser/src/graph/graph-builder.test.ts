import { describe, it, expect } from 'vitest'
import { buildDependencyGraph } from './graph-builder'

describe('Graph Builder', () => {
  describe('buildDependencyGraph', () => {
    it('should build graph from single file with imports', () => {
      const sourceCode = `
        import { helper } from './utils'

        export function main() {
          helper()
        }
      `

      const graph = buildDependencyGraph([
        { filePath: '/src/index.ts', content: sourceCode },
      ])

      expect(graph.getNodeCount()).toBeGreaterThan(0)
      expect(graph.getEdgeCount()).toBeGreaterThan(0)
    })

    it('should build graph with file nodes', () => {
      const sourceCode = `
        export class MyClass {}
      `

      const graph = buildDependencyGraph([
        { filePath: '/src/index.ts', content: sourceCode },
      ])

      const nodes = graph.getNodes()
      const fileNode = nodes.find(n => n.type === 'file')

      expect(fileNode).toBeDefined()
      expect(fileNode?.name).toBe('index.ts')
      expect(fileNode?.path).toBe('/src/index.ts')
    })

    it('should build graph with class nodes', () => {
      const sourceCode = `
        export class MyClass {
          method() {}
        }
      `

      const graph = buildDependencyGraph([
        { filePath: '/src/index.ts', content: sourceCode },
      ])

      const nodes = graph.getNodes()
      const classNode = nodes.find(n => n.type === 'class')

      expect(classNode).toBeDefined()
      expect(classNode?.name).toBe('MyClass')
    })

    it('should build graph with function nodes', () => {
      const sourceCode = `
        export function myFunction() {
          return 42
        }
      `

      const graph = buildDependencyGraph([
        { filePath: '/src/index.ts', content: sourceCode },
      ])

      const nodes = graph.getNodes()
      const functionNode = nodes.find(n => n.type === 'function')

      expect(functionNode).toBeDefined()
      expect(functionNode?.name).toBe('myFunction')
    })

    it('should create import edges between files', () => {
      const file1 = `
        import { helper } from './utils'

        export function main() {
          helper()
        }
      `

      const file2 = `
        export function helper() {
          return 42
        }
      `

      const graph = buildDependencyGraph([
        { filePath: '/src/index.ts', content: file1 },
        { filePath: '/src/utils.ts', content: file2 },
      ])

      const edges = graph.getEdges()
      const importEdge = edges.find(e => e.type === 'imports')

      expect(importEdge).toBeDefined()
      expect(importEdge?.source).toMatch(/index\.ts/)
      expect(importEdge?.target).toMatch(/utils\.ts/)
    })

    it('should create extends edges for class inheritance', () => {
      const sourceCode = `
        class Animal {}
        class Dog extends Animal {}
      `

      const graph = buildDependencyGraph([
        { filePath: '/src/index.ts', content: sourceCode },
      ])

      const edges = graph.getEdges()
      const extendsEdge = edges.find(e => e.type === 'extends')

      expect(extendsEdge).toBeDefined()
      expect(extendsEdge?.source).toMatch(/Dog/)
      expect(extendsEdge?.target).toMatch(/Animal/)
    })

    it('should create extends edges when class extends another class', () => {
      const sourceCode = `
        class BaseLogger {}
        class ConsoleLogger extends BaseLogger {}
      `

      const graph = buildDependencyGraph([
        { filePath: '/src/index.ts', content: sourceCode },
      ])

      const edges = graph.getEdges()
      const extendsEdge = edges.find(e => e.type === 'extends')

      expect(extendsEdge).toBeDefined()
      expect(extendsEdge?.source).toContain('ConsoleLogger')
      expect(extendsEdge?.target).toContain('BaseLogger')
    })

    it('should create call edges for function calls', () => {
      const sourceCode = `
        function greet() {
          return 'hello'
        }

        function main() {
          greet()
        }
      `

      const graph = buildDependencyGraph([
        { filePath: '/src/index.ts', content: sourceCode },
      ])

      const edges = graph.getEdges()
      const callEdge = edges.find(e => e.type === 'calls')

      expect(callEdge).toBeDefined()
    })

    it('should handle multiple files with cross-references', () => {
      const file1 = `
        import { ClassB } from './b'

        export class ClassA extends ClassB {
          method() {
            super.method()
          }
        }
      `

      const file2 = `
        export class ClassB {
          method() {}
        }
      `

      const graph = buildDependencyGraph([
        { filePath: '/src/a.ts', content: file1 },
        { filePath: '/src/b.ts', content: file2 },
      ])

      expect(graph.getNodeCount()).toBeGreaterThan(2) // At least 2 files + 2 classes
      expect(graph.getEdgeCount()).toBeGreaterThan(1) // At least import + extends
    })

    it('should include code metrics in file node metadata', () => {
      const sourceCode = `
        export class MyClass {
          method1() {}
          method2() {}
        }

        export function helper() {}
      `

      const graph = buildDependencyGraph([
        { filePath: '/src/index.ts', content: sourceCode },
      ])

      const fileNode = graph.getNodes().find(n => n.type === 'file')
      expect(fileNode?.metadata.metrics).toBeDefined()
      expect(fileNode?.metadata.metrics).toHaveProperty('loc')
      expect(fileNode?.metadata.metrics).toHaveProperty('classCount')
      expect(fileNode?.metadata.metrics).toHaveProperty('functionCount')
    })

    it('should handle empty file list', () => {
      const graph = buildDependencyGraph([])

      expect(graph.getNodeCount()).toBe(0)
      expect(graph.getEdgeCount()).toBe(0)
    })
  })
})
