/**
 * MethodRoom Component
 *
 * Box-shaped room geometry representing a method inside a class building.
 * Color indicates method type: instance, static, or constructor.
 * Positioned by the parent building using room layout calculations.
 */

import { useState } from 'react';
import { Text } from '@react-three/drei';
import { useCanvasStore } from '../../store';
import { METHOD_ROOM_COLORS } from '../../views/cityViewUtils';
import type { GraphNode } from '../../../../shared/types';

export interface MethodRoomProps {
  method: GraphNode;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
  /** Opacity multiplier for LOD cross-fade (0–1). Defaults to 1. */
  opacity?: number;
}

/**
 * Determine room color from method node metadata.
 */
function getRoomColor(method: GraphNode): string {
  // Check for constructor
  const name = (method.label ?? method.id).split('.').pop() ?? '';
  if (name === 'constructor' || name === '__init__') {
    return METHOD_ROOM_COLORS.constructor;
  }

  // Check metadata for static flag (static is an overlay, not a visibility tier)
  if (method.metadata?.isStatic === true) {
    return METHOD_ROOM_COLORS.static;
  }

  // Check visibility
  if (method.visibility && method.visibility in METHOD_ROOM_COLORS) {
    return METHOD_ROOM_COLORS[method.visibility as keyof typeof METHOD_ROOM_COLORS];
  }

  return METHOD_ROOM_COLORS.default;
}

export function MethodRoom({ method, position, size, opacity = 1 }: MethodRoomProps) {
  const [hovered, setHovered] = useState(false);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const setHoveredNode = useCanvasStore((s) => s.setHoveredNode);

  const color = getRoomColor(method);
  const label = (method.label ?? method.id).split('/').pop()?.split('.').pop() ?? method.id;

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh
        onClick={(e) => { e.stopPropagation(); selectNode(method.id); }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          setHoveredNode(method.id);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          setHoveredNode(null);
          document.body.style.cursor = 'auto';
        }}
      >
        <boxGeometry args={[size.width, size.height, size.depth]} />
        <meshStandardMaterial
          color={hovered ? '#fbbf24' : color}
          roughness={0.5}
          metalness={0.2}
          transparent
          opacity={0.85 * opacity}
        />
      </mesh>
      {hovered && (
        <Text
          position={[0, size.height / 2 + 0.15, size.depth / 2 + 0.1]}
          fontSize={0.15}
          color="#fbbf24"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {label}
        </Text>
      )}
    </group>
  );
}
