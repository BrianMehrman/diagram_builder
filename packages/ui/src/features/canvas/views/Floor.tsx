/**
 * Floor Component
 *
 * Renders a floor slab representing a class within the building.
 * Includes a hover state and double-click to enter the class (cell mode).
 */

import { useState } from 'react';
import { DoubleSide } from 'three';
import { Text } from '@react-three/drei';
import { useCanvasStore } from '../store';
import type { GraphNode, Position3D } from '../../../shared/types';

interface FloorProps {
  classNode: GraphNode;
  y: number;
  width: number;
  depth: number;
  origin: Position3D;
}

export function Floor({ classNode, y, width, depth, origin }: FloorProps) {
  const [hovered, setHovered] = useState(false);
  const enterNode = useCanvasStore((s) => s.enterNode);

  const handleDoubleClick = () => {
    enterNode(classNode.id, classNode.type);
  };

  return (
    <group>
      {/* Floor slab */}
      <mesh
        position={[origin.x + width / 2, y, origin.z + depth / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onDoubleClick={handleDoubleClick}
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color={hovered ? '#334155' : '#1e293b'}
          transparent
          opacity={0.5}
          side={DoubleSide}
        />
      </mesh>

      {/* Floor label */}
      <Text
        position={[origin.x - 0.5, y + 0.3, origin.z + depth / 2]}
        fontSize={0.3}
        color="#94a3b8"
        anchorX="right"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {classNode.label}
      </Text>
    </group>
  );
}
