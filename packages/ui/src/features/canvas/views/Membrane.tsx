/**
 * Membrane Component
 *
 * Renders a semi-transparent sphere representing the cell membrane
 * or nucleus boundary. Uses BackSide rendering so it's visible from inside.
 */

import { BackSide } from 'three';
import type { Position3D } from '../../../shared/types';

interface MembraneProps {
  center: Position3D;
  radius: number;
  isNucleus?: boolean;
}

export function Membrane({ center, radius, isNucleus = false }: MembraneProps) {
  return (
    <mesh position={[center.x, center.y, center.z]}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial
        color={isNucleus ? '#22c55e' : '#3b82f6'}
        transparent
        opacity={isNucleus ? 0.05 : 0.1}
        side={BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}
