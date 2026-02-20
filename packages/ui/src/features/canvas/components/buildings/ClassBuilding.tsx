/**
 * ClassBuilding Component
 *
 * Multi-story building representing a class. Height driven by containment
 * (method rooms). Floor bands at LOD 1-2, method rooms visible at LOD 3+.
 */

import { useState, useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useCanvasStore } from '../../store';
import { getBuildingConfig } from '../buildingGeometry';
import { getDirectoryFromLabel, getDirectoryColor, sortMethodsByVisibility, getLodTransition } from '../../views/cityViewUtils';
import { getFloorCount, applyFloorBandColors, getMethodCount } from './floorBandUtils';
import { FloorLabels } from './FloorLabels';
import { MethodRoom } from './MethodRoom';
import { calculateRoomLayout } from './roomLayout';
import { useTransitMapStyle } from '../../hooks/useTransitMapStyle';
import type { ClassBuildingProps } from './types';

export function ClassBuilding({ node, position, methods, lodLevel, encodingOptions }: ClassBuildingProps) {
  const [hovered, setHovered] = useState(false);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const setHoveredNode = useCanvasStore((s) => s.setHoveredNode);
  const requestFlyToNode = useCanvasStore((s) => s.requestFlyToNode);
  const transitStyle = useTransitMapStyle();

  const isSelected = selectedNodeId === node.id;
  const config = useMemo(() => getBuildingConfig(node, encodingOptions), [node, encodingOptions]);
  const { width, height, depth } = config.geometry;
  const directory = getDirectoryFromLabel(node.label);
  const color = getDirectoryColor(directory);
  const fileName = (node.label ?? node.id).split('/').pop() ?? node.id;

  // Sort methods by visibility: public (bottom) → protected → private (top)
  const sortedMethods = useMemo(
    () => (methods && methods.length > 0 ? sortMethodsByVisibility(methods) : methods),
    [methods],
  );

  const methodCount = sortedMethods?.length ?? getMethodCount(node);
  const floorCount = getFloorCount(methodCount > 0 ? methodCount : undefined);

  const geometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(width, height, depth, 1, floorCount, 1);

    // Apply floor band colors when method count is known (from sorted methods array or node.methodCount)
    // Default to "public" coloring when individual method visibility data is unavailable (AC-4)
    if (methodCount > 0) {
      const visibilities: Array<string | undefined> = sortedMethods && sortedMethods.length > 0
        ? sortedMethods.map((m) => m.visibility)
        : new Array(floorCount).fill(undefined);
      applyFloorBandColors(geo, floorCount, visibilities, height);
    }

    return geo;
  }, [width, height, depth, floorCount, methodCount, sortedMethods]);

  const hasFloorBands = methodCount > 0;
  const currentLod = lodLevel ?? 2;
  const { bandOpacity, roomOpacity, showRooms: lodShowRooms } = getLodTransition(currentLod);
  const showRooms = lodShowRooms && sortedMethods != null && sortedMethods.length > 0;

  // Calculate room placements for LOD 3+ rendering (uses sorted order)
  const roomPlacements = useMemo(() => {
    if (!sortedMethods || sortedMethods.length === 0) return [];
    return calculateRoomLayout(sortedMethods.length, width, height, depth);
  }, [sortedMethods, width, height, depth]);

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh
        position={[0, height / 2, 0]}
        geometry={geometry}
        onClick={() => selectNode(isSelected ? null : node.id)}
        onDoubleClick={() => requestFlyToNode(node.id)}
        onPointerOver={() => { setHovered(true); setHoveredNode(node.id); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); setHoveredNode(null); document.body.style.cursor = 'auto'; }}
      >
        <meshStandardMaterial
          color={hasFloorBands ? '#ffffff' : color}
          vertexColors={hasFloorBands}
          emissive={hovered ? '#f59e0b' : isSelected ? color : '#000000'}
          emissiveIntensity={hovered ? 0.4 : isSelected ? 0.3 : 0}
          roughness={config.material.roughness}
          metalness={config.material.metalness}
          opacity={showRooms
            ? bandOpacity * transitStyle.opacity + (1 - bandOpacity) * 0.3
            : transitStyle.opacity}
          transparent={showRooms || transitStyle.transparent}
        />
      </mesh>

      {/* Method rooms — visible at LOD 3+ */}
      {showRooms && (
        <group position={[0, 0, 0]}>
          {roomPlacements.map((placement) => {
            const method = sortedMethods[placement.methodIndex];
            if (!method) return null;
            return (
              <MethodRoom
                key={method.id}
                method={method}
                position={placement.position}
                size={placement.size}
                opacity={roomOpacity}
              />
            );
          })}
        </group>
      )}

      {hovered && (
        <Text
          position={[0, height + 1.0, 0]}
          fontSize={0.25}
          color="#fbbf24"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {methodCount} methods
        </Text>
      )}
      <Text
        position={[0, height + 0.5, 0]}
        fontSize={0.35}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {fileName}
      </Text>
      {/* Floor labels at LOD 3+ (alongside rooms) */}
      {sortedMethods && sortedMethods.length > 0 && (
        <FloorLabels
          methods={sortedMethods}
          totalHeight={height}
          buildingWidth={width}
          lodLevel={currentLod}
        />
      )}
    </group>
  );
}
