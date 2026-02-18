/**
 * Smog Utilities
 *
 * Threshold calculation for smog overlay indicators.
 * Smog marks districts above the 75th percentile by average complexity.
 */

import type { GraphNode } from '../../../../shared/types';

/**
 * Extract complexity from node metadata.
 * Checks both `metadata.complexity` and `metadata.properties.complexity`.
 * Returns 0 if absent — satisfies AC-4 (graceful when data absent).
 */
export function getComplexity(node: GraphNode): number {
  const meta = node.metadata;
  if (meta == null) return 0;

  // Direct property
  if (typeof meta.complexity === 'number') return meta.complexity;

  // Nested under properties (parser output format)
  const props = meta.properties;
  if (props != null && typeof props === 'object' && !Array.isArray(props)) {
    const nested = (props as Record<string, unknown>).complexity;
    if (typeof nested === 'number') return nested;
  }

  return 0;
}

/**
 * Calculate average complexity for a set of nodes.
 * Returns 0 if no nodes have complexity data.
 */
export function getAverageComplexity(nodes: GraphNode[]): number {
  if (nodes.length === 0) return 0;

  const complexities = nodes.map(getComplexity);
  const withData = complexities.filter((c) => c > 0);

  if (withData.length === 0) return 0;

  const sum = withData.reduce((acc, c) => acc + c, 0);
  return sum / withData.length;
}

/**
 * Compute the threshold for the 75th percentile of district average complexities.
 * Returns `Infinity` if no districts have complexity data (so no smog renders).
 */
export function computeSmogThreshold(districtAverages: number[]): number {
  const valid = districtAverages.filter((avg) => avg > 0);

  if (valid.length === 0) return Infinity;

  valid.sort((a, b) => b - a);

  // 75th percentile = top 25%
  const cutoffIndex = Math.max(0, Math.ceil(valid.length * 0.25) - 1);
  return valid[cutoffIndex]!;
}

/**
 * Check if a district qualifies for smog overlay.
 */
export function shouldShowSmog(averageComplexity: number, threshold: number): boolean {
  return threshold < Infinity && averageComplexity >= threshold;
}

/**
 * Compute smog opacity based on how far above threshold complexity is.
 * Returns a value between 0.15 and 0.45 for visual subtlety.
 */
export function computeSmogOpacity(averageComplexity: number, threshold: number): number {
  if (threshold <= 0 || threshold === Infinity) return 0;

  const ratio = averageComplexity / threshold;
  // Clamp between 0.15 (barely visible) and 0.45 (clearly visible)
  return Math.min(0.45, Math.max(0.15, (ratio - 1) * 0.3 + 0.15));
}
