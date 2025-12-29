/**
 * Level of Detail (LOD) System
 *
 * Provides filtering and management of graph visibility based on LOD levels.
 * The LOD system enables progressive disclosure of graph complexity:
 * - LOD 0: Repository level
 * - LOD 1: Package/namespace level
 * - LOD 2: Directory/module level
 * - LOD 3: File level
 * - LOD 4: Class/function level
 * - LOD 5: Full detail (methods, variables, types)
 */

import type { IVMGraph, IVMNode, IVMEdge, LODLevel } from '../ivm/types.js';
import type { LODConfig, LODFilterResult } from './types.js';
import { DEFAULT_LOD_CONFIG } from './types.js';

// =============================================================================
// LOD Level Utilities
// =============================================================================

/**
 * Checks if a node is visible at a given LOD level
 */
export function isNodeVisibleAtLOD(node: IVMNode, level: LODLevel): boolean {
  return node.lod <= level;
}

/**
 * Checks if an edge is visible at a given LOD level
 */
export function isEdgeVisibleAtLOD(edge: IVMEdge, level: LODLevel): boolean {
  return edge.lod <= level;
}

/**
 * Gets the recommended LOD level based on node count
 */
export function getRecommendedLOD(nodeCount: number): LODLevel {
  if (nodeCount < 50) return 5;
  if (nodeCount < 200) return 4;
  if (nodeCount < 500) return 3;
  if (nodeCount < 1000) return 2;
  if (nodeCount < 5000) return 1;
  return 0;
}

// =============================================================================
// Node Ancestry
// =============================================================================

/**
 * Builds a map of node IDs to their ancestor IDs
 */
export function buildAncestorMap(nodes: IVMNode[]): Map<string, string[]> {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const ancestorMap = new Map<string, string[]>();

  for (const node of nodes) {
    const ancestors: string[] = [];
    let current = node;

    while (current.parentId) {
      ancestors.push(current.parentId);
      const parent = nodeMap.get(current.parentId);
      if (!parent) break;
      current = parent;
    }

    ancestorMap.set(node.id, ancestors);
  }

  return ancestorMap;
}

/**
 * Gets all ancestors of a node
 */
export function getAncestors(nodeId: string, ancestorMap: Map<string, string[]>): string[] {
  return ancestorMap.get(nodeId) ?? [];
}

/**
 * Finds the nearest visible ancestor for a hidden node
 */
export function findVisibleAncestor(
  nodeId: string,
  ancestorMap: Map<string, string[]>,
  visibleNodeIds: Set<string>
): string | undefined {
  const ancestors = ancestorMap.get(nodeId) ?? [];
  return ancestors.find((id) => visibleNodeIds.has(id));
}

// =============================================================================
// LOD Filtering
// =============================================================================

/**
 * Filters nodes by LOD level
 */
export function filterNodesByLOD(
  nodes: IVMNode[],
  level: LODLevel,
  includeAncestors: boolean = true
): IVMNode[] {
  // Get directly visible nodes
  const visibleNodes = nodes.filter((n) => isNodeVisibleAtLOD(n, level));
  
  if (!includeAncestors) {
    return visibleNodes;
  }

  // Add ancestors of visible nodes
  const visibleIds = new Set(visibleNodes.map((n) => n.id));
  const ancestorMap = buildAncestorMap(nodes);
  
  const ancestorIds = new Set<string>();
  for (const node of visibleNodes) {
    const ancestors = ancestorMap.get(node.id) ?? [];
    for (const ancestorId of ancestors) {
      if (!visibleIds.has(ancestorId)) {
        ancestorIds.add(ancestorId);
      }
    }
  }

  // Add ancestor nodes
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const ancestorNodes = [...ancestorIds]
    .map((id) => nodeMap.get(id))
    .filter((n): n is IVMNode => n !== undefined);

  return [...visibleNodes, ...ancestorNodes];
}

/**
 * Filters edges by LOD level, optionally collapsing to ancestor nodes
 */
