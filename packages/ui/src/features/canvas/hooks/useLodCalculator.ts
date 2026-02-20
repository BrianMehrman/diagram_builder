/**
 * useLodCalculator Hook
 *
 * Reads camera position each frame via useFrame and updates the
 * store's lodLevel based on distance to scene origin. Uses hysteresis
 * to prevent flickering at threshold boundaries.
 *
 * Must be called from within the R3F Canvas tree.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCanvasStore } from '../store';
import {
  cameraDistanceToOrigin,
  calculateLodWithHysteresis,
} from './lodCalculatorUtils';

/**
 * Hook that automatically updates lodLevel in the store based on
 * camera distance. Call this from a component inside the R3F Canvas.
 */
export function useLodCalculator(): void {
  const setLodLevel = useCanvasStore((s) => s.setLodLevel);
  const currentLodRef = useRef(useCanvasStore.getState().lodLevel);

  useFrame(({ camera }) => {
    // Skip auto-update when the user has locked LOD manually
    if (useCanvasStore.getState().lodManualOverride) return;

    const distance = cameraDistanceToOrigin(
      camera.position.x,
      camera.position.y,
      camera.position.z,
    );

    const newLod = calculateLodWithHysteresis(distance, currentLodRef.current);

    if (newLod !== currentLodRef.current) {
      currentLodRef.current = newLod;
      setLodLevel(newLod);
    }
  });
}
