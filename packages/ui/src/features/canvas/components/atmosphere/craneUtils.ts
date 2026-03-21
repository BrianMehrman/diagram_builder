/**
 * Crane Utilities
 *
 * Threshold calculation for construction crane indicators.
 * Cranes mark buildings in the top 10% by change frequency.
 */

import type { IVMNode } from '../../../../shared/types'

/**
 * Extract changeCount from node metadata.
 * Checks both `metadata.changeCount` and `metadata.properties.changeCount`.
 * Returns 0 if absent — satisfies AC-4 (graceful when data absent).
 */
export function getChangeCount(node: IVMNode): number {
  const meta = node.metadata
  if (meta == null) return 0

  // Nested under properties (parser output format)
  const props = meta.properties
  if (props != null && typeof props === 'object' && !Array.isArray(props)) {
    const nested = props.changeCount
    if (typeof nested === 'number') return nested
  }

  return 0
}

/**
 * Compute the threshold for the top 10% of nodes by change count.
 * Returns `Infinity` if no nodes have change data (so no cranes render).
 */
export function computeCraneThreshold(nodes: IVMNode[]): number {
  const counts = nodes.map(getChangeCount).filter((c) => c > 0)

  if (counts.length === 0) return Infinity

  counts.sort((a, b) => b - a)

  // Top 10% index: at least 1 node qualifies
  const cutoffIndex = Math.max(0, Math.ceil(counts.length * 0.1) - 1)
  return counts[cutoffIndex] ?? 0
}

/**
 * Check if a node qualifies for a construction crane.
 */
export function shouldShowCrane(node: IVMNode, threshold: number): boolean {
  return threshold < Infinity && getChangeCount(node) >= threshold
}
