import { describe, it, expect } from 'vitest'
import { buildClusters } from './clusterBuilder'
import type { IVMGraph, IVMNode, Position3D } from '@diagram-builder/core'

function makeNode(
  id: string,
  opts: { path?: string; module?: string; type?: IVMNode['type']; depth?: number } = {}
): IVMNode {
  return {
    id,
    type: opts.type ?? 'file',
    position: { x: 0, y: 0, z: 0 },
    lod: 3,
    metadata: {
      label: id,
      path: opts.path ?? `src/${id}.ts`,
      properties: {
        ...(opts.module !== undefined ? { module: opts.module } : {}),
        ...(opts.depth !== undefined ? { depth: opts.depth } : {}),
      },
    },
  }
}

function makeGraph(nodes: IVMNode[]): IVMGraph {
  return {
    nodes,
    edges: [],
    metadata: {
      name: 'test',
      schemaVersion: '1.0.0',
      generatedAt: '',
      rootPath: '',
      languages: [],
      stats: {
        totalNodes: nodes.length,
        totalEdges: 0,
        nodesByType: {} as never,
        edgesByType: {} as never,
      },
    },
    bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
  }
}

function makePositions(nodes: IVMNode[], offsets: Position3D[] = []): Map<string, Position3D> {
  return new Map(nodes.map((n, i) => [n.id, offsets[i] ?? { x: i * 10, y: 0, z: 0 }]))
}

describe('buildClusters — module grouping (priority 1)', () => {
  it('groups nodes by metadata.properties.module', () => {
    const nodes = [
      makeNode('a', { module: 'auth' }),
      makeNode('b', { module: 'auth' }),
      makeNode('c', { module: 'payments' }),
    ]
    const positions = makePositions(nodes)
    const clusters = buildClusters(makeGraph(nodes), positions)

    expect(clusters.size).toBe(2)
    const auth = clusters.get('cluster:auth')
    expect(auth).toBeDefined()
    expect(auth!.nodeIds).toHaveLength(2)
    expect(auth!.label).toBe('auth (2)')
  })
})

describe('buildClusters — directory grouping (priority 2)', () => {
  it('groups nodes by parent directory when no module property', () => {
    const nodes = [
      makeNode('index', { path: 'src/auth/index.ts' }),
      makeNode('login', { path: 'src/auth/login.ts' }),
      makeNode('cart', { path: 'src/payments/cart.ts' }),
    ]
    const positions = makePositions(nodes)
    const clusters = buildClusters(makeGraph(nodes), positions)

    expect(clusters.size).toBe(2)
    const auth = clusters.get('cluster:src/auth')
    expect(auth).toBeDefined()
    expect(auth!.nodeIds).toHaveLength(2)
    expect(auth!.label).toBe('auth (2)')
  })
})

describe('buildClusters — depth-band fallback (priority 3)', () => {
  it('groups by depth bands when no path structure', () => {
    const nodes = [
      makeNode('a', { path: 'a', depth: 0 }),
      makeNode('b', { path: 'b', depth: 1 }),
      makeNode('c', { path: 'c', depth: 3 }),
      makeNode('d', { path: 'd', depth: 4 }),
    ]
    const positions = makePositions(nodes)
    const clusters = buildClusters(makeGraph(nodes), positions)

    // depth 0–1 = band 0, depth 2–3 = band 1, depth 4–5 = band 2
    expect(clusters.size).toBe(3)
  })
})

describe('buildClusters — centroid and radius', () => {
  it('centroid is the average of member positions', () => {
    const nodes = [makeNode('a', { module: 'grp' }), makeNode('b', { module: 'grp' })]
    const positions = new Map<string, Position3D>([
      ['a', { x: 0, y: 0, z: 0 }],
      ['b', { x: 10, y: 0, z: 0 }],
    ])
    const clusters = buildClusters(makeGraph(nodes), positions)
    const grp = clusters.get('cluster:grp')!
    expect(grp.centroid.x).toBeCloseTo(5)
    expect(grp.centroid.y).toBeCloseTo(0)
    expect(grp.centroid.z).toBeCloseTo(0)
  })

  it('radius is the max distance from centroid to any member', () => {
    const nodes = [makeNode('a', { module: 'grp' }), makeNode('b', { module: 'grp' })]
    const positions = new Map<string, Position3D>([
      ['a', { x: 0, y: 0, z: 0 }],
      ['b', { x: 10, y: 0, z: 0 }],
    ])
    const clusters = buildClusters(makeGraph(nodes), positions)
    const grp = clusters.get('cluster:grp')!
    // centroid = {5,0,0}, max dist = 5
    expect(grp.radius).toBeCloseTo(5)
  })
})

describe('buildClusters — dominantType', () => {
  it('dominantType is the most common node type in the cluster', () => {
    const nodes = [
      makeNode('a', { module: 'grp', type: 'file' }),
      makeNode('b', { module: 'grp', type: 'file' }),
      makeNode('c', { module: 'grp', type: 'class' }),
    ]
    const positions = makePositions(nodes)
    const clusters = buildClusters(makeGraph(nodes), positions)
    const grp = clusters.get('cluster:grp')!
    expect(grp.dominantType).toBe('file')
  })
})

describe('buildClusters — single node', () => {
  it('creates a cluster for a single-node module', () => {
    const nodes = [makeNode('only', { module: 'solo' })]
    const positions = makePositions(nodes)
    const clusters = buildClusters(makeGraph(nodes), positions)
    expect(clusters.size).toBe(1)
    expect(clusters.get('cluster:solo')!.nodeIds).toHaveLength(1)
    expect(clusters.get('cluster:solo')!.radius).toBe(0)
  })
})
