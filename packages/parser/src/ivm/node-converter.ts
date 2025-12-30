import type { NodeInput, NodeMetadata } from '../../../core/src/ivm/types.js'
import type { DependencyNode } from '../graph/dependency-graph'

/**
 * Converts a DependencyNode to NodeInput format for IVM
 *
 * @param depNode - Dependency node to convert
 * @returns NodeInput for IVM builder
 */
export function convertNode(depNode: DependencyNode): NodeInput {
  const metadata: NodeMetadata = {
    label: depNode.name,
    path: depNode.path,
  }

  // Extract standard metadata fields
  if (typeof depNode.metadata.loc === 'number') {
    metadata.loc = depNode.metadata.loc
  }

  if (typeof depNode.metadata.complexity === 'number') {
    metadata.complexity = depNode.metadata.complexity
  }

  if (typeof depNode.metadata.language === 'string') {
    metadata.language = depNode.metadata.language
  }

  // Extract location if present
  if (
    typeof depNode.metadata.startLine === 'number' &&
    typeof depNode.metadata.endLine === 'number'
  ) {
    metadata.location = {
      startLine: depNode.metadata.startLine,
      endLine: depNode.metadata.endLine,
    }

    if (typeof depNode.metadata.startColumn === 'number') {
      metadata.location.startColumn = depNode.metadata.startColumn
    }

    if (typeof depNode.metadata.endColumn === 'number') {
      metadata.location.endColumn = depNode.metadata.endColumn
    }
  }

  // Store remaining metadata as custom properties
  const customProperties: Record<string, unknown> = {}
  const standardFields = new Set([
    'loc',
    'complexity',
    'language',
    'startLine',
    'endLine',
    'startColumn',
    'endColumn',
  ])

  for (const [key, value] of Object.entries(depNode.metadata)) {
    if (!standardFields.has(key)) {
      customProperties[key] = value
    }
  }

  if (Object.keys(customProperties).length > 0) {
    metadata.properties = customProperties
  }

  return {
    id: depNode.id,
    type: depNode.type,
    metadata,
  }
}

/**
 * Converts multiple DependencyNodes to NodeInput array
 *
 * @param depNodes - Array of dependency nodes
 * @returns Array of NodeInput for IVM builder
 */
export function convertNodes(depNodes: DependencyNode[]): NodeInput[] {
  return depNodes.map(convertNode)
}
