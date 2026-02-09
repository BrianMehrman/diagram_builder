/**
 * TunnelJunction Component
 *
 * Renders a hub sphere at building bases where multiple dependency
 * tunnels converge. Size scales with tunnel count.
 */

import { DoubleSide } from 'three';
import type { Position3D } from '../../../shared/types';
import { computeJunctionSize } from '../tunnelEnhancedUtils';

interface TunnelJunctionProps {
  position: Position3D;
  tunnelCount: number;
  /** True for internal nodes, false for external */
  isInternal: boolean;
}

/** Depth below ground for junction */
const JUNCTION_Y = -3;

export function TunnelJunction({
  position,
  tunnelCount,
  isInternal,
}: TunnelJunctionProps) {
  const size = computeJunctionSize(tunnelCount);
  const color = isInternal ? '#3b82f6' : '#6366f1';

  // Shaft height from underground to surface
  const shaftHeight = Math.abs(JUNCTION_Y);

  return (
    <group position={[position.x, JUNCTION_Y, position.z]}>
      {/* Central hub sphere */}
      <mesh>
        <sphereGeometry args={[size, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Decorative ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size + 0.1, size + 0.2, 16]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.3}
          side={DoubleSide}
        />
      </mesh>

      {/* Vertical shaft to surface */}
      <mesh position={[0, shaftHeight / 2, 0]}>
        <cylinderGeometry args={[0.1, 0.1, shaftHeight, 8]} />
        <meshStandardMaterial
          color="#475569"
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  );
}
