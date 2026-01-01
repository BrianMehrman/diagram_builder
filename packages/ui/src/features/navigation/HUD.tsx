/**
 * HUD Component
 *
 * Heads-up display showing real-time canvas information
 */

import { useEffect, useState } from 'react'
import { useCanvasStore } from '../canvas/store'
import type { GraphNode } from '../../shared/types'

interface HUDProps {
  nodes?: GraphNode[]
  className?: string
}

/**
 * Calculate visible node count based on LOD level
 */
function getVisibleNodeCount(nodes: GraphNode[], lodLevel: number): number {
  return nodes.filter((node) => node.lodLevel <= lodLevel).length
}

/**
 * HUD component
 */
export function HUD({ nodes = [], className = '' }: HUDProps) {
  const camera = useCanvasStore((state) => state.camera)
  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId)
  const lodLevel = useCanvasStore((state) => state.lodLevel)
  const [fps, setFps] = useState(0)

  // FPS counter
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
  const visibleCount = getVisibleNodeCount(nodes, lodLevel)

  return (
    <div
      className={`absolute top-4 left-4 bg-black/75 text-white rounded-lg p-3 font-mono text-xs space-y-1 backdrop-blur-sm ${className}`}
    >
      {/* FPS */}
      <div className="flex justify-between gap-4">
        <span className="text-gray-400">FPS:</span>
        <span className="font-semibold">{fps}</span>
      </div>

      {/* Camera Position */}
      <div className="flex justify-between gap-4">
        <span className="text-gray-400">Camera:</span>
        <span className="font-semibold">
          ({camera.position.x.toFixed(1)}, {camera.position.y.toFixed(1)},{' '}
          {camera.position.z.toFixed(1)})
        </span>
      </div>

      {/* Camera Target */}
      <div className="flex justify-between gap-4">
        <span className="text-gray-400">Target:</span>
        <span className="font-semibold">
          ({camera.target.x.toFixed(1)}, {camera.target.y.toFixed(1)}, {camera.target.z.toFixed(1)})
        </span>
      </div>

      {/* LOD Level */}
      <div className="flex justify-between gap-4">
        <span className="text-gray-400">LOD:</span>
        <span className="font-semibold">Level {lodLevel}</span>
      </div>

      {/* Node Counts */}
      <div className="flex justify-between gap-4">
        <span className="text-gray-400">Nodes:</span>
        <span className="font-semibold">
          {visibleCount} / {nodes.length}
        </span>
      </div>

      {/* Selected Node */}
      {selectedNode && (
        <>
          <div className="border-t border-gray-600 my-1 pt-1" />
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Selected:</span>
            <span className="font-semibold truncate max-w-[150px]">{selectedNode.label}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Type:</span>
            <span className="font-semibold capitalize">{selectedNode.type}</span>
          </div>
          {selectedNode.position && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">Position:</span>
              <span className="font-semibold">
                ({selectedNode.position.x.toFixed(1)}, {selectedNode.position.y.toFixed(1)},{' '}
                {selectedNode.position.z.toFixed(1)})
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
