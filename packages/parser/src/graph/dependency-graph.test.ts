import { describe, it, expect } from 'vitest'
import { DependencyGraph, type DependencyNode, type DependencyEdge } from './dependency-graph'

describe('DependencyGraph', () => {
  describe('constructor', () => {
    it('should create an empty graph', () => {
      const graph = new DependencyGraph()

      expect(graph.getNodeCount()).toBe(0)
      expect(graph.getEdgeCount()).toBe(0)
    })
  })

  describe('addNode', () => {
    it('should add a node to the graph', () => {
      const graph = new DependencyGraph()
      const node: DependencyNode = {
        id: 'file1',
        type: 'file',
        name: 'index.ts',
        path: '/src/index.ts',
        metadata: {},
      }

      graph.addNode(node)

      expect(graph.getNodeCount()).toBe(1)
      expect(graph.getNode('file1')).toEqual(node)
    })

    it('should update existing node when adding with same id', () => {
      const graph = new DependencyGraph()
      const node1: DependencyNode = {
        id: 'file1',
        type: 'file',
        name: 'index.ts',
        path: '/src/index.ts',
        metadata: {},
      }
      const node2: DependencyNode = {
        id: 'file1',
        type: 'file',
        name: 'index.ts',
        path: '/src/index.ts',
        metadata: { updated: true },
      }

      graph.addNode(node1)
      graph.addNode(node2)

      expect(graph.getNodeCount()).toBe(1)
      expect(graph.getNode('file1')?.metadata.updated).toBe(true)
    })
  })

  describe('addEdge', () => {
    it('should add an edge between nodes', () => {
      const graph = new DependencyGraph()
      graph.addNode({ id: 'file1', type: 'file', name: 'a.ts', path: '/a.ts', metadata: {} })
      graph.addNode({ id: 'file2', type: 'file', name: 'b.ts', path: '/b.ts', metadata: {} })

      const edge: DependencyEdge = {
        source: 'file1',
        target: 'file2',
        type: 'imports',
        metadata: {},
      }

      graph.addEdge(edge)

      expect(graph.getEdgeCount()).toBe(1)
      expect(graph.getEdges()).toContainEqual(edge)
    })

    it('should allow multiple edges between same nodes with different types', () => {
      const graph = new DependencyGraph()
      graph.addNode({ id: 'class1', type: 'class', name: 'Base', path: '/base.ts', metadata: {} })
      graph.addNode({ id: 'class2', type: 'class', name: 'Derived', path: '/derived.ts', metadata: {} })

      graph.addEdge({ source: 'class2', target: 'class1', type: 'extends', metadata: {} })
      graph.addEdge({ source: 'class2', target: 'class1', type: 'calls', metadata: {} })

      expect(graph.getEdgeCount()).toBe(2)
    })
  })

  describe('getNode', () => {
    it('should return undefined for non-existent node', () => {
      const graph = new DependencyGraph()

      expect(graph.getNode('nonexistent')).toBeUndefined()
    })

    it('should return node by id', () => {
      const graph = new DependencyGraph()
      const node: DependencyNode = {
        id: 'file1',
        type: 'file',
        name: 'index.ts',
        path: '/src/index.ts',
        metadata: {},
      }

      graph.addNode(node)

      expect(graph.getNode('file1')).toEqual(node)
    })
  })

  describe('getNodes', () => {
    it('should return all nodes', () => {
      const graph = new DependencyGraph()
      const node1: DependencyNode = { id: 'file1', type: 'file', name: 'a.ts', path: '/a.ts', metadata: {} }
      const node2: DependencyNode = { id: 'file2', type: 'file', name: 'b.ts', path: '/b.ts', metadata: {} }

      graph.addNode(node1)
      graph.addNode(node2)

      const nodes = graph.getNodes()
      expect(nodes).toHaveLength(2)
      expect(nodes).toContainEqual(node1)
      expect(nodes).toContainEqual(node2)
    })
  })

  describe('getEdges', () => {
    it('should return all edges', () => {
      const graph = new DependencyGraph()
      graph.addNode({ id: 'file1', type: 'file', name: 'a.ts', path: '/a.ts', metadata: {} })
      graph.addNode({ id: 'file2', type: 'file', name: 'b.ts', path: '/b.ts', metadata: {} })
      graph.addNode({ id: 'file3', type: 'file', name: 'c.ts', path: '/c.ts', metadata: {} })

      const edge1: DependencyEdge = { source: 'file1', target: 'file2', type: 'imports', metadata: {} }
      const edge2: DependencyEdge = { source: 'file2', target: 'file3', type: 'imports', metadata: {} }

      graph.addEdge(edge1)
      graph.addEdge(edge2)

      const edges = graph.getEdges()
      expect(edges).toHaveLength(2)
      expect(edges).toContainEqual(edge1)
      expect(edges).toContainEqual(edge2)
    })
  })

  describe('getOutgoingEdges', () => {
    it('should return edges from a node', () => {
      const graph = new DependencyGraph()
      graph.addNode({ id: 'file1', type: 'file', name: 'a.ts', path: '/a.ts', metadata: {} })
      graph.addNode({ id: 'file2', type: 'file', name: 'b.ts', path: '/b.ts', metadata: {} })
      graph.addNode({ id: 'file3', type: 'file', name: 'c.ts', path: '/c.ts', metadata: {} })

      graph.addEdge({ source: 'file1', target: 'file2', type: 'imports', metadata: {} })
      graph.addEdge({ source: 'file1', target: 'file3', type: 'imports', metadata: {} })
      graph.addEdge({ source: 'file2', target: 'file3', type: 'imports', metadata: {} })

      const outgoing = graph.getOutgoingEdges('file1')
      expect(outgoing).toHaveLength(2)
      expect(outgoing.every(e => e.source === 'file1')).toBe(true)
    })

    it('should return empty array for node with no outgoing edges', () => {
      const graph = new DependencyGraph()
      graph.addNode({ id: 'file1', type: 'file', name: 'a.ts', path: '/a.ts', metadata: {} })

      expect(graph.getOutgoingEdges('file1')).toHaveLength(0)
    })
  })

  describe('getIncomingEdges', () => {
    it('should return edges to a node', () => {
      const graph = new DependencyGraph()
      graph.addNode({ id: 'file1', type: 'file', name: 'a.ts', path: '/a.ts', metadata: {} })
      graph.addNode({ id: 'file2', type: 'file', name: 'b.ts', path: '/b.ts', metadata: {} })
      graph.addNode({ id: 'file3', type: 'file', name: 'c.ts', path: '/c.ts', metadata: {} })

      graph.addEdge({ source: 'file1', target: 'file3', type: 'imports', metadata: {} })
      graph.addEdge({ source: 'file2', target: 'file3', type: 'imports', metadata: {} })

      const incoming = graph.getIncomingEdges('file3')
      expect(incoming).toHaveLength(2)
      expect(incoming.every(e => e.target === 'file3')).toBe(true)
    })

    it('should return empty array for node with no incoming edges', () => {
      const graph = new DependencyGraph()
      graph.addNode({ id: 'file1', type: 'file', name: 'a.ts', path: '/a.ts', metadata: {} })

      expect(graph.getIncomingEdges('file1')).toHaveLength(0)
    })
  })

  describe('getDependencies', () => {
    it('should return all target node ids from outgoing edges', () => {
      const graph = new DependencyGraph()
      graph.addNode({ id: 'file1', type: 'file', name: 'a.ts', path: '/a.ts', metadata: {} })
      graph.addNode({ id: 'file2', type: 'file', name: 'b.ts', path: '/b.ts', metadata: {} })
      graph.addNode({ id: 'file3', type: 'file', name: 'c.ts', path: '/c.ts', metadata: {} })

      graph.addEdge({ source: 'file1', target: 'file2', type: 'imports', metadata: {} })
      graph.addEdge({ source: 'file1', target: 'file3', type: 'imports', metadata: {} })

      const deps = graph.getDependencies('file1')
      expect(deps).toHaveLength(2)
      expect(deps).toContain('file2')
      expect(deps).toContain('file3')
    })
  })

  describe('getDependents', () => {
    it('should return all source node ids from incoming edges', () => {
      const graph = new DependencyGraph()
      graph.addNode({ id: 'file1', type: 'file', name: 'a.ts', path: '/a.ts', metadata: {} })
      graph.addNode({ id: 'file2', type: 'file', name: 'b.ts', path: '/b.ts', metadata: {} })
      graph.addNode({ id: 'file3', type: 'file', name: 'c.ts', path: '/c.ts', metadata: {} })

      graph.addEdge({ source: 'file1', target: 'file3', type: 'imports', metadata: {} })
      graph.addEdge({ source: 'file2', target: 'file3', type: 'imports', metadata: {} })

      const dependents = graph.getDependents('file3')
      expect(dependents).toHaveLength(2)
      expect(dependents).toContain('file1')
      expect(dependents).toContain('file2')
    })
  })

  describe('removeNode', () => {
    it('should remove node and associated edges', () => {
      const graph = new DependencyGraph()
      graph.addNode({ id: 'file1', type: 'file', name: 'a.ts', path: '/a.ts', metadata: {} })
      graph.addNode({ id: 'file2', type: 'file', name: 'b.ts', path: '/b.ts', metadata: {} })
      graph.addNode({ id: 'file3', type: 'file', name: 'c.ts', path: '/c.ts', metadata: {} })

      graph.addEdge({ source: 'file1', target: 'file2', type: 'imports', metadata: {} })
      graph.addEdge({ source: 'file2', target: 'file3', type: 'imports', metadata: {} })

      graph.removeNode('file2')

      expect(graph.getNodeCount()).toBe(2)
      expect(graph.getEdgeCount()).toBe(0)
      expect(graph.getNode('file2')).toBeUndefined()
    })
  })

  describe('toJSON', () => {
    it('should serialize graph to JSON', () => {
      const graph = new DependencyGraph()
      graph.addNode({ id: 'file1', type: 'file', name: 'a.ts', path: '/a.ts', metadata: {} })
      graph.addNode({ id: 'file2', type: 'file', name: 'b.ts', path: '/b.ts', metadata: {} })
      graph.addEdge({ source: 'file1', target: 'file2', type: 'imports', metadata: {} })

      const json = graph.toJSON()

      expect(json).toHaveProperty('nodes')
      expect(json).toHaveProperty('edges')
      expect(json.nodes).toHaveLength(2)
      expect(json.edges).toHaveLength(1)
    })
  })

  describe('fromJSON', () => {
    it('should deserialize graph from JSON', () => {
      const json = {
        nodes: [
          { id: 'file1', type: 'file' as const, name: 'a.ts', path: '/a.ts', metadata: {} },
          { id: 'file2', type: 'file' as const, name: 'b.ts', path: '/b.ts', metadata: {} },
        ],
        edges: [
          { source: 'file1', target: 'file2', type: 'imports' as const, metadata: {} },
        ],
      }

      const graph = DependencyGraph.fromJSON(json)

      expect(graph.getNodeCount()).toBe(2)
      expect(graph.getEdgeCount()).toBe(1)
      expect(graph.getNode('file1')).toBeDefined()
      expect(graph.getNode('file2')).toBeDefined()
    })
  })
})
