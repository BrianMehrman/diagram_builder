/**
 * ClusterBuilding Component
 *
 * Renders a compound building representing a cluster of nodes from a single
 * district. Shown at LOD level 1 (city zoom) when a district exceeds
 * the clustering threshold. Displays the node count as a badge.
 */

import { useState } from 'react';
import { Text } from '@react-three/drei';
import type { Position3D } from '../../../shared/types';
import { getDistrictColor } from './districtGroundUtils';

interface ClusterBuildingProps {
  position: Position3D;
  nodeCount: number;
  districtName: string;
  size: { width: number; depth: number; height: number };
}

export function ClusterBuilding({
  position,
  nodeCount,
  districtName,
  size,
}: ClusterBuildingProps) {
  const [hovered, setHovered] = useState(false);

  // Scale building based on cluster size, with minimums
  const width = Math.max(size.width * 0.5, 3);
  const depth = Math.max(size.depth * 0.5, 3);
  const height = Math.max(Math.log2(nodeCount + 1) * 1.5, 2);

  const color = getDistrictColor(districtName);

  const handlePointerOver = () => {
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  };

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Compound building body */}
      <mesh
        position={[0, height / 2, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={hovered ? '#f59e0b' : color}
          roughness={0.5}
          metalness={0.2}
          opacity={0.85}
          transparent
        />
      </mesh>

      {/* Count badge */}
      <Text
        position={[0, height + 0.8, 0]}
        fontSize={0.8}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.04}
        outlineColor="#000000"
        fontWeight="bold"
      >
        {`${nodeCount} files`}
      </Text>

      {/* District label */}
      <Text
        position={[0, height + 0.2, 0]}
        fontSize={0.4}
        color="#9ca3af"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {districtName}
      </Text>
    </group>
  );
}
