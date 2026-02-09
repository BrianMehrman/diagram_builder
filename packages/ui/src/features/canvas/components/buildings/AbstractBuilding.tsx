/**
 * AbstractBuilding Component
 *
 * Semi-transparent building with dashed edge lines.
 */

import { useState, useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useCanvasStore } from '../../store';
import { getBuildingConfig } from '../buildingGeometry';
import { getDirectoryFromLabel, getDirectoryColor } from '../../views/cityViewUtils';
import type { TypedBuildingProps } from './types';

export function AbstractBuilding({ node, position }: TypedBuildingProps) {
  const [hovered, setHovered] = useState(false);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const setHoveredNode = useCanvasStore((s) => s.setHoveredNode);

  const isSelected = selectedNodeId === node.id;
  const config = useMemo(() => getBuildingConfig(node), [node]);
  const { width, height } = config.geometry;
  const directory = getDirectoryFromLabel(node.label);
  const color = getDirectoryColor(directory);
  const fileName = (node.label ?? node.id).split('/').pop() ?? node.id;

  // Dashed line material for abstract class edges
  const dashedMaterial = useMemo(() => {
    const mat = new THREE.LineDashedMaterial({
      color: isSelected ? '#ffffff' : color,
      dashSize: 0.3,
      gapSize: 0.15,
      linewidth: 1,
    });
    return mat;
  }, [color, isSelected]);

  // Edge geometry from cone
  const edgeGeometry = useMemo(() => {
    const cone = new THREE.ConeGeometry(width / 2, height, 32);
    const edges = new THREE.EdgesGeometry(cone);
    return edges;
  }, [width, height]);

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Semi-transparent fill */}
      <mesh
        position={[0, height / 2, 0]}
        onClick={() => selectNode(isSelected ? null : node.id)}
        onPointerOver={() => { setHovered(true); setHoveredNode(node.id); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHovered(false); setHoveredNode(null); document.body.style.cursor = 'auto'; }}
      >
        <coneGeometry args={[width / 2, height, 32]} />
        <meshStandardMaterial
          color={hovered ? '#f59e0b' : color}
          opacity={config.material.opacity}
          transparent={config.material.transparent}
          roughness={config.material.roughness}
          metalness={config.material.metalness}
        />
      </mesh>

      {/* Dashed edge lines */}
      <primitive
        object={new THREE.LineSegments(edgeGeometry, dashedMaterial)}
        position={[0, height / 2, 0]}
        onUpdate={(self: THREE.LineSegments) => self.computeLineDistances()}
      />

      <Text
        position={[0, height + 0.5, 0]}
        fontSize={0.35}
        color="#94a3b8"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {fileName}
      </Text>
    </group>
  );
}
