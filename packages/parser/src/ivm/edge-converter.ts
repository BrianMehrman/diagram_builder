import type { EdgeInput, EdgeMetadata } from '../../../core/src/ivm/types.js'
import type { DependencyEdge } from '../graph/dependency-graph'

/**
 * Converts a DependencyEdge to EdgeInput format for IVM
 *
 * @param depEdge - Dependency edge to convert
 * @returns EdgeInput for IVM builder
 */
export function convertEdge(depEdge: DependencyEdge): EdgeInput {
  let metadata: EdgeMetadata | undefined

  // Extract standard metadata fields
  const hasLabel = typeof depEdge.metadata.label === 'string'
  const hasWeight = typeof depEdge.metadata.weight === 'number'
  const hasReference = typeof depEdge.metadata.reference === 'string'

  // Identify custom properties
  const customProperties: Record<string, unknown> = {}
  const standardFields = new Set(['label', 'weight', 'reference'])

  for (const [key, value] of Object.entries(depEdge.metadata)) {
    if (!standardFields.has(key)) {
      customProperties[key] = value
    }
  }

  const hasCustomProperties = Object.keys(customProperties).length > 0

  // Only create metadata if there's something to include
  if (hasLabel || hasWeight || hasReference || hasCustomProperties) {
    metadata = {}

    if (hasLabel) {
      metadata.label = depEdge.metadata.label as string
    }

    if (hasWeight) {
      metadata.weight = depEdge.metadata.weight as number
    }

    if (hasReference) {
      metadata.reference = depEdge.metadata.reference as string
    }

    if (hasCustomProperties) {
      metadata.properties = customProperties
    }
  }

  const result: EdgeInput = {
    source: depEdge.source,
    target: depEdge.target,
    type: depEdge.type,
  }

  if (metadata) {
    result.metadata = metadata
  }

  return result
}

/**
 * Converts multiple DependencyEdges to EdgeInput array
 *
 * @param depEdges - Array of dependency edges
 * @returns Array of EdgeInput for IVM builder
 */
export function convertEdges(depEdges: DependencyEdge[]): EdgeInput[] {
  return depEdges.map(convertEdge)
}
