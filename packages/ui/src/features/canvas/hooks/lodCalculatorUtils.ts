/**
 * LOD Calculator Utilities
 *
 * Pure functions that map camera distance to LOD level with
 * hysteresis to prevent flickering at threshold boundaries.
 */

/**
 * Distance thresholds for LOD transitions (in world units).
 * Camera closer than the threshold gets the higher LOD level.
 *
 * - LOD 1 (city):         distance > 120
 * - LOD 2 (district):     60 < distance <= 120
 * - LOD 3 (neighborhood): 25 < distance <= 60
 * - LOD 4 (street):       distance <= 25
 */
export const LOD_THRESHOLDS = {
  /** Distance below which LOD 4 (street) activates */
  street: 25,
  /** Distance below which LOD 3 (neighborhood) activates */
  neighborhood: 60,
  /** Distance below which LOD 2 (district) activates */
  district: 120,
} as const;

/**
 * Hysteresis buffer as a fraction of the threshold distance.
 * When transitioning to a lower LOD (zooming out), the camera must
 * cross the threshold plus this buffer before the LOD drops.
 * Prevents flickering at boundaries.
 */
export const HYSTERESIS_FACTOR = 0.08;

/**
 * Calculate the LOD level from camera distance to scene center.
 *
 * @param distance - Euclidean distance from camera to origin
 * @returns LOD level 1-4
 */
export function calculateLodFromDistance(distance: number): number {
  if (distance <= LOD_THRESHOLDS.street) return 4;
  if (distance <= LOD_THRESHOLDS.neighborhood) return 3;
  if (distance <= LOD_THRESHOLDS.district) return 2;
  return 1;
}

/**
 * Calculate LOD level with hysteresis to prevent threshold flickering.
 *
 * When zooming out (increasing distance), the LOD won't drop until the
 * camera passes the threshold + buffer. When zooming in, it transitions
 * at the exact threshold.
 *
 * @param distance - Current camera distance
 * @param currentLod - Current LOD level
 * @returns New LOD level (may be same as current)
 */
export function calculateLodWithHysteresis(
  distance: number,
  currentLod: number,
): number {
  const rawLod = calculateLodFromDistance(distance);

  // Zooming in (higher LOD) — transition immediately
  if (rawLod > currentLod) return rawLod;

  // Zooming out (lower LOD) — require hysteresis buffer
  if (rawLod < currentLod) {
    // Check if we've passed the threshold by enough margin
    const thresholdForCurrentLod = getThresholdForLod(currentLod);
    const buffer = thresholdForCurrentLod * HYSTERESIS_FACTOR;

    if (distance > thresholdForCurrentLod + buffer) {
      return rawLod;
    }
    // Stay at current LOD (within hysteresis zone)
    return currentLod;
  }

  return currentLod;
}

/**
 * Get the distance threshold that activates a given LOD level.
 */
function getThresholdForLod(lod: number): number {
  switch (lod) {
    case 4: return LOD_THRESHOLDS.street;
    case 3: return LOD_THRESHOLDS.neighborhood;
    case 2: return LOD_THRESHOLDS.district;
    default: return Infinity;
  }
}

/**
 * Calculate euclidean distance from camera position to scene origin.
 */
export function cameraDistanceToOrigin(
  x: number,
  y: number,
  z: number,
): number {
  return Math.sqrt(x * x + y * y + z * z);
}