export function filterEdgesByLOD(
  edges: IVMEdge[],
  level: LODLevel,
  visibleNodeIds: Set<string>,
  collapseToAncestors: boolean = true,
  ancestorMap?: Map<string, string[]>
): { edges: IVMEdge[]; collapsedEdges: Map<string, string> } {
  const result: IVMEdge[] = [];
  const collapsedEdges = new Map<string, string>();
  const seenEdges = new Set<string>();

  for (const edge of edges) {
    // Skip edges above current LOD
    if (!isEdgeVisibleAtLOD(edge, level)) {
      continue;
    }

    let source = edge.source;
    let target = edge.target;
    let isCollapsed = false;

    // Check if source is visible
    if (!visibleNodeIds.has(source)) {
      if (collapseToAncestors && ancestorMap) {
        const visibleAncestor = findVisibleAncestor(source, ancestorMap, visibleNodeIds);
        if (visibleAncestor) {
          source = visibleAncestor;
          isCollapsed = true;
        } else {
          continue; // Skip edge if no visible ancestor
        }
      } else {
        continue;
      }
    }

    // Check if target is visible
    if (!visibleNodeIds.has(target)) {
      if (collapseToAncestors && ancestorMap) {
        const visibleAncestor = findVisibleAncestor(target, ancestorMap, visibleNodeIds);
        if (visibleAncestor) {
          target = visibleAncestor;
          isCollapsed = true;
        } else {
          continue; // Skip edge if no visible ancestor
        }
      } else {
        continue;
      }
    }

    // Skip self-loops created by collapsing
    if (source === target) {
      continue;
    }

    // Deduplicate collapsed edges
    const edgeKey = `${source}->${target}:${edge.type}`;
    if (seenEdges.has(edgeKey)) {
      continue;
    }
    seenEdges.add(edgeKey);

    // Create collapsed edge or use original
    if (isCollapsed) {
      const collapsedEdge: IVMEdge = {
        ...edge,
        id: `collapsed_${edge.id}`,
        source,
        target,
        metadata: {
          ...edge.metadata,
          properties: {
            ...edge.metadata.properties,
            collapsed: true,
            originalSource: edge.source,
            originalTarget: edge.target,
          },
        },
      };
      result.push(collapsedEdge);
      collapsedEdges.set(edge.id, collapsedEdge.id);
    } else {
      result.push(edge);
    }
  }

  return { edges: result, collapsedEdges };
}

/**
 * Filters a complete graph by LOD level
 */
export function filterGraphByLOD(
  graph: IVMGraph,
  config: Partial<LODConfig> = {}
): LODFilterResult {
  const fullConfig: LODConfig = { ...DEFAULT_LOD_CONFIG, ...config };
  const { currentLevel, includeAncestors, collapseEdges } = fullConfig;

  // Check if LOD filtering is needed
  if (graph.nodes.length < fullConfig.minNodesForLOD) {
    return {
      visibleNodes: graph.nodes,
      visibleEdges: graph.edges,
      hiddenNodeCount: 0,
      hiddenEdgeCount: 0,
      collapsedEdges: new Map(),
    };
  }

  // Build ancestor map
  const ancestorMap = buildAncestorMap(graph.nodes);

  // Filter nodes
  const visibleNodes = filterNodesByLOD(graph.nodes, currentLevel, includeAncestors);
  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

  // Filter edges
  const { edges: visibleEdges, collapsedEdges } = filterEdgesByLOD(
    graph.edges,
    currentLevel,
    visibleNodeIds,
    collapseEdges,
    ancestorMap
  );

  return {
    visibleNodes,
    visibleEdges,
    hiddenNodeCount: graph.nodes.length - visibleNodes.length,
    hiddenEdgeCount: graph.edges.length - visibleEdges.length,
    collapsedEdges,
  };
}

/**
 * Creates a new graph with only visible elements at the given LOD
 */
export function createLODGraph(
  graph: IVMGraph,
  config: Partial<LODConfig> = {}
): IVMGraph {
  const filterResult = filterGraphByLOD(graph, config);

  return {
    nodes: filterResult.visibleNodes,
    edges: filterResult.visibleEdges,
    metadata: {
      ...graph.metadata,
      stats: {
        ...graph.metadata.stats,
        totalNodes: filterResult.visibleNodes.length,
        totalEdges: filterResult.visibleEdges.length,
      },
      properties: {
        ...graph.metadata.properties,
        lodLevel: config.currentLevel ?? DEFAULT_LOD_CONFIG.currentLevel,
        hiddenNodes: filterResult.hiddenNodeCount,
        hiddenEdges: filterResult.hiddenEdgeCount,
      },
    },
    bounds: graph.bounds, // Keep original bounds for context
  };
}

// =============================================================================
// LOD Transition Helpers
// =============================================================================

/**
 * Gets nodes that become visible when increasing LOD level
 */
export function getNewlyVisibleNodes(
  graph: IVMGraph,
  fromLevel: LODLevel,
  toLevel: LODLevel
): IVMNode[] {
  if (toLevel <= fromLevel) return [];

  return graph.nodes.filter((n) => n.lod > fromLevel && n.lod <= toLevel);
}

/**
 * Gets nodes that become hidden when decreasing LOD level
 */
export function getNewlyHiddenNodes(
  graph: IVMGraph,
  fromLevel: LODLevel,
  toLevel: LODLevel
): IVMNode[] {
  if (toLevel >= fromLevel) return [];

  return graph.nodes.filter((n) => n.lod <= fromLevel && n.lod > toLevel);
}

/**
 * Calculates node counts at each LOD level
 */
export function getNodeCountsByLOD(graph: IVMGraph): Record<LODLevel, number> {
  const counts: Record<LODLevel, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const node of graph.nodes) {
    counts[node.lod]++;
  }

  return counts;
}

/**
 * Calculates cumulative node counts at each LOD level (visible nodes)
 */
export function getCumulativeNodeCounts(graph: IVMGraph): Record<LODLevel, number> {
  const counts = getNodeCountsByLOD(graph);
  const cumulative: Record<LODLevel, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  let total = 0;
  for (let level = 0; level <= 5; level++) {
    total += counts[level as LODLevel];
    cumulative[level as LODLevel] = total;
  }

  return cumulative;
}
