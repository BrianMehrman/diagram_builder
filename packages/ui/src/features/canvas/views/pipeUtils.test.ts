import { describe, it, expect } from 'vitest'
import {
  getPipeDepth,
  calculatePipeRoute,
  SHORT_PIPE_THRESHOLD,
  SHORT_PIPE_DEPTH,
  LONG_PIPE_DEPTH,
} from './pipeUtils'

describe('getPipeDepth', () => {
  it('returns SHORT_PIPE_DEPTH for close nodes', () => {
    expect(getPipeDepth({ x: 0, z: 0 }, { x: 1, z: 0 })).toBe(SHORT_PIPE_DEPTH)
  })
  it('returns LONG_PIPE_DEPTH for distant nodes', () => {
    expect(getPipeDepth({ x: 0, z: 0 }, { x: SHORT_PIPE_THRESHOLD + 1, z: 0 })).toBe(
      LONG_PIPE_DEPTH
    )
  })
})

describe('calculatePipeRoute', () => {
  it('returns 5 waypoints', () => {
    const route = calculatePipeRoute({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 0 }, 2)
    expect(route).toHaveLength(5)
  })
  it('starts at source x/z', () => {
    const route = calculatePipeRoute({ x: 3, y: 0, z: 5 }, { x: 10, y: 0, z: 0 }, 2)
    expect(route[0]).toMatchObject({ x: 3, z: 5, y: 0 })
  })
  it('dips underground at pipeDepth', () => {
    const route = calculatePipeRoute({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 0 }, 3)
    expect(route[1]!.y).toBe(-3)
  })
})
