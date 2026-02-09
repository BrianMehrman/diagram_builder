/**
 * Building-to-Cell Transition Utilities
 *
 * Pure functions for calculating camera entry positions and
 * transition fade values when navigating from building → cell view.
 */

import type { Position3D } from '../../../shared/types';

interface CellEntryParams {
  classPosition: Position3D;
  cellRadius: number;
}

interface EntryTarget {
  position: Position3D;
  target: Position3D;
}

/**
 * Calculate camera entry position and look-at target for entering a cell.
 *
 * Camera is positioned inside the cell membrane, offset from center
 * for a good viewing angle of the organelles.
 */
export function calculateCellEntryTarget(params: CellEntryParams): EntryTarget {
  const { classPosition, cellRadius } = params;

  const entryPosition: Position3D = {
    x: classPosition.x + cellRadius * 0.3,
    y: classPosition.y + cellRadius * 0.2,
    z: classPosition.z + cellRadius * 0.5,
  };

  const lookTarget: Position3D = {
    x: classPosition.x,
    y: classPosition.y,
    z: classPosition.z,
  };

  return { position: entryPosition, target: lookTarget };
}

/**
 * Compute opacity for building floors during transition.
 * Focused floor stays fully visible. Non-focused floors fade out.
 */
export function computeFloorFadeOpacity(
  progress: number,
  isFocused: boolean
): number {
  if (isFocused) return 1;
  return Math.max(0, 1 - progress);
}

/**
 * Compute crossfade between room box and cell sphere.
 * At progress 0: box visible, sphere hidden.
 * At progress 1: box hidden, sphere visible.
 */
export function computeRoomToCellProgress(progress: number): {
  boxOpacity: number;
  sphereOpacity: number;
} {
  return {
    boxOpacity: Math.max(0, 1 - progress),
    sphereOpacity: Math.min(1, progress),
  };
}
