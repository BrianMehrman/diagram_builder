/**
 * VariableCrate Component
 *
 * Small box representing a variable, with warm brown wood-like color.
 */

import { useState, useMemo } from 'react';
import { Text } from '@react-three/drei';
import { useCanvasStore } from '../../store';
import { getBuildingConfig } from '../buildingGeometry';
import type { TypedBuildingProps } from './types';

const CRATE_COLOR = '#8B6914';

export function VariableCrate({ node, position }: TypedBuildingProps) {
  const [hovered, setHovered] = useState(false);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const setHoveredNode = useCanvasStore((s) => s.setHoveredNode);

  const isSelected = selectedNodeId === node.id;
  const config = useMemo(() => getBuildingConfig(node), [node]);
  const { width } = config.geometry;
  const fileName = (node.label ?? node.id).split('/').pop() ?? node.id;

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh
        position={[0, width / 2, 0]}
        onClick={() => selectNode(isSelected ? null : node.id)}
        onPointerOver={() => { setHovered(true); setHoveredNode(node.id); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); setHoveredNode(null); document.body.style.cursor = 'auto'; }}
      >
        <sphereGeometry args={[width / 2, 32, 16]} />
        <meshStandardMaterial
          color={hovered ? '#f59e0b' : CRATE_COLOR}
          emissive={isSelected ? CRATE_COLOR : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
          roughness={config.material.roughness}
          metalness={config.material.metalness}
        />
      </mesh>
      <Text
        position={[0, width + 0.3, 0]}
        fontSize={0.25}
        color="#d4a574"
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
