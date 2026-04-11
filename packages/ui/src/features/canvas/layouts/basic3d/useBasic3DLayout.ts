/**
 * useBasic3DLayout Hook
 *
 * Wires LOD level → ViewResolver → layout computation (Web Worker) → canvas store.
 * Falls back to synchronous buildRadialTree if the worker fails.
 */

import { useMemo, useEffect, useRef, useState } from 'react'
import { withSpan } from '../../../../lib/telemetry'
import { SemanticTier } from '@diagram-builder/core'
import type { IVMGraph } from '@diagram-builder/core'
import type { NodeType, EdgeType } from '@diagram-builder/core'
import { useCanvasStore } from '../../store'
import { buildRadialTree } from './radialTree'
import { serializeGraph } from './serializeGraph'
import type { Position3D } from '../../../../shared/types'
import type { ComputeLayoutMessage, WorkerOutMessage } from './workers/layoutWorker'

// ---------------------------------------------------------------------------
// Empty graph sentinel
// ---------------------------------------------------------------------------

const EMPTY_GRAPH: IVMGraph = {
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
      nodesByType: {} as Record<NodeType, number>,
      edgesByType: {} as Record<EdgeType, number>,
    },
  },
  bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
}

const LAYOUT_CONFIG = { depthSpacing: 30, rootRadius: 5 }

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface Basic3DLayoutResult {
  positions: Map<string, Position3D>
  graph: IVMGraph
  maxDepth: number
}

// ---------------------------------------------------------------------------
// Fallback: synchronous layout (used on worker error)
// ---------------------------------------------------------------------------

