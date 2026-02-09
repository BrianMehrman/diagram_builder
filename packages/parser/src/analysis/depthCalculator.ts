import type { DependencyNode, DependencyEdge } from '../graph/dependency-graph'

/**
 * Result of abstraction depth calculation
 */
export interface DepthResult {
  /** Depth per node ID */
  depths: Map<string, number>
  /** Identified entry point node IDs */
  entryPoints: string[]
  /** Maximum depth value across all nodes */
  maxDepth: number
  /** Node IDs that are unreachable from any entry point */
  orphans: string[]
}

/** Filename patterns that indicate entry points */
const ENTRY_POINT_PATTERNS = [
  /^index\.[tj]sx?$/,
  /^main\.[tj]sx?$/,
  /^app\.[tj]sx?$/,
  /^server\.[tj]sx?$/,
  /^entry\.[tj]sx?$/,
]

/**
 * Identifies entry point nodes using filename heuristics and import analysis.
 *
 * Detection order:
 * 1. Filename pattern matching (index, main, app, server, entry)
 * 2. Files with zero incoming import edges
 * 3. Fallback: root-level files (no directory separators in path)
 *
 * @param nodes - All dependency nodes
 * @param edges - All dependency edges
 * @returns Array of entry point node IDs
 */
export function identifyEntryPoints(
  nodes: DependencyNode[],
  edges: DependencyEdge[]
): string[] {
  if (nodes.length === 0) return []

  // Build set of nodes that are imported by others
  const importedNodeIds = new Set<string>()
  for (const edge of edges) {
    if (edge.type === 'imports') {
      importedNodeIds.add(edge.target)
    }
  }

  const entryPoints = new Set<string>()

  // 1. Detect by filename pattern
  for (const node of nodes) {
    const fileName = node.name || node.path.split('/').pop() || ''
    if (ENTRY_POINT_PATTERNS.some(pattern => pattern.test(fileName))) {
      entryPoints.add(node.id)
    }
  }

  // Build set of nodes that import others (have outgoing import edges)
  const importingNodeIds = new Set<string>()
  for (const edge of edges) {
    if (edge.type === 'imports') {
      importingNodeIds.add(edge.source)
    }
  }

  // 2. Detect by zero incoming import edges (only if node participates in imports)
  for (const node of nodes) {
    if (!importedNodeIds.has(node.id) && importingNodeIds.has(node.id)) {
      entryPoints.add(node.id)
    }
  }

  // 3. Fallback: root-level files if no entry points found
  if (entryPoints.size === 0) {
    for (const node of nodes) {
      if (!node.path.includes('/')) {
        entryPoints.add(node.id)
      }
    }
  }

  // 4. Final fallback: use all nodes if still empty
  if (entryPoints.size === 0) {
    for (const node of nodes) {
      entryPoints.add(node.id)
    }
  }

  return Array.from(entryPoints)
}

/**
 * Calculates abstraction depth for all nodes using multi-source BFS from entry points.
 *
 * Entry points get depth 0. Each import hop increments depth by 1.
 * Only 'imports' edges are followed. BFS guarantees minimum depth when
 * reachable from multiple paths. Unreachable nodes are marked as orphans
 * with depth maxDepth + 1.
 *
 * @param nodes - All dependency nodes
 * @param edges - All dependency edges
 * @returns DepthResult with depths, entry points, max depth, and orphans
 */
export function calculateAbstractionDepth(
  nodes: DependencyNode[],
  edges: DependencyEdge[]
): DepthResult {
  if (nodes.length === 0) {
    return { depths: new Map(), entryPoints: [], maxDepth: 0, orphans: [] }
  }

  // Build adjacency list from import edges only
  const adjacency = new Map<string, string[]>()
  for (const node of nodes) {
    adjacency.set(node.id, [])
  }
  for (const edge of edges) {
    if (edge.type === 'imports') {
      const neighbors = adjacency.get(edge.source)
      if (neighbors) {
        neighbors.push(edge.target)
      }
    }
  }

  // Identify entry points
  const entryPoints = identifyEntryPoints(nodes, edges)

  // Multi-source BFS
  const depths = new Map<string, number>()
  const queue: Array<{ id: string; depth: number }> = []

  for (const ep of entryPoints) {
    depths.set(ep, 0)
    queue.push({ id: ep, depth: 0 })
  }

  let head = 0
  let maxDepth = 0

  while (head < queue.length) {
    const { id, depth } = queue[head++]

    const neighbors = adjacency.get(id) || []
    for (const neighbor of neighbors) {
      if (!depths.has(neighbor)) {
        const nextDepth = depth + 1
        depths.set(neighbor, nextDepth)
        if (nextDepth > maxDepth) {
          maxDepth = nextDepth
        }
        queue.push({ id: neighbor, depth: nextDepth })
      }
    }
  }

  // Handle orphan nodes (unreachable from any entry point)
  const orphans: string[] = []
  const orphanDepth = maxDepth + 1

  for (const node of nodes) {
    if (!depths.has(node.id)) {
      depths.set(node.id, orphanDepth)
      orphans.push(node.id)
    }
  }

  // Update maxDepth if orphans exist
  if (orphans.length > 0) {
    maxDepth = orphanDepth
  }

  return { depths, entryPoints, maxDepth, orphans }
}
