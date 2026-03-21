/**
 * ViewResolver Implementation
 *
 * Provides fast-path tier lookup and constraint-based view pruning
 * for the Semantic Tiered Views system.
 */

import type { IVMGraph, IVMEdge, IVMNode, EdgeType, NodeType } from '../ivm/types.js'
import type { ParseResult, GroupNode } from '../ivm/semantic-tier.js'
import { SemanticTier } from '../ivm/semantic-tier.js'
import type { ViewResolver, ViewConfig, ViewResult, PruningReport } from './types.js'
import { calculateBounds, calculateStats } from '../ivm/builder.js'
import { applyFocalPruning } from './focal-pruner.js'

// =============================================================================
// Helper: rebuild graph metadata after filtering
// =============================================================================

function rebuildGraph(base: IVMGraph, nodes: IVMNode[], edges: IVMEdge[]): IVMGraph {
  return {
    nodes,
    edges,
    metadata: {
      ...base.metadata,
      stats: calculateStats(nodes, edges),
    },
    bounds: calculateBounds(nodes),
  }
}

// =============================================================================
// Edge Type Filtering
// =============================================================================

function filterEdgeTypes(graph: IVMGraph, allowedTypes: EdgeType[]): IVMGraph {
  const allowed = new Set(allowedTypes)
  const edges = graph.edges.filter((e) => allowed.has(e.type))
  return rebuildGraph(graph, graph.nodes, edges)
}

// =============================================================================
// Node Type Filtering
// =============================================================================

function filterNodeTypes(graph: IVMGraph, allowedTypes: NodeType[]): IVMGraph {
  const allowed = new Set(allowedTypes)
  const nodes = graph.nodes.filter((n) => allowed.has(n.type))
  const nodeIds = new Set(nodes.map((n) => n.id))
  const edges = graph.edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
  return rebuildGraph(graph, nodes, edges)
}

// =============================================================================
// Edge Budget Pruning
// =============================================================================

function getEdgeWeight(edge: IVMEdge): number {
  const props = edge.metadata.properties
  if (props && typeof props.totalWeight === 'number') {
    return props.totalWeight
  }
  return edge.metadata.weight ?? 1
}

function pruneEdgesToBudget(
  graph: IVMGraph,
  maxEdges: number
): { graph: IVMGraph; report: PruningReport } {
  // Sort descending by weight — keep the heaviest edges
  const sorted = [...graph.edges].sort((a, b) => getEdgeWeight(b) - getEdgeWeight(a))
  const kept = sorted.slice(0, maxEdges)
  const dropped = sorted.slice(maxEdges)

  const edgesDroppedByType: Partial<Record<EdgeType, number>> = {}
  for (const edge of dropped) {
    edgesDroppedByType[edge.type] = (edgesDroppedByType[edge.type] ?? 0) + 1
  }

  return {
    graph: rebuildGraph(graph, graph.nodes, kept),
    report: {
      edgesDropped: dropped.length,
      edgesDroppedByType,
      groupsCollapsed: [],
      constraintsSatisfied: kept.length <= maxEdges,
    },
  }
}

// =============================================================================
// Node Budget Pruning
// =============================================================================

function pruneNodesToBudget(
  graph: IVMGraph,
  maxNodes: number
): { graph: IVMGraph; report: PruningReport } {
  // Count connections per node
  const connectionCount = new Map<string, number>()
  for (const node of graph.nodes) {
    connectionCount.set(node.id, 0)
  }
  for (const edge of graph.edges) {
    connectionCount.set(edge.source, (connectionCount.get(edge.source) ?? 0) + 1)
    connectionCount.set(edge.target, (connectionCount.get(edge.target) ?? 0) + 1)
  }

  // Sort descending by connection count — keep most connected
  const sorted = [...graph.nodes].sort(
    (a, b) => (connectionCount.get(b.id) ?? 0) - (connectionCount.get(a.id) ?? 0)
  )

  const kept = sorted.slice(0, maxNodes)
  const keptIds = new Set(kept.map((n) => n.id))
  const edges = graph.edges.filter((e) => keptIds.has(e.source) && keptIds.has(e.target))

  const droppedEdges = graph.edges.length - edges.length
  const edgesDroppedByType: Partial<Record<EdgeType, number>> = {}
  for (const edge of graph.edges) {
    if (!keptIds.has(edge.source) || !keptIds.has(edge.target)) {
      edgesDroppedByType[edge.type] = (edgesDroppedByType[edge.type] ?? 0) + 1
    }
  }

  return {
    graph: rebuildGraph(graph, kept, edges),
    report: {
      edgesDropped: droppedEdges,
      edgesDroppedByType,
      groupsCollapsed: [],
      constraintsSatisfied: kept.length <= maxNodes,
    },
  }
}

// =============================================================================
// Pruning Report Merging
// =============================================================================

function mergePruningReports(
  existing: PruningReport | undefined,
  additional: PruningReport
): PruningReport {
  if (!existing) return additional

  const mergedByType: Partial<Record<EdgeType, number>> = { ...existing.edgesDroppedByType }
  for (const [type, count] of Object.entries(additional.edgesDroppedByType)) {
    const edgeType = type as EdgeType
    mergedByType[edgeType] = (mergedByType[edgeType] ?? 0) + (count ?? 0)
  }

  return {
    edgesDropped: existing.edgesDropped + additional.edgesDropped,
    edgesDroppedByType: mergedByType,
    groupsCollapsed: [...existing.groupsCollapsed, ...additional.groupsCollapsed],
    constraintsSatisfied: additional.constraintsSatisfied,
  }
}

