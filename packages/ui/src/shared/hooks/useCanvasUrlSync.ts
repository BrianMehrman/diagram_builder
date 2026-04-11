/**
 * useCanvasUrlSync
 *
 * Two-way sync between URL query params and canvas store state.
 *
 * On mount: reads layout/camera params from URL and applies to store.
 * On change: debounced 500ms write back to URL via history.replaceState.
 *
 * Params managed: layout, cx/cy/cz (camera position), tx/ty/tz (camera target).
 * LOD is omitted — it derives from camera distance automatically.
 */

import { useEffect, useRef } from 'react'
import { useCanvasStore } from '../../features/canvas/store'

const DEBOUNCE_MS = 500

function parseFloatOrNull(value: string | null): number | null {
  if (value === null) return null
  const n = parseFloat(value)
  return isFinite(n) ? n : null
}

function buildUrlParams(
  layout: string,
  position: { x: number; y: number; z: number },
  target: { x: number; y: number; z: number }
): string {
  const params = new URLSearchParams()
  params.set('layout', layout)
  params.set('cx', position.x.toFixed(2))
  params.set('cy', position.y.toFixed(2))
  params.set('cz', position.z.toFixed(2))
  params.set('tx', target.x.toFixed(2))
  params.set('ty', target.y.toFixed(2))
  params.set('tz', target.z.toFixed(2))
  return `${window.location.pathname}?${params.toString()}`
}

export function useCanvasUrlSync(): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // On mount: read URL and apply to store
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    const layout = params.get('layout')
    if (layout === 'city' || layout === 'basic3d') {
      useCanvasStore.getState().setActiveLayout(layout)
    }

    const cx = parseFloatOrNull(params.get('cx'))
    const cy = parseFloatOrNull(params.get('cy'))
    const cz = parseFloatOrNull(params.get('cz'))
    if (cx !== null && cy !== null && cz !== null) {
      useCanvasStore.getState().setCameraPosition({ x: cx, y: cy, z: cz })
    }

    const tx = parseFloatOrNull(params.get('tx'))
    const ty = parseFloatOrNull(params.get('ty'))
    const tz = parseFloatOrNull(params.get('tz'))
    if (tx !== null && ty !== null && tz !== null) {
      useCanvasStore.getState().setCameraTarget({ x: tx, y: ty, z: tz })
    }
  }, [])

  // On state change: debounced write to URL
  useEffect(() => {
    const unsubscribe = useCanvasStore.subscribe((state) => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => {
        const url = buildUrlParams(state.activeLayout, state.camera.position, state.camera.target)
        const currentUrl = `${window.location.pathname}${window.location.search}`
        if (url !== currentUrl) {
          history.replaceState(null, '', url)
        }
        timerRef.current = null
      }, DEBOUNCE_MS)
    })

    return () => {
      unsubscribe()
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])
}
