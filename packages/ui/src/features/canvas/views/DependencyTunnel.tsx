/**
 * DependencyTunnel Component
 *
 * Renders a single dependency connection as a tube below the ground plane.
 * Uses CatmullRomCurve3 for smooth underground path.
 * Enhanced with dependency-type color coding and glow effect.
 */

import { useMemo } from 'react';
import { CatmullRomCurve3, Vector3, BackSide } from 'three';
import type { Position3D } from '../../../shared/types';
import {
  computeTunnelRadius,
  generateTunnelPoints,
} from '../undergroundUtils';
import { getDependencyColor } from '../tunnelEnhancedUtils';
import type { DependencyType } from '../tunnelEnhancedUtils';

interface DependencyTunnelProps {
  sourcePosition: Position3D;
  targetPosition: Position3D;
  importCount: number;
  /** Whether the target node is external */
  isExternal: boolean;
  /** Dependency type for color coding */
  dependencyType?: DependencyType;
}

/** Tube segments for curve smoothness */
const TUBE_SEGMENTS = 32;
/** Tube radial segments */
const RADIAL_SEGMENTS = 8;
/** Glow tube radius offset */
const GLOW_OFFSET = 0.05;

export function DependencyTunnel({
  sourcePosition,
  targetPosition,
  importCount,
  isExternal,
  dependencyType = 'production',
}: DependencyTunnelProps) {
  const radius = computeTunnelRadius(importCount);

  // Generate smooth curve through underground control points
  const curve = useMemo(() => {
    const points = generateTunnelPoints(sourcePosition, targetPosition);
    return new CatmullRomCurve3(
      points.map((p) => new Vector3(p.x, p.y, p.z))
    );
  }, [sourcePosition, targetPosition]);

  // Color: use dependency type, override to indigo for external
  const color = isExternal ? '#6366f1' : getDependencyColor(dependencyType);

  return (
    <group>
      {/* Main tunnel tube */}
      <mesh>
        <tubeGeometry
          args={[curve, TUBE_SEGMENTS, radius, RADIAL_SEGMENTS, false]}
        />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.6}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Glow outer tube */}
      <mesh>
        <tubeGeometry
          args={[curve, TUBE_SEGMENTS, radius + GLOW_OFFSET, RADIAL_SEGMENTS, false]}
        />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.1}
          side={BackSide}
        />
      </mesh>
    </group>
  );
}
