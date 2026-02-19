/**
 * OverheadWire Component (Story 11-11, 11-13)
 *
 * Renders a runtime relationship (method call, composition) as a thin
 * wire/cable arc above building rooftops.
 *
 * Visual distinction from underground pipes:
 *   - Wires use thin LINE geometry (LineBasicMaterial / LineDashedMaterial)
 *   - Pipes use thick TUBE geometry (TubeGeometry + MeshStandardMaterial)
 *
 * Wire style by edge type (Story 11-13):
 *   - 'calls'    → solid green  line (LineBasicMaterial)
 *   - 'composes' → dashed purple line (LineDashedMaterial)
 *
 * Arc shape:
 *   - Starts at source building rooftop (Y = sourceHeight)
 *   - Peaks at Y = max(sourceHeight, targetHeight) + baseOffset + distance * scaleFactor
 *   - Ends at target building rooftop (Y = targetHeight)
 *
 * Uses THREE.Line via <primitive> to avoid R3F <line> / SVG conflict.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { useCanvasStore } from '../store';
import {
  calculateWireArcPeak,
  isWireVisible,
  getWireColor,
  getWireMaterialType,
  WIRE_DASH_SIZE,
  WIRE_GAP_SIZE,
} from '../views/cityViewUtils';
import type { Position3D } from '../../../shared/types';

export interface OverheadWireProps {
  /** XZ position of source node (Y ignored — wire starts at sourceHeight). */
  sourcePosition: Position3D;
  /** XZ position of target node (Y ignored — wire ends at targetHeight). */
  targetPosition: Position3D;
  /** Rooftop Y of the source building (world units). */
  sourceHeight: number;
  /** Rooftop Y of the target building (world units). */
  targetHeight: number;
  /** Edge relationship type — drives color and line style. */
  edgeType: string;
}

/** Number of points sampled along the bezier curve. */
const CURVE_SEGMENTS = 24;

/** Wire opacity in normal mode. */
const WIRE_OPACITY = 0.7;

export function OverheadWire({
  sourcePosition,
  targetPosition,
  sourceHeight,
  targetHeight,
  edgeType,
}: OverheadWireProps) {
  const lodLevel = useCanvasStore((s) => s.lodLevel);

  const lineObject = useMemo(() => {
    const dx = targetPosition.x - sourcePosition.x;
    const dz = targetPosition.z - sourcePosition.z;
    const horizontalDistance = Math.sqrt(dx * dx + dz * dz);

    const peakY = calculateWireArcPeak(sourceHeight, targetHeight, horizontalDistance);
    const midX = (sourcePosition.x + targetPosition.x) / 2;
    const midZ = (sourcePosition.z + targetPosition.z) / 2;

    // Quadratic bezier: source rooftop → peak midpoint → target rooftop
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(sourcePosition.x, sourceHeight, sourcePosition.z),
      new THREE.Vector3(midX, peakY, midZ),
      new THREE.Vector3(targetPosition.x, targetHeight, targetPosition.z),
    );

    const points = curve.getPoints(CURVE_SEGMENTS);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const color = getWireColor(edgeType);
    const materialType = getWireMaterialType(edgeType);

    let line: THREE.Line;

    if (materialType === 'dashed') {
      // LineDashedMaterial requires computeLineDistances() after geometry is set
      const material = new THREE.LineDashedMaterial({
        color,
        transparent: true,
        opacity: WIRE_OPACITY,
        dashSize: WIRE_DASH_SIZE,
        gapSize: WIRE_GAP_SIZE,
      });
      line = new THREE.Line(geometry, material);
      line.computeLineDistances();
    } else {
      // Solid thin line — visually distinct from underground tube pipes
      const material = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: WIRE_OPACITY,
      });
      line = new THREE.Line(geometry, material);
    }

    return line;
  }, [sourcePosition, targetPosition, sourceHeight, targetHeight, edgeType]);

  // LOD gate — wires visible at LOD 2+ only
  if (!isWireVisible(lodLevel)) return null;

  // Use <primitive> to avoid React reconciler / SVG <line> conflict
  return <primitive object={lineObject} />;
}
