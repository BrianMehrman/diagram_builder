/**
 * useTransitMapStyle Hook
 *
 * Returns material overrides for buildings when transit-map mode is active.
 * Buildings fade to 0.15 opacity so edges dominate the visual.
 */

import { useCanvasStore } from '../store';

export interface TransitMapBuildingStyle {
  opacity: number;
  transparent: boolean;
}

const TRANSIT_MAP_BUILDING_OPACITY = 0.15;
const NORMAL_BUILDING_OPACITY = 1.0;

/**
 * Returns opacity/transparent overrides for building materials.
 * When transitMapMode is active, buildings fade to 0.15 opacity.
 */
export function useTransitMapStyle(): TransitMapBuildingStyle {
  const transitMapMode = useCanvasStore((s) => s.citySettings.transitMapMode);

  if (transitMapMode) {
    return { opacity: TRANSIT_MAP_BUILDING_OPACITY, transparent: true };
  }

  return { opacity: NORMAL_BUILDING_OPACITY, transparent: false };
}
