/**
 * Shared types for typed building components.
 */

import type { GraphNode, Position3D } from '../../../../shared/types';
import type { EncodedHeightOptions } from '../../views/cityViewUtils';

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
  encodingOptions?: EncodedHeightOptions;
  /** True when this class/interface is inherited or implemented by other classes (Story 11-6/11-7). */
  isBaseClass?: boolean;
}
