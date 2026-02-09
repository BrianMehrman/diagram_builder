/**
 * BuildingWalls Component
 *
 * Renders semi-transparent walls around the building interior.
 * Uses BackSide rendering so walls are visible from inside.
 */

import { BackSide } from 'three';
import type { Position3D } from '../../../shared/types';

interface BuildingWallsProps {
  width: number;
  height: number;
  depth: number;
  origin: Position3D;
}

export function BuildingWalls({ width, height, depth, origin }: BuildingWallsProps) {
  return (
    <mesh
      position={[
        origin.x + width / 2,
        origin.y + height / 2,
        origin.z + depth / 2,
      ]}
    >
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial
        color="#475569"
        transparent
        opacity={0.08}
        side={BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}
