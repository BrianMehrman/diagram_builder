/**
 * Canvas Page
 *
 * Standalone 3D visualization canvas for testing and direct canvas access
 * This page is similar to WorkspacePage but doesn't require a workspace ID
 */

import { useState } from 'react'
import { Canvas3D } from '../features/canvas'
import { MiniMap } from '../features/minimap'
import { Navigation } from '../features/navigation'
import { ExportButton } from '../features/export'
import { HUD } from '../features/navigation/HUD'
import type { GraphNode } from '../shared/types'

export function CanvasPage() {
  // Panel states
  const [miniMapCollapsed, setMiniMapCollapsed] = useState(false)
  const [hudCollapsed, setHudCollapsed] = useState(false)

  // Mock nodes for components that need them
  const nodes: GraphNode[] = []

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Compact Top Bar */}
      <header
        className="bg-gray-800 border-b border-gray-700 px-3 py-2 flex items-center justify-between"
        data-testid="canvas-header"
      >
        <h1 className="text-sm font-semibold text-white">Canvas</h1>

        <div className="flex items-center gap-2">
          <ExportButton />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* 3D Canvas */}
        <Canvas3D />

        {/* Collapsible HUD (Top Left) */}
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-black/75 backdrop-blur-sm rounded-lg overflow-hidden">
            <button
              onClick={() => setHudCollapsed(!hudCollapsed)}
              className="w-full px-3 py-2 flex items-center justify-between text-white hover:bg-white/10 transition-colors"
            >
              <span className="text-xs font-semibold">HUD</span>
              <svg
                className={`w-4 h-4 transition-transform ${hudCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {!hudCollapsed && (
              <div className="border-t border-gray-700">
                <HUD nodes={nodes} />
              </div>
            )}
          </div>
        </div>

        {/* Navigation Panel (Top Center-Left) */}
        <div className="absolute top-4 left-1/4 z-20 max-w-md">
          <Navigation nodes={nodes} />
        </div>

        {/* Collapsible MiniMap (Bottom Right) */}
        <div className="absolute bottom-4 right-4 z-20">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <button
              onClick={() => setMiniMapCollapsed(!miniMapCollapsed)}
              className="w-full px-3 py-2 flex items-center justify-between bg-gray-100 hover:bg-gray-200 transition-colors border-b border-gray-200"
            >
              <span className="text-xs font-semibold text-gray-900">MiniMap</span>
              <svg
                className={`w-4 h-4 transition-transform ${miniMapCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {!miniMapCollapsed && (
              <div className="w-64 h-64">
                <MiniMap nodes={nodes} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
