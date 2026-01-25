/**
 * useCameraFlight Hook
 *
 * Provides smooth camera flight animation to navigate to nodes in the 3D graph
 */

import { useCallback, useRef } from 'react';
import { useCanvasStore } from '../canvas/store';
import type { Position3D } from '../../shared/types';

/**
 * Animation configuration
 */
const ANIMATION_DURATION_MS = 800;
const CAMERA_OFFSET_Y = 5;
const CAMERA_OFFSET_Z = 10;

/**
 * Ease-in-out cubic easing function
 *
 * Creates smooth acceleration at start and deceleration at end
 */
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Calculate camera position to view a node
 *
 * Positions camera above and in front of the node
 */
function calculateCameraPosition(nodePosition: Position3D): Position3D {
  return {
    x: nodePosition.x,
    y: nodePosition.y + CAMERA_OFFSET_Y,
    z: nodePosition.z + CAMERA_OFFSET_Z,
  };
}

/**
 * Linearly interpolate between two positions
 */
function lerp(start: Position3D, end: Position3D, t: number): Position3D {
  return {
    x: start.x + (end.x - start.x) * t,
    y: start.y + (end.y - start.y) * t,
    z: start.z + (end.z - start.z) * t,
  };
}

/**
 * Return value from useCameraFlight hook
 */
interface UseCameraFlightReturn {
  flyToNode: (nodeId: string, nodePosition: Position3D) => void;
}

/**
 * Hook for smooth camera flight animations to graph nodes
 *
 * Features:
 * - Smooth ease-in-out animation over 800ms
 * - Respects prefers-reduced-motion (instant teleport)
 * - Selects node on arrival
 * - Uses requestAnimationFrame for smooth animation
 */
export function useCameraFlight(): UseCameraFlightReturn {
  const setCamera = useCanvasStore((state) => state.setCamera);
  const setCameraTarget = useCanvasStore((state) => state.setCameraTarget);
  const selectNode = useCanvasStore((state) => state.selectNode);

  // Track animation frame ID for cleanup
  const animationFrameRef = useRef<number | null>(null);

  const flyToNode = useCallback(
    (nodeId: string, nodePosition: Position3D) => {
      // Cancel any existing animation
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Check prefers-reduced-motion
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

      // Calculate target camera position
      const targetCameraPosition = calculateCameraPosition(nodePosition);

      if (prefersReducedMotion) {
        // Instant teleport (no animation)
        setCamera({
          position: targetCameraPosition,
          target: nodePosition,
        });
        setCameraTarget(nodePosition);
        selectNode(nodeId);
        return;
      }

      // Get starting position
      const startPosition = useCanvasStore.getState().camera.position;
      const startTarget = useCanvasStore.getState().camera.target;
      const startTime = performance.now();

      function animate(): void {
        const now = performance.now();
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);

        // Apply easing
        const easedProgress = easeInOutCubic(progress);

        // Interpolate position and target
        const currentPosition = lerp(
          startPosition,
          targetCameraPosition,
          easedProgress
        );
        const currentTarget = lerp(startTarget, nodePosition, easedProgress);

        // Update camera
        setCamera({
          position: currentPosition,
          target: currentTarget,
        });
        setCameraTarget(currentTarget);

        if (progress < 1) {
          // Continue animation
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Animation complete - select node
          selectNode(nodeId);
          animationFrameRef.current = null;
        }
      }

      // Start animation
      animationFrameRef.current = requestAnimationFrame(animate);
    },
    [setCamera, setCameraTarget, selectNode]
  );

  return { flyToNode };
}
