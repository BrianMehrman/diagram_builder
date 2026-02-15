/**
 * HUD Component
 *
 * Heads-up display showing real-time workspace statistics.
 * Uses semantic HTML (dl/dt/dd) with ARIA attributes for accessibility.
 *
 * Stats: Nodes, Files, FPS, Control Mode, LOD, Camera Coords, Selected/Hovered Node
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
  const hoveredNodeId = useCanvasStore((state) => state.hoveredNodeId)
  const controlMode = useCanvasStore((state) => state.controlMode)
  const camera = useCanvasStore((state) => state.camera)
  const lodLevel = useCanvasStore((state) => state.lodLevel)
  const layoutPositions = useCanvasStore((state) => state.layoutPositions)
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
  const hoveredNode = nodes.find((n) => n.id === hoveredNodeId)
  const totalNodes = nodes.length
  const fileCount = nodes.filter((n) => n.type === 'file').length

  const fpsColorClass = fps > 30 ? 'text-green-400' : 'text-red-400'
  const modeLabel = controlMode === 'fly' ? 'Fly' : 'Orbit'

  // Get layout position for selected node
  const selectedLayoutPos = selectedNodeId ? layoutPositions.get(selectedNodeId) : undefined

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

        {/* LOD Level */}
        <div className="flex justify-between items-center">
          <dt className="text-gray-400">LOD</dt>
          <dd className="font-semibold">{lodLevel}</dd>
        </div>
      </dl>

      {/* Camera Coordinates */}
      <div className="border-t border-gray-600 mt-2 pt-2">
        <div className="text-gray-400 text-[10px] uppercase tracking-wide mb-1">Camera</div>
        <div className="font-mono text-[10px] text-gray-300">
          {camera.position.x.toFixed(2)}, {camera.position.y.toFixed(2)}, {camera.position.z.toFixed(2)}
        </div>
      </div>

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
          {selectedLayoutPos && (
            <div>
              <span className="text-gray-400 text-[10px]">Pos: </span>
              <span className="font-mono text-[10px] text-gray-300">
                {selectedLayoutPos.x.toFixed(2)}, {selectedLayoutPos.y.toFixed(2)}, {selectedLayoutPos.z.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Hovered Node Info */}
      {hoveredNode && hoveredNode.id !== selectedNodeId && (
        <div className="border-t border-gray-600 mt-2 pt-2 space-y-1" data-testid="hovered-node-info">
          <div className="flex justify-between gap-2">
            <span className="text-gray-400">Hover:</span>
            <span className="font-semibold truncate max-w-[120px]">{hoveredNode.label}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-gray-400">Type:</span>
            <span className="font-semibold capitalize">{hoveredNode.type}</span>
          </div>
        </div>
      )}
    </div>
  )
}
