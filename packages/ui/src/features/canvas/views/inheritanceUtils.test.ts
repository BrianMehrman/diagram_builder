import { describe, it, expect } from 'vitest'
import { isBaseClass, detectBaseClasses, buildIncomingEdgeCounts } from './inheritanceUtils'

const edges = [
  { source: 'A', target: 'B', type: 'extends' },
  { source: 'C', target: 'B', type: 'implements' },
  { source: 'D', target: 'E', type: 'imports' },
]

describe('isBaseClass', () => {
  it('true when node is target of inheritance edge', () => {
    expect(isBaseClass('B', edges)).toBe(true)
  })
  it('false for non-inheritance target', () => {
    expect(isBaseClass('E', edges)).toBe(false)
  })
  it('false for source of inheritance edge', () => {
    expect(isBaseClass('A', edges)).toBe(false)
  })
})

describe('detectBaseClasses', () => {
  it('returns set of all base class IDs', () => {
    const result = detectBaseClasses(edges)
    expect(result.has('B')).toBe(true)
    expect(result.has('E')).toBe(false)
    expect(result.size).toBe(1)
  })
  it('handles inherits type', () => {
    const result = detectBaseClasses([{ source: 'X', target: 'Y', type: 'inherits' }])
    expect(result.has('Y')).toBe(true)
  })
})

describe('buildIncomingEdgeCounts', () => {
  it('counts incoming edges per target', () => {
    const counts = buildIncomingEdgeCounts(edges)
    expect(counts.get('B')).toBe(2)
    expect(counts.get('E')).toBe(1)
    expect(counts.get('A')).toBeUndefined()
  })
  it('returns empty map for empty edges', () => {
    expect(buildIncomingEdgeCounts([])).toEqual(new Map())
  })
})
