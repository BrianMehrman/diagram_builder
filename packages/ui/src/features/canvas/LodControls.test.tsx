/**
 * LodControls Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { LodControls } from './LodControls'
import { useCanvasStore } from './store'

describe('LodControls', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset()
  })

  it('renders level buttons 1–5', () => {
    render(<LodControls />)

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole('button', { name: new RegExp(`LOD ${i}`) })).toBeDefined()
    }
  })

  it('shows Auto mode by default', () => {
    render(<LodControls />)

    expect(screen.getByRole('button', { name: /toggle manual lod/i }).textContent).toBe('Auto')
  })

  it('clicking a level button switches to Manual and updates lodLevel', () => {
    render(<LodControls />)

    act(() => {
      screen.getByRole('button', { name: /LOD 2/ }).click()
    })

    expect(useCanvasStore.getState().lodLevel).toBe(2)
    expect(useCanvasStore.getState().lodManualOverride).toBe(true)
    expect(screen.getByRole('button', { name: /toggle manual lod/i }).textContent).toBe('Manual')
  })

  it('toggle button enables and disables manual override', () => {
    render(<LodControls />)

    act(() => {
      screen.getByRole('button', { name: /toggle manual lod/i }).click()
    })

    expect(useCanvasStore.getState().lodManualOverride).toBe(true)

    act(() => {
      screen.getByRole('button', { name: /toggle manual lod/i }).click()
    })

    expect(useCanvasStore.getState().lodManualOverride).toBe(false)
  })

  it('highlights the active LOD level button', () => {
    render(<LodControls />)

    // Default lodLevel is 1
    const activeButton = screen.getByRole('button', { name: /LOD 1/ })
    expect(activeButton.className).toContain('bg-blue-600')
  })

  it('shows level label below buttons', () => {
    render(<LodControls />)

    // Default level 1 = 'City (clusters)'
    expect(screen.getByText('City (clusters)')).toBeDefined()
  })
})
