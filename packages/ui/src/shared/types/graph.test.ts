/**
 * IVMGraph Types Tests
 *
 * Validates IVMNode, IVMEdge, and IVMGraph type usage
 * including new city-to-cell layout fields (depth, isExternal, parentId)
 */

import { describe, it, expect } from 'vitest'
import type { IVMNode, IVMEdge, IVMGraph } from './graph'

describe('IVMNode type', () => {
  it('creates a node with all fields including new layout fields', () => {
    const node: IVMNode = {
      id: 'file-1',
      type: 'file',
      label: 'index.ts',
      metadata: { path: 'src/index.ts' },
      position: { x: 0, y: 0, z: 0 },
      lod: 1,
      depth: 2,
      isExternal: false,
      parentId: 'dir-1',
    }

    expect(node.id).toBe('file-1')
    expect(node.depth).toBe(2)
    expect(node.isExternal).toBe(false)
    expect(node.parentId).toBe('dir-1')
  })

  it('creates a node without new fields (backward compatibility)', () => {
    const node: IVMNode = {
      id: 'func-1',
      type: 'function',
      label: 'handleClick',
      metadata: {},
      lod: 3,
    }

    expect(node.id).toBe('func-1')
    expect(node.depth).toBeUndefined()
    expect(node.isExternal).toBeUndefined()
    expect(node.parentId).toBeUndefined()
  })

  it('creates an external library node', () => {
    const node: IVMNode = {
      id: 'ext-react',
      type: 'file',
      label: 'react',
      metadata: { path: 'node_modules/react/index.js' },
      lod: 1,
      isExternal: true,
      depth: 0,
    }

    expect(node.isExternal).toBe(true)
  })

  it('creates a deeply nested node with parent', () => {
    const parentNode: IVMNode = {
      id: 'class-1',
      type: 'class',
      label: 'UserService',
      metadata: {},
      lod: 2,
      depth: 1,
    }

    const childNode: IVMNode = {
      id: 'method-1',
      type: 'method',
      label: 'getUser',
      metadata: {},
      lod: 3,
      depth: 2,
      parentId: parentNode.id,
    }

    expect(childNode.parentId).toBe('class-1')
    expect(childNode.depth).toBeGreaterThan(parentNode.depth!)
  })

  it('supports all node types including new Epic 9-B types', () => {
    const types: IVMNode['type'][] = [
      'file',
      'class',
      'function',
      'method',
      'variable',
      'interface',
      'enum',
      'abstract_class',
    ]
    types.forEach((type) => {
      const node: IVMNode = { id: `${type}-1`, type, label: type, metadata: {}, lod: 1 }
      expect(node.type).toBe(type)
    })
  })

  it('creates an interface node', () => {
    const node: IVMNode = {
      id: 'iface-1',
      type: 'interface',
      label: 'UserRepository',
      metadata: {},
      lod: 2,
      methodCount: 5,
    }

    expect(node.type).toBe('interface')
    expect(node.methodCount).toBe(5)
  })

  it('creates an enum node', () => {
    const node: IVMNode = {
      id: 'enum-1',
      type: 'enum',
      label: 'Status',
      metadata: {},
      lod: 2,
    }

    expect(node.type).toBe('enum')
  })

  it('creates an abstract class node with shape metadata', () => {
    const node: IVMNode = {
      id: 'abs-1',
      type: 'abstract_class',
      label: 'BaseService',
      metadata: {},
      lod: 2,
      isAbstract: true,
      methodCount: 12,
      hasNestedTypes: true,
    }

    expect(node.type).toBe('abstract_class')
    expect(node.isAbstract).toBe(true)
    expect(node.methodCount).toBe(12)
    expect(node.hasNestedTypes).toBe(true)
  })

  it('shape metadata fields are optional (backward compatibility)', () => {
    const node: IVMNode = {
      id: 'class-1',
      type: 'class',
      label: 'UserService',
      metadata: {},
      lod: 2,
    }

    expect(node.methodCount).toBeUndefined()
    expect(node.isAbstract).toBeUndefined()
    expect(node.hasNestedTypes).toBeUndefined()
  })

  it('creates a node with sign metadata fields', () => {
    const node: IVMNode = {
      id: 'func-1',
      type: 'function',
      label: 'getUser',
      metadata: {},
      lod: 2,
      visibility: 'public',
      isDeprecated: false,
      isExported: true,
    }

    expect(node.visibility).toBe('public')
    expect(node.isDeprecated).toBe(false)
    expect(node.isExported).toBe(true)
  })

  it('supports all visibility values', () => {
    const visibilities: IVMNode['visibility'][] = ['public', 'protected', 'private', 'static']
    visibilities.forEach((vis) => {
      const node: IVMNode = {
        id: `vis-${vis}`,
        type: 'function',
        label: 'test',
        metadata: {},
        lod: 1,
        visibility: vis,
      }
      expect(node.visibility).toBe(vis)
    })
  })

  it('creates a deprecated node', () => {
    const node: IVMNode = {
      id: 'dep-1',
      type: 'function',
      label: 'oldMethod',
      metadata: {},
      lod: 2,
      isDeprecated: true,
    }

    expect(node.isDeprecated).toBe(true)
  })

  it('sign metadata fields are optional (backward compatibility)', () => {
    const node: IVMNode = {
      id: 'class-2',
      type: 'class',
      label: 'Service',
      metadata: {},
      lod: 2,
    }

    expect(node.visibility).toBeUndefined()
    expect(node.isDeprecated).toBeUndefined()
    expect(node.isExported).toBeUndefined()
  })
})

describe('IVMEdge type', () => {
  it('creates an edge with all types', () => {
    const types: IVMEdge['type'][] = ['contains', 'depends_on', 'calls', 'inherits', 'imports']
    types.forEach((type) => {
      const edge: IVMEdge = { id: `edge-${type}`, source: 'a', target: 'b', type, metadata: {} }
      expect(edge.type).toBe(type)
    })
  })
})

describe('Graph type', () => {
  it('creates a graph with nodes containing new fields', () => {
    const graph: IVMGraph = {
      nodes: [
        { id: 'f1', type: 'file', label: 'index.ts', metadata: {}, lod: 1, depth: 0 },
        { id: 'c1', type: 'class', label: 'App', metadata: {}, lod: 2, depth: 1, parentId: 'f1' },
        { id: 'ext', type: 'file', label: 'react', metadata: {}, lod: 1, isExternal: true },
      ],
      edges: [{ id: 'e1', source: 'f1', target: 'c1', type: 'contains', metadata: {} }],
      metadata: {
        repositoryId: 'repo-1',
        name: 'test-repo',
        totalNodes: 3,
        totalEdges: 1,
      },
    }

    expect(graph.nodes).toHaveLength(3)
    expect(graph.nodes[1].parentId).toBe('f1')
    expect(graph.nodes[2].isExternal).toBe(true)
  })
})
