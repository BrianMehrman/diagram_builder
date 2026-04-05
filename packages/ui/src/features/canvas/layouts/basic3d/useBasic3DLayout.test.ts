/**
 * useBasic3DLayout Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../../../../lib/telemetry', () => ({
  withSpan: vi.fn((_name: string, _attrs: unknown, fn: (span: unknown) => unknown) =>
    fn({ end: vi.fn(), setAttributes: vi.fn(), setStatus: vi.fn() })
  ),
  getTracer: vi.fn(),
}))
import { renderHook, act } from '@testing-library/react'
import { useBasic3DLayout } from './useBasic3DLayout'
import { useCanvasStore } from '../../store'
import { SemanticTier } from '@diagram-builder/core'
import type { IVMGraph, ViewResolver } from '@diagram-builder/core'
import type { Position3D } from '../../../../shared/types'

// ---------------------------------------------------------------------------
// Shared empty graph
// ---------------------------------------------------------------------------

const emptyGraph: IVMGraph = {
  nodes: [],
  edges: [],
  metadata: {
    name: '',
    schemaVersion: '1.0.0',
    generatedAt: '',
    rootPath: '',
    languages: [],
    stats: {
      totalNodes: 0,
      totalEdges: 0,
      nodesByType: {} as Record<string, number>,
      edgesByType: {} as Record<string, number>,
    },
  },
  bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
}

// ---------------------------------------------------------------------------
// Mock buildRadialTree
// ---------------------------------------------------------------------------

const mockRadialPositions = new Map<string, Position3D>()
let mockMaxDepth = 0

vi.mock('./radialTree', () => ({
  buildRadialTree: vi.fn((_graph: IVMGraph) => ({
    positions: mockRadialPositions,
    bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
    maxDepth: mockMaxDepth,
  })),
}))

// ---------------------------------------------------------------------------
// Mock resolver factory
// ---------------------------------------------------------------------------

function makeMockResolver(graph = emptyGraph): ViewResolver {
  return {
    getTier: vi.fn((_tier: SemanticTier) => graph),
    getView: vi.fn((_config: unknown) => ({ graph })),
  } as unknown as ViewResolver
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useBasic3DLayout LOD dispatch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCanvasStore.getState().reset()
    mockRadialPositions.clear()
    mockMaxDepth = 0
  })

  it('LOD 1 calls getTier(SemanticTier.Symbol)', () => {
    const resolver = makeMockResolver()
    useCanvasStore.setState({ resolver, lodLevel: 1 })

    renderHook(() => useBasic3DLayout())

    expect(resolver.getTier).toHaveBeenCalledWith(SemanticTier.Symbol)
    expect(resolver.getView).not.toHaveBeenCalled()
  })

  it('LOD 2 calls getTier(SemanticTier.Symbol)', () => {
    const resolver = makeMockResolver()
    useCanvasStore.setState({ resolver, lodLevel: 2 })

    renderHook(() => useBasic3DLayout())

    expect(resolver.getTier).toHaveBeenCalledWith(SemanticTier.Symbol)
    expect(resolver.getView).not.toHaveBeenCalled()
  })

  it('LOD 3 calls getTier(SemanticTier.Symbol)', () => {
    const resolver = makeMockResolver()
    useCanvasStore.setState({ resolver, lodLevel: 3 })

    renderHook(() => useBasic3DLayout())

    expect(resolver.getTier).toHaveBeenCalledWith(SemanticTier.Symbol)
    expect(resolver.getView).not.toHaveBeenCalled()
  })

  it('LOD 4 with selectedNodeId calls getView with focalNodeId', () => {
    const resolver = makeMockResolver()
    useCanvasStore.setState({ resolver, lodLevel: 4, selectedNodeId: 'node-1' })

    renderHook(() => useBasic3DLayout())

    expect(resolver.getView).toHaveBeenCalledWith({
      baseTier: SemanticTier.Symbol,
      focalNodeId: 'node-1',
    })
    expect(resolver.getTier).not.toHaveBeenCalled()
  })

  it('LOD 4 without selectedNodeId falls back to getTier(Symbol)', () => {
    const resolver = makeMockResolver()
    useCanvasStore.setState({ resolver, lodLevel: 4, selectedNodeId: null })

    renderHook(() => useBasic3DLayout())

    expect(resolver.getTier).toHaveBeenCalledWith(SemanticTier.Symbol)
    expect(resolver.getView).not.toHaveBeenCalled()
  })
})

describe('useBasic3DLayout null resolver', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCanvasStore.getState().reset()
    mockRadialPositions.clear()
    mockMaxDepth = 0
  })

  it('returns empty positions when resolver is null', () => {
    useCanvasStore.setState({ resolver: null })

    const { result } = renderHook(() => useBasic3DLayout())

    expect(result.current.positions.size).toBe(0)
    expect(result.current.maxDepth).toBe(0)
  })
})

describe('useBasic3DLayout store integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCanvasStore.getState().reset()
    mockRadialPositions.clear()
    mockMaxDepth = 0
  })

  it('setLayoutPositions is called with positions after computation', async () => {
    const resolver = makeMockResolver()
    // Seed some positions so setLayoutPositions is triggered
    mockRadialPositions.set('node-a', { x: 1, y: 2, z: 3 })
    useCanvasStore.setState({ resolver, lodLevel: 1 })

    await act(async () => {
      renderHook(() => useBasic3DLayout())
    })

    const stored = useCanvasStore.getState().layoutPositions
    expect(stored.get('node-a')).toEqual({ x: 1, y: 2, z: 3 })
  })

  it('returns maxDepth from buildRadialTree result', () => {
    const resolver = makeMockResolver()
    mockMaxDepth = 5
    useCanvasStore.setState({ resolver, lodLevel: 1 })

    const { result } = renderHook(() => useBasic3DLayout())

    expect(result.current.maxDepth).toBe(5)
  })
})

describe('useBasic3DLayout nearestNodeId', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    useCanvasStore.getState().reset()
    mockRadialPositions.clear()
    mockMaxDepth = 0
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('unmount resets nearestNodeId to null', () => {
    const resolver = makeMockResolver()
    useCanvasStore.setState({ resolver, lodLevel: 1 })

    const { unmount } = renderHook(() => useBasic3DLayout())

    // Set a non-null value to verify cleanup resets it
    useCanvasStore.setState({ nearestNodeId: 'some-node' })

    unmount()

    expect(useCanvasStore.getState().nearestNodeId).toBeNull()
  })

  it('computes nearest node to camera after debounce', () => {
    const resolver = makeMockResolver()
    mockRadialPositions.set('node-near', { x: 1, y: 0, z: 0 })
    mockRadialPositions.set('node-far', { x: 100, y: 0, z: 0 })

    useCanvasStore.setState({
      resolver,
      lodLevel: 1,
      camera: { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, zoom: 1 },
    })

    renderHook(() => useBasic3DLayout())

    vi.advanceTimersByTime(250)

    expect(useCanvasStore.getState().nearestNodeId).toBe('node-near')
  })
})

// ---------------------------------------------------------------------------
// Telemetry instrumentation
// ---------------------------------------------------------------------------

describe('useBasic3DLayout telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCanvasStore.getState().reset()
  })

  it('emits ui.layout.compute span with node_count when layout runs', async () => {
    const telemetry = await import('../../../../lib/telemetry')
    const resolver = makeMockResolver()
    useCanvasStore.setState({ resolver, lodLevel: 1 })

    renderHook(() => useBasic3DLayout())

    expect(telemetry.withSpan).toHaveBeenCalledWith(
      'ui.layout.compute',
      expect.objectContaining({ node_count: expect.any(Number) }),
      expect.any(Function)
    )
  })
})
