/**
 * ViewModeRenderer Component
 *
 * Switches between CityView, BuildingView, and CellView
 * based on the current viewMode in the canvas store.
 */

import { useCanvasStore } from '../store'
import type { ViewMode } from '../store'
import { useLayout } from '../layouts'
import { BuildingView } from './BuildingView'
import { CellView } from './CellView'

interface ViewProps {
  view: 'city' | 'building' | 'cell'
  focusedNodeId: string | null
}

/**
 * Pure function to determine which view to render.
 * Falls back to city view when building/cell mode lacks a focusedNodeId.
 */
export function selectViewProps(viewMode: ViewMode, focusedNodeId: string | null): ViewProps {
  if (viewMode === 'building' && focusedNodeId) {
    return { view: 'building', focusedNodeId }
  }
  if (viewMode === 'cell' && focusedNodeId) {
    return { view: 'cell', focusedNodeId }
  }
  return { view: 'city', focusedNodeId: null }
}

export function ViewModeRenderer() {
  const viewMode = useCanvasStore((s) => s.viewMode)
  const focusedNodeId = useCanvasStore((s) => s.focusedNodeId)
  const parseResult = useCanvasStore((s) => s.parseResult)
  const { engine } = useLayout()

  const { view, focusedNodeId: nodeId } = selectViewProps(viewMode, focusedNodeId)

  if (view === 'building' && parseResult) {
    return <BuildingView graph={parseResult.graph} focusedNodeId={nodeId ?? ''} />
  }
  if (view === 'cell' && parseResult) {
    return <CellView graph={parseResult.graph} focusedNodeId={nodeId ?? ''} />
  }

  const LayoutView = engine.component
  return <LayoutView />
}
