import type { IVMGraph } from '../../../core/src/ivm/types.js'

/**
 * Types of validation errors
 */
export type ValidationErrorType =
  | 'DUPLICATE_NODE_ID'
  | 'INVALID_EDGE_SOURCE'
  | 'INVALID_EDGE_TARGET'
  | 'MISSING_METADATA'

/**
 * Validation error details
 */
export interface ValidationError {
  /** Type of validation error */
  type: ValidationErrorType
  /** Human-readable error message */
  message: string
  /** ID of the node or edge that caused the error */
  id?: string
}

/**
 * Result of IVM validation
 */
export interface ValidationResult {
  /** Whether the IVM graph is valid */
  valid: boolean
  /** List of validation errors (empty if valid) */
  errors: ValidationError[]
}

/**
 * Validates an IVM graph for structural integrity
 *
 * @param graph - IVM graph to validate
 * @returns Validation result with errors if any
 */
export function validateIVM(graph: IVMGraph): ValidationResult {
  const errors: ValidationError[] = []

  // Validate unique node IDs
  const nodeIds = new Set<string>()
  for (const node of graph.nodes) {
    if (nodeIds.has(node.id)) {
      errors.push({
        type: 'DUPLICATE_NODE_ID',
        message: `Duplicate node IDs found: ${node.id}`,
        id: node.id,
      })
    }
    nodeIds.add(node.id)
  }

  // Validate required node metadata
  for (const node of graph.nodes) {
    if (!node.metadata.label || node.metadata.label.trim() === '') {
      errors.push({
        type: 'MISSING_METADATA',
        message: `Node ${node.id} is missing required metadata: label`,
        id: node.id,
      })
    }
    if (!node.metadata.path || node.metadata.path.trim() === '') {
      errors.push({
        type: 'MISSING_METADATA',
        message: `Node ${node.id} is missing required metadata: path`,
        id: node.id,
      })
    }
  }

  // Validate edge references
  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push({
        type: 'INVALID_EDGE_SOURCE',
        message: `Edge ${edge.id} references non-existent source node: ${edge.source}`,
        id: edge.id,
      })
    }
    if (!nodeIds.has(edge.target)) {
      errors.push({
        type: 'INVALID_EDGE_TARGET',
        message: `Edge ${edge.id} references non-existent target node: ${edge.target}`,
        id: edge.id,
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
