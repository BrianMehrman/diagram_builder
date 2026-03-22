/**
 * useBasic3DLayout Hook
 *
 * Wires LOD level → ViewResolver → buildRadialTree → canvas store.
 * All 4 LOD levels use SemanticTier.Symbol so 3D nodes are always visible.
 * LOD 4 with a selected node uses a focal view for proximity-based expansion.
 */

import { useMemo, useEffect } from 'react'
import { SemanticTier } from '@diagram-builder/core'
import type { IVMGraph } from '@diagram-builder/core'
import type { NodeType, EdgeType } from '@diagram-builder/core'
import { useCanvasStore } from '../../store'
import { buildRadialTree } from './radialTree'
import type { Position3D } from '../../../../shared/types'

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

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface Basic3DLayoutResult {
  positions: Map<string, Position3D>
  graph: IVMGraph
  maxDepth: number
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Computes a radial-tree 3D layout for the current LOD/resolver state.
 *
 * Publishes positions to the canvas store so camera flight can use them.
 * Tracks the node nearest to the camera (debounced 200 ms) and sets
 * nearestNodeId in the store.
 */
export function useBasic3DLayout(): Basic3DLayoutResult {
  // Primitive store selectors — avoid object reference re-renders
  const resolver = useCanvasStore((s) => s.resolver)
  const lodLevel = useCanvasStore((s) => s.lodLevel)
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)
  const setLayoutPositions = useCanvasStore((s) => s.setLayoutPositions)
  const setNearestNodeId = useCanvasStore((s) => s.setNearestNodeId)
  const cameraPosX = useCanvasStore((s) => s.camera?.position?.x ?? 0)
  const cameraPosY = useCanvasStore((s) => s.camera?.position?.y ?? 0)
  const cameraPosZ = useCanvasStore((s) => s.camera?.position?.z ?? 0)

  // ---------------------------------------------------------------------------
  // Step 1: Derive graph from resolver + LOD
  // ---------------------------------------------------------------------------

  const graph = useMemo(() => {
    if (!resolver) return EMPTY_GRAPH

    // LOD 1-3: always use Symbol tier
    if (lodLevel <= 3) return resolver.getTier(SemanticTier.Symbol)

    // LOD 4: focal view if selectedNodeId is set, else fall back
    if (!selectedNodeId) return resolver.getTier(SemanticTier.Symbol)
    return resolver.getView({ baseTier: SemanticTier.Symbol, focalNodeId: selectedNodeId }).graph
  }, [resolver, lodLevel, selectedNodeId])

  // ---------------------------------------------------------------------------
  // Step 2: Run layout algorithm
  // ---------------------------------------------------------------------------

  const positions = useMemo(
    () => buildRadialTree(graph, { depthSpacing: 30, rootRadius: 5 }),
    [graph]
  )

  // ---------------------------------------------------------------------------
  // Step 3: Publish positions to store
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (positions.positions.size > 0) {
      setLayoutPositions(positions.positions)
    }
  }, [positions, setLayoutPositions])

  // ---------------------------------------------------------------------------
  // Step 4: Debounced nearest-node computation
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const timer = setTimeout(() => {
      if (positions.positions.size === 0) {
        setNearestNodeId(null)
        return
      }
      const cameraPos = { x: cameraPosX, y: cameraPosY, z: cameraPosZ }
      let nearestId: string | null = null
      let nearestDist = Infinity
      for (const [nodeId, pos] of positions.positions) {
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
  }, [cameraPosX, cameraPosY, cameraPosZ, positions, setNearestNodeId])

  // Reset nearestNodeId on unmount
  useEffect(() => {
    return () => setNearestNodeId(null)
  }, [setNearestNodeId])

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    positions: positions.positions,
    graph,
    maxDepth: positions.maxDepth,
  }
}
