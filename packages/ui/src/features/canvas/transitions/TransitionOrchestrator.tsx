/**
 * TransitionOrchestrator Component
 *
 * Logic-only component that detects view mode changes and
 * coordinates camera flight + visual transitions.
 * Renders nothing — just orchestrates side effects.
 *
 * Handles:
 * - city → building: fly camera to building interior
 * - building → cell: fly camera to cell interior
 */

import { useEffect, useRef } from 'react';
import { useCanvasStore } from '../store';
import type { ViewMode } from '../store';
import { calculateBuildingEntryTarget } from './cityToBuildingTransition';
import { calculateCellEntryTarget } from './buildingToCellTransition';

const DEFAULT_CELL_RADIUS = 10;

export function TransitionOrchestrator() {
  const viewMode = useCanvasStore((s) => s.viewMode);
  const focusedNodeId = useCanvasStore((s) => s.focusedNodeId);
  const setCameraPosition = useCanvasStore((s) => s.setCameraPosition);
  const setCameraTarget = useCanvasStore((s) => s.setCameraTarget);
  const setFlightState = useCanvasStore((s) => s.setFlightState);
  const layoutPositions = useCanvasStore((s) => s.layoutPositions);

  const prevModeRef = useRef<ViewMode>(viewMode);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const prevMode = prevModeRef.current;

    if (focusedNodeId) {
      // City → Building transition
      if (prevMode === 'city' && viewMode === 'building') {
        const pos = layoutPositions.get(focusedNodeId);

        if (pos) {
          const entry = calculateBuildingEntryTarget({
            buildingPosition: pos,
            buildingWidth: 4,
            buildingHeight: 12,
            buildingDepth: 4,
          });

          setFlightState(true, focusedNodeId);
          setCameraPosition(entry.position);
          setCameraTarget(entry.target);

          timer = setTimeout(() => {
            setFlightState(false, null);
          }, 600);
        }
      }

      // Building → Cell transition
      if (prevMode === 'building' && viewMode === 'cell') {
        const pos = layoutPositions.get(focusedNodeId);
        const classPosition = pos ?? { x: 0, y: 0, z: 0 };

        const entry = calculateCellEntryTarget({
          classPosition,
          cellRadius: DEFAULT_CELL_RADIUS,
        });

        setFlightState(true, focusedNodeId);
        setCameraPosition(entry.position);
        setCameraTarget(entry.target);

        timer = setTimeout(() => {
          setFlightState(false, null);
        }, 600);
      }
    }

    prevModeRef.current = viewMode;

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [viewMode, focusedNodeId, layoutPositions, setCameraPosition, setCameraTarget, setFlightState]);

  return null;
}
