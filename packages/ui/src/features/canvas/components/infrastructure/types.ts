import type { IVMNode, Position3D } from '../../../../shared/types'

/**
 * Common props for all infrastructure landmark components.
 */
export interface InfrastructureProps {
  node: IVMNode
  position: Position3D
}
