/**
 * useCityFiltering Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { SemanticTier, createViewResolver } from '@diagram-builder/core'
import type { ParseResult, GroupNode } from '@diagram-builder/core'
import { useCityFiltering } from './useCityFiltering'
import { useCanvasStore } from '../../store'
import type { IVMGraph, IVMNode, IVMEdge, Position3D } from '../../../../shared/types'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../../layout/engines/clusterUtils', () => ({
  shouldCluster: (count: number, threshold: number) => count > threshold,
  createClusterMetadata: (
    districtId: string,
    nodeIds: string[],
    _positions: Map<string, Position3D>
  ) => ({
    districtId,
    nodeIds,
    nodeCount: nodeIds.length,
    center: { x: 0, y: 0, z: 0 },
    size: { width: 10, depth: 10, height: 5 },
  }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createNode(
  id: string,
  type: IVMNode['type'] = 'file',
  dir = 'src/features',
  opts: { parentId?: string; isExternal?: boolean; path?: string } = {}
): IVMNode {
  return {
    id,
    type,
    metadata: {
      label: id,
      path: opts.path ?? (dir ? `${dir}/${id}.ts` : `${id}.ts`),
      properties: { isExternal: opts.isExternal ?? false, depth: 1 },
    },
    lod: 3,
    position: { x: 0, y: 0, z: 0 },
    parentId: opts.parentId,
  }
}

function createEdge(source: string, target: string, type: IVMEdge['type'] = 'imports'): IVMEdge {
  return {
    id: `${source}--${type}--${target}`,
    source,
    target,
    type,
    metadata: {},
    lod: 0,
  }
}

function makeGraph(nodes: IVMNode[], edges: IVMEdge[] = []): IVMGraph {
  return {
    nodes,
    edges,
    metadata: {
      name: 'T',
      schemaVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      rootPath: 'src/',
      stats: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        nodesByType: {} as never,
        edgesByType: {} as never,
      },
      languages: [],
    },
    bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
  }
}

function buildPositions(nodes: IVMNode[]): Map<string, Position3D> {
  const positions = new Map<string, Position3D>()
  nodes.forEach((n, i) => {
    positions.set(n.id, { x: i * 5, y: 0, z: i * 3 })
  })
  return positions
}

/**
 * Build a minimal ParseResult with one Module-tier group per unique groupId provided.
 * Each group entry maps groupId → nodeIds that belong to it.
 */
