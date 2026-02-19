/**
 * BaseClassBuilding Component
 *
 * Visually distinct building for classes that are inherited by other classes.
 * Uses a warm sandstone/amber color palette and a wider footprint to communicate
 * "foundational, load-bearing" at city-level zoom (LOD 1-2).
 *
 * Supports the same method room rendering at LOD 3+ as ClassBuilding.
 */

import { useState, useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useCanvasStore } from '../../store';
import { getBuildingConfig } from '../buildingGeometry';
import {
  sortMethodsByVisibility,
  getLodTransition,
  BASE_CLASS_COLOR,
  BASE_CLASS_EMISSIVE,
} from '../../views/cityViewUtils';
import { getFloorCount, applyFloorBandColors, getMethodCount } from './floorBandUtils';
import { FloorLabels } from './FloorLabels';
import { MethodRoom } from './MethodRoom';
import { calculateRoomLayout } from './roomLayout';
import { useTransitMapStyle } from '../../hooks/useTransitMapStyle';
import type { ClassBuildingProps } from './types';

export function BaseClassBuilding({ node, position, methods, lodLevel, encodingOptions }: ClassBuildingProps) {
  const [hovered, setHovered] = useState(false);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const setHoveredNode = useCanvasStore((s) => s.setHoveredNode);
  const requestFlyToNode = useCanvasStore((s) => s.requestFlyToNode);
  const transitStyle = useTransitMapStyle();

  const isSelected = selectedNodeId === node.id;
  // Pass isBaseClass=true so the factory returns the wider footprint + stone material
  const config = useMemo(() => getBuildingConfig(node, encodingOptions, true), [node, encodingOptions]);
  const { width, height, depth } = config.geometry;
  const fileName = (node.label ?? node.id).split('/').pop() ?? node.id;

  // Sort methods: public (ground floor) → protected → private (top)
  const sortedMethods = useMemo(
    () => (methods && methods.length > 0 ? sortMethodsByVisibility(methods) : methods),
    [methods],
  );

  const methodCount = sortedMethods?.length ?? getMethodCount(node);
  const floorCount = getFloorCount(methodCount > 0 ? methodCount : undefined);

  const geometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(width, height, depth, 1, floorCount, 1);

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

  const roomPlacements = useMemo(() => {
    if (!sortedMethods || sortedMethods.length === 0) return [];
    return calculateRoomLayout(sortedMethods.length, width, height, depth);
  }, [sortedMethods, width, height, depth]);

  // Warm amber glow always present (even when not selected) — signals "foundational"
  const emissiveColor = hovered ? '#fbbf24' : isSelected ? BASE_CLASS_COLOR : BASE_CLASS_EMISSIVE;
  const emissiveIntensity = hovered ? 0.5 : isSelected ? 0.4 : 0.15;

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
          color={hasFloorBands ? '#ffffff' : BASE_CLASS_COLOR}
          vertexColors={hasFloorBands}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
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
            const method = sortedMethods![placement.methodIndex];
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
        color={BASE_CLASS_COLOR}
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {fileName}
      </Text>
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
