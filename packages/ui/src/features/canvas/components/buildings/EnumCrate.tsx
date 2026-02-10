/**
 * EnumCrate Component
 *
 * Small box representing an enum, with metallic striped appearance.
 * Uses two overlapping meshes to create a striped effect.
 */

import { useState, useMemo } from 'react';
import { Text, Edges } from '@react-three/drei';
import { useCanvasStore } from '../../store';
import { getBuildingConfig } from '../buildingGeometry';
import type { TypedBuildingProps } from './types';

const ENUM_COLOR = '#7c3aed';

export function EnumCrate({ node, position }: TypedBuildingProps) {
  const [hovered, setHovered] = useState(false);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const setHoveredNode = useCanvasStore((s) => s.setHoveredNode);
  const requestFlyToNode = useCanvasStore((s) => s.requestFlyToNode);

  const isSelected = selectedNodeId === node.id;
  const config = useMemo(() => getBuildingConfig(node), [node]);
  const { width, height } = config.geometry;
  const fileName = (node.label ?? node.id).split('/').pop() ?? node.id;

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Main body */}
      <mesh
        position={[0, height / 2, 0]}
        onClick={() => selectNode(isSelected ? null : node.id)}
        onDoubleClick={() => requestFlyToNode(node.id)}
        onPointerOver={() => { setHovered(true); setHoveredNode(node.id); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); setHoveredNode(null); document.body.style.cursor = 'auto'; }}
      >
        <cylinderGeometry args={[width / 2, width / 2, height, 6]} />
        <meshStandardMaterial
          color={hovered ? '#f59e0b' : ENUM_COLOR}
          emissive={isSelected ? ENUM_COLOR : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
          roughness={config.material.roughness}
          metalness={config.material.metalness}
        />
        <Edges
          threshold={15}
          color={isSelected ? '#ffffff' : '#a78bfa'}
          lineWidth={1.5}
        />
      </mesh>
      <Text
        position={[0, height + 0.3, 0]}
        fontSize={0.25}
        color="#c4b5fd"
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
