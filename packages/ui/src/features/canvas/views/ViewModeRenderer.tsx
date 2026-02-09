/**
 * ViewModeRenderer Component
 *
 * Switches between CityView, BuildingView, and CellView
 * based on the current viewMode in the canvas store.
 */

import { useCanvasStore } from '../store';
import type { ViewMode } from '../store';
import { CityView } from './CityView';
import { BuildingView } from './BuildingView';
import { CellView } from './CellView';
import type { Graph } from '../../../shared/types';

interface ViewModeRendererProps {
  graph: Graph;
}

interface ViewProps {
  view: 'city' | 'building' | 'cell';
  focusedNodeId: string | null;
}

/**
 * Pure function to determine which view to render.
 * Falls back to city view when building/cell mode lacks a focusedNodeId.
 */
export function selectViewProps(
  viewMode: ViewMode,
  focusedNodeId: string | null
): ViewProps {
  if (viewMode === 'building' && focusedNodeId) {
    return { view: 'building', focusedNodeId };
  }
  if (viewMode === 'cell' && focusedNodeId) {
    return { view: 'cell', focusedNodeId };
  }
  return { view: 'city', focusedNodeId: null };
}

export function ViewModeRenderer({ graph }: ViewModeRendererProps) {
  const viewMode = useCanvasStore((s) => s.viewMode);
  const focusedNodeId = useCanvasStore((s) => s.focusedNodeId);

  const { view, focusedNodeId: nodeId } = selectViewProps(viewMode, focusedNodeId);

  switch (view) {
    case 'building':
      return <BuildingView graph={graph} focusedNodeId={nodeId!} />;
    case 'cell':
      return <CellView graph={graph} focusedNodeId={nodeId!} />;
    case 'city':
    default:
      return <CityView graph={graph} />;
  }
}
