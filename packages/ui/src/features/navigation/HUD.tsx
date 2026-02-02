/**
 * HUD Component
 *
 * Heads-up display showing real-time workspace statistics.
 * Uses semantic HTML (dl/dt/dd) with ARIA attributes for accessibility.
 *
 * Stats: Nodes, Files, FPS, Control Mode
 */

import { useEffect, useState } from 'react'
import { useCanvasStore } from '../canvas/store'
import type { GraphNode } from '../../shared/types'

interface HUDProps {
  nodes?: GraphNode[]
  className?: string
}

export function HUD({ nodes = [], className = '' }: HUDProps) {
  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId)
  const controlMode = useCanvasStore((state) => state.controlMode)
  const [fps, setFps] = useState(0)

  // FPS counter - throttled to 1s updates
  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()

    const measureFps = () => {
      frameCount++
      const currentTime = performance.now()
      const elapsed = currentTime - lastTime

      if (elapsed >= 1000) {
        setFps(Math.round((frameCount * 1000) / elapsed))
        frameCount = 0
        lastTime = currentTime
      }

      requestAnimationFrame(measureFps)
    }

    const rafId = requestAnimationFrame(measureFps)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)
  const totalNodes = nodes.length
  const fileCount = nodes.filter((n) => n.type === 'file').length

  const fpsColorClass = fps > 30 ? 'text-green-400' : 'text-red-400'
  const modeLabel = controlMode === 'fly' ? 'Fly ✈️' : 'Orbit 🔄'

  return (
    <div
      className={`absolute top-4 left-4 w-[200px] text-white rounded-lg p-3 text-xs backdrop-blur-md ${className}`}
      style={{ backgroundColor: 'rgba(26, 31, 46, 0.95)' }}
      aria-label="Workspace statistics"
      tabIndex={-1}
    >
      <dl className="space-y-1.5" aria-live="polite">
        {/* Nodes */}
        <div className="flex justify-between items-center">
          <dt className="text-gray-400">Nodes</dt>
          <dd className="font-semibold">{totalNodes}</dd>
        </div>

        {/* Files */}
        <div className="flex justify-between items-center">
          <dt className="text-gray-400">Files</dt>
          <dd className="font-semibold">{fileCount}</dd>
        </div>

        {/* FPS */}
        <div className="flex justify-between items-center">
          <dt className="text-gray-400">FPS</dt>
          <dd className={`font-semibold ${fpsColorClass}`} data-testid="fps-value">
            {fps}
          </dd>
        </div>

        {/* Control Mode */}
        <div className="flex justify-between items-center">
          <dt className="text-gray-400">Mode</dt>
          <dd className="font-semibold">{modeLabel}</dd>
        </div>
      </dl>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="border-t border-gray-600 mt-2 pt-2 space-y-1">
          <div className="flex justify-between gap-2">
            <span className="text-gray-400">Selected:</span>
            <span className="font-semibold truncate max-w-[120px]">{selectedNode.label}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-400">Type:</span>
            <span className="font-semibold capitalize">{selectedNode.type}</span>
          </div>
        </div>
      )}
    </div>
  )
}
