/**
 * InterfaceBuilding Component
 *
 * Glass building with transparent walls and wireframe edge overlay.
 */

import { useState, useMemo } from 'react';
import { Text, Edges } from '@react-three/drei';
import { useCanvasStore } from '../../store';
import { getBuildingConfig } from '../buildingGeometry';
import { getDirectoryFromLabel, getDirectoryColor } from '../../views/cityViewUtils';
import type { TypedBuildingProps } from './types';

export function InterfaceBuilding({ node, position }: TypedBuildingProps) {
  const [hovered, setHovered] = useState(false);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const setHoveredNode = useCanvasStore((s) => s.setHoveredNode);
  const requestFlyToNode = useCanvasStore((s) => s.requestFlyToNode);

  const isSelected = selectedNodeId === node.id;
  const config = useMemo(() => getBuildingConfig(node), [node]);
  const { width, height } = config.geometry;
  const directory = getDirectoryFromLabel(node.label);
  const color = getDirectoryColor(directory);
  const fileName = (node.label ?? node.id).split('/').pop() ?? node.id;

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh
        position={[0, height / 2, 0]}
        onClick={() => selectNode(isSelected ? null : node.id)}
        onDoubleClick={() => requestFlyToNode(node.id)}
        onPointerOver={() => { setHovered(true); setHoveredNode(node.id); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); setHoveredNode(null); document.body.style.cursor = 'auto'; }}
      >
        <cylinderGeometry args={[width / 2, width / 2, height, 8]} />
        <meshStandardMaterial
          color={hovered ? '#f59e0b' : color}
          opacity={config.material.opacity}
          transparent={config.material.transparent}
          roughness={config.material.roughness}
          metalness={config.material.metalness}
        />
        <Edges
          threshold={15}
          color={isSelected ? '#ffffff' : color}
          lineWidth={1}
        />
      </mesh>
      <Text
        position={[0, height + 0.5, 0]}
        fontSize={0.35}
        color="#94a3b8"
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
