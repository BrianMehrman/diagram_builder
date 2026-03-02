import { describe, it, expect } from 'vitest'
import { sortMethodsByVisibility } from './methodUtils'

describe('sortMethodsByVisibility', () => {
  it('sorts public before protected before private', () => {
    const methods = [
      { name: 'doPrivate', visibility: 'private' },
      { name: 'doPublic', visibility: 'public' },
      { name: 'doProtected', visibility: 'protected' },
    ]
    const sorted = sortMethodsByVisibility(methods)
    expect(sorted[0]!.visibility).toBe('public')
    expect(sorted[1]!.visibility).toBe('protected')
    expect(sorted[2]!.visibility).toBe('private')
  })

  it('preserves original order within same visibility tier', () => {
    const methods = [
      { name: 'first', visibility: 'public' },
      { name: 'second', visibility: 'public' },
    ]
    const sorted = sortMethodsByVisibility(methods)
    expect(sorted[0]!.name).toBe('first')
    expect(sorted[1]!.name).toBe('second')
  })

  it('does not mutate the input array', () => {
    const input = [{ visibility: 'private' }, { visibility: 'public' }]
    sortMethodsByVisibility(input)
    expect(input[0]!.visibility).toBe('private')
  })
})
