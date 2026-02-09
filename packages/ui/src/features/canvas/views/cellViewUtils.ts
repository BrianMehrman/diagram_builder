/**
 * Cell View Utilities
 *
 * Pure utility functions for the CellView renderer.
 * Extracted for testability without React Three Fiber dependencies.
 */

import type { Graph, GraphNode } from '../../../shared/types';

/**
 * Organelle color palette by node type.
 */
export const ORGANELLE_COLORS: Record<string, string> = {
  function: '#3b82f6', // Blue
  method: '#60a5fa', // Light blue
  variable: '#22c55e', // Green
};

/**
 * Get color for an organelle based on its node type.
 */
export function getOrganelleColor(nodeType: GraphNode['type']): string {
  return ORGANELLE_COLORS[nodeType] ?? '#6b7280';
}

/**
 * Organelle shape types.
 */
export type OrganelleShape = 'sphere' | 'cube';

/**
 * Get the 3D shape for an organelle based on its node type.
 */
export function getOrganelleShape(nodeType: GraphNode['type']): OrganelleShape {
  switch (nodeType) {
    case 'variable':
      return 'cube';
    case 'function':
    case 'method':
    default:
      return 'sphere';
  }
}

/**
 * Base organelle size.
 */
const BASE_SIZE = 0.5;

/**
 * Calculate organelle size based on metadata (line count / complexity).
 * Larger methods get larger organelles via logarithmic scaling.
 */
export function getOrganelleSize(metadata: Record<string, unknown>): number {
  const lineCount = (metadata.lineCount as number) ?? 10;
  const clamped = Math.max(1, lineCount);
  return BASE_SIZE * (1 + Math.log10(clamped) * 0.3);
}

/**
 * Extract a subgraph containing only the focused class and its children (organelles).
 */
export function extractCellSubgraph(
  graph: Graph,
  focusedNodeId: string
): { nodes: GraphNode[]; edges: Graph['edges'] } | null {
  const cellNode = graph.nodes.find((n) => n.id === focusedNodeId);
  if (!cellNode) return null;

  // Direct children of the class
  const children = graph.nodes.filter((n) => n.parentId === focusedNodeId);

  const allNodes = [cellNode, ...children];
  const allNodeIds = new Set(allNodes.map((n) => n.id));

  // Filter edges to only include those between organelles
  const relevantEdges = graph.edges.filter(
    (e) => allNodeIds.has(e.source) && allNodeIds.has(e.target)
  );

  return {
    nodes: allNodes,
    edges: relevantEdges,
  };
}
