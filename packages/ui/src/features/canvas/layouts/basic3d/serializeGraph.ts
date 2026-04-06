/**
 * serializeGraph.ts
 *
 * Strips an IVMGraph to structurally-clonable plain objects before postMessage.
 * IVMGraph is already plain-object data, but this guards against any class
 * instances or functions that might slip into `metadata.properties`.
 */

import type { IVMGraph, IVMNode, IVMEdge } from '@diagram-builder/core'

function sanitizeProperties(
  props: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (props === undefined) return undefined
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      result[key] = value
    }
    // Drop functions, class instances, symbols — not structuredClone-safe
  }
  return result
}

function sanitizeNode(node: IVMNode): IVMNode {
  const sanitized = sanitizeProperties(node.metadata.properties)
  return {
    ...node,
    metadata: {
      ...node.metadata,
      ...(sanitized !== undefined ? { properties: sanitized } : {}),
    },
  }
}

function sanitizeEdge(edge: IVMEdge): IVMEdge {
  return { ...edge, metadata: {} }
}

export function serializeGraph(graph: IVMGraph): IVMGraph {
  return {
    ...graph,
    nodes: graph.nodes.map(sanitizeNode),
    edges: graph.edges.map(sanitizeEdge),
  }
}
