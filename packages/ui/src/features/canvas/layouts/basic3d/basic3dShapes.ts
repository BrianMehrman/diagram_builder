/**
 * basic3dShapes.ts
 *
 * Pure data module providing shape and color lookup tables for all 13 valid
 * NodeType values. No React imports — safe to use anywhere.
 */

import type { NodeType, IVMNode } from '@diagram-builder/core'

// =============================================================================
// Shape type
// =============================================================================

export type Basic3DShape =
  | 'disc'
  | 'large-disc'
  | 'box'
  | 'large-box'
  | 'very-large-box'
  | 'sphere'
  | 'small-sphere'
  | 'icosahedron'
  | 'octahedron'
  | 'cylinder'
  | 'torus'

// =============================================================================
// Lookup tables
// =============================================================================

const SHAPE_MAP: Record<NodeType, Basic3DShape> = {
  file: 'disc',
  directory: 'large-disc',
  module: 'disc',
  class: 'box',
  interface: 'icosahedron',
  type: 'icosahedron',
  function: 'sphere',
  method: 'small-sphere',
  variable: 'octahedron',
  enum: 'cylinder',
  namespace: 'torus',
  package: 'large-box',
  repository: 'very-large-box',
}

const COLOR_MAP: Record<NodeType, string> = {
  function: '#4A90D9',
  method: '#4A90D9',
  class: '#E67E22',
  interface: '#95A5A6',
  type: '#95A5A6',
  file: '#27AE60',
  directory: '#27AE60',
  module: '#27AE60',
  variable: '#9B59B6',
  enum: '#F39C12',
  namespace: '#ECEFF1',
  package: '#ECEFF1',
  repository: '#ECEFF1',
}

// =============================================================================
// Exported functions
// =============================================================================

/**
 * Returns the base 3D shape for a given NodeType.
 * Abstract modifier (wireframe/outline treatment) is handled separately by the renderer.
 */
export function getShapeForType(type: NodeType): Basic3DShape {
  return SHAPE_MAP[type]
}

/**
 * Returns the hex color string for a given NodeType.
 */
export function getColorForType(type: NodeType): string {
  return COLOR_MAP[type]
}

/**
 * Returns true if the node is marked as abstract via metadata.properties.isAbstract === true.
 */
export function isAbstractNode(node: IVMNode): boolean {
  return node.metadata?.properties?.['isAbstract'] === true
}
