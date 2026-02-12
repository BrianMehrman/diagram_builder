/**
 * Shared types for typed building components.
 */

import type { GraphNode, Position3D } from '../../../../shared/types';

/**
 * Standard props accepted by all typed building components.
 */
export interface TypedBuildingProps {
  node: GraphNode;
  position: Position3D;
}

/**
 * Extended props for class-like buildings that support floor bands.
 */
export interface ClassBuildingProps extends TypedBuildingProps {
  methods?: GraphNode[];
  lodLevel?: number;
}
