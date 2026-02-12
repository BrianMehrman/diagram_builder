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

import { useMemo } from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import type { BlockLayout } from '../layout/types';

export interface FileBlockProps {
  block: BlockLayout;
  districtColor: string;
  lodLevel: number;
}

export function FileBlock({ block, districtColor, lodLevel }: FileBlockProps) {
  const { position, footprint, isMerged, fileId } = block;
  const { width, depth } = footprint;

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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshBasicMaterial
          color={districtColor}
          transparent
          opacity={0.25}
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
