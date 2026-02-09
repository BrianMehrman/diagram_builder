/**
 * Organelle Component
 *
 * Renders a method, function, or variable as a 3D organelle within the cell.
 * Shape and color indicate type, size reflects complexity.
 */

import { useState } from 'react';
import { useCanvasStore } from '../store';
import type { GraphNode, Position3D } from '../../../shared/types';
import { getOrganelleColor, getOrganelleShape, getOrganelleSize } from './cellViewUtils';

interface OrganelleProps {
  node: GraphNode;
  position: Position3D;
}

export function Organelle({ node, position }: OrganelleProps) {
  const [hovered, setHovered] = useState(false);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const setHoveredNode = useCanvasStore((s) => s.setHoveredNode);

  const isSelected = selectedNodeId === node.id;
  const color = getOrganelleColor(node.type);
  const shape = getOrganelleShape(node.type);
  const size = getOrganelleSize(node.metadata);

  const handleClick = () => {
    selectNode(isSelected ? null : node.id);
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
      {/* Organelle shape */}
      <mesh
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {shape === 'cube' ? (
          <boxGeometry args={[size * 0.8, size * 0.8, size * 0.8]} />
        ) : (
          <sphereGeometry args={[size, 16, 16]} />
        )}
        <meshStandardMaterial
          color={hovered ? '#f59e0b' : color}
          transparent
          opacity={0.85}
          roughness={0.3}
          metalness={0.1}
          emissive={isSelected ? color : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>

      {/* Label plane */}
      <mesh position={[0, size + 0.3, 0]}>
        <planeGeometry args={[(node.label ?? '').length * 0.15, 0.3]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}
