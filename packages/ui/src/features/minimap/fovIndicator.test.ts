/**
 * FOV Indicator Tests
 */

import { describe, it, expect } from 'vitest'
import { calculateFovCorners } from './fovIndicator'

describe('calculateFovCorners', () => {
  it('returns four corner positions', () => {
    const corners = calculateFovCorners(
      { x: 0, y: 10, z: 10 },
      { x: 0, y: 0, z: 0 }
    )

    expect(corners).toHaveProperty('topLeft')
    expect(corners).toHaveProperty('topRight')
    expect(corners).toHaveProperty('bottomLeft')
    expect(corners).toHaveProperty('bottomRight')
  })

  it('produces symmetric corners when camera is centered', () => {
    const corners = calculateFovCorners(
      { x: 0, y: 10, z: 10 },
      { x: 0, y: 0, z: 0 }
    )

    // Left and right should be mirrored around center X
    const centerX = (corners.topLeft.x + corners.topRight.x) / 2
    expect(Math.abs(centerX)).toBeLessThan(1)
  })

  it('wider aspect ratio produces wider FOV', () => {
    const narrow = calculateFovCorners(
      { x: 0, y: 10, z: 10 },
      { x: 0, y: 0, z: 0 },
      50,
      1 // square aspect
    )

    const wide = calculateFovCorners(
      { x: 0, y: 10, z: 10 },
      { x: 0, y: 0, z: 0 },
      50,
      2 // wider aspect
    )

    const narrowWidth = Math.abs(narrow.topRight.x - narrow.topLeft.x)
    const wideWidth = Math.abs(wide.topRight.x - wide.topLeft.x)

    expect(wideWidth).toBeGreaterThan(narrowWidth)
  })

  it('larger FOV degrees produces wider indicator', () => {
    const small = calculateFovCorners(
      { x: 0, y: 10, z: 10 },
      { x: 0, y: 0, z: 0 },
      30,
      16 / 9
    )

    const large = calculateFovCorners(
      { x: 0, y: 10, z: 10 },
      { x: 0, y: 0, z: 0 },
      90,
      16 / 9
    )

    const smallWidth = Math.abs(small.topRight.x - small.topLeft.x)
    const largeWidth = Math.abs(large.topRight.x - large.topLeft.x)

    expect(largeWidth).toBeGreaterThan(smallWidth)
  })

  it('handles camera directly above target', () => {
    // Camera looking straight down
    const corners = calculateFovCorners(
      { x: 5, y: 20, z: 5 },
      { x: 5, y: 0, z: 5 },
      50,
      16 / 9
    )

    // Should still produce valid corners (no NaN)
    expect(Number.isFinite(corners.topLeft.x)).toBe(true)
    expect(Number.isFinite(corners.topLeft.z)).toBe(true)
    expect(Number.isFinite(corners.topRight.x)).toBe(true)
    expect(Number.isFinite(corners.bottomLeft.z)).toBe(true)
  })

  it('moves FOV center when camera target moves', () => {
    const cornersA = calculateFovCorners(
      { x: 0, y: 10, z: 10 },
      { x: 0, y: 0, z: 0 }
    )

    const cornersB = calculateFovCorners(
      { x: 10, y: 10, z: 20 },
      { x: 10, y: 0, z: 10 }
    )

    // Center of cornersB should be shifted by ~10 on X
    const centerAx = (cornersA.topLeft.x + cornersA.topRight.x + cornersA.bottomLeft.x + cornersA.bottomRight.x) / 4
    const centerBx = (cornersB.topLeft.x + cornersB.topRight.x + cornersB.bottomLeft.x + cornersB.bottomRight.x) / 4

    expect(centerBx - centerAx).toBeCloseTo(10, 0)
  })
})