function runSynchronousLayout(
  graph: IVMGraph,
  setLayoutPositions: (p: Map<string, Position3D>) => void,
  setLayoutState: (s: 'idle' | 'computing' | 'ready' | 'error') => void
) {
  const result = withSpan('ui.layout.compute', { node_count: graph.nodes.length }, () =>
    buildRadialTree(graph, LAYOUT_CONFIG)
  )
  if (result.positions.size > 0) setLayoutPositions(result.positions)
  setLayoutState('ready')
  return result
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useBasic3DLayout(): Basic3DLayoutResult {
  const resolver = useCanvasStore((s) => s.resolver)
  const lodLevel = useCanvasStore((s) => s.lodLevel)
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)
  const setLayoutPositions = useCanvasStore((s) => s.setLayoutPositions)
  const setLayoutState = useCanvasStore((s) => s.setLayoutState)
  const setLayoutProgress = useCanvasStore((s) => s.setLayoutProgress)
  const setClusters = useCanvasStore((s) => s.setClusters)
  const setNearestNodeId = useCanvasStore((s) => s.setNearestNodeId)
  const cameraPosX = useCanvasStore((s) => s.camera?.position?.x ?? 0)
  const cameraPosY = useCanvasStore((s) => s.camera?.position?.y ?? 0)
  const cameraPosZ = useCanvasStore((s) => s.camera?.position?.z ?? 0)

  // ---------------------------------------------------------------------------
  // Step 1: Derive graph from resolver + LOD
  // ---------------------------------------------------------------------------

  const graph = useMemo(() => {
    if (!resolver) return EMPTY_GRAPH
    if (lodLevel < 5) return resolver.getTier(SemanticTier.Symbol)
    if (!selectedNodeId) return resolver.getTier(SemanticTier.Symbol)
    return resolver.getView({ baseTier: SemanticTier.Symbol, focalNodeId: selectedNodeId }).graph
  }, [resolver, lodLevel, selectedNodeId])

  // ---------------------------------------------------------------------------
  // Step 2: Track computed positions in a ref (for nearest-node computation)
  //         and maxDepth in state so callers get re-render when it changes.
  // ---------------------------------------------------------------------------

  const positionsRef = useRef<Map<string, Position3D>>(new Map())
  const maxDepthRef = useRef(0)
  const [maxDepth, setMaxDepth] = useState(0)

  // ---------------------------------------------------------------------------
  // Step 3: Spawn worker on graph change
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (graph.nodes.length === 0) {
      positionsRef.current = new Map()
      maxDepthRef.current = 0
      setMaxDepth(0)
      setLayoutPositions(new Map())
      setClusters(new Map())
      setLayoutProgress(0)
      setLayoutState('idle')
      return
    }

    setLayoutState('computing')
    setLayoutProgress(0)

    let worker: Worker | null = null
    let cancelled = false

    try {
      worker = new Worker(new URL('./workers/layoutWorker.ts', import.meta.url), {
        type: 'module',
      })

      worker.onmessage = (event: MessageEvent<WorkerOutMessage>) => {
        if (cancelled) return
        const msg = event.data

        if (msg.type === 'LAYOUT_BATCH') {
          const positions = new Map(msg.positions.map(({ id, position }) => [id, position]))
          positionsRef.current = positions
          setLayoutPositions(positions)
          setLayoutProgress(msg.totalNodes > 0 ? 1 : 0)
        } else if (msg.type === 'LAYOUT_CLUSTERS') {
          setClusters(new Map(msg.clusters))
        } else if (msg.type === 'LAYOUT_COMPLETE') {
          maxDepthRef.current = msg.maxDepth
          setMaxDepth(msg.maxDepth)
          setLayoutState('ready')
        } else if (msg.type === 'LAYOUT_ERROR') {
          console.warn('[useBasic3DLayout] Worker error, falling back:', msg.message)
          const result = runSynchronousLayout(graph, setLayoutPositions, setLayoutState)
          positionsRef.current = result.positions
          maxDepthRef.current = result.maxDepth
          setMaxDepth(result.maxDepth)
        }
      }

      worker.onerror = () => {
        if (cancelled) return
        console.warn('[useBasic3DLayout] Worker crashed, falling back')
        const result = runSynchronousLayout(graph, setLayoutPositions, setLayoutState)
        positionsRef.current = result.positions
        maxDepthRef.current = result.maxDepth
        setMaxDepth(result.maxDepth)
      }

      const msg: ComputeLayoutMessage = {
        type: 'COMPUTE_LAYOUT',
        graph: serializeGraph(graph),
        config: LAYOUT_CONFIG,
      }
      worker.postMessage(msg)
    } catch {
      // Worker not available (SSR, restricted environment)
      const result = runSynchronousLayout(graph, setLayoutPositions, setLayoutState)
      positionsRef.current = result.positions
      maxDepthRef.current = result.maxDepth
      setMaxDepth(result.maxDepth)
    }

    return () => {
      cancelled = true
      worker?.terminate()
    }
  }, [graph, setLayoutPositions, setLayoutState, setLayoutProgress, setClusters, setMaxDepth])

  // ---------------------------------------------------------------------------
  // Step 4: Debounced nearest-node computation
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const timer = setTimeout(() => {
      const positions = positionsRef.current
      if (positions.size === 0) {
        setNearestNodeId(null)
        return
      }
      const cameraPos = { x: cameraPosX, y: cameraPosY, z: cameraPosZ }
      let nearestId: string | null = null
      let nearestDist = Infinity
      for (const [nodeId, pos] of positions) {
        const dx = pos.x - cameraPos.x
        const dy = pos.y - cameraPos.y
        const dz = pos.z - cameraPos.z
        const dist = dx * dx + dy * dy + dz * dz
        if (dist < nearestDist) {
          nearestDist = dist
          nearestId = nodeId
        }
      }
      setNearestNodeId(nearestId)
    }, 200)

    return () => clearTimeout(timer)
  }, [cameraPosX, cameraPosY, cameraPosZ, setNearestNodeId])

  // Reset nearestNodeId on unmount
  useEffect(() => {
    return () => setNearestNodeId(null)
  }, [setNearestNodeId])

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    // NOTE: positionsRef.current is a ref value — not reactive. Callers must also
    // subscribe to layoutState from the store and re-read positions when it transitions
    // to 'ready'. Basic3DView does this correctly; any new consumer must do the same.
    positions: positionsRef.current,
    graph,
    maxDepth,
  }
}
