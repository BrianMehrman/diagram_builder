import { describe, it, expect } from 'vitest'
import {
  calculateLodFromDistance,
  calculateLodWithHysteresis,
  cameraDistanceToOrigin,
  LOD_THRESHOLDS,
  HYSTERESIS_FACTOR,
} from './lodCalculatorUtils'

describe('calculateLodFromDistance', () => {
  it('returns 5 at distance 0', () => expect(calculateLodFromDistance(0)).toBe(5))
  it('returns 5 at street threshold', () =>
    expect(calculateLodFromDistance(LOD_THRESHOLDS.street)).toBe(5))
  it('returns 4 just above street threshold', () =>
    expect(calculateLodFromDistance(LOD_THRESHOLDS.street + 1)).toBe(4))
  it('returns 4 at neighborhood threshold', () =>
    expect(calculateLodFromDistance(LOD_THRESHOLDS.neighborhood)).toBe(4))
  it('returns 3 just above neighborhood threshold', () =>
    expect(calculateLodFromDistance(LOD_THRESHOLDS.neighborhood + 1)).toBe(3))
  it('returns 3 at district threshold', () =>
    expect(calculateLodFromDistance(LOD_THRESHOLDS.district)).toBe(3))
  it('returns 2 just above district threshold', () =>
    expect(calculateLodFromDistance(LOD_THRESHOLDS.district + 1)).toBe(2))
  it('returns 2 at approach threshold', () =>
    expect(calculateLodFromDistance(LOD_THRESHOLDS.approach)).toBe(2))
  it('returns 1 just above approach threshold', () =>
    expect(calculateLodFromDistance(LOD_THRESHOLDS.approach + 1)).toBe(1))
  it('returns 1 at very large distance', () => expect(calculateLodFromDistance(10000)).toBe(1))
})

describe('calculateLodWithHysteresis', () => {
  it('zooming in (lower distance): transitions immediately', () => {
    expect(calculateLodWithHysteresis(LOD_THRESHOLDS.neighborhood - 1, 3)).toBe(4)
  })

  it('zooming out: stays at current LOD within hysteresis buffer', () => {
    const buffer = LOD_THRESHOLDS.neighborhood * HYSTERESIS_FACTOR
    const justOutside = LOD_THRESHOLDS.neighborhood + buffer * 0.5
    expect(calculateLodWithHysteresis(justOutside, 4)).toBe(4)
  })

  it('zooming out: drops LOD once past hysteresis buffer', () => {
    const buffer = LOD_THRESHOLDS.neighborhood * HYSTERESIS_FACTOR
    const wellOutside = LOD_THRESHOLDS.neighborhood + buffer * 2
    expect(calculateLodWithHysteresis(wellOutside, 4)).toBe(3)
  })

  it('LOD 3 → LOD 2 hysteresis: stays at 3 within buffer', () => {
    const buffer = LOD_THRESHOLDS.district * HYSTERESIS_FACTOR
    const justOutside = LOD_THRESHOLDS.district + buffer * 0.5
    expect(calculateLodWithHysteresis(justOutside, 3)).toBe(3)
  })

  it('LOD 2 → LOD 1 hysteresis: stays at 2 within buffer', () => {
    const buffer = LOD_THRESHOLDS.approach * HYSTERESIS_FACTOR
    const justOutside = LOD_THRESHOLDS.approach + buffer * 0.5
    expect(calculateLodWithHysteresis(justOutside, 2)).toBe(2)
  })

  it('same distance: no LOD change', () => {
    expect(calculateLodWithHysteresis(50, 4)).toBe(4)
  })
})

describe('cameraDistanceToOrigin', () => {
  it('returns 0 at origin', () => expect(cameraDistanceToOrigin(0, 0, 0)).toBe(0))
  it('returns correct distance for (3, 4, 0)', () =>
    expect(cameraDistanceToOrigin(3, 4, 0)).toBeCloseTo(5))
  it('returns correct distance for (1, 1, 1)', () =>
    expect(cameraDistanceToOrigin(1, 1, 1)).toBeCloseTo(Math.sqrt(3)))
})
