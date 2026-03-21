/**
 * Shared types for typed building components.
 */

import type { IVMNode, Position3D, IVMGraph } from '../../../../shared/types'
import type { EncodedHeightOptions } from '../../views/heightUtils'

/**
 * Standard props accepted by all typed building components.
 */
export interface TypedBuildingProps {
  node: IVMNode
  position: Position3D
  graph: IVMGraph
}

/**
 * Extended props for class-like buildings that support floor bands.
 */
export interface ClassBuildingProps extends TypedBuildingProps {
  methods?: IVMNode[]
  lodLevel?: number
  encodingOptions?: EncodedHeightOptions
  /** True when this class/interface is inherited or implemented by other classes (Story 11-6/11-7). */
  isBaseClass?: boolean
}
