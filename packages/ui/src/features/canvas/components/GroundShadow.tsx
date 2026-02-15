/**
 * GroundShadow Component
 *
 * Renders a semi-transparent line on the Y=0 ground plane that mirrors
 * the shape of a SkyEdge arc.  This lets developers discover dependency
 * connections at ground level without looking up.
 *
 * In transit-map mode the shadow becomes fully opaque.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import type { GraphEdge, Position3D } from '../../../shared/types';
import { useCanvasStore } from '../store';
import {
  getSkyEdgeColor,
  getSkyEdgeHeight,
  isSkyEdgeVisible,
} from './skyEdgeUtils';

export interface GroundShadowProps {
  edge: GraphEdge;
  sourcePosition: Position3D;
  targetPosition: Position3D;
}

const CURVE_SEGMENTS = 32;
const NORMAL_OPACITY = 0.25;
const TRANSIT_MAP_OPACITY = 1.0;
/** Small offset to avoid z-fighting with ground planes */
const GROUND_Y = 0.01;

export function GroundShadow({ edge, sourcePosition, targetPosition }: GroundShadowProps) {
  const lodLevel = useCanvasStore((s) => s.lodLevel);
  const edgeTierVisibility = useCanvasStore((s) => s.citySettings.edgeTierVisibility);
  const transitMapMode = useCanvasStore((s) => s.citySettings.transitMapMode);

  const lineObject = useMemo(() => {
    // Replicate the same bezier curve as SkyEdge, then project all Y to ground
    const peakY = getSkyEdgeHeight(edge.type);
    const midX = (sourcePosition.x + targetPosition.x) / 2;
    const midZ = (sourcePosition.z + targetPosition.z) / 2;

    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(sourcePosition.x, 0, sourcePosition.z),
      new THREE.Vector3(midX, peakY, midZ),
      new THREE.Vector3(targetPosition.x, 0, targetPosition.z),
    );

    const points = curve.getPoints(CURVE_SEGMENTS);

    // Orthographic projection: set all Y values to ground level
    for (const p of points) {
      p.y = GROUND_Y;
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const color = getSkyEdgeColor(edge.type);
    const opacity = transitMapMode ? TRANSIT_MAP_OPACITY : NORMAL_OPACITY;

    const material = new THREE.LineBasicMaterial({
      color,
      opacity,
      transparent: true,
      depthWrite: false,
    });

    return new THREE.Line(geometry, material);
  }, [
    edge.type,
    sourcePosition.x,
    sourcePosition.z,
    targetPosition.x,
    targetPosition.z,
    transitMapMode,
  ]);

  if (!isSkyEdgeVisible(edge.type, lodLevel, edgeTierVisibility)) {
    return null;
  }

  return <primitive object={lineObject} />;
}
