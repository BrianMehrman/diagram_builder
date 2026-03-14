/**
 * Tier Materializer
 *
 * Produces a valid IVMGraph for each semantic tier by collapsing lower-tier
 * nodes into group representatives. Uses the GroupHierarchy to determine
 * which nodes are visible at each tier level.
 */

import type { IVMGraph, IVMNode, IVMEdge, NodeType, EdgeType } from '../../../core/src/ivm/types.js'
import {
  SemanticTier,
  NODE_TYPE_TO_TIER,
} from '../../../core/src/ivm/semantic-tier.js'
import type { GroupNode, GroupHierarchy, AggregatedEdge } from '../../../core/src/ivm/semantic-tier.js'
import {
  createDefaultPosition,
  calculateBounds,
  calculateStats,
  generateEdgeId,
  assignLOD,
} from '../../../core/src/ivm/builder.js'

// =============================================================================
// Tier-to-NodeType mapping for synthetic nodes
// =============================================================================

const TIER_TO_NODE_TYPE: Record<SemanticTier, NodeType> = {
  [SemanticTier.Repository]: 'repository',
  [SemanticTier.Package]: 'package',
  [SemanticTier.Module]: 'module',
  [SemanticTier.File]: 'file',
  [SemanticTier.Symbol]: 'class',
  [SemanticTier.Detail]: 'method',
}

// =============================================================================
// Visible Node Collection
// =============================================================================

/**
 * Collects the set of visible IVM node IDs for a given tier by walking
 * the GroupHierarchy tree.
 *
 * - Groups at the target tier become visible (use their representative node).
 * - Groups above the target tier: include their direct nodeIds, recurse children.
 * - Groups below the target tier: skip (collapsed into parent).
 */
function collectVisibleGroups(
  group: GroupNode,
  tier: SemanticTier,
  result: Map<string, GroupNode>,
): void {
  if (group.tier === tier) {
    // This group IS at the target tier — it becomes a visible node
    result.set(group.id, group)
    return
  }

  if (group.tier < tier) {
    // Group is above the target tier — include its direct nodeIds as visible,
    // then recurse into children looking for groups at the target tier
    // Only include this group if it has nodeIds (it's a real node, not just a container)
    if (group.nodeIds.length > 0) {
      result.set(group.id, group)
    }
    for (const child of group.children) {
      collectVisibleGroups(child, tier, result)
    }
    return
  }

  // group.tier > tier — below the target tier, skip (collapsed into parent)
}

// =============================================================================
// Synthetic Node Creation
// =============================================================================

/**
 * Creates a synthetic IVMNode for a group that has no real IVM node
 * to use as a representative.
 */
function createSyntheticNode(group: GroupNode): IVMNode {
  const nodeType = TIER_TO_NODE_TYPE[group.tier]
  return {
    id: group.id,
    type: nodeType,
    position: createDefaultPosition(),
    lod: assignLOD(nodeType),
    metadata: {
      label: group.label,
      path: group.id,
      properties: {
        synthetic: true,
        collapsedNodeCount: countDescendantNodes(group),
      },
    },
  }
}

/**
 * Counts the total number of nodeIds in a group and all its descendants.
 */
function countDescendantNodes(group: GroupNode): number {
  let count = group.nodeIds.length
  for (const child of group.children) {
    count += countDescendantNodes(child)
  }
  return count
}

// =============================================================================
// Edge Materialization
// =============================================================================

/**
 * Determines the dominant edge type from a breakdown map.
 * The dominant type is the one with the highest count.
 */
function getDominantEdgeType(breakdown: Partial<Record<EdgeType, number>>): EdgeType {
  let dominant: EdgeType = 'depends_on'
  let maxCount = 0

  for (const [edgeType, count] of Object.entries(breakdown)) {
    if (count !== undefined && count > maxCount) {
      maxCount = count
      dominant = edgeType as EdgeType
    }
  }

  return dominant
}

/**
 * Converts an AggregatedEdge into an IVMEdge with breakdown metadata.
 */
function materializeAggregatedEdge(aggEdge: AggregatedEdge): IVMEdge {
  const dominantType = getDominantEdgeType(aggEdge.breakdown)

  return {
    id: generateEdgeId(aggEdge.sourceGroupId, aggEdge.targetGroupId, dominantType),
    source: aggEdge.sourceGroupId,
    target: aggEdge.targetGroupId,
    type: dominantType,
    lod: SemanticTier.Repository, // aggregated edges visible at all levels
    metadata: {
      weight: aggEdge.totalWeight,
      properties: {
        aggregated: true,
        totalWeight: aggEdge.totalWeight,
        breakdown: { ...aggEdge.breakdown },
      },
    },
  }
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Materializes an IVMGraph for a specific semantic tier.
 *
 * For the Detail tier (5), returns the full graph as-is.
 * For other tiers, walks the GroupHierarchy tree to determine which nodes
 * are visible, creates representative or synthetic nodes, and converts
 * aggregated edges into IVMEdges.
 *
 * @param fullGraph - The complete IVM graph with all nodes
 * @param hierarchy - The GroupHierarchy produced by buildGroupHierarchy
 * @param tier - The semantic tier to materialize
 * @returns A valid IVMGraph containing only nodes/edges visible at the tier
 */
export function materializeTier(
  fullGraph: IVMGraph,
  hierarchy: GroupHierarchy,
  tier: SemanticTier,
): IVMGraph {
  // Detail tier returns the full graph as-is
  if (tier === SemanticTier.Detail) {
    return fullGraph
  }

  // Collect visible groups at this tier
  const visibleGroups = new Map<string, GroupNode>()
  collectVisibleGroups(hierarchy.root, tier, visibleGroups)

  // Build a lookup of full graph nodes by ID
  const fullNodeMap = new Map<string, IVMNode>(fullGraph.nodes.map((n) => [n.id, n]))

  // Create IVM nodes for each visible group
  const nodes: IVMNode[] = []
  for (const [, group] of visibleGroups) {
    // Try to use the first real IVM node as representative
    const representativeId = group.nodeIds[0]
    const realNode = representativeId ? fullNodeMap.get(representativeId) : undefined

    if (realNode) {
      // Use the real node, potentially enriched with collapsed info
      const node: IVMNode = {
        ...realNode,
        metadata: {
          ...realNode.metadata,
          properties: {
            ...realNode.metadata.properties,
            collapsedNodeCount: countDescendantNodes(group),
          },
        },
      }
      nodes.push(node)
    } else {
      // No real node — create a synthetic one
      nodes.push(createSyntheticNode(group))
    }
  }

  // Convert aggregated edges for this tier into IVMEdges
  const aggregatedEdges = hierarchy.edgesByTier[tier] || []
  const visibleNodeIds = new Set(nodes.map((n) => n.id))

  const edges: IVMEdge[] = []
  for (const aggEdge of aggregatedEdges) {
    // Only include edges where both endpoints are in the visible set
    if (visibleNodeIds.has(aggEdge.sourceGroupId) && visibleNodeIds.has(aggEdge.targetGroupId)) {
      edges.push(materializeAggregatedEdge(aggEdge))
    }
  }

  // Build metadata and bounds
  const bounds = calculateBounds(nodes)
  const stats = calculateStats(nodes, edges)

  return {
    nodes,
    edges,
    metadata: {
      ...fullGraph.metadata,
      stats,
      properties: {
        ...fullGraph.metadata.properties,
        materializedTier: tier,
        materializedTierName: SemanticTier[tier],
      },
    },
    bounds,
  }
}
