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
// Shared graph with nodes (for tests that need Worker to be spawned)
// ---------------------------------------------------------------------------

const graphWithNodes: IVMGraph = {
  nodes: [
    {
      id: 'node-a',
      type: 'function' as import('@diagram-builder/core').NodeType,
      label: 'nodeA',
      metadata: { filePath: 'a.ts', language: 'typescript', properties: {} },
      position: { x: 0, y: 0, z: 0 },
    },
  ],
  edges: [],
  metadata: {
    name: '',
    schemaVersion: '1.0.0',
    generatedAt: '',
    rootPath: '',
    languages: [],
    stats: {
      totalNodes: 1,
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

  it('LOD 4 with selectedNodeId calls getTier(Symbol) — focal subgraph not active below LOD 5', () => {
    const resolver = makeMockResolver()
    useCanvasStore.setState({ resolver, lodLevel: 4, selectedNodeId: 'node-1' })

    renderHook(() => useBasic3DLayout())

    expect(resolver.getTier).toHaveBeenCalledWith(SemanticTier.Symbol)
    expect(resolver.getView).not.toHaveBeenCalled()
  })

  it('LOD 5 with selectedNodeId calls getView with focalNodeId', () => {
    const resolver = makeMockResolver()
    useCanvasStore.setState({ resolver, lodLevel: 5, selectedNodeId: 'node-1' })

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

  it('LOD 5 without selectedNodeId falls back to getTier(Symbol)', () => {
    const resolver = makeMockResolver()
    useCanvasStore.setState({ resolver, lodLevel: 5, selectedNodeId: null })

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
    vi.stubGlobal('Worker', MockWorkerConstructor)
    useCanvasStore.getState().reset()
    mockRadialPositions.clear()
    mockMaxDepth = 0
    mockWorkerInstance = null
  })

  it('setLayoutPositions is called with positions after computation', async () => {
    const resolver = makeMockResolver(graphWithNodes)
    useCanvasStore.setState({ resolver, lodLevel: 1 })

    await act(async () => {
      renderHook(() => useBasic3DLayout())
    })

    // Simulate Worker sending LAYOUT_BATCH with positions
    await act(async () => {
      mockWorkerInstance?.simulateMessage({
        type: 'LAYOUT_BATCH',
        positions: [{ id: 'node-a', position: { x: 1, y: 2, z: 3 } }],
        totalNodes: 1,
      })
    })

    const stored = useCanvasStore.getState().layoutPositions
    expect(stored.get('node-a')).toEqual({ x: 1, y: 2, z: 3 })
  })

  it('returns maxDepth from buildRadialTree result', async () => {
    const resolver = makeMockResolver(graphWithNodes)
    useCanvasStore.setState({ resolver, lodLevel: 1 })

    let result: { current: ReturnType<typeof useBasic3DLayout> }
    await act(async () => {
      const hook = renderHook(() => useBasic3DLayout())
      result = hook.result
    })

    // Simulate Worker completing with maxDepth
    await act(async () => {
      mockWorkerInstance?.simulateMessage({
        type: 'LAYOUT_COMPLETE',
        bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
        maxDepth: 5,
      })
    })

    expect(result!.current.maxDepth).toBe(5)
  })
})

describe('useBasic3DLayout nearestNodeId', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    vi.stubGlobal('Worker', MockWorkerConstructor)
    useCanvasStore.getState().reset()
    mockRadialPositions.clear()
    mockMaxDepth = 0
    mockWorkerInstance = null
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

  it('computes nearest node to camera after debounce', async () => {
    const resolver = makeMockResolver(graphWithNodes)

    useCanvasStore.setState({
      resolver,
      lodLevel: 1,
      camera: { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, zoom: 1 },
    })

    renderHook(() => useBasic3DLayout())

    // Simulate Worker sending positions
    act(() => {
      mockWorkerInstance?.simulateMessage({
        type: 'LAYOUT_BATCH',
        positions: [
          { id: 'node-near', position: { x: 1, y: 0, z: 0 } },
          { id: 'node-far', position: { x: 100, y: 0, z: 0 } },
        ],
        totalNodes: 2,
      })
    })

    vi.advanceTimersByTime(250)

    expect(useCanvasStore.getState().nearestNodeId).toBe('node-near')
  })
})

// ---------------------------------------------------------------------------
// Worker integration tests
// ---------------------------------------------------------------------------

// Mock the Worker constructor
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  _listeners = new Map<string, EventListenerOrEventListenerObject[]>()

  postMessage(_data: unknown) {
    // no-op — simulate async response in test via simulateMessage
  }

  terminate() {}

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const list = this._listeners.get(type) ?? []
    list.push(listener)
    this._listeners.set(type, list)
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const list = this._listeners.get(type) ?? []
    this._listeners.set(
      type,
      list.filter((l) => l !== listener)
    )
  }

  simulateMessage(data: unknown) {
    const event = new MessageEvent('message', { data })
    if (this.onmessage) this.onmessage(event)
  }

  simulateError(message: string) {
    const event = new ErrorEvent('error', { message })
    if (this.onerror) this.onerror(event)
  }
}

