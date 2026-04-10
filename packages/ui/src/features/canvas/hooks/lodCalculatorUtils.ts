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
 * - LOD 1 (city):      distance > 200
 * - LOD 2 (approach):  120 < distance <= 200  — repository + package nodes
 * - LOD 3 (district):   60 < distance <= 120  — all container nodes
 * - LOD 4 (neighborhood): 25 < distance <= 60 — + structural nodes (file, class, ...)
 * - LOD 5 (street):   distance <= 25          — all nodes + proximity edges
 */
export const LOD_THRESHOLDS = {
  /** Distance below which LOD 5 (street) activates */
  street: 25,
  /** Distance below which LOD 4 (neighborhood) activates */
  neighborhood: 60,
  /** Distance below which LOD 3 (district) activates */
  district: 120,
  /** Distance below which LOD 2 (approach) activates */
  approach: 200,
} as const

/**
 * Hysteresis buffer as a fraction of the threshold distance.
 */
export const HYSTERESIS_FACTOR = 0.08

/**
 * Calculate the LOD level from camera distance to scene center.
 *
 * @param distance - Euclidean distance from camera to origin
 * @returns LOD level 1-5
 */
export function calculateLodFromDistance(distance: number): number {
  if (distance <= LOD_THRESHOLDS.street) return 5
  if (distance <= LOD_THRESHOLDS.neighborhood) return 4
  if (distance <= LOD_THRESHOLDS.district) return 3
  if (distance <= LOD_THRESHOLDS.approach) return 2
  return 1
}

/**
 * Calculate LOD level with hysteresis to prevent threshold flickering.
 */
export function calculateLodWithHysteresis(distance: number, currentLod: number): number {
  const rawLod = calculateLodFromDistance(distance)

  if (rawLod > currentLod) return rawLod

  if (rawLod < currentLod) {
    const thresholdForCurrentLod = getThresholdForLod(currentLod)
    const buffer = thresholdForCurrentLod * HYSTERESIS_FACTOR

    if (distance > thresholdForCurrentLod + buffer) {
      return rawLod
    }
    return currentLod
  }

  return currentLod
}

/**
 * Get the distance threshold that activates a given LOD level.
 */
function getThresholdForLod(lod: number): number {
  switch (lod) {
    case 5:
      return LOD_THRESHOLDS.street
    case 4:
      return LOD_THRESHOLDS.neighborhood
    case 3:
      return LOD_THRESHOLDS.district
    case 2:
      return LOD_THRESHOLDS.approach
    default:
      return Infinity
  }
}

/**
 * Calculate euclidean distance from camera position to scene origin.
 */
export function cameraDistanceToOrigin(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z)
}
