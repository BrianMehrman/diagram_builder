/**
 * SkyEdge Component
 *
 * Renders an elevated bezier arc between two city positions,
 * representing a cross-district or inheritance edge in the sky layer.
 * Uses THREE.Line primitive to avoid SVG <line> conflict in R3F.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import type { GraphEdge, Position3D } from '../../../shared/types';
import { useCanvasStore } from '../store';
import {
  getSkyEdgeColor,
  getSkyEdgeHeight,
  isSkyEdgeDashed,
  isSkyEdgeVisible,
} from './skyEdgeUtils';

export interface SkyEdgeProps {
  edge: GraphEdge;
  sourcePosition: Position3D;
  targetPosition: Position3D;
}

const CURVE_SEGMENTS = 32;

export function SkyEdge({ edge, sourcePosition, targetPosition }: SkyEdgeProps) {
  const lodLevel = useCanvasStore((s) => s.lodLevel);
  const edgeTierVisibility = useCanvasStore((s) => s.citySettings.edgeTierVisibility);

  const lineObject = useMemo(() => {
    const peakY = getSkyEdgeHeight(edge.type);
    const midX = (sourcePosition.x + targetPosition.x) / 2;
    const midZ = (sourcePosition.z + targetPosition.z) / 2;

    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(sourcePosition.x, 0, sourcePosition.z),
      new THREE.Vector3(midX, peakY, midZ),
      new THREE.Vector3(targetPosition.x, 0, targetPosition.z),
    );

    const points = curve.getPoints(CURVE_SEGMENTS);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const color = getSkyEdgeColor(edge.type);

    const material = isSkyEdgeDashed(edge.type)
      ? new THREE.LineDashedMaterial({
          color,
          dashSize: 1,
          gapSize: 0.5,
          opacity: 0.6,
          transparent: true,
        })
      : new THREE.LineBasicMaterial({
          color,
          opacity: 0.6,
          transparent: true,
        });

    const line = new THREE.Line(geometry, material);

    // Dashed material requires computed line distances
    if (isSkyEdgeDashed(edge.type)) {
      line.computeLineDistances();
    }

    return line;
  }, [edge.type, sourcePosition.x, sourcePosition.z, targetPosition.x, targetPosition.z]);

  if (!isSkyEdgeVisible(edge.type, lodLevel, edgeTierVisibility)) {
    return null;
  }

  return <primitive object={lineObject} />;
}
