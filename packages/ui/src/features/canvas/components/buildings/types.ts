/**
 * Shared types for typed building components.
 */

import type { GraphNode, Position3D, Graph } from '../../../../shared/types'
import type { EncodedHeightOptions } from '../../views/heightUtils'

/**
 * Standard props accepted by all typed building components.
 */
export interface TypedBuildingProps {
  node: GraphNode
  position: Position3D
  graph: Graph
}

/**
 * Extended props for class-like buildings that support floor bands.
 */
export interface ClassBuildingProps extends TypedBuildingProps {
  methods?: GraphNode[]
  lodLevel?: number
  encodingOptions?: EncodedHeightOptions
  /** True when this class/interface is inherited or implemented by other classes (Story 11-6/11-7). */
  isBaseClass?: boolean
}
