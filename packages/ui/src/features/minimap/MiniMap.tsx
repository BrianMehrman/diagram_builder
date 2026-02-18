/**
 * MiniMap Component
 *
 * Combines file tree view and 3D spatial overview with click-to-jump navigation,
 * FOV indicator, and collapsible panel.
 */

import { useState, useCallback } from 'react'
import { FileTreeView } from './FileTreeView'
import { SpatialOverview } from './SpatialOverview'
import { useCanvasStore } from '../canvas/store'
import { useCameraFlight } from '../navigation/useCameraFlight'
import type { GraphNode } from '../../shared/types'

const STORAGE_KEY = 'minimap-collapsed'

function readCollapsedState(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

interface MiniMapProps {
  nodes?: GraphNode[]
  className?: string
}

type ViewMode = 'tree' | 'spatial'

/**
 * MiniMap component
 */
export function MiniMap({ nodes = [], className = '' }: MiniMapProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const [collapsed, setCollapsed] = useState<boolean>(readCollapsedState)

  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId)
  const selectNode = useCanvasStore((state) => state.selectNode)
  const camera = useCanvasStore((state) => state.camera)

  const { flyToNode } = useCameraFlight()

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      selectNode(nodeId)

      // Prefer layout positions (from CityView), fall back to graph node position
      const layoutPos = useCanvasStore.getState().layoutPositions.get(nodeId)
      const node = nodes.find((n) => n.id === nodeId)
      const targetPos = layoutPos ?? node?.position
      if (targetPos) {
        flyToNode(nodeId, targetPos)
      }
    },
    [nodes, selectNode, flyToNode]
  )

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // localStorage unavailable
      }
      return next
    })
  }, [])

  return (
    <div
      role="region"
      aria-label="Minimap overview"
      className={`bg-white rounded-lg shadow-lg overflow-hidden flex flex-col ${className}`}
    >
      {/* Header with toggle */}
      <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">MiniMap</h3>
            <button
              onClick={toggleCollapsed}
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Expand minimap' : 'Collapse minimap'}
              className="text-gray-500 hover:text-gray-700 text-xs px-1"
            >
              {collapsed ? '▲' : '▼'}
            </button>
          </div>
          {!collapsed && (
            <div className="flex gap-1 bg-white rounded p-1">
              <button
                onClick={() => setViewMode('tree')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  viewMode === 'tree'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Tree
              </button>
              <button
                onClick={() => setViewMode('spatial')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  viewMode === 'spatial'
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                3D
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content - hidden when collapsed */}
      {!collapsed && (
        <>
          <div className="flex-1 overflow-y-auto">
            {viewMode === 'tree' ? (
              <FileTreeView
                nodes={nodes}
                onNodeClick={handleNodeClick}
                selectedNodeId={selectedNodeId}
              />
            ) : (
              <SpatialOverview
                nodes={nodes}
                selectedNodeId={selectedNodeId}
                cameraPosition={camera.position}
                cameraTarget={camera.target}
                onNodeClick={handleNodeClick}
              />
            )}
          </div>

          {/* Footer stats */}
          <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              {nodes.length} nodes
              {selectedNodeId && ' • 1 selected'}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
