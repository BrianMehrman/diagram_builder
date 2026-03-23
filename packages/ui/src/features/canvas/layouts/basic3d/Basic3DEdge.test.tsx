import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Basic3DEdge } from './Basic3DEdge'

vi.mock('@react-three/drei', () => ({
  Line: vi.fn(({ points, opacity }: { points: [number, number, number][]; opacity: number }) => (
    <div data-testid="line" data-points={JSON.stringify(points)} data-opacity={opacity} />
  )),
}))

describe('Basic3DEdge', () => {
  const from = { x: 1, y: 2, z: 3 }
  const to = { x: 4, y: 5, z: 6 }

  it('renders a Line element', () => {
    const { getByTestId } = render(<Basic3DEdge from={from} to={to} />)
    expect(getByTestId('line')).toBeDefined()
  })

  it('passes correct points array as [x, y, z] tuples', () => {
    const { getByTestId } = render(<Basic3DEdge from={from} to={to} />)
    const el = getByTestId('line')
    const points = JSON.parse(el.getAttribute('data-points') ?? '[]')
    expect(points).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ])
  })

  it('sets opacity to 0.4', () => {
    const { getByTestId } = render(<Basic3DEdge from={from} to={to} />)
    const el = getByTestId('line')
    expect(parseFloat(el.getAttribute('data-opacity') ?? '0')).toBe(0.4)
  })
})
