/**
 * Hierarchy Builder
 *
 * Groups IVM nodes by semantic tier and computes aggregated edges
 * to produce a GroupHierarchy for tiered views.
 */

import type { IVMGraph, IVMNode, EdgeType } from '../../../core/src/ivm/types.js'
import {
  SemanticTier,
  NODE_TYPE_TO_TIER,
  AGGREGATABLE_EDGE_TYPES,
} from '../../../core/src/ivm/semantic-tier.js'
import type {
  GroupNode,
  AggregatedEdge,
  GroupHierarchy,
} from '../../../core/src/ivm/semantic-tier.js'

// =============================================================================
// Tree Building
// =============================================================================

/**
 * Builds the group hierarchy tree from an IVM graph.
 *
 * Strategy:
 * 1. Create a GroupNode for every IVM node that acts as a group at its tier
 * 2. Wire children based on parentId and directory grouping
 * 3. Ensure every IVM node appears in exactly one GroupNode's nodeIds
 */
function buildGroupTree(graph: IVMGraph): GroupNode {
  const nodesByTier = new Map<SemanticTier, IVMNode[]>()

  // Classify nodes by tier
  for (const node of graph.nodes) {
    const tier = NODE_TYPE_TO_TIER[node.type]
    const tierNodes = nodesByTier.get(tier) ?? []
    tierNodes.push(node)
    nodesByTier.set(tier, tierNodes)
  }

  // Build a parent lookup from IVM parentId
  const parentMap = new Map<string, string>()
  for (const node of graph.nodes) {
    if (node.parentId) {
      parentMap.set(node.id, node.parentId)
    }
  }

  // Create GroupNode for each IVM node that serves as a group
  const groupNodes = new Map<string, GroupNode>()

  for (const node of graph.nodes) {
    const tier = NODE_TYPE_TO_TIER[node.type]
    groupNodes.set(node.id, {
      id: node.id,
      label: node.metadata.label,
      tier,
      nodeIds: [node.id],
      children: [],
    })
  }

  // Wire parent-child relationships
  // Nodes with parentId become children of their parent's group
  for (const node of graph.nodes) {
    if (node.parentId && groupNodes.has(node.parentId)) {
      const parentGroup = groupNodes.get(node.parentId)
      const childGroup = groupNodes.get(node.id)
      if (parentGroup && childGroup) {
        parentGroup.children.push(childGroup)
      }
    }
  }

  // Find root nodes (no parent) and create a synthetic repository root if needed
  const rootNodes = graph.nodes.filter((n) => !n.parentId)

  // If there's exactly one root and it's a repository node, use it
  const firstRoot = rootNodes[0]
  if (
    rootNodes.length === 1 &&
    firstRoot &&
    NODE_TYPE_TO_TIER[firstRoot.type] === SemanticTier.Repository
  ) {
    const rootGroup = groupNodes.get(firstRoot.id)
    if (rootGroup) return rootGroup
  }

  // Otherwise, create a synthetic repository root
  const root: GroupNode = {
    id: 'group:repository',
    label: graph.metadata.name,
    tier: SemanticTier.Repository,
    nodeIds: [],
    children: rootNodes.flatMap((n) => {
      const g = groupNodes.get(n.id)
      return g ? [g] : []
    }),
  }

  return root
}

// =============================================================================
// Node-to-Group Mapping at Each Tier
// =============================================================================

/**
 * For a given tier level, maps every IVM node to the group it belongs to at that tier.
 * A node belongs to the nearest ancestor (or itself) whose tier <= the requested tier.
 */
function buildNodeToGroupMapping(graph: IVMGraph, tier: SemanticTier): Map<string, string> {
  const nodeMap = new Map<string, IVMNode>(graph.nodes.map((n) => [n.id, n]))
  const mapping = new Map<string, string>()

  function findGroupAtTier(nodeId: string): string {
    // Check cache
    const cached = mapping.get(nodeId)
    if (cached !== undefined) {
      return cached
    }

    const node = nodeMap.get(nodeId)
    if (!node) return nodeId

    const nodeTier = NODE_TYPE_TO_TIER[node.type]

    // If this node is at or above the target tier, it IS the group
    if (nodeTier <= tier) {
      mapping.set(nodeId, nodeId)
      return nodeId
    }

    // Otherwise, walk up to parent
    if (node.parentId) {
      const parentGroup = findGroupAtTier(node.parentId)
      mapping.set(nodeId, parentGroup)
      return parentGroup
    }

    // No parent and below the tier — map to a synthetic root
    mapping.set(nodeId, 'group:repository')
    return 'group:repository'
  }

  for (const node of graph.nodes) {
    findGroupAtTier(node.id)
  }

  return mapping
}

