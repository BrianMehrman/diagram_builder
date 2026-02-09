/**
 * City-to-Building Transition Utilities
 *
 * Pure functions for calculating camera entry positions and
 * transition fade values when navigating from city → building view.
 */

import type { Position3D } from '../../../shared/types';

interface BuildingEntryParams {
  buildingPosition: Position3D;
  buildingWidth: number;
  buildingHeight: number;
  buildingDepth: number;
}

interface EntryTarget {
  position: Position3D;
  target: Position3D;
}

/**
 * Calculate camera entry position and look-at target for entering a building.
 *
 * Camera is positioned just outside the front face, centered on the building,
 * at 30% of building height, looking at the center of the building.
 */
export function calculateBuildingEntryTarget(params: BuildingEntryParams): EntryTarget {
  const { buildingPosition, buildingWidth, buildingHeight, buildingDepth } = params;

  const centerX = buildingPosition.x + buildingWidth / 2;
  const eyeY = buildingPosition.y + buildingHeight * 0.3;

  const entryPosition: Position3D = {
    x: centerX,
    y: eyeY,
    z: buildingPosition.z + buildingDepth + 2, // just outside front face
  };

  const lookTarget: Position3D = {
    x: centerX,
    y: eyeY,
    z: buildingPosition.z + buildingDepth / 2, // center of building
  };

  return { position: entryPosition, target: lookTarget };
}

/**
 * Compute opacity for non-target city buildings during transition.
 * Fades from 1 (fully visible) to 0 (hidden) as progress goes 0 → 1.
 */
export function computeCityFadeOpacity(progress: number): number {
  return Math.max(0, 1 - progress);
}

/**
 * Compute opacity for building interior elements during transition.
 * Fades from 0 (hidden) to 1 (fully visible) as progress goes 0 → 1.
 */
export function computeInteriorRevealOpacity(progress: number): number {
  return Math.min(1, progress);
}
