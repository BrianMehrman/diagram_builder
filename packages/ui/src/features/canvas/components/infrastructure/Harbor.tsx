/**
 * Harbor Component
 *
 * Dock platform with pier posts for database nodes.
 */

import { useState } from 'react';
import { Text } from '@react-three/drei';
import { useCanvasStore } from '../../store';
import type { InfrastructureProps } from './types';

const DOCK_COLOR = '#64748b';
const POST_COLOR = '#78716c';
const WATER_COLOR = '#1e3a5f';
const DOCK_W = 4;
const DOCK_H = 0.4;
const DOCK_D = 2.5;
const POST_R = 0.15;
const POST_H = 2;

export function Harbor({ node, position }: InfrastructureProps) {
  const [hovered, setHovered] = useState(false);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const setHoveredNode = useCanvasStore((s) => s.setHoveredNode);
  const requestFlyToNode = useCanvasStore((s) => s.requestFlyToNode);

  const isSelected = selectedNodeId === node.id;
  const label = (node.label ?? node.id).split('/').pop() ?? node.id;
  const dockY = POST_H;

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Water base */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[DOCK_W + 1, DOCK_D + 1]} />
        <meshStandardMaterial color={WATER_COLOR} opacity={0.5} transparent roughness={0.2} metalness={0.1} />
      </mesh>
      {/* Dock platform */}
      <mesh
        position={[0, dockY + DOCK_H / 2, 0]}
        onClick={() => selectNode(isSelected ? null : node.id)}
        onDoubleClick={() => requestFlyToNode(node.id)}
        onPointerOver={() => { setHovered(true); setHoveredNode(node.id); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); setHoveredNode(null); document.body.style.cursor = 'auto'; }}
      >
        <boxGeometry args={[DOCK_W, DOCK_H, DOCK_D]} />
        <meshStandardMaterial
          color={hovered ? '#94a3b8' : DOCK_COLOR}
          emissive={isSelected ? '#3b82f6' : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      {/* Pier posts */}
      {[[-1.5, -0.8], [-1.5, 0.8], [1.5, -0.8], [1.5, 0.8]].map(([x, z], i) => (
        <mesh key={i} position={[x!, POST_H / 2, z!]}>
          <cylinderGeometry args={[POST_R, POST_R, POST_H, 8]} />
          <meshStandardMaterial color={POST_COLOR} roughness={0.9} metalness={0.1} />
        </mesh>
      ))}
      <Text
        position={[0, dockY + DOCK_H + 1, 0]}
        fontSize={0.3}
        color="#3b82f6"
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
