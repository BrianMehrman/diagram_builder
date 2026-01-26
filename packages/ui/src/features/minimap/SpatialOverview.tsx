/**
 * SpatialOverview Component
 *
 * 3D spatial minimap showing node positions
 */

import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, Html } from '@react-three/drei';
import type { GraphNode } from '../../shared/types';

interface SpatialOverviewProps {
  nodes: GraphNode[];
  selectedNodeId?: string | null;
  cameraPosition?: { x: number; y: number; z: number };
  onNodeClick?: (nodeId: string) => void;
}

/**
 * Mini node representation
 */
function MiniNode({
  node,
  isSelected,
  onClick,
}: {
  node: GraphNode;
  isSelected: boolean;
  onClick?: ((nodeId: string) => void) | undefined;
}) {
  const [hovered, setHovered] = useState(false);
  const position = node.position ?? { x: 0, y: 0, z: 0 };

  const getColor = (type: GraphNode['type']): string => {
    switch (type) {
      case 'file':
        return '#0ea5e9';
      case 'class':
        return '#8b5cf6';
      case 'function':
        return '#10b981';
      case 'method':
        return '#f59e0b';
      case 'variable':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(node.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial
          color={getColor(node.type)}
          opacity={isSelected ? 1 : hovered ? 0.9 : 0.7}
          transparent
        />
      </mesh>

      {/* Show label on hover or when selected */}
      {(hovered || isSelected) && (
        <Html
          position={[0, 0.5, 0]}
          center
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div className="bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
            {node.label || node.id}
          </div>
        </Html>
      )}
    </group>
  );
}

/**
 * Camera position indicator
 */
function CameraIndicator({
  position,
}: {
  position: { x: number; y: number; z: number };
}) {
  return (
    <mesh position={[position.x, position.y, position.z]}>
      <coneGeometry args={[0.3, 0.6, 4]} />
      <meshBasicMaterial color="#ffffff" opacity={0.8} transparent />
    </mesh>
  );
}

/**
 * SpatialOverview component
 */
export function SpatialOverview({
  nodes,
  selectedNodeId,
  cameraPosition,
  onNodeClick,
}: SpatialOverviewProps) {
  return (
    <div className="w-full h-full bg-gray-900">
      <Canvas>
        <OrthographicCamera
          makeDefault
          position={[15, 15, 15]}
          zoom={8}
          near={0.1}
          far={1000}
        />

        {/* Axes helper lines */}
        <gridHelper args={[20, 20, '#4b5563', '#374151']} />

        {/* Render mini nodes */}
        {nodes
          .filter((n) => n.position)
          .map((node) => (
            <MiniNode
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              onClick={onNodeClick}
            />
          ))}

        {/* Camera position indicator */}
        {cameraPosition && <CameraIndicator position={cameraPosition} />}

        {/* Lighting */}
        <ambientLight intensity={0.8} />
      </Canvas>
    </div>
  );
}
