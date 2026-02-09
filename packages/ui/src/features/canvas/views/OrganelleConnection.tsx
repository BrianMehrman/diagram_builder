/**
 * OrganelleConnection Component
 *
 * Renders a subtle line between two organelles representing
 * a call or data flow relationship.
 */

import type { Position3D } from '../../../shared/types';

interface OrganelleConnectionProps {
  sourcePos?: Position3D;
  targetPos?: Position3D;
}

export function OrganelleConnection({
  sourcePos,
  targetPos,
}: OrganelleConnectionProps) {
  if (!sourcePos || !targetPos) return null;

  // Create a simple line between two points using bufferGeometry
  const points = new Float32Array([
    sourcePos.x, sourcePos.y, sourcePos.z,
    targetPos.x, targetPos.y, targetPos.z,
  ]);

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={points}
          count={2}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color="#475569"
        transparent
        opacity={0.3}
      />
    </line>
  );
}
