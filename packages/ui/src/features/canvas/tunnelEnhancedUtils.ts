/**
 * Enhanced Tunnel Utilities
 *
 * Pure functions for enhanced dependency tunnel rendering:
 * color mapping, junction sizing, and legend data.
 */

import type { GraphEdge } from '../../shared/types';

/**
 * Dependency type for color coding
 */
export type DependencyType = 'production' | 'dev' | 'peer' | 'type';

/**
 * Color palette by dependency type
 */
export const DEPENDENCY_COLORS: Record<DependencyType, string> = {
  production: '#3b82f6', // Blue
  dev: '#8b5cf6', // Purple
  peer: '#22c55e', // Green
  type: '#6b7280', // Gray
};

/**
 * Legend items for the dependency legend overlay
 */
export const LEGEND_ITEMS: Array<{
  type: DependencyType;
  color: string;
  label: string;
}> = [
  { type: 'production', color: DEPENDENCY_COLORS.production, label: 'Production' },
  { type: 'dev', color: DEPENDENCY_COLORS.dev, label: 'Dev' },
  { type: 'peer', color: DEPENDENCY_COLORS.peer, label: 'Peer' },
  { type: 'type', color: DEPENDENCY_COLORS.type, label: 'Type-only' },
];

/** Base junction sphere size */
const JUNCTION_BASE_SIZE = 0.3;

/** Size increment per tunnel */
const JUNCTION_SIZE_PER_TUNNEL = 0.1;

/** Maximum junction size */
const JUNCTION_MAX_SIZE = 1.5;

/**
 * Get the color for a dependency type.
 * Falls back to production color for unknown types.
 */
export function getDependencyColor(depType: DependencyType): string {
  return DEPENDENCY_COLORS[depType] ?? DEPENDENCY_COLORS.production;
}

/**
 * Compute junction sphere size from the number of tunnels connecting at a node.
 */
export function computeJunctionSize(tunnelCount: number): number {
  const raw = JUNCTION_BASE_SIZE + tunnelCount * JUNCTION_SIZE_PER_TUNNEL;
  return Math.min(raw, JUNCTION_MAX_SIZE);
}

/**
 * Count the number of tunnel connections per node ID.
 * Each edge contributes +1 to both source and target node counts.
 */
export function countTunnelsPerNode(
  edges: GraphEdge[]
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const edge of edges) {
    counts.set(edge.source, (counts.get(edge.source) ?? 0) + 1);
    counts.set(edge.target, (counts.get(edge.target) ?? 0) + 1);
  }
  return counts;
}
