/**
 * FOV Indicator Utilities
 *
 * Calculates camera frustum boundaries for minimap FOV visualization.
 * Projects the camera's field of view onto the minimap coordinate space.
 */

import type { Position3D } from '../../shared/types'

/**
 * FOV indicator geometry: four corners of the visible area projected onto XZ plane
 */
export interface FovCorners {
  topLeft: { x: number; z: number }
  topRight: { x: number; z: number }
  bottomLeft: { x: number; z: number }
  bottomRight: { x: number; z: number }
}

/**
 * Calculate the FOV indicator corners based on camera position and target.
 *
 * Projects the camera frustum onto the XZ ground plane to show
 * the approximate visible area in the minimap spatial view.
 *
 * @param cameraPosition - Current camera position in 3D space
 * @param cameraTarget - Current camera look-at target
 * @param fovDegrees - Vertical field of view in degrees (default 50)
 * @param aspect - Aspect ratio width/height (default 16/9)
 */
export function calculateFovCorners(
  cameraPosition: Position3D,
  cameraTarget: Position3D,
  fovDegrees: number = 50,
  aspect: number = 16 / 9
): FovCorners {
  // Direction from camera to target (projected onto XZ plane)
  const dx = cameraTarget.x - cameraPosition.x
  const dz = cameraTarget.z - cameraPosition.z

  // Distance from camera to target (XZ projection)
  const dist = Math.sqrt(dx * dx + dz * dz)

  // Height of camera above target determines spread
  const height = Math.abs(cameraPosition.y - cameraTarget.y)
  const effectiveDist = Math.max(dist, 1) // Avoid division by zero

  // Half-angles of the frustum
  const halfFovRad = ((fovDegrees / 2) * Math.PI) / 180
  const halfHeight = Math.tan(halfFovRad) * Math.max(height, effectiveDist)
  const halfWidth = halfHeight * aspect

  // Normalize direction
  const length = Math.max(Math.sqrt(dx * dx + dz * dz), 0.001)
  const ndx = dx / length
  const ndz = dz / length

  // Perpendicular direction (rotate 90 degrees in XZ plane)
  const px = -ndz
  const pz = ndx

  // Center of the FOV on the ground (target position)
  const cx = cameraTarget.x
  const cz = cameraTarget.z

  // Forward offset (half the depth of visible area)
  const fwdOffset = halfHeight * 0.5

  return {
    topLeft: {
      x: cx + ndx * fwdOffset - px * halfWidth,
      z: cz + ndz * fwdOffset - pz * halfWidth,
    },
    topRight: {
      x: cx + ndx * fwdOffset + px * halfWidth,
      z: cz + ndz * fwdOffset + pz * halfWidth,
    },
    bottomLeft: {
      x: cx - ndx * fwdOffset - px * halfWidth,
      z: cz - ndz * fwdOffset - pz * halfWidth,
    },
    bottomRight: {
      x: cx - ndx * fwdOffset + px * halfWidth,
      z: cz - ndz * fwdOffset + pz * halfWidth,
    },
  }
}
