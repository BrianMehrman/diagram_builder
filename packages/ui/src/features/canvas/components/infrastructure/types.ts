import type { GraphNode, Position3D } from '../../../../shared/types';

/**
 * Common props for all infrastructure landmark components.
 */
export interface InfrastructureProps {
  node: GraphNode;
  position: Position3D;
}
