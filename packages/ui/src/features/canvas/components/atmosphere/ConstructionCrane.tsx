/**
 * ConstructionCrane Component
 *
 * Iconic crane silhouette placed on top of buildings with high recent
 * change frequency (top 10% by changeCount). Visible at LOD 3+ only.
 *
 * The caller decides whether a node qualifies (via craneUtils);
 * this component simply renders the geometry when conditions are met.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { useCanvasStore } from '../../store';
import type { GraphNode, Position3D } from '../../../../shared/types';

export interface ConstructionCraneProps {
  node: GraphNode;
  position: Position3D;
  buildingHeight: number;
}

/** Construction yellow/orange */
const CRANE_COLOR = '#F59E0B';

export function ConstructionCrane({ position, buildingHeight }: ConstructionCraneProps) {
  const lodLevel = useCanvasStore((s) => s.lodLevel);
  const cranesEnabled = useCanvasStore(
    (s) => s.citySettings.atmosphereOverlays.cranes,
  );

  // AC-5: visible at LOD 3+ only
  // AC-3: toggleable via atmosphereOverlays.cranes
  if (lodLevel < 3 || !cranesEnabled) return null;

  const poleHeight = buildingHeight * 0.6;
  const armLength = buildingHeight * 0.5;
  const hookLength = buildingHeight * 0.15;

  // Memoize the material so it's shared across instances
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: CRANE_COLOR, roughness: 0.6, metalness: 0.3 }),
    [],
  );

  return (
    <group position={[position.x, buildingHeight, position.z]}>
      {/* Vertical pole */}
      <mesh position={[0, poleHeight / 2, 0]} material={material}>
        <boxGeometry args={[0.15, poleHeight, 0.15]} />
      </mesh>

      {/* Horizontal arm — offset to one side */}
      <mesh position={[armLength / 2, poleHeight, 0]} material={material}>
        <boxGeometry args={[armLength, 0.1, 0.1]} />
      </mesh>

      {/* Hook — dangling from arm tip */}
      <mesh position={[armLength, poleHeight - hookLength / 2, 0]} material={material}>
        <boxGeometry args={[0.05, hookLength, 0.05]} />
      </mesh>
    </group>
  );
}
