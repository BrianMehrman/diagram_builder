import type { DependencyNode, DependencyEdge } from '../graph/dependency-graph'

/**
 * Result of containment hierarchy analysis
 */
export interface ContainmentResult {
  /** Map of child node ID → parent node ID */
  parentMap: Map<string, string>
  /** Explicit 'contains' edges linking parents to children */
  containmentEdges: DependencyEdge[]
  /** Node IDs that have no parent (top-level nodes) */
  rootNodes: string[]
}

/** Node types that can act as containers */
const CONTAINER_TYPES = new Set(['file', 'class', 'module'])

/** Node types that are contained by files or classes */
const FILE_CHILD_TYPES = new Set(['class', 'function', 'interface', 'method'])

/**
 * Analyzes DependencyNodes and DependencyEdges to establish containment
 * (parent-child) relationships.
 *
 * Detection uses two strategies:
 * 1. Path-based grouping: nodes sharing the same `path` property where
 *    a 'file' node is the parent of 'class'/'function'/'interface' nodes
 * 2. Edge confirmation: existing 'exports' edges from file → class/function
 *
 * @param nodes - All dependency nodes
 * @param edges - All dependency edges
 * @returns ContainmentResult with parentMap, containment edges, and root nodes
 */
export function buildContainmentHierarchy(
  nodes: DependencyNode[],
  edges: DependencyEdge[]
): ContainmentResult {
  if (nodes.length === 0) {
    return { parentMap: new Map(), containmentEdges: [], rootNodes: [] }
  }

  const parentMap = new Map<string, string>()
  const containmentEdges: DependencyEdge[] = []
  const nodeById = new Map<string, DependencyNode>()

  for (const node of nodes) {
    nodeById.set(node.id, node)
  }

  // Strategy 1: Use existing 'exports' edges from file → class/function
  // These are created by graph-builder for containment
  for (const edge of edges) {
    if (edge.type === 'exports') {
      const sourceNode = nodeById.get(edge.source)
      const targetNode = nodeById.get(edge.target)

      if (
        sourceNode &&
        targetNode &&
        CONTAINER_TYPES.has(sourceNode.type) &&
        FILE_CHILD_TYPES.has(targetNode.type)
      ) {
        parentMap.set(targetNode.id, sourceNode.id)
      }
    }
  }

  // Strategy 2: Path-based grouping for nodes not yet assigned a parent
  // Group non-file nodes by path and look for a file node at the same path
  const fileNodesByPath = new Map<string, DependencyNode>()
  for (const node of nodes) {
    if (node.type === 'file') {
      fileNodesByPath.set(node.path, node)
    }
  }

  for (const node of nodes) {
    if (node.type === 'file') continue
    if (parentMap.has(node.id)) continue // already assigned via edges

    const fileNode = fileNodesByPath.get(node.path)
    if (fileNode && FILE_CHILD_TYPES.has(node.type)) {
      parentMap.set(node.id, fileNode.id)
    }
  }

  // Create explicit 'contains' edges for all parent-child pairs
  for (const [childId, parentId] of parentMap) {
    containmentEdges.push({
      source: parentId,
      target: childId,
      type: 'contains',
      metadata: {},
    })
  }

  // Identify root nodes (no parent)
  const rootNodes: string[] = []
  for (const node of nodes) {
    if (!parentMap.has(node.id)) {
      rootNodes.push(node.id)
    }
  }

  return { parentMap, containmentEdges, rootNodes }
}
