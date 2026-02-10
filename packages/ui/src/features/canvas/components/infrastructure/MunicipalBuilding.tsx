/**
 * MunicipalBuilding Component
 *
 * Building with dome on top for logging / scheduled task nodes.
 */

import { useState } from 'react';
import { Text } from '@react-three/drei';
import { useCanvasStore } from '../../store';
import type { InfrastructureProps } from './types';

const BASE_COLOR = '#a3a3a3';
const DOME_COLOR = '#d4d4d4';
const BASE_W = 3;
const BASE_H = 3;
const BASE_D = 3;
const DOME_R = 1.2;

export function MunicipalBuilding({ node, position }: InfrastructureProps) {
  const [hovered, setHovered] = useState(false);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const setHoveredNode = useCanvasStore((s) => s.setHoveredNode);
  const requestFlyToNode = useCanvasStore((s) => s.requestFlyToNode);

  const isSelected = selectedNodeId === node.id;
  const label = (node.label ?? node.id).split('/').pop() ?? node.id;

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Base building */}
      <mesh
        position={[0, BASE_H / 2, 0]}
        onClick={() => selectNode(isSelected ? null : node.id)}
        onDoubleClick={() => requestFlyToNode(node.id)}
        onPointerOver={() => { setHovered(true); setHoveredNode(node.id); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); setHoveredNode(null); document.body.style.cursor = 'auto'; }}
      >
        <boxGeometry args={[BASE_W, BASE_H, BASE_D]} />
        <meshStandardMaterial
          color={hovered ? '#d4d4d4' : BASE_COLOR}
          emissive={isSelected ? '#fbbf24' : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
          roughness={0.6}
          metalness={0.3}
        />
      </mesh>
      {/* Dome */}
      <mesh position={[0, BASE_H + DOME_R * 0.5, 0]}>
        <sphereGeometry args={[DOME_R, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={DOME_COLOR}
          roughness={0.4}
          metalness={0.5}
        />
      </mesh>
      <Text
        position={[0, BASE_H + DOME_R + 0.5, 0]}
        fontSize={0.3}
        color="#fbbf24"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {label}
      </Text>
    </group>
  );
}
