/**
 * Building Component
 *
 * Renders a file as a 3D building in the city view.
 * Height represents abstraction depth, color represents directory grouping.
 */

import { useState, useMemo } from 'react';
import { Text } from '@react-three/drei';
import { useCanvasStore } from '../store';
import type { GraphNode, Position3D } from '../../../shared/types';
import {
  getDirectoryColor,
  getDirectoryFromLabel,
  getBuildingHeight,
  BUILDING_WIDTH,
  BUILDING_DEPTH,
} from './cityViewUtils';

interface BuildingProps {
  node: GraphNode;
  position: Position3D;
}

export function Building({ node, position }: BuildingProps) {
  const [hovered, setHovered] = useState(false);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const setHoveredNode = useCanvasStore((s) => s.setHoveredNode);
  const enterNode = useCanvasStore((s) => s.enterNode);

  const isSelected = selectedNodeId === node.id;
  const buildingHeight = getBuildingHeight(node.depth);
  const directory = getDirectoryFromLabel(node.label);
  const color = getDirectoryColor(directory);
  const label = node.label ?? '';
  const fileName = label.split('/').pop() ?? label;

  const emissiveColor = useMemo(() => {
    if (isSelected) return color;
    return '#000000';
  }, [isSelected, color]);

  const handleClick = () => {
    selectNode(isSelected ? null : node.id);
  };

  const handleDoubleClick = () => {
    enterNode(node.id, node.type);
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
      {/* Building body */}
      <mesh
        position={[0, buildingHeight / 2, 0]}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[BUILDING_WIDTH, buildingHeight, BUILDING_DEPTH]} />
        <meshStandardMaterial
          color={hovered ? '#f59e0b' : color}
          emissive={emissiveColor}
          emissiveIntensity={isSelected ? 0.3 : 0}
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Building label */}
      <Text
        position={[0, buildingHeight + 0.5, 0]}
        fontSize={0.35}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {fileName}
      </Text>
    </group>
  );
}
