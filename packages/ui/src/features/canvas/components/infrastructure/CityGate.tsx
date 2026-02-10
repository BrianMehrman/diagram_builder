/**
 * CityGate Component
 *
 * Archway with two pillars for entry-point / auth / gateway nodes.
 */

import { useState } from 'react';
import { Text } from '@react-three/drei';
import { useCanvasStore } from '../../store';
import type { InfrastructureProps } from './types';

const PILLAR_COLOR = '#78716c';
const ARCH_COLOR = '#a8a29e';
const PILLAR_R = 0.4;
const PILLAR_H = 5;
const PILLAR_GAP = 2.5;
const ARCH_W = PILLAR_GAP + PILLAR_R * 2;
const ARCH_H = 0.6;
const ARCH_D = 0.6;

export function CityGate({ node, position }: InfrastructureProps) {
  const [hovered, setHovered] = useState(false);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const setHoveredNode = useCanvasStore((s) => s.setHoveredNode);
  const requestFlyToNode = useCanvasStore((s) => s.requestFlyToNode);

  const isSelected = selectedNodeId === node.id;
  const label = (node.label ?? node.id).split('/').pop() ?? node.id;

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Left pillar */}
      <mesh
        position={[-PILLAR_GAP / 2, PILLAR_H / 2, 0]}
        onClick={() => selectNode(isSelected ? null : node.id)}
        onDoubleClick={() => requestFlyToNode(node.id)}
        onPointerOver={() => { setHovered(true); setHoveredNode(node.id); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); setHoveredNode(null); document.body.style.cursor = 'auto'; }}
      >
        <cylinderGeometry args={[PILLAR_R, PILLAR_R, PILLAR_H, 16]} />
        <meshStandardMaterial
          color={hovered ? '#a8a29e' : PILLAR_COLOR}
          emissive={isSelected ? '#a78bfa' : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>
      {/* Right pillar */}
      <mesh position={[PILLAR_GAP / 2, PILLAR_H / 2, 0]}>
        <cylinderGeometry args={[PILLAR_R, PILLAR_R, PILLAR_H, 16]} />
        <meshStandardMaterial
          color={hovered ? '#a8a29e' : PILLAR_COLOR}
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>
      {/* Arch crossbar */}
      <mesh position={[0, PILLAR_H, 0]}>
        <boxGeometry args={[ARCH_W, ARCH_H, ARCH_D]} />
        <meshStandardMaterial
          color={ARCH_COLOR}
          roughness={0.5}
          metalness={0.4}
        />
      </mesh>
      {/* Pillar caps */}
      <mesh position={[-PILLAR_GAP / 2, PILLAR_H + ARCH_H / 2 + 0.2, 0]}>
        <sphereGeometry args={[0.3, 16, 8]} />
        <meshStandardMaterial color={ARCH_COLOR} roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[PILLAR_GAP / 2, PILLAR_H + ARCH_H / 2 + 0.2, 0]}>
        <sphereGeometry args={[0.3, 16, 8]} />
        <meshStandardMaterial color={ARCH_COLOR} roughness={0.4} metalness={0.5} />
      </mesh>
      <Text
        position={[0, PILLAR_H + ARCH_H + 1, 0]}
        fontSize={0.3}
        color="#a78bfa"
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
