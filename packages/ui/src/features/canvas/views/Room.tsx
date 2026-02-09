/**
 * Room Component
 *
 * Renders a method, function, or variable as a room within a building floor.
 * Color indicates type, with hover and selection states.
 */

import { useState } from 'react';
import { Text } from '@react-three/drei';
import { useCanvasStore } from '../store';
import type { GraphNode, Position3D } from '../../../shared/types';
import { getRoomColor } from './buildingViewUtils';

interface RoomProps {
  node: GraphNode;
  position: Position3D;
}

const ROOM_SIZE = 1.5;

export function Room({ node, position }: RoomProps) {
  const [hovered, setHovered] = useState(false);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const setHoveredNode = useCanvasStore((s) => s.setHoveredNode);

  const isSelected = selectedNodeId === node.id;
  const color = getRoomColor(node.type);

  const handleClick = () => {
    selectNode(isSelected ? null : node.id);
  };

  const handlePointerOver = () => {
    setHovered(true);
    setHoveredNode(node.id);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    setHoveredNode(null);
    document.body.style.cursor = 'auto';
  };

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Room box */}
      <mesh
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[ROOM_SIZE, ROOM_SIZE, ROOM_SIZE]} />
        <meshStandardMaterial
          color={hovered ? '#f59e0b' : color}
          transparent
          opacity={0.6}
          emissive={isSelected ? color : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>

      {/* Room label */}
      <Text
        position={[0, ROOM_SIZE / 2 + 0.3, 0]}
        fontSize={0.22}
        color="#e2e8f0"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.015}
        outlineColor="#000000"
      >
        {node.label ?? ''}
      </Text>
    </group>
  );
}
