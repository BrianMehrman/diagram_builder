/**
 * Airport Component
 *
 * Wide terminal building with runway strip for external API nodes.
 */

import { useState } from 'react';
import { Text } from '@react-three/drei';
import { useCanvasStore } from '../../store';
import type { InfrastructureProps } from './types';

const TERMINAL_COLOR = '#e2e8f0';
const RUNWAY_COLOR = '#1e293b';
const STRIPE_COLOR = '#fbbf24';
const TERMINAL_W = 4;
const TERMINAL_H = 2;
const TERMINAL_D = 2;
const RUNWAY_W = 6;
const RUNWAY_H = 0.05;
const RUNWAY_D = 0.8;

export function Airport({ node, position }: InfrastructureProps) {
  const [hovered, setHovered] = useState(false);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const setHoveredNode = useCanvasStore((s) => s.setHoveredNode);
  const requestFlyToNode = useCanvasStore((s) => s.requestFlyToNode);

  const isSelected = selectedNodeId === node.id;
  const label = (node.label ?? node.id).split('/').pop() ?? node.id;

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Runway */}
      <mesh position={[0, RUNWAY_H / 2, TERMINAL_D / 2 + RUNWAY_D / 2 + 0.3]}>
        <boxGeometry args={[RUNWAY_W, RUNWAY_H, RUNWAY_D]} />
        <meshStandardMaterial color={RUNWAY_COLOR} roughness={0.9} metalness={0.1} />
      </mesh>
      {/* Runway center stripe */}
      <mesh position={[0, RUNWAY_H + 0.01, TERMINAL_D / 2 + RUNWAY_D / 2 + 0.3]}>
        <boxGeometry args={[RUNWAY_W * 0.8, 0.01, 0.08]} />
        <meshStandardMaterial color={STRIPE_COLOR} emissive={STRIPE_COLOR} emissiveIntensity={0.2} />
      </mesh>
      {/* Terminal building */}
      <mesh
        position={[0, TERMINAL_H / 2, 0]}
        onClick={() => selectNode(isSelected ? null : node.id)}
        onDoubleClick={() => requestFlyToNode(node.id)}
        onPointerOver={() => { setHovered(true); setHoveredNode(node.id); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); setHoveredNode(null); document.body.style.cursor = 'auto'; }}
      >
        <boxGeometry args={[TERMINAL_W, TERMINAL_H, TERMINAL_D]} />
        <meshStandardMaterial
          color={hovered ? '#f1f5f9' : TERMINAL_COLOR}
          emissive={isSelected ? '#06b6d4' : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
      {/* Control tower */}
      <mesh position={[TERMINAL_W / 2 - 0.5, TERMINAL_H + 1.5, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 3, 12]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[TERMINAL_W / 2 - 0.5, TERMINAL_H + 3.2, 0]}>
        <cylinderGeometry args={[0.5, 0.4, 0.5, 12]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.5} />
      </mesh>
      <Text
        position={[0, TERMINAL_H + 4, 0]}
        fontSize={0.3}
        color="#06b6d4"
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
