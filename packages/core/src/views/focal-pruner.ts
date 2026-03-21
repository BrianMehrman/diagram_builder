/**
 * Focal-Point Pruning
 *
 * BFS-based pruning that keeps nodes within a hop radius of a focal node,
 * progressively shrinking when edge budgets are exceeded.
 */

import type { IVMGraph, IVMEdge, EdgeType } from '../ivm/types.js'
import type { ViewConstraints, PruningReport } from './types.js'
import { calculateBounds, calculateStats } from '../ivm/builder.js'

export interface FocalPruningResult {
  graph: IVMGraph
  report: PruningReport
}

export function applyFocalPruning(
  graph: IVMGraph,
  focalNodeId: string,
  falloffHops: number,
  constraints: ViewConstraints
): FocalPruningResult {
  // Build adjacency map (bidirectional)
  const adjacency = new Map<string, Set<string>>()
  for (const node of graph.nodes) {
    adjacency.set(node.id, new Set())
  }
  for (const edge of graph.edges) {
    adjacency.get(edge.source)?.add(edge.target)
    adjacency.get(edge.target)?.add(edge.source)
  }

  // BFS from focal node to assign hop distances
  const hopDistance = new Map<string, number>()
  const queue: [string, number][] = [[focalNodeId, 0]]
  hopDistance.set(focalNodeId, 0)

  while (queue.length > 0) {
    const [nodeId, dist] = queue.shift()!
    const neighbors = adjacency.get(nodeId) || new Set()
    for (const neighbor of neighbors) {
      if (!hopDistance.has(neighbor)) {
        hopDistance.set(neighbor, dist + 1)
        queue.push([neighbor, dist + 1])
      }
    }
  }

  // Keep nodes within falloffHops
  let keptNodeIds = new Set<string>()
  for (const [nodeId, dist] of hopDistance) {
    if (dist <= falloffHops) {
      keptNodeIds.add(nodeId)
    }
  }

  // Filter edges to those connecting kept nodes
  let keptEdges = graph.edges.filter(
    (e) => keptNodeIds.has(e.source) && keptNodeIds.has(e.target)
  )

  // Progressive shrink if over edge budget
  let currentHops = falloffHops
  while (
    constraints.maxEdges &&
    keptEdges.length > constraints.maxEdges &&
    currentHops > 0
  ) {
    currentHops--
    keptNodeIds = new Set<string>()
    for (const [nodeId, dist] of hopDistance) {
      if (dist <= currentHops) {
        keptNodeIds.add(nodeId)
      }
    }
    keptEdges = graph.edges.filter(
      (e) => keptNodeIds.has(e.source) && keptNodeIds.has(e.target)
    )
  }

  // Final weight-based pruning if still over budget
  if (constraints.maxEdges && keptEdges.length > constraints.maxEdges) {
    const sorted = [...keptEdges].sort((a, b) => {
      const wA = getEdgeWeight(a)
      const wB = getEdgeWeight(b)
      return wB - wA
    })
    keptEdges = sorted.slice(0, constraints.maxEdges)
    const edgeNodeIds = new Set<string>()
    edgeNodeIds.add(focalNodeId)
    for (const e of keptEdges) {
      edgeNodeIds.add(e.source)
      edgeNodeIds.add(e.target)
    }
    keptNodeIds = edgeNodeIds
  }

  const keptNodes = graph.nodes.filter((n) => keptNodeIds.has(n.id))

  // Calculate dropped edges
  const droppedEdges = graph.edges.filter(
    (e) => !(keptNodeIds.has(e.source) && keptNodeIds.has(e.target))
  )

  const droppedByType: Partial<Record<EdgeType, number>> = {}
  for (const edge of droppedEdges) {
    droppedByType[edge.type] = (droppedByType[edge.type] || 0) + 1
  }

  return {
    graph: {
      nodes: keptNodes,
      edges: keptEdges,
      metadata: {
        ...graph.metadata,
        stats: calculateStats(keptNodes, keptEdges),
      },
      bounds: calculateBounds(keptNodes),
    },
    report: {
      edgesDropped: droppedEdges.length,
      edgesDroppedByType: droppedByType,
      groupsCollapsed: [],
      constraintsSatisfied:
        (!constraints.maxEdges || keptEdges.length <= constraints.maxEdges) &&
        (!constraints.maxNodes || keptNodes.length <= constraints.maxNodes),
    },
  }
}

function getEdgeWeight(edge: IVMEdge): number {
  const props = edge.metadata.properties as Record<string, unknown> | undefined
  if (props && typeof props.totalWeight === 'number') {
    return props.totalWeight
  }
  return edge.metadata.weight ?? 1
}
