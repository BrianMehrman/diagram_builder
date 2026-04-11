/**
 * useCanvasUrlSync Tests
 *
 * Tests for two-way sync between URL query params and canvas store state.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCanvasUrlSync } from './useCanvasUrlSync'
import { useCanvasStore } from '../../features/canvas/store'

describe('useCanvasUrlSync', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useCanvasStore.getState().reset()
    useCanvasStore.getState().setActiveLayout('city') // explicit reset — store reset includes activeLayout but be explicit for clarity

    vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  function setLocationSearch(search: string): void {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, search, pathname: '/canvas' },
    })
  }

  // -------------------------------------------------------------------------
  // Mount: reading URL into store
  // -------------------------------------------------------------------------

  it('applies layout=basic3d from URL on mount', () => {
    setLocationSearch('?layout=basic3d')

    renderHook(() => useCanvasUrlSync())

    expect(useCanvasStore.getState().activeLayout).toBe('basic3d')
  })

  it('applies layout=city from URL on mount', () => {
    // Set to basic3d first so we can detect the reset
    useCanvasStore.getState().setActiveLayout('basic3d')
    setLocationSearch('?layout=city')

    renderHook(() => useCanvasUrlSync())

    expect(useCanvasStore.getState().activeLayout).toBe('city')
  })

  it('applies camera position from URL on mount', () => {
    setLocationSearch('?cx=10.00&cy=20.00&cz=30.00')

    renderHook(() => useCanvasUrlSync())

    const { position } = useCanvasStore.getState().camera
    expect(position.x).toBeCloseTo(10)
    expect(position.y).toBeCloseTo(20)
    expect(position.z).toBeCloseTo(30)
  })

  it('applies camera target from URL on mount', () => {
    setLocationSearch('?tx=1.00&ty=2.00&tz=3.00')

    renderHook(() => useCanvasUrlSync())

    const { target } = useCanvasStore.getState().camera
    expect(target.x).toBeCloseTo(1)
    expect(target.y).toBeCloseTo(2)
    expect(target.z).toBeCloseTo(3)
  })

  it('ignores invalid layout value and keeps default', () => {
    setLocationSearch('?layout=invalid')

    renderHook(() => useCanvasUrlSync())

    expect(useCanvasStore.getState().activeLayout).toBe('city')
  })

  it('ignores non-finite camera values and leaves position unchanged', () => {
    setLocationSearch('?cx=NaN&cy=abc&cz=30.00')
    const defaultPosition = useCanvasStore.getState().camera.position

    renderHook(() => useCanvasUrlSync())

    const { position } = useCanvasStore.getState().camera
    expect(position.x).toBe(defaultPosition.x)
    expect(position.y).toBe(defaultPosition.y)
  })

  it('does not apply partial camera position (requires all three components)', () => {
    setLocationSearch('?cx=10.00&cy=20.00') // missing cz
    const defaultPosition = useCanvasStore.getState().camera.position

    renderHook(() => useCanvasUrlSync())

    const { position } = useCanvasStore.getState().camera
    expect(position.x).toBe(defaultPosition.x)
    expect(position.y).toBe(defaultPosition.y)
    expect(position.z).toBe(defaultPosition.z)
  })

  // -------------------------------------------------------------------------
  // State change: writing to URL
  // -------------------------------------------------------------------------

  it('calls history.replaceState after debounce when layout changes', () => {
    setLocationSearch('')
    renderHook(() => useCanvasUrlSync())

    act(() => {
      useCanvasStore.getState().setActiveLayout('basic3d')
    })

    // Not called yet (debounce pending)
    expect(window.history.replaceState).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(window.history.replaceState).toHaveBeenCalledOnce()
    const url = (window.history.replaceState as ReturnType<typeof vi.fn>).mock.calls[0][2] as string
    expect(url).toContain('layout=basic3d')
  })

  it('includes cx in URL after camera position change', () => {
    setLocationSearch('')
    renderHook(() => useCanvasUrlSync())

    act(() => {
      useCanvasStore.getState().setCameraPosition({ x: 50, y: 25, z: 10 })
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    const url = (window.history.replaceState as ReturnType<typeof vi.fn>).mock.calls[0][2] as string
    expect(url).toContain('cx=50.00')
    expect(url).toContain('cy=25.00')
    expect(url).toContain('cz=10.00')
  })

  it('debounces multiple rapid changes into a single replaceState call', () => {
    setLocationSearch('')
    renderHook(() => useCanvasUrlSync())

    act(() => {
      useCanvasStore.getState().setActiveLayout('basic3d')
      useCanvasStore.getState().setCameraPosition({ x: 1, y: 2, z: 3 })
      useCanvasStore.getState().setCameraPosition({ x: 4, y: 5, z: 6 })
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(window.history.replaceState).toHaveBeenCalledOnce()
  })

  it('does not call replaceState before debounce window elapses', () => {
    setLocationSearch('')
    renderHook(() => useCanvasUrlSync())

    act(() => {
      useCanvasStore.getState().setActiveLayout('basic3d')
    })

    act(() => {
      vi.advanceTimersByTime(499)
    })

    expect(window.history.replaceState).not.toHaveBeenCalled()
  })

  it('includes camera target in URL after setCameraTarget', () => {
    setLocationSearch('')
    renderHook(() => useCanvasUrlSync())

    act(() => {
      useCanvasStore.getState().setCameraTarget({ x: 7, y: 8, z: 9 })
    })

    act(() => {
      vi.advanceTimersByTime(500)
    })

    const url = (window.history.replaceState as ReturnType<typeof vi.fn>).mock.calls[0][2] as string
    expect(url).toContain('tx=7.00')
    expect(url).toContain('ty=8.00')
    expect(url).toContain('tz=9.00')
  })

  it('cleans up subscription and timer on unmount', () => {
    setLocationSearch('')
    const { unmount } = renderHook(() => useCanvasUrlSync())

    act(() => {
      useCanvasStore.getState().setActiveLayout('basic3d')
    })

    // Unmount before debounce fires
    unmount()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(window.history.replaceState).not.toHaveBeenCalled()
  })
})