// =============================================================================
// Edge Aggregation
// =============================================================================

/**
 * Aggregates edges at a given tier level.
 * Only aggregatable edge types are included.
 * Edges within the same group are excluded (internal edges).
 */
function aggregateEdgesAtTier(graph: IVMGraph, tier: SemanticTier): AggregatedEdge[] {
  const nodeToGroup = buildNodeToGroupMapping(graph, tier)
  const aggregatableSet = new Set<EdgeType>(AGGREGATABLE_EDGE_TYPES)

  // Key: "sourceGroup->targetGroup", Value: breakdown map
  const edgeMap = new Map<string, Map<EdgeType, number>>()

  for (const edge of graph.edges) {
    // Skip non-aggregatable edge types
    if (!aggregatableSet.has(edge.type)) continue

    const sourceGroup = nodeToGroup.get(edge.source)
    const targetGroup = nodeToGroup.get(edge.target)

    if (!sourceGroup || !targetGroup) continue

    // Skip internal edges (same group)
    if (sourceGroup === targetGroup) continue

    const key = `${sourceGroup}->${targetGroup}`
    if (!edgeMap.has(key)) {
      edgeMap.set(key, new Map())
    }

    const breakdown = edgeMap.get(key) ?? new Map<EdgeType, number>()
    breakdown.set(edge.type, (breakdown.get(edge.type) || 0) + 1)
    edgeMap.set(key, breakdown)
  }

  // Convert to AggregatedEdge array
  const result: AggregatedEdge[] = []
  for (const [key, breakdown] of edgeMap) {
    const parts = key.split('->')
    const sourceGroupId = parts[0] ?? ''
    const targetGroupId = parts[1] ?? ''
    const breakdownObj: Partial<Record<EdgeType, number>> = {}
    let totalWeight = 0

    for (const [edgeType, count] of breakdown) {
      breakdownObj[edgeType] = count
      totalWeight += count
    }

    result.push({
      sourceGroupId,
      targetGroupId,
      breakdown: breakdownObj,
      totalWeight,
    })
  }

  return result
}

// =============================================================================
// Tier Counting
// =============================================================================

/**
 * Counts the number of group nodes at each tier in the hierarchy tree.
 */
function countGroupsByTier(root: GroupNode): Record<SemanticTier, number> {
  const counts: Record<SemanticTier, number> = {
    [SemanticTier.Repository]: 0,
    [SemanticTier.Package]: 0,
    [SemanticTier.Module]: 0,
    [SemanticTier.File]: 0,
    [SemanticTier.Symbol]: 0,
    [SemanticTier.Detail]: 0,
  }

  function walk(node: GroupNode): void {
    counts[node.tier]++
    for (const child of node.children) {
      walk(child)
    }
  }

  walk(root)
  return counts
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Builds a GroupHierarchy from an IVMGraph.
 *
 * Groups IVM nodes by semantic tier, builds a tree structure using
 * parentId relationships, and computes aggregated edges at each tier.
 */
export function buildGroupHierarchy(graph: IVMGraph): GroupHierarchy {
  // Step 1: Build the group tree
  const root = buildGroupTree(graph)

  // Step 2: Count groups by tier
  const tierCount = countGroupsByTier(root)

  // Step 3: Compute aggregated edges for each tier
  const edgesByTier: Record<SemanticTier, AggregatedEdge[]> = {
    [SemanticTier.Repository]: aggregateEdgesAtTier(graph, SemanticTier.Repository),
    [SemanticTier.Package]: aggregateEdgesAtTier(graph, SemanticTier.Package),
    [SemanticTier.Module]: aggregateEdgesAtTier(graph, SemanticTier.Module),
    [SemanticTier.File]: aggregateEdgesAtTier(graph, SemanticTier.File),
    [SemanticTier.Symbol]: aggregateEdgesAtTier(graph, SemanticTier.Symbol),
    [SemanticTier.Detail]: aggregateEdgesAtTier(graph, SemanticTier.Detail),
  }

  return {
    root,
    tierCount,
    edgesByTier,
  }
}
