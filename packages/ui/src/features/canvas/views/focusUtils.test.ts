import { describe, it, expect } from 'vitest'
import { getNodeFocusOpacity } from './focusUtils'

describe('getNodeFocusOpacity', () => {
  const direct = new Set(['B', 'C'])
  const secondHop = new Set(['D'])

  it('returns 1.0 when no focus mode', () => {
    expect(getNodeFocusOpacity('X', null, direct, secondHop)).toBe(1.0)
  })
  it('returns 1.0 for the focused node itself', () => {
    expect(getNodeFocusOpacity('A', 'A', direct, secondHop)).toBe(1.0)
  })
  it('returns 1.0 for direct connections', () => {
    expect(getNodeFocusOpacity('B', 'A', direct, secondHop)).toBe(1.0)
  })
  it('returns 0.5 for second-hop nodes', () => {
    expect(getNodeFocusOpacity('D', 'A', direct, secondHop)).toBe(0.5)
  })
  it('returns 0.15 for unrelated nodes', () => {
    expect(getNodeFocusOpacity('Z', 'A', direct, secondHop)).toBe(0.15)
  })
})
