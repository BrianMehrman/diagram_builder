import { describe, it, expect } from 'vitest'
import {
  classifyEdgeRouting,
  calculateWireArcPeak,
  isWireVisible,
  getWireColor,
  isEdgeVisibleForLod,
  WIRE_LOD_MIN,
} from './wireUtils'

describe('classifyEdgeRouting', () => {
  it('calls -> overhead', () => expect(classifyEdgeRouting('calls')).toBe('overhead'))
  it('composes -> overhead', () => expect(classifyEdgeRouting('composes')).toBe('overhead'))
  it('imports -> underground', () => expect(classifyEdgeRouting('imports')).toBe('underground'))
  it('extends -> underground', () => expect(classifyEdgeRouting('extends')).toBe('underground'))
  it('case insensitive', () => expect(classifyEdgeRouting('CALLS')).toBe('overhead'))
})

describe('calculateWireArcPeak', () => {
  it('clears the taller rooftop', () => {
    const peak = calculateWireArcPeak(5, 10, 0)
    expect(peak).toBeGreaterThan(10)
  })
  it('increases with horizontal distance', () => {
    const near = calculateWireArcPeak(5, 5, 10)
    const far = calculateWireArcPeak(5, 5, 50)
    expect(far).toBeGreaterThan(near)
  })
})

describe('isWireVisible', () => {
  it('false below WIRE_LOD_MIN', () => expect(isWireVisible(WIRE_LOD_MIN - 1)).toBe(false))
  it('true at WIRE_LOD_MIN', () => expect(isWireVisible(WIRE_LOD_MIN)).toBe(true))
})

describe('getWireColor', () => {
  it('returns specific color for known type', () => expect(getWireColor('calls')).toBe('#34d399'))
  it('returns default for unknown type', () => expect(getWireColor('unknown')).toBe('#6ee7b7'))
})

describe('isEdgeVisibleForLod', () => {
  const CAMERA = { x: 0, y: 0, z: 0 }
  // dist² = 25, well within EDGE_PROXIMITY_SQ (3600)
  const NEAR_POS = { x: 5, y: 0, z: 0 }
  // dist² = 40000, outside EDGE_PROXIMITY_SQ
  const FAR_POS = { x: 200, y: 0, z: 0 }

  it('LOD 1 with selection: returns false (clusters only, no individual edges)', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', 'src', 1, NEAR_POS, NEAR_POS, CAMERA)).toBe(false)
  })

  it('LOD 2 with source selected: returns true', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', 'src', 2, FAR_POS, FAR_POS, CAMERA)).toBe(true)
  })

  it('LOD 2 with target selected: returns true', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', 'tgt', 2, FAR_POS, FAR_POS, CAMERA)).toBe(true)
  })

  it('LOD 2 with unrelated node selected: returns false', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', 'other', 2, NEAR_POS, NEAR_POS, CAMERA)).toBe(false)
  })

  it('LOD 2 no selection: returns false', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', null, 2, NEAR_POS, NEAR_POS, CAMERA)).toBe(false)
  })

  it('LOD 3 with source selected: returns true', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', 'src', 3, FAR_POS, FAR_POS, CAMERA)).toBe(true)
  })

  it('LOD 3 no selection: returns false', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', null, 3, NEAR_POS, NEAR_POS, CAMERA)).toBe(false)
  })

  it('LOD 4 no selection, source near camera: returns true (proximity)', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', null, 4, NEAR_POS, FAR_POS, CAMERA)).toBe(true)
  })

  it('LOD 4 no selection, target near camera: returns true (proximity)', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', null, 4, FAR_POS, NEAR_POS, CAMERA)).toBe(true)
  })

  it('LOD 4 no selection, both nodes far: returns false', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', null, 4, FAR_POS, FAR_POS, CAMERA)).toBe(false)
  })

  it('LOD 4 with selection, nodes far: returns true (selection beats proximity)', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', 'src', 4, FAR_POS, FAR_POS, CAMERA)).toBe(true)
  })

  it('LOD 4 no selection, undefined positions: returns false', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', null, 4, undefined, undefined, CAMERA)).toBe(false)
  })

  it('LOD 5 no selection, source near camera: returns true (proximity applies at LOD 5)', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', null, 5, NEAR_POS, FAR_POS, CAMERA)).toBe(true)
  })

  it('LOD 5 with selection: returns true', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', 'src', 5, FAR_POS, FAR_POS, CAMERA)).toBe(true)
  })
})

describe('isEdgeVisibleForLod with null cameraPos', () => {
  it('returns true for selected-node edge when cameraPos is null', () => {
    const from = { x: 0, y: 0, z: 0 }
    const to = { x: 10, y: 0, z: 0 }
    expect(isEdgeVisibleForLod('a', 'b', 'a', 4, from, to, null)).toBe(true)
  })

  it('returns false for proximity edge when cameraPos is null', () => {
    const from = { x: 0, y: 0, z: 0 }
    const to = { x: 10, y: 0, z: 0 }
    expect(isEdgeVisibleForLod('a', 'b', null, 4, from, to, null)).toBe(false)
  })
})
