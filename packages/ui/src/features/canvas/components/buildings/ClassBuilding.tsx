/**
 * ClassBuilding Component
 *
 * Multi-story building representing a class. Height uses log-scaled methodCount.
 * Per-method visibility-colored floor bands via vertex coloring on a single mesh.
 */

import { useState, useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useCanvasStore } from '../../store';
import { getBuildingConfig } from '../buildingGeometry';
import { getDirectoryFromLabel, getDirectoryColor } from '../../views/cityViewUtils';
import { getFloorCount, applyFloorBandColors } from './floorBandUtils';
import { FloorLabels } from './FloorLabels';
import type { ClassBuildingProps } from './types';

export function ClassBuilding({ node, position, methods, lodLevel, encodingOptions }: ClassBuildingProps) {
  const [hovered, setHovered] = useState(false);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const setHoveredNode = useCanvasStore((s) => s.setHoveredNode);
  const requestFlyToNode = useCanvasStore((s) => s.requestFlyToNode);

  const isSelected = selectedNodeId === node.id;
  const config = useMemo(() => getBuildingConfig(node, encodingOptions), [node, encodingOptions]);
  const { width, height, depth } = config.geometry;
  const directory = getDirectoryFromLabel(node.label);
  const color = getDirectoryColor(directory);
  const fileName = (node.label ?? node.id).split('/').pop() ?? node.id;

  const methodCount = methods?.length ?? node.methodCount ?? 0;
  const floorCount = getFloorCount(methodCount > 0 ? methodCount : undefined);

  const geometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(width, height, depth, 1, floorCount, 1);

    if (methods && methods.length > 0) {
      const visibilities = methods.map((m) => m.visibility);
      applyFloorBandColors(geo, floorCount, visibilities, height);
    }

    return geo;
  }, [width, height, depth, floorCount, methods]);

  const hasFloorBands = !!(methods && methods.length > 0);

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
        />
      </mesh>
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
      {methods && methods.length > 0 && (
        <FloorLabels
          methods={methods}
          totalHeight={height}
          buildingWidth={width}
          lodLevel={lodLevel ?? 2}
        />
      )}
    </group>
  );
}
