// packages/ui/src/features/canvas/layouts/index.test.ts
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCanvasStore } from '../store'
import { useLayout } from './index'

describe('useLayout', () => {
  it('returns city engine when activeLayout is city', () => {
    useCanvasStore.setState({ activeLayout: 'city' })
    const { result } = renderHook(() => useLayout())
    expect(result.current.engine.id).toBe('city')
  })

  it('returns basic3d engine when activeLayout is basic3d', () => {
    useCanvasStore.setState({ activeLayout: 'basic3d' })
    const { result } = renderHook(() => useLayout())
    expect(result.current.engine.id).toBe('basic3d')
  })

  it('each engine has a component', () => {
    useCanvasStore.setState({ activeLayout: 'city' })
    const { result } = renderHook(() => useLayout())
    expect(result.current.engine.component).toBeDefined()
  })
})
