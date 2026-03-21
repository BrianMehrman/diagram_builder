import { describe, it, expect } from 'vitest'
import { buildGraph } from '../../../core/src/ivm/builder.js'
import { SemanticTier } from '../../../core/src/ivm/semantic-tier.js'
import type { GraphInput } from '../../../core/src/ivm/types.js'
import { buildGroupHierarchy } from './hierarchy-builder'
import type { GroupNode } from '../../../core/src/ivm/semantic-tier.js'

/**
 * Recursively collects all nodeIds from a GroupNode tree.
 */
function collectAllNodeIds(node: GroupNode): string[] {
  const ids = [...node.nodeIds]
  for (const child of node.children) {
    ids.push(...collectAllNodeIds(child))
  }
  return ids
}

describe('buildGroupHierarchy', () => {
  it('creates root group at Repository tier', () => {
    const input: GraphInput = {
      nodes: [
        { id: 'file:src/a.ts', type: 'file', metadata: { label: 'a.ts', path: 'src/a.ts' } },
        {
          id: 'class:A',
          type: 'class',
          parentId: 'file:src/a.ts',
          metadata: { label: 'A', path: 'src/a.ts#A' },
        },
        {
          id: 'method:A.foo',
          type: 'method',
          parentId: 'class:A',
          metadata: { label: 'foo', path: 'src/a.ts#A.foo' },
        },
      ],
      edges: [
        { source: 'file:src/a.ts', target: 'class:A', type: 'contains' },
        { source: 'class:A', target: 'method:A.foo', type: 'contains' },
      ],
      metadata: { name: 'test', rootPath: '/test', languages: [] },
    }

    const graph = buildGraph(input)
    const hierarchy = buildGroupHierarchy(graph)

    expect(hierarchy.root.tier).toBe(SemanticTier.Repository)
  })

  it('assigns every node to exactly one group', () => {
    const input: GraphInput = {
      nodes: [
        { id: 'file:src/a.ts', type: 'file', metadata: { label: 'a.ts', path: 'src/a.ts' } },
        {
          id: 'class:A',
          type: 'class',
          parentId: 'file:src/a.ts',
          metadata: { label: 'A', path: 'src/a.ts#A' },
        },
        {
          id: 'method:A.foo',
          type: 'method',
          parentId: 'class:A',
          metadata: { label: 'foo', path: 'src/a.ts#A.foo' },
        },
        { id: 'file:src/b.ts', type: 'file', metadata: { label: 'b.ts', path: 'src/b.ts' } },
        {
          id: 'function:bar',
          type: 'function',
          parentId: 'file:src/b.ts',
          metadata: { label: 'bar', path: 'src/b.ts#bar' },
        },
      ],
      edges: [
        { source: 'file:src/a.ts', target: 'class:A', type: 'contains' },
        { source: 'class:A', target: 'method:A.foo', type: 'contains' },
        { source: 'file:src/b.ts', target: 'function:bar', type: 'contains' },
      ],
      metadata: { name: 'test', rootPath: '/test', languages: [] },
    }

    const graph = buildGraph(input)
    const hierarchy = buildGroupHierarchy(graph)

    const allNodeIds = collectAllNodeIds(hierarchy.root)
    const graphNodeIds = graph.nodes.map((n) => n.id)

    // Every graph node should appear in the hierarchy
    for (const id of graphNodeIds) {
      expect(allNodeIds).toContain(id)
    }

    // No duplicates
    const uniqueIds = new Set(allNodeIds)
    expect(uniqueIds.size).toBe(allNodeIds.length)

    // Same count
    expect(allNodeIds.length).toBe(graphNodeIds.length)
  })

  it('counts nodes per tier correctly', () => {
    const input: GraphInput = {
      nodes: [
        { id: 'file:src/a.ts', type: 'file', metadata: { label: 'a.ts', path: 'src/a.ts' } },
        { id: 'file:src/b.ts', type: 'file', metadata: { label: 'b.ts', path: 'src/b.ts' } },
        {
          id: 'class:A',
          type: 'class',
          parentId: 'file:src/a.ts',
          metadata: { label: 'A', path: 'src/a.ts#A' },
        },
        {
          id: 'class:B',
          type: 'class',
          parentId: 'file:src/b.ts',
          metadata: { label: 'B', path: 'src/b.ts#B' },
        },
        {
          id: 'method:A.foo',
          type: 'method',
          parentId: 'class:A',
          metadata: { label: 'foo', path: 'src/a.ts#A.foo' },
        },
      ],
      edges: [
        { source: 'file:src/a.ts', target: 'class:A', type: 'contains' },
        { source: 'file:src/b.ts', target: 'class:B', type: 'contains' },
        { source: 'class:A', target: 'method:A.foo', type: 'contains' },
      ],
      metadata: { name: 'test', rootPath: '/test', languages: [] },
    }

    const graph = buildGraph(input)
    const hierarchy = buildGroupHierarchy(graph)

    // 1 synthetic repository root
    expect(hierarchy.tierCount[SemanticTier.Repository]).toBe(1)
    // 2 files
    expect(hierarchy.tierCount[SemanticTier.File]).toBe(2)
    // 2 classes
    expect(hierarchy.tierCount[SemanticTier.Symbol]).toBe(2)
    // 1 method
    expect(hierarchy.tierCount[SemanticTier.Detail]).toBe(1)
  })

  it('aggregates cross-group edges with type breakdown', () => {
    const input: GraphInput = {
      nodes: [
        { id: 'file:src/a.ts', type: 'file', metadata: { label: 'a.ts', path: 'src/a.ts' } },
        { id: 'file:src/b.ts', type: 'file', metadata: { label: 'b.ts', path: 'src/b.ts' } },
        {
          id: 'class:A',
          type: 'class',
          parentId: 'file:src/a.ts',
          metadata: { label: 'A', path: 'src/a.ts#A' },
        },
        {
          id: 'class:B',
          type: 'class',
          parentId: 'file:src/b.ts',
          metadata: { label: 'B', path: 'src/b.ts#B' },
        },
      ],
      edges: [
        { source: 'file:src/a.ts', target: 'class:A', type: 'contains' },
        { source: 'file:src/b.ts', target: 'class:B', type: 'contains' },
        { source: 'file:src/a.ts', target: 'file:src/b.ts', type: 'imports' },
        { source: 'class:A', target: 'class:B', type: 'calls' },
      ],
      metadata: { name: 'test', rootPath: '/test', languages: [] },
    }

    const graph = buildGraph(input)
    const hierarchy = buildGroupHierarchy(graph)

    // At File tier, file:src/a.ts and file:src/b.ts are separate groups
    // The imports edge (file→file) and calls edge (class→class, which rolls up to file groups) both cross groups
    const fileEdges = hierarchy.edgesByTier[SemanticTier.File]
    expect(fileEdges.length).toBe(1)

    const edge = fileEdges[0]
    expect(edge.sourceGroupId).toBe('file:src/a.ts')
    expect(edge.targetGroupId).toBe('file:src/b.ts')
    expect(edge.totalWeight).toBe(2) // 1 imports + 1 calls
    expect(edge.breakdown.imports).toBe(1)
    expect(edge.breakdown.calls).toBe(1)
  })

  it('excludes contains edges from aggregation', () => {
    const input: GraphInput = {
      nodes: [
        { id: 'file:src/a.ts', type: 'file', metadata: { label: 'a.ts', path: 'src/a.ts' } },
        {
          id: 'class:A',
          type: 'class',
          parentId: 'file:src/a.ts',
          metadata: { label: 'A', path: 'src/a.ts#A' },
        },
        {
          id: 'method:A.foo',
          type: 'method',
          parentId: 'class:A',
          metadata: { label: 'foo', path: 'src/a.ts#A.foo' },
        },
      ],
      edges: [
        { source: 'file:src/a.ts', target: 'class:A', type: 'contains' },
        { source: 'class:A', target: 'method:A.foo', type: 'contains' },
      ],
      metadata: { name: 'test', rootPath: '/test', languages: [] },
    }

    const graph = buildGraph(input)
    const hierarchy = buildGroupHierarchy(graph)

    // All tiers should have no aggregated edges (contains is excluded)
    for (const tier of Object.values(SemanticTier).filter(
      (v) => typeof v === 'number'
    ) as SemanticTier[]) {
      expect(hierarchy.edgesByTier[tier]).toEqual([])
    }
  })

  it('hides internal edges (same group)', () => {
    const input: GraphInput = {
      nodes: [
        { id: 'file:src/a.ts', type: 'file', metadata: { label: 'a.ts', path: 'src/a.ts' } },
        {
          id: 'class:A',
          type: 'class',
          parentId: 'file:src/a.ts',
          metadata: { label: 'A', path: 'src/a.ts#A' },
        },
        {
          id: 'class:B',
          type: 'class',
          parentId: 'file:src/a.ts',
          metadata: { label: 'B', path: 'src/a.ts#B' },
        },
      ],
      edges: [
        { source: 'file:src/a.ts', target: 'class:A', type: 'contains' },
        { source: 'file:src/a.ts', target: 'class:B', type: 'contains' },
        { source: 'class:A', target: 'class:B', type: 'calls' },
      ],
      metadata: { name: 'test', rootPath: '/test', languages: [] },
    }

    const graph = buildGraph(input)
    const hierarchy = buildGroupHierarchy(graph)

    // At File tier, both classes are in the same file group → internal → hidden
    const fileEdges = hierarchy.edgesByTier[SemanticTier.File]
    expect(fileEdges).toEqual([])

    // At Symbol tier, they ARE separate groups → should appear
    const symbolEdges = hierarchy.edgesByTier[SemanticTier.Symbol]
    expect(symbolEdges.length).toBe(1)
    expect(symbolEdges[0].breakdown.calls).toBe(1)
  })
})
