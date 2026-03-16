/**
 * useCityLayout Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCityLayout } from './useCityLayout'
import { useCanvasStore } from '../../store'
import { SemanticTier } from '@diagram-builder/core'
import { createViewResolver } from '@diagram-builder/core'
import type { IVMNode, IVMGraph, ParseResult } from '@diagram-builder/core'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPositions = new Map<string, { x: number; y: number; z: number }>()
const mockDistrictArcs = [
  {
    id: 'src/features',
    arcStart: 0,
    arcEnd: Math.PI,
    innerRadius: 10,
    outerRadius: 20,
    ringDepth: 1,
    nodeCount: 2,
  },
]

const mockDistricts = [
  {
    id: 'src/features',
    arc: mockDistrictArcs[0],
    blocks: [],
    isCompound: false,
  },
]

const mockExternalZones: Array<{
  zoneMetadata: { type: string; arcStart: number; arcEnd: number; nodeCount: number }
  nodes: Array<{ nodeId: string; position: { x: number; y: number; z: number } }>
}> = []

vi.mock('../../layout/engines/radialCityLayout', () => ({
  RadialCityLayoutEngine: class MockRadialCityLayoutEngine {
    layout() {
      return {
        positions: mockPositions,
        bounds: {
          min: { x: -50, y: 0, z: -50 },
          max: { x: 50, y: 20, z: 50 },
        },
        metadata: { districtArcs: mockDistrictArcs },
        districts: mockDistricts,
        externalZones: mockExternalZones,
      }
    }
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createNode(id: string, type: IVMNode['type'] = 'file'): IVMNode {
  return {
    id,
    type,
    label: id,
    metadata: { path: `src/features/${id}.ts` },
    lod: 3,
    depth: 1,
    isExternal: false,
  }
}

function createGraph(nodeCount = 3): IVMGraph {
  const nodes: IVMNode[] = []
  for (let i = 0; i < nodeCount; i++) {
    nodes.push(createNode(`node-${i}`))
  }
  return {
    nodes,
    edges: [],
    metadata: { repositoryId: 'test', name: 'Test', totalNodes: nodes.length, totalEdges: 0 },
  }
}

function buildMinimalIVMGraph(nodeOverrides: Pick<IVMNode, 'id' | 'type' | 'lod'>[]): IVMGraph {
  const nodes: IVMNode[] = nodeOverrides.map((o) => ({
    id: o.id,
    type: o.type,
    lod: o.lod,
    position: { x: 0, y: 0, z: 0 },
    metadata: { label: o.id, path: o.id, properties: {} },
  }))
  return {
    nodes,
    edges: [],
    metadata: { name: 'test', schemaVersion: '1.0.0', generatedAt: '', rootPath: '', languages: [], stats: { totalNodes: nodes.length, totalEdges: 0, nodesByType: {} as Record<string, number>, edgesByType: {} as Record<string, number> } },
    bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
  }
}

function buildMockParseResult(graph: IVMGraph): ParseResult {
  return {
    graph,
    hierarchy: { root: { id: 'group:root', label: 'root', tier: SemanticTier.Repository, nodeIds: [], children: [] }, tierCount: {} as any, edgesByTier: {} as any },
    tiers: { 0: graph, 1: graph, 2: graph, 3: graph, 4: graph, 5: graph } as any,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useCityLayout', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset()
    mockPositions.clear()
    // Set up a resolver so useCityLayout can read a graph from the store
    const graph = createGraph(3)
    const parseResult = buildMockParseResult(graph)
    const resolver = createViewResolver(parseResult)
    useCanvasStore.setState({ parseResult, resolver })
  })

  it('returns positions for all nodes', () => {
    const graph = createGraph(3)
    graph.nodes.forEach((n, i) => {
      mockPositions.set(n.id, { x: i * 5, y: 0, z: i * 3 })
    })

    const { result } = renderHook(() => useCityLayout())

    expect(result.current.positions.size).toBe(3)
    expect(result.current.positions.get('node-0')).toEqual({ x: 0, y: 0, z: 0 })
  })

  it('returns district arc metadata', () => {
    const graph = createGraph(2)
    graph.nodes.forEach((n, i) => {
      mockPositions.set(n.id, { x: i, y: 0, z: i })
    })

    const { result } = renderHook(() => useCityLayout())

    expect(result.current.districtArcs).toHaveLength(1)
    expect(result.current.districtArcs[0]!.id).toBe('src/features')
  })

  it('computes groundWidth and groundDepth from bounds', () => {
    const graph = createGraph(1)
    mockPositions.set('node-0', { x: 0, y: 0, z: 0 })

    const { result } = renderHook(() => useCityLayout())

    // bounds: min(-50,0,-50) max(50,20,50)
    expect(result.current.groundWidth).toBe(100)
    expect(result.current.groundDepth).toBe(100)
  })

  it('publishes positions to store via setLayoutPositions', () => {
    const graph = createGraph(2)
    graph.nodes.forEach((n, i) => {
      mockPositions.set(n.id, { x: i, y: 0, z: i })
    })

    renderHook(() => useCityLayout())

    const storePositions = useCanvasStore.getState().layoutPositions
    expect(storePositions.size).toBe(2)
  })

  it('returns same reference when graph and density are unchanged', () => {
    const graph = createGraph(2)
    graph.nodes.forEach((n, i) => {
      mockPositions.set(n.id, { x: i, y: 0, z: i })
    })

    const { result, rerender } = renderHook(() => useCityLayout())
    const firstPositions = result.current.positions

    rerender()
    expect(result.current.positions).toBe(firstPositions)
  })

  it('returns districtArcs as empty array when metadata has no arcs', () => {
    // Override mock to return no metadata
    const originalArcs = [...mockDistrictArcs]
    mockDistrictArcs.length = 0

    const graph = createGraph(1)
    mockPositions.set('node-0', { x: 0, y: 0, z: 0 })

    const { result } = renderHook(() => useCityLayout())

    expect(result.current.districtArcs).toEqual([])

    // Restore
    mockDistrictArcs.push(...originalArcs)
  })

  it('exposes districts from hierarchical result', () => {
    const graph = createGraph(2)
    graph.nodes.forEach((n, i) => {
      mockPositions.set(n.id, { x: i, y: 0, z: i })
    })

    const { result } = renderHook(() => useCityLayout())

    expect(result.current.districts).toBeDefined()
    expect(Array.isArray(result.current.districts)).toBe(true)
  })

  it('exposes externalZones from hierarchical result', () => {
    const graph = createGraph(1)
    mockPositions.set('node-0', { x: 0, y: 0, z: 0 })

    const { result } = renderHook(() => useCityLayout())

    expect(result.current.externalZones).toBeDefined()
    expect(Array.isArray(result.current.externalZones)).toBe(true)
  })
})

describe('useCityLayout resolver integration', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset()
    mockPositions.clear()
  })

  it('uses resolver.getTier(SemanticTier.File) for layout when resolver is set', () => {
    const fileTierGraph = buildMinimalIVMGraph([
      { id: 'file:a', type: 'file', lod: SemanticTier.File },
      { id: 'file:b', type: 'file', lod: SemanticTier.File },
    ])
    const mockParseResult = buildMockParseResult(fileTierGraph)
    const resolver = createViewResolver(mockParseResult)

    useCanvasStore.setState({ parseResult: mockParseResult, resolver })

    fileTierGraph.nodes.forEach((n, i) => {
      mockPositions.set(n.id, { x: i * 5, y: 0, z: i * 3 })
    })

    const { result } = renderHook(() => useCityLayout())

    expect(result.current.positions.size).toBe(2)
  })

  it('returns empty layout when resolver is null', () => {
    useCanvasStore.setState({ resolver: null })
    const { result } = renderHook(() => useCityLayout())
    expect(result.current.positions.size).toBe(0)
  })
})