let mockWorkerInstance: MockWorker | null = null

function MockWorkerConstructor(this: MockWorker) {
  // Initialise all MockWorker fields on `this` so the hook can set onmessage/onerror
  // on the same object that simulateMessage/simulateError read from.
  this.onmessage = null
  this.onerror = null
  this._listeners = new Map()
  // eslint-disable-next-line @typescript-eslint/no-this-alias
  mockWorkerInstance = this
}
MockWorkerConstructor.prototype = MockWorker.prototype

vi.stubGlobal('Worker', MockWorkerConstructor)

describe('useBasic3DLayout — worker flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('Worker', MockWorkerConstructor)
    useCanvasStore.getState().reset()
    mockRadialPositions.clear()
    mockMaxDepth = 0
    mockWorkerInstance = null
  })

  it('sets layoutState to computing when resolver is set', async () => {
    const resolver = makeMockResolver(graphWithNodes)
    await act(async () => {
      useCanvasStore.setState({ resolver, lodLevel: 1 })
      renderHook(() => useBasic3DLayout())
    })
    expect(useCanvasStore.getState().layoutState).toBe('computing')
  })

  it('sets layoutState to ready after LAYOUT_COMPLETE', async () => {
    const resolver = makeMockResolver(graphWithNodes)
    await act(async () => {
      useCanvasStore.setState({ resolver, lodLevel: 1 })
      renderHook(() => useBasic3DLayout())
    })

    await act(async () => {
      mockWorkerInstance?.simulateMessage({
        type: 'LAYOUT_BATCH',
        positions: [{ id: 'node-a', position: { x: 1, y: 2, z: 3 } }],
        totalNodes: 1,
      })
      mockWorkerInstance?.simulateMessage({
        type: 'LAYOUT_CLUSTERS',
        clusters: [],
      })
      mockWorkerInstance?.simulateMessage({
        type: 'LAYOUT_COMPLETE',
        bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 10, y: 10, z: 10 } },
        maxDepth: 2,
      })
    })

    expect(useCanvasStore.getState().layoutState).toBe('ready')
  })

  it('publishes positions to store after LAYOUT_BATCH', async () => {
    const resolver = makeMockResolver(graphWithNodes)
    await act(async () => {
      useCanvasStore.setState({ resolver, lodLevel: 1 })
      renderHook(() => useBasic3DLayout())
    })

    await act(async () => {
      mockWorkerInstance?.simulateMessage({
        type: 'LAYOUT_BATCH',
        positions: [{ id: 'node-x', position: { x: 5, y: 0, z: 0 } }],
        totalNodes: 1,
      })
    })

    expect(useCanvasStore.getState().layoutPositions.get('node-x')).toEqual({ x: 5, y: 0, z: 0 })
  })

  it('sets layoutState to ready and falls back on LAYOUT_ERROR', async () => {
    const resolver = makeMockResolver(graphWithNodes)
    await act(async () => {
      useCanvasStore.setState({ resolver, lodLevel: 1 })
      renderHook(() => useBasic3DLayout())
    })

    await act(async () => {
      mockWorkerInstance?.simulateMessage({
        type: 'LAYOUT_ERROR',
        message: 'worker failed',
      })
    })

    // Falls back to synchronous buildRadialTree (already mocked)
    expect(useCanvasStore.getState().layoutState).toBe('ready')
  })

  it('terminates the worker on unmount', async () => {
    const resolver = makeMockResolver(graphWithNodes)
    let unmount: () => void
    await act(async () => {
      useCanvasStore.setState({ resolver, lodLevel: 1 })
      const result = renderHook(() => useBasic3DLayout())
      unmount = result.unmount
    })

    const worker = mockWorkerInstance
    const terminateSpy = vi.spyOn(worker!, 'terminate')

    act(() => unmount())

    expect(terminateSpy).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Telemetry instrumentation
// ---------------------------------------------------------------------------

describe('useBasic3DLayout telemetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('Worker', MockWorkerConstructor)
    useCanvasStore.getState().reset()
    mockWorkerInstance = null
  })

  it('emits ui.layout.compute span with node_count when layout falls back to sync', async () => {
    const telemetry = await import('../../../../lib/telemetry')
    const resolver = makeMockResolver(graphWithNodes)
    useCanvasStore.setState({ resolver, lodLevel: 1 })

    await act(async () => {
      renderHook(() => useBasic3DLayout())
    })

    // Trigger fallback via LAYOUT_ERROR — this calls runSynchronousLayout which calls withSpan
    await act(async () => {
      mockWorkerInstance?.simulateMessage({
        type: 'LAYOUT_ERROR',
        message: 'test error',
      })
    })

    expect(telemetry.withSpan).toHaveBeenCalledWith(
      'ui.layout.compute',
      expect.objectContaining({ node_count: expect.any(Number) }),
      expect.any(Function)
    )
  })
})
