/**
 * PowerStation Component
 *
 * Tall industrial building with smokestacks for event bus / message broker nodes.
 */

import { useState } from 'react';
import { Text } from '@react-three/drei';
import { useCanvasStore } from '../../store';
import type { InfrastructureProps } from './types';

const BASE_COLOR = '#374151';
const STACK_COLOR = '#78716c';
const BASE_W = 3;
const BASE_H = 4;
const BASE_D = 2;
const STACK_R = 0.3;
const STACK_H = 3;

export function PowerStation({ node, position }: InfrastructureProps) {
  const [hovered, setHovered] = useState(false);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const setHoveredNode = useCanvasStore((s) => s.setHoveredNode);
  const requestFlyToNode = useCanvasStore((s) => s.requestFlyToNode);

  const isSelected = selectedNodeId === node.id;
  const label = (node.label ?? node.id).split('/').pop() ?? node.id;

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Industrial base */}
      <mesh
        position={[0, BASE_H / 2, 0]}
        onClick={() => selectNode(isSelected ? null : node.id)}
        onDoubleClick={() => requestFlyToNode(node.id)}
        onPointerOver={() => { setHovered(true); setHoveredNode(node.id); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); setHoveredNode(null); document.body.style.cursor = 'auto'; }}
      >
        <boxGeometry args={[BASE_W, BASE_H, BASE_D]} />
        <meshStandardMaterial
          color={hovered ? '#6b7280' : BASE_COLOR}
          emissive={isSelected ? '#f97316' : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
          roughness={0.8}
          metalness={0.4}
        />
      </mesh>
      {/* Left smokestack */}
      <mesh position={[-0.8, BASE_H + STACK_H / 2, 0]}>
        <cylinderGeometry args={[STACK_R, STACK_R, STACK_H, 12]} />
        <meshStandardMaterial color={STACK_COLOR} roughness={0.9} metalness={0.3} />
      </mesh>
      {/* Right smokestack */}
      <mesh position={[0.8, BASE_H + STACK_H / 2, 0]}>
        <cylinderGeometry args={[STACK_R, STACK_R, STACK_H, 12]} />
        <meshStandardMaterial color={STACK_COLOR} roughness={0.9} metalness={0.3} />
      </mesh>
      <Text
        position={[0, BASE_H + STACK_H + 0.5, 0]}
        fontSize={0.3}
        color="#f97316"
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
