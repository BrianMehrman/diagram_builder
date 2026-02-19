/**
 * UndergroundPipe Component
 *
 * Renders import, inheritance, and implements relationships as pipe/conduit
 * geometry below the ground plane (y < 0).
 *
 * Route: source at surface → drop to pipe depth → horizontal run → rise to surface.
 * Uses CatmullRomCurve3 for smooth bends and TubeGeometry for the conduit look.
 * Pipe color and thickness encode the relationship type.
 */

import { useMemo } from 'react';
import { CatmullRomCurve3, Vector3, BackSide } from 'three';
import type { Position3D } from '../../../shared/types';
import {
  calculatePipeRoute,
  getPipeDepth,
  PIPE_COLORS,
  PIPE_DEFAULT_COLOR,
  PIPE_RADIUS,
  PIPE_DEFAULT_RADIUS,
} from '../views/cityViewUtils';

export interface UndergroundPipeProps {
  sourcePosition: Position3D;
  targetPosition: Position3D;
  /** Edge relationship type — drives color and thickness. */
  edgeType: string;
  /** Override automatic depth calculation (useful for stacking). */
  pipeDepth?: number;
}

/** Tube curve segments (smoothness). */
const TUBE_SEGMENTS = 24;
/** Tube radial segments (roundness). */
const RADIAL_SEGMENTS = 6;
/** Outer glow tube radius addend. */
const GLOW_OFFSET = 0.04;

export function UndergroundPipe({
  sourcePosition,
  targetPosition,
  edgeType,
  pipeDepth,
}: UndergroundPipeProps) {
  const depth = pipeDepth ?? getPipeDepth(sourcePosition, targetPosition);
  const color = PIPE_COLORS[edgeType] ?? PIPE_DEFAULT_COLOR;
  const radius = PIPE_RADIUS[edgeType] ?? PIPE_DEFAULT_RADIUS;

  const curve = useMemo(() => {
    const pts = calculatePipeRoute(sourcePosition, targetPosition, depth);
    return new CatmullRomCurve3(pts.map((p) => new Vector3(p.x, p.y, p.z)));
  }, [sourcePosition, targetPosition, depth]);

  return (
    <group>
      {/* Main conduit tube */}
      <mesh>
        <tubeGeometry args={[curve, TUBE_SEGMENTS, radius, RADIAL_SEGMENTS, false]} />
        <meshStandardMaterial
          color={color}
          roughness={0.85}
          metalness={0.3}
          transparent
          opacity={0.75}
        />
      </mesh>

      {/* Subtle outer glow shell */}
      <mesh>
        <tubeGeometry args={[curve, TUBE_SEGMENTS, radius + GLOW_OFFSET, RADIAL_SEGMENTS, false]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.08}
          side={BackSide}
        />
      </mesh>
    </group>
  );
}