function buildParseResult(
  nodes: IVMNode[],
  edges: IVMEdge[] = [],
  groups: Array<{ id: string; label: string; nodeIds: string[] }> = []
): ParseResult {
  const graph = makeGraph(nodes, edges)
  const root: GroupNode = {
    id: 'group:root',
    label: 'root',
    tier: SemanticTier.Repository,
    nodeIds: [],
    children: groups.map((g) => ({
      id: g.id,
      label: g.label,
      tier: SemanticTier.Module,
      nodeIds: g.nodeIds,
      children: [],
    })),
  }
  const hierarchy = {
    root,
    tierCount: {} as Record<SemanticTier, number>,
    edgesByTier: {} as Record<SemanticTier, never[]>,
  }
  const tiers = {
    [SemanticTier.Repository]: graph,
    [SemanticTier.Package]: graph,
    [SemanticTier.Module]: graph,
    [SemanticTier.File]: graph,
    [SemanticTier.Symbol]: graph,
    [SemanticTier.Detail]: graph,
  } as Record<SemanticTier, IVMGraph>
  return { graph, hierarchy, tiers }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useCityFiltering', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset()
    // reset() does not clear parseResult — clear it explicitly so tests are isolated
    useCanvasStore.setState({ parseResult: null, resolver: null })
  })

  describe('internal/external split', () => {
    it('separates internal and external nodes', () => {
      const nodes = [
        createNode('a', 'file'),
        createNode('b', 'class'),
        createNode('ext', 'file', 'node_modules/lodash', { isExternal: true }),
      ]
      const graph = makeGraph(nodes)
      const positions = buildPositions(nodes)

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      expect(result.current.internalNodes).toHaveLength(2)
      expect(result.current.externalNodes).toHaveLength(1)
      expect(result.current.externalNodes[0]!.id).toBe('ext')
    })
  })

  describe('district grouping', () => {
    it('groups nodes by GroupHierarchy Module groups', () => {
      const nodes = [
        createNode('a', 'file', 'src/features'),
        createNode('b', 'file', 'src/features'),
        createNode('c', 'file', 'src/utils'),
      ]
      const parseResult = buildParseResult(
        nodes,
        [],
        [
          { id: 'group:features', label: 'features', nodeIds: ['a', 'b'] },
          { id: 'group:utils', label: 'utils', nodeIds: ['c'] },
        ]
      )
      useCanvasStore.setState({ parseResult, resolver: createViewResolver(parseResult) })
      const graph = makeGraph(nodes)
      const positions = buildPositions(nodes)

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      expect(result.current.districtGroups.get('group:features')).toHaveLength(2)
      expect(result.current.districtGroups.get('group:utils')).toHaveLength(1)
    })

    it('returns empty districtGroups when no parseResult is set', () => {
      const nodes = [createNode('a', 'file', '', { path: 'index.ts' })]
      const graph = makeGraph(nodes)
      const positions = buildPositions(nodes)

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      expect(result.current.districtGroups.size).toBe(0)
    })

    it('district keys start with group: prefix', () => {
      const nodes = [createNode('a', 'file', 'src/features'), createNode('b', 'file', 'src/utils')]
      const parseResult = buildParseResult(
        nodes,
        [],
        [
          { id: 'group:features', label: 'features', nodeIds: ['a'] },
          { id: 'group:utils', label: 'utils', nodeIds: ['b'] },
        ]
      )
      useCanvasStore.setState({ parseResult, resolver: createViewResolver(parseResult) })
      const graph = makeGraph(nodes)
      const positions = buildPositions(nodes)

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      const districtKeys = Array.from(result.current.districtGroups.keys())
      expect(districtKeys.every((k) => k.startsWith('group:'))).toBe(true)
    })
  })

  describe('clustering at LOD 1', () => {
    it('creates clusters for large districts at LOD 1', () => {
      useCanvasStore.getState().setLodLevel(1)

      const nodes: IVMNode[] = []
      for (let i = 0; i < 25; i++) {
        nodes.push(createNode(`n-${i}`, 'file', 'src/big'))
      }
      const nodeIds = nodes.map((n) => n.id)
      const parseResult = buildParseResult(nodes, [], [{ id: 'group:big', label: 'big', nodeIds }])
      useCanvasStore.setState((s) => ({
        ...s,
        parseResult,
        resolver: createViewResolver(parseResult),
      }))
      const graph = makeGraph(nodes)
      const positions = buildPositions(nodes)

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      expect(result.current.clusters).toHaveLength(1)
      expect(result.current.clusters[0]!.districtId).toBe('group:big')
      expect(result.current.clusteredNodeIds.size).toBe(25)
    })

    it('does not cluster at LOD 2+', () => {
      useCanvasStore.getState().setLodLevel(2)

      const nodes: IVMNode[] = []
      for (let i = 0; i < 25; i++) {
        nodes.push(createNode(`n-${i}`, 'file', 'src/big'))
      }
      const nodeIds = nodes.map((n) => n.id)
      const parseResult = buildParseResult(nodes, [], [{ id: 'group:big', label: 'big', nodeIds }])
      useCanvasStore.setState((s) => ({
        ...s,
        parseResult,
        resolver: createViewResolver(parseResult),
      }))
      const graph = makeGraph(nodes)
      const positions = buildPositions(nodes)

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      expect(result.current.clusters).toHaveLength(0)
      expect(result.current.clusteredNodeIds.size).toBe(0)
    })

    it('only counts file nodes toward the clustering threshold', () => {
      useCanvasStore.getState().setLodLevel(1)

      // 5 files (below threshold of 20) + 20 classes — classes must not trigger clustering
      const nodes: IVMNode[] = []
      for (let i = 0; i < 5; i++) {
        nodes.push(createNode(`file-${i}`, 'file', 'src/big'))
      }
      for (let i = 0; i < 20; i++) {
        nodes.push(createNode(`class-${i}`, 'class', 'src/big', { parentId: `file-${i % 5}` }))
      }
      // Only file nodes are in the group nodeIds for fileDistrictGroups filtering
      const fileIds = nodes.filter((n) => n.type === 'file').map((n) => n.id)
      const allIds = nodes.map((n) => n.id)
      const parseResult = buildParseResult(
        nodes,
        [],
        [{ id: 'group:big', label: 'big', nodeIds: allIds }]
      )
      useCanvasStore.setState((s) => ({
        ...s,
        parseResult,
        resolver: createViewResolver(parseResult),
      }))
      const graph = makeGraph(nodes)
      const positions = buildPositions(nodes)

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      // fileDistrictGroups only has 5 file nodes (below threshold 20) → no cluster
      expect(result.current.clusters).toHaveLength(0)
      expect(result.current.clusteredNodeIds.size).toBe(0)

      // Suppress unused variable lint
      void fileIds
    })

    it('also hides child nodes of clustered files', () => {
      useCanvasStore.getState().setLodLevel(1)

      const nodes: IVMNode[] = []
      // 25 file nodes — triggers clustering
      for (let i = 0; i < 25; i++) {
        nodes.push(createNode(`file-${i}`, 'file', 'src/big'))
      }
      // 5 classes as children of file-0
      for (let i = 0; i < 5; i++) {
        nodes.push(createNode(`class-${i}`, 'class', 'src/big', { parentId: 'file-0' }))
      }
      // 2 methods as grandchildren (children of class-0)
      for (let i = 0; i < 2; i++) {
        nodes.push(createNode(`method-${i}`, 'method', 'src/big', { parentId: 'class-0' }))
      }
      const allIds = nodes.map((n) => n.id)
      const parseResult = buildParseResult(
        nodes,
        [],
        [{ id: 'group:big', label: 'big', nodeIds: allIds }]
      )
      useCanvasStore.setState((s) => ({
        ...s,
        parseResult,
        resolver: createViewResolver(parseResult),
      }))
      const graph = makeGraph(nodes)
      const positions = buildPositions(nodes)

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      // 25 files + 5 classes + 2 methods = 32 hidden nodes
      expect(result.current.clusteredNodeIds.size).toBe(32)
    })

    it('does not cluster small districts', () => {
      useCanvasStore.getState().setLodLevel(1)

      const nodes = [createNode('a', 'file', 'src/small'), createNode('b', 'file', 'src/small')]
      const parseResult = buildParseResult(
        nodes,
        [],
        [{ id: 'group:small', label: 'small', nodeIds: ['a', 'b'] }]
      )
      useCanvasStore.setState((s) => ({
        ...s,
        parseResult,
        resolver: createViewResolver(parseResult),
      }))
      const graph = makeGraph(nodes)
      const positions = buildPositions(nodes)

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      expect(result.current.clusters).toHaveLength(0)
    })
  })

  describe('childrenByFile (x-ray)', () => {
    it('returns empty map when x-ray is off', () => {
      // x-ray is off by default
      const nodes = [
        createNode('file-1', 'file'),
        createNode('class-1', 'class', 'src/features', { parentId: 'file-1' }),
      ]
      const graph = makeGraph(nodes)
      const positions = buildPositions(nodes)

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      expect(result.current.childrenByFile.size).toBe(0)
    })

    it('builds parent→children map when x-ray is on', () => {
      useCanvasStore.getState().toggleXRay()

      const nodes = [
        createNode('file-1', 'file'),
        createNode('class-1', 'class', 'src/features', { parentId: 'file-1' }),
        createNode('func-1', 'function', 'src/features', { parentId: 'file-1' }),
      ]
      const graph = makeGraph(nodes)
      const positions = buildPositions(nodes)

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      expect(result.current.childrenByFile.get('file-1')).toHaveLength(2)
    })
  })

  describe('nodeMap', () => {
    it('maps every node by id', () => {
      const nodes = [createNode('a', 'file'), createNode('b', 'class')]
      const graph = makeGraph(nodes)
      const positions = buildPositions(nodes)

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      expect(result.current.nodeMap.size).toBe(2)
      expect(result.current.nodeMap.get('a')!.type).toBe('file')
    })
  })

  describe('visibleEdges', () => {
    it('includes imports edges with both endpoints positioned', () => {
      useCanvasStore.getState().setCityVersion('v1')
      const nodes = [createNode('a'), createNode('b')]
      const graph = makeGraph(nodes, [createEdge('a', 'b', 'imports')])
      const positions = buildPositions(nodes)

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      expect(result.current.visibleEdges).toHaveLength(1)
    })

    it('filters out contains edges', () => {
      const nodes = [createNode('a'), createNode('b')]
      const graph = makeGraph(nodes, [createEdge('a', 'b', 'contains')])
      const positions = buildPositions(nodes)

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      expect(result.current.visibleEdges).toHaveLength(0)
    })

    it('filters out edges without positioned endpoints', () => {
      const nodes = [createNode('a'), createNode('b')]
      const graph = makeGraph(nodes, [createEdge('a', 'b', 'imports')])
      // Only position node 'a'
      const positions = new Map<string, Position3D>()
      positions.set('a', { x: 0, y: 0, z: 0 })

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      expect(result.current.visibleEdges).toHaveLength(0)
    })

    it('includes depends_on and calls edges', () => {
      useCanvasStore.getState().setCityVersion('v1')
      const nodes = [createNode('a'), createNode('b'), createNode('c')]
      const graph = makeGraph(nodes, [
        createEdge('a', 'b', 'depends_on'),
        createEdge('b', 'c', 'calls'),
      ])
      const positions = buildPositions(nodes)

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      expect(result.current.visibleEdges).toHaveLength(2)
    })

    it('includes extends edges', () => {
      const nodes = [createNode('a', 'file', 'src/models'), createNode('b', 'file', 'src/services')]
      const graph = makeGraph(nodes, [createEdge('a', 'b', 'extends')])
      const positions = buildPositions(nodes)

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      expect(result.current.visibleEdges).toHaveLength(1)
    })

    it('uses extends not inherits in edge type allowlist', () => {
      const nodes = [createNode('a', 'file', 'src/models'), createNode('b', 'file', 'src/services')]
      const graph = makeGraph(nodes, [
        createEdge('a', 'b', 'extends'),
        createEdge('a', 'b', 'imports'),
      ])
      const positions = buildPositions(nodes)

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      const edgeTypes = result.current.visibleEdges.map((e) => e.type)
      expect(edgeTypes).toContain('extends')
      expect(edgeTypes).not.toContain('inherits')
    })
  })

  describe('visibleEdges — city-v2 cross-district filtering', () => {
    function buildV2ParseResult(nodeA: IVMNode, nodeB: IVMNode, sameGroup: boolean): ParseResult {
      const nodes = [nodeA, nodeB]
      if (sameGroup) {
        return buildParseResult(
          nodes,
          [],
          [{ id: 'group:features', label: 'features', nodeIds: [nodeA.id, nodeB.id] }]
        )
      }
      return buildParseResult(
        nodes,
        [],
        [
          { id: 'group:features', label: 'features', nodeIds: [nodeA.id] },
          { id: 'group:utils', label: 'utils', nodeIds: [nodeB.id] },
        ]
      )
    }

    it('hides intra-district imports in v2 mode', () => {
      useCanvasStore.getState().setCityVersion('v2')

      // Both nodes in same Module group
      const nodeA = createNode('a', 'file', 'src/features')
      const nodeB = createNode('b', 'file', 'src/features')
      const parseResult = buildV2ParseResult(nodeA, nodeB, true)
      useCanvasStore.setState((s) => ({
        ...s,
        parseResult,
        resolver: createViewResolver(parseResult),
      }))

      const graph = makeGraph([nodeA, nodeB], [createEdge('a', 'b', 'imports')])
      const positions = buildPositions([nodeA, nodeB])

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      expect(result.current.visibleEdges).toHaveLength(0)
    })

    it('shows cross-district imports in v2 mode', () => {
      useCanvasStore.getState().setCityVersion('v2')

      // Nodes in different Module groups
      const nodeA = createNode('a', 'file', 'src/features')
      const nodeB = createNode('b', 'file', 'src/utils')
      const parseResult = buildV2ParseResult(nodeA, nodeB, false)
      useCanvasStore.setState((s) => ({
        ...s,
        parseResult,
        resolver: createViewResolver(parseResult),
      }))

      const graph = makeGraph([nodeA, nodeB], [createEdge('a', 'b', 'imports')])
      const positions = buildPositions([nodeA, nodeB])

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      expect(result.current.visibleEdges).toHaveLength(1)
    })

    it('shows all edges in v1 mode regardless of district', () => {
      useCanvasStore.getState().setCityVersion('v1')
      const nodes = [
        createNode('a', 'file', 'src/features'),
        createNode('b', 'file', 'src/features'),
      ]
      const graph = makeGraph(nodes, [createEdge('a', 'b', 'imports')])
      const positions = buildPositions(nodes)

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      expect(result.current.visibleEdges).toHaveLength(1)
    })

    it('still hides contains edges in v2 mode', () => {
      useCanvasStore.getState().setCityVersion('v2')

      const nodeA = createNode('a', 'file', 'src/features')
      const nodeB = createNode('b', 'file', 'src/utils')
      const parseResult = buildV2ParseResult(nodeA, nodeB, false)
      useCanvasStore.setState((s) => ({
        ...s,
        parseResult,
        resolver: createViewResolver(parseResult),
      }))

      const graph = makeGraph([nodeA, nodeB], [createEdge('a', 'b', 'contains')])
      const positions = buildPositions([nodeA, nodeB])

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      expect(result.current.visibleEdges).toHaveLength(0)
    })

    it('hides intra-district depends_on and calls in v2 mode', () => {
      useCanvasStore.getState().setCityVersion('v2')

      const nodeA = createNode('a', 'file', 'src/features')
      const nodeB = createNode('b', 'file', 'src/features')
      const nodeC = createNode('c', 'file', 'src/features')
      const parseResult = buildParseResult(
        [nodeA, nodeB, nodeC],
        [],
        [{ id: 'group:features', label: 'features', nodeIds: ['a', 'b', 'c'] }]
      )
      useCanvasStore.setState((s) => ({
        ...s,
        parseResult,
        resolver: createViewResolver(parseResult),
      }))

      const graph = makeGraph(
        [nodeA, nodeB, nodeC],
        [createEdge('a', 'b', 'depends_on'), createEdge('b', 'c', 'calls')]
      )
      const positions = buildPositions([nodeA, nodeB, nodeC])

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      expect(result.current.visibleEdges).toHaveLength(0)
    })

    it('keeps cross-district extends in v2 mode', () => {
      useCanvasStore.getState().setCityVersion('v2')

      const nodeA = createNode('a', 'file', 'src/models')
      const nodeB = createNode('b', 'file', 'src/services')
      const parseResult = buildV2ParseResult(nodeA, nodeB, false)
      useCanvasStore.setState((s) => ({
        ...s,
        parseResult,
        resolver: createViewResolver(parseResult),
      }))

      const graph = makeGraph([nodeA, nodeB], [createEdge('a', 'b', 'extends')])
      const positions = buildPositions([nodeA, nodeB])

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      expect(result.current.visibleEdges).toHaveLength(1)
    })
  })

  describe('GroupHierarchy-based district grouping', () => {
    it('sources district groups from GroupHierarchy at Module tier, not path strings', () => {
      const nodeA = createNode('file:a', 'file', 'src/mod1')
      const nodeB = createNode('file:b', 'file', 'src/mod1')
      const parseResult = buildParseResult(
        [nodeA, nodeB],
        [],
        [{ id: 'group:mod1', label: 'mod1', nodeIds: ['file:a', 'file:b'] }]
      )
      useCanvasStore.setState({ parseResult, resolver: createViewResolver(parseResult) })

      const graph = makeGraph([nodeA, nodeB])
      const positions = buildPositions([nodeA, nodeB])

      const { result } = renderHook(() => useCityFiltering(graph, positions))

      const districtKeys = Array.from(result.current.districtGroups.keys())
      expect(districtKeys.every((k) => k.startsWith('group:'))).toBe(true)
    })
  })
})
