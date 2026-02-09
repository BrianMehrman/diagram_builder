/**
 * DistrictGround Component
 *
 * Renders a colored arc-segment ground plane for a district in the radial city layout.
 * Uses Three.js RingGeometry with thetaStart/thetaLength for arc segments.
 */

import { useMemo } from 'react';
import * as THREE from 'three';

interface DistrictGroundProps {
  /** Start angle of the arc in radians */
  arcStart: number;
  /** End angle of the arc in radians */
  arcEnd: number;
  /** Inner radius of the arc segment */
  innerRadius: number;
  /** Outer radius of the arc segment */
  outerRadius: number;
  /** Fill color for the ground plane */
  color: string;
  /** District label (used for accessibility) */
  label: string;
  /** Whether to show the border line (default true) */
  showBorder?: boolean;
}

/** Number of segments for arc geometry smoothness */
const ARC_SEGMENTS = 32;

export function DistrictGround({
  arcStart,
  arcEnd,
  innerRadius,
  outerRadius,
  color,
  label,
  showBorder = true,
}: DistrictGroundProps) {
  const thetaLength = arcEnd - arcStart;

  // Build border line geometry as a BufferGeometry
  const borderGeometry = useMemo(() => {
    if (!showBorder || thetaLength <= 0) return null;

    const points: THREE.Vector3[] = [];

    // Inner arc edge
    for (let i = 0; i <= ARC_SEGMENTS; i++) {
      const angle = arcStart + (i / ARC_SEGMENTS) * thetaLength;
      points.push(new THREE.Vector3(
        Math.cos(angle) * innerRadius,
        0.02,
        Math.sin(angle) * innerRadius,
      ));
    }

    // Outer arc edge (reversed for closed loop)
    for (let i = ARC_SEGMENTS; i >= 0; i--) {
      const angle = arcStart + (i / ARC_SEGMENTS) * thetaLength;
      points.push(new THREE.Vector3(
        Math.cos(angle) * outerRadius,
        0.02,
        Math.sin(angle) * outerRadius,
      ));
    }

    // Close the loop
    points.push(new THREE.Vector3(
      Math.cos(arcStart) * innerRadius,
      0.02,
      Math.sin(arcStart) * innerRadius,
    ));

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [arcStart, thetaLength, innerRadius, outerRadius, showBorder]);

  if (thetaLength <= 0) return null;

  return (
    <group name={`district-ground-${label}`}>
      {/* Arc-segment fill */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[innerRadius, outerRadius, ARC_SEGMENTS, 1, arcStart, thetaLength]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Border line using primitive to avoid SVG line type conflict */}
      {showBorder && borderGeometry && (
        <primitive object={new THREE.Line(
          borderGeometry,
          new THREE.LineBasicMaterial({
            color,
            transparent: true,
            opacity: 0.2,
          }),
        )} />
      )}
    </group>
  );
}