// =============================================================================
// Expand / Collapse
// =============================================================================

function findGroup(root: GroupNode, targetId: string): GroupNode | null {
  if (root.id === targetId) return root
  for (const child of root.children) {
    const found = findGroup(child, targetId)
    if (found) return found
  }
  return null
}

function collectAllNodeIdsFromGroup(group: GroupNode): string[] {
  const ids = [...group.nodeIds]
  for (const child of group.children) {
    ids.push(...collectAllNodeIdsFromGroup(child))
  }
  return ids
}

function applyExpandCollapse(
  baseGraph: IVMGraph,
  parseResult: ParseResult,
  _baseTier: SemanticTier,
  expandGroupIds: string[],
  collapseGroupIds: string[]
): IVMGraph {
  let nodes = [...baseGraph.nodes]
  let edges = [...baseGraph.edges]

  // Expand: for each expanded group, add its children from the full graph
  for (const groupId of expandGroupIds) {
    const group = findGroup(parseResult.hierarchy.root, groupId)
    if (!group) continue

    const childNodeIds = new Set<string>()
    for (const child of group.children) {
      for (const nodeId of child.nodeIds) {
        childNodeIds.add(nodeId)
      }
    }

    const existingIds = new Set(nodes.map((n) => n.id))
    const childNodes = parseResult.graph.nodes.filter(
      (n) => childNodeIds.has(n.id) && !existingIds.has(n.id)
    )
    nodes = nodes.concat(childNodes)

    const allVisibleIds = new Set(nodes.map((n) => n.id))
    const existingEdgeIds = new Set(edges.map((e) => e.id))
    const newEdges = parseResult.graph.edges.filter(
      (e) =>
        allVisibleIds.has(e.source) && allVisibleIds.has(e.target) && !existingEdgeIds.has(e.id)
    )
    edges = edges.concat(newEdges)
  }

  // Collapse: remove children of collapsed groups, keep representative node
  for (const groupId of collapseGroupIds) {
    const group = findGroup(parseResult.hierarchy.root, groupId)
    if (!group) continue

    const childNodeIds = new Set(collectAllNodeIdsFromGroup(group))
    const representativeId = group.nodeIds[0]
    nodes = nodes.filter((n) => !childNodeIds.has(n.id) || n.id === representativeId)

    const nodeIdSet = new Set(nodes.map((n) => n.id))
    edges = edges.filter((e) => nodeIdSet.has(e.source) && nodeIdSet.has(e.target))
  }

  return rebuildGraph(baseGraph, nodes, edges)
}

// =============================================================================
// ViewResolver Factory
// =============================================================================

export function createViewResolver(parseResult: ParseResult): ViewResolver {
  const cache = new Map<string, ViewResult>()

  return {
    getTier(tier: SemanticTier): IVMGraph {
      return parseResult.tiers[tier]
    },

    getView(config: ViewConfig): ViewResult {
      const cacheKey = JSON.stringify(config)
      const cached = cache.get(cacheKey)
      if (cached) return cached

      let graph = parseResult.tiers[config.baseTier]
      let pruningReport: PruningReport | undefined

      // Apply expand/collapse before constraints
      if (config.expand?.length || config.collapse?.length) {
        graph = applyExpandCollapse(
          graph,
          parseResult,
          config.baseTier,
          config.expand || [],
          config.collapse || []
        )
      }

      // Apply edge type filter
      if (config.constraints?.allowedEdgeTypes) {
        graph = filterEdgeTypes(graph, config.constraints.allowedEdgeTypes)
      }

      // Apply node type filter
      if (config.constraints?.allowedNodeTypes) {
        graph = filterNodeTypes(graph, config.constraints.allowedNodeTypes)
      }

      // Apply focal pruning (before budget pruning — may satisfy budgets on its own)
      if (config.focalNodeId && config.constraints) {
        const focalResult = applyFocalPruning(
          graph,
          config.focalNodeId,
          config.falloffHops ?? 2,
          config.constraints
        )
        graph = focalResult.graph
        pruningReport = focalResult.report
      }

      // Apply edge budget (skip if focal pruning already satisfied it)
      if (config.constraints?.maxEdges && graph.edges.length > config.constraints.maxEdges) {
        const pruned = pruneEdgesToBudget(graph, config.constraints.maxEdges)
        graph = pruned.graph
        pruningReport = mergePruningReports(pruningReport, pruned.report)
      }

      // Apply node budget (skip if already within budget)
      if (config.constraints?.maxNodes && graph.nodes.length > config.constraints.maxNodes) {
        const pruned = pruneNodesToBudget(graph, config.constraints.maxNodes)
        graph = pruned.graph
        pruningReport = mergePruningReports(pruningReport, pruned.report)
      }

      const result: ViewResult = pruningReport ? { graph, pruningReport } : { graph }
      cache.set(cacheKey, result)
      return result
    },
  }
}
