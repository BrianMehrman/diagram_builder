import { describe, it, expect } from 'vitest'
import { sortMethodsByVisibility } from './methodUtils'
import type { IVMNode } from '../../../shared/types'

function makeMethod(name: string, visibility: string): IVMNode {
  return {
    id: name,
    type: 'method',
    metadata: { label: name, path: `src/${name}.ts`, properties: { visibility } },
    lod: 1,
    position: { x: 0, y: 0, z: 0 },
  }
}

describe('sortMethodsByVisibility', () => {
  it('sorts public before protected before private', () => {
    const methods = [
      makeMethod('doPrivate', 'private'),
      makeMethod('doPublic', 'public'),
      makeMethod('doProtected', 'protected'),
    ]
    const sorted = sortMethodsByVisibility(methods)
    expect((sorted[0]!.metadata.properties?.visibility as string)).toBe('public')
    expect((sorted[1]!.metadata.properties?.visibility as string)).toBe('protected')
    expect((sorted[2]!.metadata.properties?.visibility as string)).toBe('private')
  })

  it('preserves original order within same visibility tier', () => {
    const methods = [
      makeMethod('first', 'public'),
      makeMethod('second', 'public'),
    ]
    const sorted = sortMethodsByVisibility(methods)
    expect(sorted[0]!.id).toBe('first')
    expect(sorted[1]!.id).toBe('second')
  })

  it('does not mutate the input array', () => {
    const input = [makeMethod('a', 'private'), makeMethod('b', 'public')]
    sortMethodsByVisibility(input)
    expect((input[0]!.metadata.properties?.visibility as string)).toBe('private')
  })
})
