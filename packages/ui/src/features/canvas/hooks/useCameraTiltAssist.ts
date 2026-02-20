/**
 * useCameraTiltAssist Hook
 *
 * On node selection, smoothly tilts the camera upward to reveal
 * outgoing sky edges above the selected building.
 *
 * - 0.5s ease-out animation
 * - Cancels if user moves camera during tilt
 * - Gated behind citySettings.cameraTiltAssist preference
 * - Respects prefers-reduced-motion (instant tilt)
 */

import { useEffect, useRef, useCallback } from 'react';
import { useCanvasStore } from '../store';

/** Animation duration in milliseconds */
export const TILT_DURATION_MS = 500;

/** How much to raise the camera target Y to reveal sky edges */
export const TILT_TARGET_Y_OFFSET = 8;

/**
 * Ease-out cubic — fast start, slow finish (feels responsive)
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Hook that focuses the camera on a selected node and optionally tilts
 * upward to reveal outgoing sky edges above the building.
 *
 * When the selected node has a known layout position, the camera target
 * animates to that node's position (+ Y tilt offset if enabled), so the
 * selected node is centered in view. Without a known position it falls
 * back to a Y-only tilt from the current target.
 */
export function useCameraTiltAssist(): void {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const cameraTiltAssist = useCanvasStore((s) => s.citySettings.cameraTiltAssist);
  const viewMode = useCanvasStore((s) => s.viewMode);
  const isFlying = useCanvasStore((s) => s.isFlying);
  const layoutPositions = useCanvasStore((s) => s.layoutPositions);

  const animFrameRef = useRef<number | null>(null);
  const prevSelectedRef = useRef<string | null>(null);

  const cancelTilt = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Only trigger on new selection, not deselection or same node
    if (!selectedNodeId || selectedNodeId === prevSelectedRef.current) {
      prevSelectedRef.current = selectedNodeId;
      return;
    }
    prevSelectedRef.current = selectedNodeId;

    // Gate: preference must be enabled
    if (!cameraTiltAssist) return;

    // Gate: only in city view mode
    if (viewMode !== 'city') return;

    // Gate: skip if a camera flight is in progress
    if (isFlying) return;

    // Cancel any existing tilt animation
    cancelTilt();

    const state = useCanvasStore.getState();
    const startTarget = { ...state.camera.target };

    // If we know the node's layout position, focus the camera on it.
    // Otherwise fall back to a Y-only tilt from the current target.
    const nodePos = layoutPositions.get(selectedNodeId);
    const endTarget = nodePos
      ? { x: nodePos.x, y: nodePos.y + TILT_TARGET_Y_OFFSET, z: nodePos.z }
      : { ...startTarget, y: startTarget.y + TILT_TARGET_Y_OFFSET };

    // Reduced motion: instant focus
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      useCanvasStore.getState().setCameraTarget(endTarget);
      return;
    }

    const startTime = performance.now();

    // Snapshot camera position at start — if user moves it, cancel
    const startCameraPos = { ...state.camera.position };

    function animate(): void {
      const now = performance.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / TILT_DURATION_MS, 1);
      const eased = easeOutCubic(progress);

      // Check for user camera input: if camera position changed
      // from something other than our animation, cancel
      const currentPos = useCanvasStore.getState().camera.position;
      const posDrift =
        Math.abs(currentPos.x - startCameraPos.x) +
        Math.abs(currentPos.y - startCameraPos.y) +
        Math.abs(currentPos.z - startCameraPos.z);

      if (posDrift > 0.01) {
        // User moved the camera — cancel focus
        animFrameRef.current = null;
        return;
      }

      useCanvasStore.getState().setCameraTarget({
        x: startTarget.x + (endTarget.x - startTarget.x) * eased,
        y: startTarget.y + (endTarget.y - startTarget.y) * eased,
        z: startTarget.z + (endTarget.z - startTarget.z) * eased,
      });

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        animFrameRef.current = null;
      }
    }

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelTilt();
    };
  }, [selectedNodeId, cameraTiltAssist, viewMode, isFlying, layoutPositions, cancelTilt]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelTilt();
    };
  }, [cancelTilt]);
}
