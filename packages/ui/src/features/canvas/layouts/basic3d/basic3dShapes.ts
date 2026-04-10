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

// =============================================================================
// LOD visibility
// =============================================================================

/** Repository and package — the top-level containers visible at LOD 2 (approach). */
const TOP_CONTAINER_TYPES = new Set<NodeType>(['repository', 'package'])

/** All container types — visible at LOD 3 (district). */
export const CONTAINER_TYPES = new Set<NodeType>([
  'repository',
  'package',
  'namespace',
  'module',
  'directory',
])

/** Container + structural types — visible at LOD 4 (neighborhood). */
export const STRUCTURAL_TYPES = new Set<NodeType>([
  ...CONTAINER_TYPES,
  'file',
  'class',
  'interface',
  'type',
])

/**
 * Returns true if a node should be rendered as an individual node at the given LOD level.
 *
 * LOD 1: no individual nodes (cluster layer only)
 * LOD 2: top-level containers only (repository, package)
 * LOD 3: all container nodes (+ namespace, module, directory)
 * LOD 4: container + structural nodes (+ file, class, interface, type) — labels visible
 * LOD 5: all node types
 */
export function isNodeVisibleAtLod(node: IVMNode, lod: number): boolean {
  if (lod >= 5) return true
  if (lod === 4) return STRUCTURAL_TYPES.has(node.type)
  if (lod === 3) return CONTAINER_TYPES.has(node.type)
  if (lod === 2) return TOP_CONTAINER_TYPES.has(node.type)
  return false // LOD 1: cluster layer only
}
