/**
 * NodeRenderer Component
 *
 * Renders individual graph nodes as 3D objects (spheres or boxes)
 * Supports selection, hover, and highlight states with visual feedback
 */

import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
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
  const [pulseIntensity, setPulseIntensity] = useState(0);

  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId);
  const highlightedNodeId = useCanvasStore((state) => state.highlightedNodeId);
  const selectNode = useCanvasStore((state) => state.selectNode);
  const setHoveredNode = useCanvasStore((state) => state.setHoveredNode);

  const isSelected = selectedNodeId === node.id;
  const isHighlighted = highlightedNodeId === node.id;
  const color = getNodeColor(node.type);
  const size = getNodeSize(node.type);

  // Default position if not provided
  const position = node.position ?? { x: 0, y: 0, z: 0 };

  // Animate pulse effect for highlighted nodes
  useFrame((_, delta) => {
    if (isHighlighted) {
      // Sine wave pulse animation (0.3 to 0.8 intensity)
      const time = performance.now() / 1000;
      const intensity = 0.55 + Math.sin(time * 4) * 0.25;
      setPulseIntensity(intensity);
    } else if (pulseIntensity > 0) {
      // Fade out when unhighlighted
      setPulseIntensity(Math.max(0, pulseIntensity - delta * 2));
    }
  });

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

  // Scale based on selection/hover/highlight state
  const baseScale = isSelected ? 1.3 : hovered ? 1.15 : 1;
  const highlightScale = isHighlighted ? 1 + pulseIntensity * 0.1 : 1;
  const scale = baseScale * highlightScale;

  // Calculate emissive properties
  const emissiveColor = useMemo(() => {
    if (isHighlighted) return '#ffffff'; // White glow for highlight
    if (isSelected) return color;
    return '#000000';
  }, [isHighlighted, isSelected, color]);

  const emissiveIntensity = useMemo(() => {
    if (isHighlighted) return pulseIntensity;
    if (isSelected) return 0.3;
    return 0;
  }, [isHighlighted, isSelected, pulseIntensity]);

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
        emissive={emissiveColor}
        emissiveIntensity={emissiveIntensity}
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

      {/* Highlight glow ring (arrival feedback) */}
      {isHighlighted && (
        <mesh scale={1 + pulseIntensity * 0.3}>
          <ringGeometry args={[size * 0.9, size * 1.1, 32]} />
          <meshBasicMaterial
            color="#3b82f6"
            transparent
            opacity={pulseIntensity * 0.6}
          />
        </mesh>
      )}
    </mesh>
  );
}
