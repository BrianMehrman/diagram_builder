/**
 * useCameraFlight Hook
 *
 * Provides smooth camera flight animation to navigate to nodes in the 3D graph
 *
 * Features:
 * - Smooth 1.5s ease-in-out animation
 * - ESC key cancels flight mid-animation
 * - Highlights target node on arrival (2s fade)
 * - Respects prefers-reduced-motion (instant teleport)
 * - Updates flight state for breadcrumb tracking
 */

import { useCallback, useRef, useEffect } from 'react';
import { useCanvasStore } from '../canvas/store';
import type { Position3D } from '../../shared/types';

/**
 * Animation configuration
 */
const ANIMATION_DURATION_MS = 1500; // 1.5 seconds per UX spec
const HIGHLIGHT_DURATION_MS = 2000; // 2 seconds highlight on arrival
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
  /** Fly camera to a node position */
  flyToNode: (nodeId: string, nodePosition: Position3D) => void;
  /** Cancel current flight animation */
  cancelFlight: () => void;
  /** Whether a flight is currently in progress */
  isFlying: boolean;
}

/**
 * Hook for smooth camera flight animations to graph nodes
 *
 * Features:
 * - Smooth 1.5s ease-in-out animation
 * - ESC key cancels flight mid-animation
 * - Highlights target node on arrival (2s fade)
 * - Respects prefers-reduced-motion (instant teleport)
 * - Updates flight state for breadcrumb tracking
 */
export function useCameraFlight(): UseCameraFlightReturn {
  const setCamera = useCanvasStore((state) => state.setCamera);
  const setCameraTarget = useCanvasStore((state) => state.setCameraTarget);
  const selectNode = useCanvasStore((state) => state.selectNode);
  const setHighlightedNode = useCanvasStore((state) => state.setHighlightedNode);
  const setFlightState = useCanvasStore((state) => state.setFlightState);
  const isFlying = useCanvasStore((state) => state.isFlying);

  // Track animation frame ID for cleanup
  const animationFrameRef = useRef<number | null>(null);
  // Track highlight timeout for cleanup
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Cancel current flight animation
   */
  const cancelFlight = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setFlightState(false, null);
  }, [setFlightState]);

  /**
   * Handle arrival at target node
   */
  const handleArrival = useCallback(
    (nodeId: string) => {
      // Select the node
      selectNode(nodeId);

      // Highlight the node (glow effect)
      setHighlightedNode(nodeId);

      // Clear highlight after duration
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
      highlightTimeoutRef.current = setTimeout(() => {
        setHighlightedNode(null);
        highlightTimeoutRef.current = null;
      }, HIGHLIGHT_DURATION_MS);

      // Clear flight state
      setFlightState(false, null);
      animationFrameRef.current = null;
    },
    [selectNode, setHighlightedNode, setFlightState]
  );

  /**
   * Fly camera to a node position
   */
  const flyToNode = useCallback(
    (nodeId: string, nodePosition: Position3D) => {
      // Cancel any existing animation
      cancelFlight();

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
        handleArrival(nodeId);
        return;
      }

      // Set flight state for breadcrumb tracking
      setFlightState(true, nodeId);

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
          // Animation complete
          handleArrival(nodeId);
        }
      }

      // Start animation
      animationFrameRef.current = requestAnimationFrame(animate);
    },
    [cancelFlight, setCamera, setCameraTarget, setFlightState, handleArrival]
  );

  // ESC key listener to cancel flight
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && animationFrameRef.current !== null) {
        cancelFlight();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cancelFlight]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  return { flyToNode, cancelFlight, isFlying };
}
