/**
 * Building View Utilities
 *
 * Pure utility functions for the BuildingView renderer.
 * Extracted for testability without React Three Fiber dependencies.
 */

import type { Graph, GraphNode } from '../../../shared/types';

/**
 * Room color palette by node type.
 */
export const ROOM_COLORS: Record<string, string> = {
  function: '#3b82f6', // Blue
  method: '#60a5fa', // Light blue
  variable: '#22c55e', // Green
};

/**
 * Get color for a room based on its node type.
 */
export function getRoomColor(nodeType: GraphNode['type']): string {
  return ROOM_COLORS[nodeType] ?? '#6b7280';
}

/**
 * Extract a subgraph containing only the focused file and its descendants.
 * Includes direct children (classes, file-level functions) and grandchildren (methods).
 */
export function extractBuildingSubgraph(
  graph: Graph,
  focusedNodeId: string
): { nodes: GraphNode[]; edges: Graph['edges'] } | null {
  const fileNode = graph.nodes.find((n) => n.id === focusedNodeId);
  if (!fileNode) return null;

  // Direct children of the file
  const directChildren = graph.nodes.filter(
    (n) => n.parentId === focusedNodeId
  );

  // Grandchildren (e.g., methods of classes)
  const directChildIds = new Set(directChildren.map((n) => n.id));
  const grandChildren = graph.nodes.filter(
    (n) => n.parentId !== undefined && directChildIds.has(n.parentId)
  );

  const allNodes = [fileNode, ...directChildren, ...grandChildren];
  const allNodeIds = new Set(allNodes.map((n) => n.id));

  // Filter edges to only include those between relevant nodes
  const relevantEdges = graph.edges.filter(
    (e) => allNodeIds.has(e.source) && allNodeIds.has(e.target)
  );

  return {
    nodes: allNodes,
    edges: relevantEdges,
  };
}
