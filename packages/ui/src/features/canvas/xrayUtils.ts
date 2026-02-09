/**
 * X-Ray Mode Utilities
 *
 * Pure functions for X-ray mode rendering calculations.
 * Extracted for testability without React Three Fiber dependencies.
 */

/**
 * Compute wall opacity based on X-ray mode state.
 * Returns 1 (solid) when off, xrayOpacity when on.
 */
export function computeXRayWallOpacity(
  isXRayMode: boolean,
  xrayOpacity: number
): number {
  return isXRayMode ? xrayOpacity : 1;
}

/**
 * Whether to show internal detail for a building in X-ray mode.
 * Only shows detail for nearby buildings to maintain performance.
 */
export function shouldShowXRayDetail(
  isXRayMode: boolean,
  distanceToCamera: number,
  detailDistance: number
): boolean {
  if (!isXRayMode) return false;
  return distanceToCamera <= detailDistance;
}
