/**
 * FileBlock Component
 *
 * Renders a file as a ground-level land plot in the city metaphor.
 * Three layers:
 *  1. Ground plane — subtle colored rectangle (always)
 *  2. Boundary line — thin rectangle outline (multi-export files only)
 *  3. File name label — small text at block edge (LOD 2+ only)
 *
 * Pattern follows DistrictGround.tsx (meshBasicMaterial, depthWrite=false,
 * <primitive> for THREE.Line to avoid SVG conflict).
 */

import { useMemo, useState } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { useCanvasStore } from '../store';
import type { BlockLayout } from '../layout/types';

export interface FileBlockProps {
  block: BlockLayout;
  districtColor: string;
  lodLevel: number;
}

export function FileBlock({ block, districtColor, lodLevel }: FileBlockProps) {
  const { position, footprint, isMerged, fileId } = block;
  const { width, depth } = footprint;

  const [hovered, setHovered] = useState(false);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const setHoveredNode = useCanvasStore((s) => s.setHoveredNode);

  const isSelected = selectedNodeId === fileId;

  const handleClick = () => {
    selectNode(isSelected ? null : fileId);
  };

  const handlePointerOver = () => {
    setHovered(true);
    setHoveredNode(fileId);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    setHoveredNode(null);
    document.body.style.cursor = 'auto';
  };

  // Boundary line geometry — rectangle from 5 vertices (4 corners + close)
  const boundaryGeometry = useMemo(() => {
    if (isMerged) return null;

    const hw = width / 2;
    const hd = depth / 2;
    const y = 0.02; // slightly above ground plane to avoid z-fighting

    const points = [
      new THREE.Vector3(-hw, y, -hd),
      new THREE.Vector3(hw, y, -hd),
      new THREE.Vector3(hw, y, hd),
      new THREE.Vector3(-hw, y, hd),
      new THREE.Vector3(-hw, y, -hd), // close the loop
    ];

    return new THREE.BufferGeometry().setFromPoints(points);
  }, [width, depth, isMerged]);

  // Extract filename from full path
  const fileName = fileId.split('/').pop() ?? fileId;

  return (
    <group position={[position.x, position.y, position.z]} name={`file-block-${fileId}`}>
      {/* 1. Ground plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial
          color={isSelected ? '#f59e0b' : hovered ? '#d4a017' : districtColor}
          transparent
          opacity={isSelected ? 0.55 : hovered ? 0.4 : 0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 2. Boundary line (multi-export files only) */}
      {!isMerged && boundaryGeometry && (
        <primitive
          object={
            new THREE.Line(
              boundaryGeometry,
              new THREE.LineBasicMaterial({
                color: districtColor,
                transparent: true,
                opacity: 0.3,
              }),
            )
          }
        />
      )}

      {/* 3. File name label (LOD 2+) */}
      {lodLevel >= 2 && (
        <Text
          position={[0, 0.05, depth / 2 + 0.3]}
          fontSize={0.4}
          color="#ffffff"
          anchorX="center"
          anchorY="top"
          outlineWidth={0.02}
          outlineColor="#000000"
          frustumCulled
        >
          {fileName}
        </Text>
      )}
    </group>
  );
}
