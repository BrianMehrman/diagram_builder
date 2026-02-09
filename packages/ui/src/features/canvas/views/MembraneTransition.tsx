/**
 * MembraneTransition Component
 *
 * Visual crossfade between building walls and cell membrane.
 * Building walls dissolve as the cell membrane fades in.
 * Progress is controlled externally by useViewTransition hook.
 */

import { BackSide } from 'three';
import type { Position3D } from '../../../shared/types';
import {
  computeWallOpacity,
  computeMembraneOpacity,
} from '../hooks/viewTransitionUtils';

interface MembraneTransitionProps {
  center: Position3D;
  buildingWidth: number;
  buildingHeight: number;
  buildingDepth: number;
  membraneRadius: number;
  /** Transition progress: 0 = building walls, 1 = cell membrane */
  progress: number;
}

export function MembraneTransition({
  center,
  buildingWidth,
  buildingHeight,
  buildingDepth,
  membraneRadius,
  progress,
}: MembraneTransitionProps) {
  const wallOpacity = computeWallOpacity(progress);
  const membraneOpacity = computeMembraneOpacity(progress);

  return (
    <group position={[center.x, center.y, center.z]}>
      {/* Dissolving building walls */}
      {progress < 1 && wallOpacity > 0.001 && (
        <mesh>
          <boxGeometry args={[buildingWidth, buildingHeight, buildingDepth]} />
          <meshStandardMaterial
            color="#475569"
            transparent
            opacity={wallOpacity}
            side={BackSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Forming cell membrane */}
      {progress > 0 && membraneOpacity > 0.001 && (
        <mesh>
          <sphereGeometry args={[membraneRadius, 32, 32]} />
          <meshStandardMaterial
            color="#3b82f6"
            transparent
            opacity={membraneOpacity}
            side={BackSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
