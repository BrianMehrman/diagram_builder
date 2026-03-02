/**
 * Inheritance detection utilities for graph edge analysis.
 *
 * Extracted from cityViewUtils.ts for focused testability.
 */

/**
 * Edge types that represent inheritance/implementation relationships (Story 11-5).
 * Handles both parser output ('extends', 'implements') and IVM/UI type ('inherits').
 */
const INHERITANCE_EDGE_TYPES = new Set(['extends', 'implements', 'inherits'])

/**
 * Determine whether a single node is a base class (i.e. inherited or implemented by another class).
 *
 * A class is a base class if any inheritance-type edge has it as the **target**.
 * Handles `extends`, `implements`, and `inherits` edge types.
 *
 * Pure function — no side effects, no store dependency.
 *
 * @param nodeId - The node ID to check
 * @param edges - All graph edges
 */
export function isBaseClass(
  nodeId: string,
  edges: ReadonlyArray<{ source: string; target: string; type: string }>
): boolean {
  return edges.some((e) => e.target === nodeId && INHERITANCE_EDGE_TYPES.has(e.type))
}

/**
 * Compute the set of node IDs that are base classes across the entire graph.
 *
 * Single pass through edges for efficiency. Returns a Set so lookups are O(1).
 * Handles `extends`, `implements`, and `inherits` edge types (AC-3).
 *
 * @param edges - All graph edges
 * @returns Set of node IDs that are base classes
 */
export function detectBaseClasses(
  edges: ReadonlyArray<{ source: string; target: string; type: string }>
): Set<string> {
  const baseClasses = new Set<string>()
  for (const edge of edges) {
    if (INHERITANCE_EDGE_TYPES.has(edge.type)) {
      baseClasses.add(edge.target)
    }
  }
  return baseClasses
}

/**
 * Build a map of node ID → incoming edge count from the graph's edges.
 * Counts edges where the node is the target.
 */
export function buildIncomingEdgeCounts(
  edges: ReadonlyArray<{ target: string }>
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const edge of edges) {
    counts.set(edge.target, (counts.get(edge.target) ?? 0) + 1)
  }
  return counts
}
