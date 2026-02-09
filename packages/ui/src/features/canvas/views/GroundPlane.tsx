/**
 * GroundPlane Component
 *
 * Renders a grid at Y=0 representing the city streets.
 */

import { Grid } from '@react-three/drei';

interface GroundPlaneProps {
  width: number;
  depth: number;
  /** Opacity of the ground grid (1 = solid, 0 = invisible) */
  opacity?: number;
}

export function GroundPlane({ width, depth, opacity = 1 }: GroundPlaneProps) {
  const size = Math.max(width, depth) * 1.5;

  return (
    <group>
      <Grid
        args={[size, size]}
        cellSize={3}
        cellThickness={0.5}
        cellColor="#1e293b"
        sectionSize={15}
        sectionThickness={1}
        sectionColor="#334155"
        fadeDistance={size}
        fadeStrength={1}
        followCamera={false}
        position={[0, 0, 0]}
      />
      {/* Semi-transparent overlay to fade the ground in underground mode */}
      {opacity < 1 && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[size, size]} />
          <meshBasicMaterial
            color="#0f172a"
            transparent
            opacity={1 - opacity}
          />
        </mesh>
      )}
    </group>
  );
}
