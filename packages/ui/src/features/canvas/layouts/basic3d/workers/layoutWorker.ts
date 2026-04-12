/**
 * layoutWorker.ts
 *
 * Web Worker entry point for Basic3D layout computation.
 * Runs buildRadialTree + buildClusters off the main thread.
 *
 * Message protocol:
 *   In:  { type: 'COMPUTE_LAYOUT'; graph: IVMGraph; config: RadialTreeOptions }
 *   Out: { type: 'LAYOUT_BATCH'; positions: Array<{ id: string; position: Position3D }>; totalNodes: number }
 *        { type: 'LAYOUT_CLUSTERS'; clusters: Array<[string, ClusterData]> }
 *        { type: 'LAYOUT_COMPLETE'; bounds: { min: Position3D; max: Position3D }; maxDepth: number }
 *        { type: 'LAYOUT_ERROR'; message: string }
 */

import type { IVMGraph, Position3D } from '@diagram-builder/core'
import { buildRadialTree } from '../radialTree'
import type { RadialTreeOptions } from '../radialTree'
import { buildClusters } from '../clusterBuilder'
import type { ClusterData } from '../clusterBuilder'

// ---------------------------------------------------------------------------
// Worker message types (exported — imported by useBasic3DLayout for type safety)
// ---------------------------------------------------------------------------

export interface ComputeLayoutMessage {
  type: 'COMPUTE_LAYOUT'
  graph: IVMGraph
  config: RadialTreeOptions
}

export interface LayoutBatchMessage {
  type: 'LAYOUT_BATCH'
  positions: Array<{ id: string; position: Position3D }>
  totalNodes: number
}

export interface LayoutClustersMessage {
  type: 'LAYOUT_CLUSTERS'
  clusters: Array<[string, ClusterData]>
}

export interface LayoutCompleteMessage {
  type: 'LAYOUT_COMPLETE'
  bounds: { min: Position3D; max: Position3D }
  maxDepth: number
}

export interface LayoutErrorMessage {
  type: 'LAYOUT_ERROR'
  message: string
}

export type WorkerOutMessage =
  | LayoutBatchMessage
  | LayoutClustersMessage
  | LayoutCompleteMessage
  | LayoutErrorMessage

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

self.onmessage = (event: MessageEvent<ComputeLayoutMessage>) => {
  const { type, graph, config } = event.data

  if (type !== 'COMPUTE_LAYOUT') return

  try {
    // 1. Run layout
    const result = buildRadialTree(graph, config)

    // 2. Convert Map → array (Maps are not structuredClone-safe)
    const positionsArray = Array.from(result.positions.entries()).map(([id, position]) => ({
      id,
      position,
    }))

    // 3. Send positions batch
    const batchMsg: LayoutBatchMessage = {
      type: 'LAYOUT_BATCH',
      positions: positionsArray,
      totalNodes: graph.nodes.length,
    }
    self.postMessage(batchMsg)

    // 4. Build and send clusters
    const clusters = buildClusters(graph, result.positions)
    const clustersMsg: LayoutClustersMessage = {
      type: 'LAYOUT_CLUSTERS',
      clusters: Array.from(clusters.entries()),
    }
    self.postMessage(clustersMsg)

    // 5. Signal completion
    const completeMsg: LayoutCompleteMessage = {
      type: 'LAYOUT_COMPLETE',
      bounds: result.bounds,
      maxDepth: result.maxDepth,
    }
    self.postMessage(completeMsg)
  } catch (err) {
    const errorMsg: LayoutErrorMessage = {
      type: 'LAYOUT_ERROR',
      message: err instanceof Error ? err.message : String(err),
    }
    self.postMessage(errorMsg)
  }
}
