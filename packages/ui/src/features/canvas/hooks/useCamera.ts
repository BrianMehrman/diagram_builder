/**
 * useCamera Hook
 *
 * Provides convenient access to camera state and controls
 */

import { useCallback } from 'react'
import { useCanvasStore } from '../store'
import type { Position3D } from '../../../shared/types'

/**
 * Camera hook return type
 */
export interface UseCameraReturn {
  position: Position3D
  target: Position3D
  zoom: number
  setPosition: (position: Position3D) => void
  setTarget: (target: Position3D) => void
  setZoom: (zoom: number) => void
  lookAt: (target: Position3D) => void
  moveTo: (position: Position3D, target?: Position3D) => void
  reset: () => void
}

/**
 * Hook for camera state and controls
 */
export function useCamera(): UseCameraReturn {
  const posX = useCanvasStore((s) => s.camera.position.x)
  const posY = useCanvasStore((s) => s.camera.position.y)
  const posZ = useCanvasStore((s) => s.camera.position.z)
  const targetX = useCanvasStore((s) => s.camera.target.x)
  const targetY = useCanvasStore((s) => s.camera.target.y)
  const targetZ = useCanvasStore((s) => s.camera.target.z)
  const zoom = useCanvasStore((s) => s.camera.zoom)
  const setCameraPosition = useCanvasStore((state) => state.setCameraPosition)
  const setCameraTarget = useCanvasStore((state) => state.setCameraTarget)
  const setZoom = useCanvasStore((state) => state.setZoom)
  const reset = useCanvasStore((state) => state.reset)

  const setPosition = useCallback(
    (position: Position3D) => {
      setCameraPosition(position)
    },
    [setCameraPosition]
  )

  const setTarget = useCallback(
    (target: Position3D) => {
      setCameraTarget(target)
    },
    [setCameraTarget]
  )

  const lookAt = useCallback(
    (target: Position3D) => {
      setCameraTarget(target)
    },
    [setCameraTarget]
  )

  const moveTo = useCallback(
    (position: Position3D, target?: Position3D) => {
      setCameraPosition(position)
      if (target) {
        setCameraTarget(target)
      }
    },
    [setCameraPosition, setCameraTarget]
  )

  return {
    position: { x: posX, y: posY, z: posZ },
    target: { x: targetX, y: targetY, z: targetZ },
    zoom,
    setPosition,
    setTarget,
    setZoom,
    lookAt,
    moveTo,
    reset,
  }
}
