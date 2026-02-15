/**
 * ExternalBuilding Component
 *
 * Renders an external library dependency as a smaller, distinct building.
 * Uses wireframe material to visually distinguish from internal buildings.
 */

import { useState } from 'react';
import { Text } from '@react-three/drei';
import { useCanvasStore } from '../store';
import { useTransitMapStyle } from '../hooks/useTransitMapStyle';
import type { GraphNode, Position3D } from '../../../shared/types';
import { EXTERNAL_COLOR } from './cityViewUtils';

interface ExternalBuildingProps {
  node: GraphNode;
  position: Position3D;
}

const EXTERNAL_SIZE = 1.2;
const EXTERNAL_HEIGHT = 2;

export function ExternalBuilding({ node, position }: ExternalBuildingProps) {
  const [hovered, setHovered] = useState(false);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const setHoveredNode = useCanvasStore((s) => s.setHoveredNode);
  const transitStyle = useTransitMapStyle();

  const isSelected = selectedNodeId === node.id;
  const label = node.label ?? '';
  const packageName = label.split('/').pop() ?? label;

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
      {/* External building body (wireframe) */}
      <mesh
        position={[0, EXTERNAL_HEIGHT / 2, 0]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[EXTERNAL_SIZE, EXTERNAL_HEIGHT, EXTERNAL_SIZE]} />
        <meshStandardMaterial
          color={hovered ? '#94a3b8' : EXTERNAL_COLOR}
          wireframe
          emissive={isSelected ? '#ffffff' : '#000000'}
          emissiveIntensity={isSelected ? 0.2 : 0}
          opacity={transitStyle.opacity}
          transparent={transitStyle.transparent}
        />
      </mesh>

      {/* Package label */}
      <Text
        position={[0, EXTERNAL_HEIGHT + 0.3, 0]}
        fontSize={0.28}
        color="#94a3b8"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {packageName}
      </Text>
    </group>
  );
}
