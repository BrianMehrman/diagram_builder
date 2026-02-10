/**
 * WaterTower Component
 *
 * Cylindrical tank on stilts for job queue / cache nodes.
 */

import { useState } from 'react';
import { Text } from '@react-three/drei';
import { useCanvasStore } from '../../store';
import type { InfrastructureProps } from './types';

const TANK_COLOR = '#0ea5e9';
const STILT_COLOR = '#78716c';
const TANK_R = 1.2;
const TANK_H = 2;
const STILT_R = 0.12;
const STILT_H = 4;

export function WaterTower({ node, position }: InfrastructureProps) {
  const [hovered, setHovered] = useState(false);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const setHoveredNode = useCanvasStore((s) => s.setHoveredNode);
  const requestFlyToNode = useCanvasStore((s) => s.requestFlyToNode);

  const isSelected = selectedNodeId === node.id;
  const label = (node.label ?? node.id).split('/').pop() ?? node.id;
  const tankY = STILT_H + TANK_H / 2;

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Tank */}
      <mesh
        position={[0, tankY, 0]}
        onClick={() => selectNode(isSelected ? null : node.id)}
        onDoubleClick={() => requestFlyToNode(node.id)}
        onPointerOver={() => { setHovered(true); setHoveredNode(node.id); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); setHoveredNode(null); document.body.style.cursor = 'auto'; }}
      >
        <cylinderGeometry args={[TANK_R, TANK_R, TANK_H, 24]} />
        <meshStandardMaterial
          color={hovered ? '#38bdf8' : TANK_COLOR}
          emissive={isSelected ? TANK_COLOR : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
          roughness={0.5}
          metalness={0.6}
        />
      </mesh>
      {/* Four stilts */}
      {[[-0.6, 0, -0.6], [0.6, 0, -0.6], [-0.6, 0, 0.6], [0.6, 0, 0.6]].map(([x, _y, z], i) => (
        <mesh key={i} position={[x!, STILT_H / 2, z!]}>
          <cylinderGeometry args={[STILT_R, STILT_R, STILT_H, 8]} />
          <meshStandardMaterial color={STILT_COLOR} roughness={0.9} metalness={0.2} />
        </mesh>
      ))}
      <Text
        position={[0, tankY + TANK_H / 2 + 0.5, 0]}
        fontSize={0.3}
        color="#38bdf8"
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
