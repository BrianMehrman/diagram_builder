/**
 * NodeRenderer Component
 *
 * Renders individual graph nodes as 3D objects (spheres or boxes)
 */

import { useRef, useState } from 'react';
import { Mesh } from 'three';
import { useCanvasStore } from '../store';
import type { GraphNode } from '../../../shared/types';

interface NodeRendererProps {
  node: GraphNode;
}

/**
 * Get node color based on type
 */
function getNodeColor(type: GraphNode['type']): string {
  switch (type) {
    case 'file':
      return '#0ea5e9'; // Blue
    case 'class':
      return '#8b5cf6'; // Purple
    case 'function':
      return '#10b981'; // Green
    case 'method':
      return '#f59e0b'; // Amber
    case 'variable':
      return '#ef4444'; // Red
    default:
      return '#6b7280'; // Gray
  }
}

/**
 * Get node size based on type
 */
function getNodeSize(type: GraphNode['type']): number {
  switch (type) {
    case 'file':
      return 0.8;
    case 'class':
      return 0.6;
    case 'function':
      return 0.5;
    case 'method':
      return 0.4;
    case 'variable':
      return 0.3;
    default:
      return 0.5;
  }
}

/**
 * NodeRenderer component
 */
export function NodeRenderer({ node }: NodeRendererProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId);
  const selectNode = useCanvasStore((state) => state.selectNode);
  const setHoveredNode = useCanvasStore((state) => state.setHoveredNode);

  const isSelected = selectedNodeId === node.id;
  const color = getNodeColor(node.type);
  const size = getNodeSize(node.type);

  // Default position if not provided
  const position = node.position ?? { x: 0, y: 0, z: 0 };

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

  // Scale based on selection/hover state
  const scale = isSelected ? 1.3 : hovered ? 1.15 : 1;

  return (
    <mesh
      ref={meshRef}
      position={[position.x, position.y, position.z]}
      scale={scale}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Use sphere for most nodes, box for files */}
      {node.type === 'file' ? (
        <boxGeometry args={[size, size, size]} />
      ) : (
        <sphereGeometry args={[size / 2, 32, 32]} />
      )}

      <meshStandardMaterial
        color={color}
        emissive={isSelected ? color : '#000000'}
        emissiveIntensity={isSelected ? 0.3 : 0}
        roughness={0.7}
        metalness={0.2}
      />

      {/* Selection ring */}
      {isSelected && (
        <mesh>
          <ringGeometry args={[size * 0.7, size * 0.8, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      )}
    </mesh>
  );
}
