/**
 * radialTree.test.ts
 *
 * Tests for the buildRadialTree BFS layout algorithm.
 */

import { describe, it, expect } from 'vitest'
import { buildRadialTree } from './radialTree'
import type { IVMGraph, IVMNode, IVMEdge } from '@diagram-builder/core'

// =============================================================================
// Test fixture helpers
// =============================================================================

function makeNode(
  id: string,
  overrides: Partial<IVMNode> = {},
  depth?: number
): IVMNode {
  return {
    id,
    type: 'module',
    position: { x: 0, y: 0, z: 0 },
    lod: 3,
    metadata: {
      label: id,
      path: `/${id}`,
      properties: depth !== undefined ? { depth } : undefined,
    },
    ...overrides,
  }
}

function makeEdge(source: string, target: string, idx: number): IVMEdge {
  return {
    id: `e${idx}`,
    source,
    target,
    type: 'imports',
    lod: 3,
    metadata: {},
  }
}

function makeGraph(nodes: IVMNode[], edges: IVMEdge[]): IVMGraph {
  return {
    nodes,
    edges,
    metadata: {
      name: 'test',
      schemaVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      rootPath: '/',
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        nodesByType: {} as IVMGraph['metadata']['stats']['nodesByType'],
        edgesByType: {} as IVMGraph['metadata']['stats']['edgesByType'],
      },
      languages: [],
    },
    bounds: {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 },
    },
  }
}

const DEFAULT_OPTIONS = { depthSpacing: 30, rootRadius: 5 }

// =============================================================================
// Tests
// =============================================================================

