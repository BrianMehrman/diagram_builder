import { describe, it, expect } from 'vitest'
import type { DependencyNode, DependencyEdge } from '../graph/dependency-graph'
import {
  buildContainmentHierarchy,
  type ContainmentResult,
} from './containmentAnalyzer'

// Helper to create a file node (matching graph-builder pattern)
function makeFileNode(filePath: string): DependencyNode {
  return {
    id: `file:${filePath}`,
    type: 'file',
    name: filePath.split('/').pop() || filePath,
    path: filePath,
    metadata: {},
  }
}

// Helper to create a class node
function makeClassNode(filePath: string, className: string): DependencyNode {
  return {
    id: `class:${filePath}:${className}`,
    type: 'class',
    name: className,
    path: filePath,
    metadata: {},
  }
}

// Helper to create a function node
function makeFunctionNode(filePath: string, funcName: string): DependencyNode {
  return {
    id: `function:${filePath}:${funcName}`,
    type: 'function',
    name: funcName,
    path: filePath,
    metadata: {},
  }
}

// Helper to create an exports edge (file → class/function)
function makeExportsEdge(sourceId: string, targetId: string): DependencyEdge {
  return { source: sourceId, target: targetId, type: 'exports', metadata: {} }
}

describe('containmentAnalyzer', () => {
  describe('buildContainmentHierarchy', () => {
    it('should detect file → class containment', () => {
      const filePath = 'src/user.ts'
      const fileNode = makeFileNode(filePath)
      const classNode = makeClassNode(filePath, 'User')
      const nodes = [fileNode, classNode]
      const edges = [makeExportsEdge(fileNode.id, classNode.id)]

      const result = buildContainmentHierarchy(nodes, edges)

      expect(result.parentMap.get(classNode.id)).toBe(fileNode.id)
      expect(result.parentMap.has(fileNode.id)).toBe(false) // file has no parent
    })

    it('should detect file → function containment', () => {
      const filePath = 'src/utils.ts'
      const fileNode = makeFileNode(filePath)
      const funcNode = makeFunctionNode(filePath, 'helper')
      const nodes = [fileNode, funcNode]
      const edges = [makeExportsEdge(fileNode.id, funcNode.id)]

      const result = buildContainmentHierarchy(nodes, edges)

      expect(result.parentMap.get(funcNode.id)).toBe(fileNode.id)
    })

    it('should handle file with multiple classes and functions', () => {
      const filePath = 'src/models.ts'
      const fileNode = makeFileNode(filePath)
      const class1 = makeClassNode(filePath, 'User')
      const class2 = makeClassNode(filePath, 'Admin')
      const func1 = makeFunctionNode(filePath, 'createUser')
      const nodes = [fileNode, class1, class2, func1]
      const edges = [
        makeExportsEdge(fileNode.id, class1.id),
        makeExportsEdge(fileNode.id, class2.id),
        makeExportsEdge(fileNode.id, func1.id),
      ]

      const result = buildContainmentHierarchy(nodes, edges)

      expect(result.parentMap.get(class1.id)).toBe(fileNode.id)
      expect(result.parentMap.get(class2.id)).toBe(fileNode.id)
      expect(result.parentMap.get(func1.id)).toBe(fileNode.id)
    })

    it('should create contains edges for each parent-child pair', () => {
      const filePath = 'src/service.ts'
      const fileNode = makeFileNode(filePath)
      const classNode = makeClassNode(filePath, 'Service')
      const funcNode = makeFunctionNode(filePath, 'init')
      const nodes = [fileNode, classNode, funcNode]
      const edges = [
        makeExportsEdge(fileNode.id, classNode.id),
        makeExportsEdge(fileNode.id, funcNode.id),
      ]

      const result = buildContainmentHierarchy(nodes, edges)

      expect(result.containmentEdges).toHaveLength(2)

      const classEdge = result.containmentEdges.find(e => e.target === classNode.id)
      expect(classEdge).toBeDefined()
      expect(classEdge!.source).toBe(fileNode.id)
      expect(classEdge!.type).toBe('contains')

      const funcEdge = result.containmentEdges.find(e => e.target === funcNode.id)
      expect(funcEdge).toBeDefined()
      expect(funcEdge!.source).toBe(fileNode.id)
      expect(funcEdge!.type).toBe('contains')
    })

    it('should handle file with no children (leaf file)', () => {
      const fileNode = makeFileNode('src/constants.ts')
      const nodes = [fileNode]
      const edges: DependencyEdge[] = []

      const result = buildContainmentHierarchy(nodes, edges)

      expect(result.parentMap.size).toBe(0)
      expect(result.containmentEdges).toHaveLength(0)
      expect(result.rootNodes).toContain(fileNode.id)
    })

    it('should identify root nodes (nodes without parents)', () => {
      const filePath = 'src/app.ts'
      const fileNode = makeFileNode(filePath)
      const classNode = makeClassNode(filePath, 'App')
      const nodes = [fileNode, classNode]
      const edges = [makeExportsEdge(fileNode.id, classNode.id)]

      const result = buildContainmentHierarchy(nodes, edges)

      expect(result.rootNodes).toContain(fileNode.id)
      expect(result.rootNodes).not.toContain(classNode.id)
    })

    it('should handle orphan class without a file parent', () => {
      // A class node whose path doesn't match any file node
      const classNode = makeClassNode('src/orphan.ts', 'Orphan')
      const nodes = [classNode]
      const edges: DependencyEdge[] = []

      const result = buildContainmentHierarchy(nodes, edges)

      // Orphan has no parent
      expect(result.parentMap.has(classNode.id)).toBe(false)
      // Orphan is a root node
      expect(result.rootNodes).toContain(classNode.id)
    })

    it('should return empty result for empty graph', () => {
      const result = buildContainmentHierarchy([], [])

      expect(result.parentMap.size).toBe(0)
      expect(result.containmentEdges).toHaveLength(0)
      expect(result.rootNodes).toHaveLength(0)
    })

    it('should use path-based grouping even without exports edges', () => {
      // Nodes share the same path but no explicit 'exports' edge
      const filePath = 'src/data.ts'
      const fileNode = makeFileNode(filePath)
      const classNode = makeClassNode(filePath, 'DataStore')
      const nodes = [fileNode, classNode]
      const edges: DependencyEdge[] = [] // no edges at all

      const result = buildContainmentHierarchy(nodes, edges)

      // Path-based grouping should still detect containment
      expect(result.parentMap.get(classNode.id)).toBe(fileNode.id)
    })

    it('should handle multiple files each with children', () => {
      const file1 = makeFileNode('src/a.ts')
      const file2 = makeFileNode('src/b.ts')
      const classA = makeClassNode('src/a.ts', 'ClassA')
      const classB = makeClassNode('src/b.ts', 'ClassB')
      const funcB = makeFunctionNode('src/b.ts', 'helperB')
      const nodes = [file1, file2, classA, classB, funcB]
      const edges = [
        makeExportsEdge(file1.id, classA.id),
        makeExportsEdge(file2.id, classB.id),
        makeExportsEdge(file2.id, funcB.id),
      ]

      const result = buildContainmentHierarchy(nodes, edges)

      expect(result.parentMap.get(classA.id)).toBe(file1.id)
      expect(result.parentMap.get(classB.id)).toBe(file2.id)
      expect(result.parentMap.get(funcB.id)).toBe(file2.id)
      expect(result.rootNodes).toContain(file1.id)
      expect(result.rootNodes).toContain(file2.id)
      expect(result.containmentEdges).toHaveLength(3)
    })

    it('should ensure parentMap and containmentEdges are consistent', () => {
      const filePath = 'src/model.ts'
      const fileNode = makeFileNode(filePath)
      const classNode = makeClassNode(filePath, 'Model')
      const nodes = [fileNode, classNode]
      const edges = [makeExportsEdge(fileNode.id, classNode.id)]

      const result = buildContainmentHierarchy(nodes, edges)

      // Every entry in parentMap should have a matching containment edge
      for (const [childId, parentId] of result.parentMap) {
        const matchingEdge = result.containmentEdges.find(
          e => e.source === parentId && e.target === childId
        )
        expect(matchingEdge).toBeDefined()
      }

      // Every containment edge should have a matching parentMap entry
      for (const edge of result.containmentEdges) {
        expect(result.parentMap.get(edge.target)).toBe(edge.source)
      }
    })
  })
})
