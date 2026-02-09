/**
 * XRayBuilding Component
 *
 * Renders a building in X-ray mode: wireframe walls with visible
 * internal structure (floor planes and method dots).
 */

import { useMemo } from 'react';
import { BoxGeometry, DoubleSide, EdgesGeometry } from 'three';
import type { GraphNode, Position3D } from '../../../shared/types';
import {
  getBuildingHeight,
  BUILDING_WIDTH,
  BUILDING_DEPTH,
} from './cityViewUtils';

interface XRayBuildingProps {
  node: GraphNode;
  position: Position3D;
  /** Child nodes inside this file (classes, methods, etc.) */
  children: GraphNode[];
  /** Wall opacity in x-ray mode */
  xrayOpacity: number;
  /** Whether to show internal detail (distance-based) */
  showDetail: boolean;
}

const FLOOR_HEIGHT = 3;

export function XRayBuilding({
  node,
  position,
  children,
  xrayOpacity,
  showDetail,
}: XRayBuildingProps) {
  const buildingHeight = getBuildingHeight(node.depth);

  const classes = useMemo(
    () => children.filter((n) => n.type === 'class'),
    [children]
  );

  const methods = useMemo(
    () => children.filter((n) => n.type === 'method' || n.type === 'function'),
    [children]
  );

  // Pre-compute edge geometry for the outline
  const edgesGeo = useMemo(() => {
    const box = new BoxGeometry(BUILDING_WIDTH, buildingHeight, BUILDING_DEPTH);
    return new EdgesGeometry(box);
  }, [buildingHeight]);

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Wireframe building */}
      <mesh position={[0, buildingHeight / 2, 0]}>
        <boxGeometry args={[BUILDING_WIDTH, buildingHeight, BUILDING_DEPTH]} />
        <meshStandardMaterial
          color="#475569"
          transparent
          opacity={xrayOpacity}
          wireframe
        />
      </mesh>

      {/* Edge outline for visibility */}
      <lineSegments position={[0, buildingHeight / 2, 0]} geometry={edgesGeo}>
        <lineBasicMaterial color="#64748b" />
      </lineSegments>

      {/* Internal detail (only if nearby) */}
      {showDetail && (
        <group>
          {/* Floor planes for each class */}
          {classes.map((cls, i) => (
            <mesh
              key={cls.id}
              position={[0, (i + 1) * FLOOR_HEIGHT, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry
                args={[BUILDING_WIDTH * 0.9, BUILDING_DEPTH * 0.9]}
              />
              <meshStandardMaterial
                color="#3b82f6"
                transparent
                opacity={0.3}
                side={DoubleSide}
              />
            </mesh>
          ))}

          {/* Method dots (small spheres) */}
          {methods.map((method, i) => {
            const angle = (i / Math.max(methods.length, 1)) * Math.PI * 2;
            const radius = BUILDING_WIDTH * 0.3;
            return (
              <mesh
                key={method.id}
                position={[
                  Math.cos(angle) * radius,
                  FLOOR_HEIGHT * 1.5,
                  Math.sin(angle) * radius,
                ]}
              >
                <sphereGeometry args={[0.15, 8, 8]} />
                <meshStandardMaterial
                  color="#60a5fa"
                  emissive="#60a5fa"
                  emissiveIntensity={0.5}
                />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
}