describe('buildRadialTree', () => {
  it('returns empty positions and maxDepth 0 for an empty graph', () => {
    const graph = makeGraph([], [])
    const result = buildRadialTree(graph, DEFAULT_OPTIONS)

    expect(result.positions.size).toBe(0)
    expect(result.maxDepth).toBe(0)
    expect(result.bounds.min).toEqual({ x: 0, y: 0, z: 0 })
    expect(result.bounds.max).toEqual({ x: 0, y: 0, z: 0 })
  })

  it('places a single node near origin with maxDepth 0', () => {
    const graph = makeGraph([makeNode('a', {}, 0)], [])
    const result = buildRadialTree(graph, DEFAULT_OPTIONS)

    expect(result.positions.size).toBe(1)
    expect(result.maxDepth).toBe(0)

    const pos = result.positions.get('a')!
    const dist = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2)
    // Should be placed on or near the rootRadius shell
    expect(dist).toBeCloseTo(DEFAULT_OPTIONS.rootRadius, 1)
  })

  it('places entry nodes (depth===0 property) at the root radius shell', () => {
    const graph = makeGraph(
      [makeNode('root', {}, 0), makeNode('child')],
      [makeEdge('root', 'child', 0)]
    )
    const result = buildRadialTree(graph, DEFAULT_OPTIONS)

    const rootPos = result.positions.get('root')!
    const dist = Math.sqrt(rootPos.x ** 2 + rootPos.y ** 2 + rootPos.z ** 2)
    expect(dist).toBeCloseTo(DEFAULT_OPTIONS.rootRadius, 1)
  })

  it('assigns BFS depth: child at depth 1, grandchild at depth 2', () => {
    const graph = makeGraph(
      [makeNode('root', {}, 0), makeNode('child'), makeNode('grandchild')],
      [makeEdge('root', 'child', 0), makeEdge('child', 'grandchild', 1)]
    )
    const result = buildRadialTree(graph, DEFAULT_OPTIONS)

    expect(result.maxDepth).toBe(2)
    expect(result.positions.size).toBe(3)

    const rootPos = result.positions.get('root')!
    const childPos = result.positions.get('child')!
    const grandPos = result.positions.get('grandchild')!

    const rootDist = Math.sqrt(rootPos.x ** 2 + rootPos.y ** 2 + rootPos.z ** 2)
    const childDist = Math.sqrt(childPos.x ** 2 + childPos.y ** 2 + childPos.z ** 2)
    const grandDist = Math.sqrt(grandPos.x ** 2 + grandPos.y ** 2 + grandPos.z ** 2)

    // root at rootRadius, child at rootRadius + 1*depthSpacing, grand at rootRadius + 2*depthSpacing
    expect(rootDist).toBeCloseTo(DEFAULT_OPTIONS.rootRadius, 1)
    expect(childDist).toBeCloseTo(
      DEFAULT_OPTIONS.rootRadius + DEFAULT_OPTIONS.depthSpacing,
      1
    )
    expect(grandDist).toBeCloseTo(
      DEFAULT_OPTIONS.rootRadius + 2 * DEFAULT_OPTIONS.depthSpacing,
      1
    )
  })

  it('places multiple entry points at distinct positions using Fibonacci sampling', () => {
    const graph = makeGraph(
      [makeNode('a', {}, 0), makeNode('b', {}, 0), makeNode('c', {}, 0)],
      []
    )
    const result = buildRadialTree(graph, DEFAULT_OPTIONS)

    const posA = result.positions.get('a')!
    const posB = result.positions.get('b')!
    const posC = result.positions.get('c')!

    // All three should be distinct
    const distAB = Math.sqrt(
      (posA.x - posB.x) ** 2 + (posA.y - posB.y) ** 2 + (posA.z - posB.z) ** 2
    )
    const distBC = Math.sqrt(
      (posB.x - posC.x) ** 2 + (posB.y - posC.y) ** 2 + (posB.z - posC.z) ** 2
    )
    const distAC = Math.sqrt(
      (posA.x - posC.x) ** 2 + (posA.y - posC.y) ** 2 + (posA.z - posC.z) ** 2
    )

    expect(distAB).toBeGreaterThan(0.001)
    expect(distBC).toBeGreaterThan(0.001)
    expect(distAC).toBeGreaterThan(0.001)
  })

  it('places shared dependency near centroid of parent positions', () => {
    // A and B are both parents of C (shared dependency)
    const graph = makeGraph(
      [makeNode('a', {}, 0), makeNode('b', {}, 0), makeNode('shared')],
      [makeEdge('a', 'shared', 0), makeEdge('b', 'shared', 1)]
    )
    const result = buildRadialTree(graph, DEFAULT_OPTIONS)

    const posA = result.positions.get('a')!
    const posB = result.positions.get('b')!
    const posShared = result.positions.get('shared')!

    const centroid = {
      x: (posA.x + posB.x) / 2,
      y: (posA.y + posB.y) / 2,
      z: (posA.z + posB.z) / 2,
    }

    // Allow tolerance for jitter (depthSpacing * 0.1 = 3, so allow ~4 units)
    const tolerance = DEFAULT_OPTIONS.depthSpacing * 0.15
    expect(Math.abs(posShared.x - centroid.x)).toBeLessThan(tolerance)
    expect(Math.abs(posShared.y - centroid.y)).toBeLessThan(tolerance)
    expect(Math.abs(posShared.z - centroid.z)).toBeLessThan(tolerance)
  })

  it('is deterministic: same graph produces same positions', () => {
    const graph = makeGraph(
      [makeNode('root', {}, 0), makeNode('child'), makeNode('grandchild')],
      [makeEdge('root', 'child', 0), makeEdge('child', 'grandchild', 1)]
    )

    const result1 = buildRadialTree(graph, DEFAULT_OPTIONS)
    const result2 = buildRadialTree(graph, DEFAULT_OPTIONS)

    for (const [id, pos1] of result1.positions) {
      const pos2 = result2.positions.get(id)!
      expect(pos2).toBeDefined()
      expect(pos1.x).toBe(pos2.x)
      expect(pos1.y).toBe(pos2.y)
      expect(pos1.z).toBe(pos2.z)
    }
  })

  it('returns correct maxDepth for a 3-level graph', () => {
    const graph = makeGraph(
      [
        makeNode('root', {}, 0),
        makeNode('level1'),
        makeNode('level2'),
      ],
      [makeEdge('root', 'level1', 0), makeEdge('level1', 'level2', 1)]
    )
    const result = buildRadialTree(graph, DEFAULT_OPTIONS)
    expect(result.maxDepth).toBe(2)
  })

  it('falls back to no-incoming-edge nodes when no depth===0 metadata exists', () => {
    // No node has depth property — fall back to nodes with no incoming edges
    const graph = makeGraph(
      [makeNode('root'), makeNode('child')],
      [makeEdge('root', 'child', 0)]
    )
    const result = buildRadialTree(graph, DEFAULT_OPTIONS)

    // root has no incoming edge, so it's an entry point at rootRadius
    const rootPos = result.positions.get('root')!
    const dist = Math.sqrt(rootPos.x ** 2 + rootPos.y ** 2 + rootPos.z ** 2)
    expect(dist).toBeCloseTo(DEFAULT_OPTIONS.rootRadius, 1)
    expect(result.maxDepth).toBe(1)
  })

  it('computes correct bounds across all positions', () => {
    const graph = makeGraph(
      [makeNode('root', {}, 0), makeNode('child')],
      [makeEdge('root', 'child', 0)]
    )
    const result = buildRadialTree(graph, DEFAULT_OPTIONS)

    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity

    for (const pos of result.positions.values()) {
      minX = Math.min(minX, pos.x)
      minY = Math.min(minY, pos.y)
      minZ = Math.min(minZ, pos.z)
      maxX = Math.max(maxX, pos.x)
      maxY = Math.max(maxY, pos.y)
      maxZ = Math.max(maxZ, pos.z)
    }

    expect(result.bounds.min.x).toBeCloseTo(minX, 5)
    expect(result.bounds.min.y).toBeCloseTo(minY, 5)
    expect(result.bounds.min.z).toBeCloseTo(minZ, 5)
    expect(result.bounds.max.x).toBeCloseTo(maxX, 5)
    expect(result.bounds.max.y).toBeCloseTo(maxY, 5)
    expect(result.bounds.max.z).toBeCloseTo(maxZ, 5)
  })
})
