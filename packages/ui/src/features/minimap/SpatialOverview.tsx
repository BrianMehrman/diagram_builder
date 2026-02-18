/**
 * SpatialOverview Component
 *
 * 3D spatial minimap showing node positions
 */

import { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, Html, Line } from '@react-three/drei';
import type { GraphNode, Position3D } from '../../shared/types';
import { useCanvasStore } from '../canvas/store';
import { calculateFovCorners } from './fovIndicator';

interface SpatialOverviewProps {
  nodes: GraphNode[];
  selectedNodeId?: string | null;
  cameraPosition?: { x: number; y: number; z: number };
  cameraTarget?: { x: number; y: number; z: number };
  onNodeClick?: (nodeId: string) => void;
}

/**
 * Mini node representation
 */
function MiniNode({
  node,
  position,
  isSelected,
  onClick,
}: {
  node: GraphNode;
  position: Position3D;
  isSelected: boolean;
  onClick?: ((nodeId: string) => void) | undefined;
}) {
  const [hovered, setHovered] = useState(false);

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

  // Prefer metadata.label (IVM format from API), then top-level label, then extract from id
  const rawLabel = (node.metadata?.label as string) || node.label || node.id;
  const displayLabel = rawLabel.includes('/') ? rawLabel.split('/').pop()! : rawLabel;

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

      {/* Always show label */}
      <Html
        position={[0, 0.5, 0]}
        center
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div className={`text-white text-[10px] px-1 py-0.5 rounded whitespace-nowrap ${
          isSelected ? 'bg-blue-600/90 font-bold' : hovered ? 'bg-black/90' : 'bg-black/60'
        }`}>
          {displayLabel}
        </div>
      </Html>
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
 * FOV indicator showing camera frustum projected onto XZ plane
 */
function FovIndicator({
  cameraPosition,
  cameraTarget,
}: {
  cameraPosition: { x: number; y: number; z: number };
  cameraTarget: { x: number; y: number; z: number };
}) {
  const points = useMemo(() => {
    const corners = calculateFovCorners(cameraPosition, cameraTarget);
    const y = 0.05; // Slightly above ground
    return [
      [corners.topLeft.x, y, corners.topLeft.z] as [number, number, number],
      [corners.topRight.x, y, corners.topRight.z] as [number, number, number],
      [corners.bottomRight.x, y, corners.bottomRight.z] as [number, number, number],
      [corners.bottomLeft.x, y, corners.bottomLeft.z] as [number, number, number],
      [corners.topLeft.x, y, corners.topLeft.z] as [number, number, number], // close loop
    ];
  }, [cameraPosition, cameraTarget]);

  return (
    <Line
      points={points}
      color="#ffffff"
      lineWidth={1.5}
      opacity={0.4}
      transparent
    />
  );
}

/**
 * SpatialOverview component
 */
function MiniNodes({
  nodes,
  selectedNodeId,
  onNodeClick,
}: {
  nodes: GraphNode[];
  selectedNodeId: string | null | undefined;
  onNodeClick: ((nodeId: string) => void) | undefined;
}) {
  const layoutPositions = useCanvasStore((s) => s.layoutPositions);

  // Use layout positions when available, fall back to node.position
  const nodesWithPositions = useMemo(() => {
    return nodes
      .map((node) => {
        const pos = layoutPositions.get(node.id) ?? node.position;
        return pos ? { node, position: pos } : null;
      })
      .filter((entry): entry is { node: GraphNode; position: Position3D } => entry !== null);
  }, [nodes, layoutPositions]);

  return (
    <>
      {nodesWithPositions.map(({ node, position }) => (
        <MiniNode
          key={node.id}
          node={node}
          position={position}
          isSelected={selectedNodeId === node.id}
          onClick={onNodeClick}
        />
      ))}
    </>
  );
}

export function SpatialOverview({
  nodes,
  selectedNodeId,
  cameraPosition,
  cameraTarget,
  onNodeClick,
}: SpatialOverviewProps) {
  return (
    <div className="w-full h-full bg-gray-900 cursor-crosshair">
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
        <MiniNodes
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          onNodeClick={onNodeClick}
        />

        {/* Camera position indicator */}
        {cameraPosition && <CameraIndicator position={cameraPosition} />}

        {/* FOV indicator */}
        {cameraPosition && cameraTarget && (
          <FovIndicator cameraPosition={cameraPosition} cameraTarget={cameraTarget} />
        )}

        {/* Lighting */}
        <ambientLight intensity={0.8} />
      </Canvas>
    </div>
  );
}
