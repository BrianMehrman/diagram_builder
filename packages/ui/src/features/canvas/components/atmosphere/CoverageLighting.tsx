/**
 * CoverageLighting Component
 *
 * Point light above a building that encodes test coverage:
 * bright warm light for well-tested code, no added light for untested code.
 *
 * Visible at LOD 3+ only, toggleable via atmosphereOverlays.lighting.
 * Wiring into CityAtmosphere is a separate story (10-22).
 */

import { useCanvasStore } from '../../store';
import type { GraphNode, Position3D } from '../../../../shared/types';
import {
  getTestCoverage,
  computeLightIntensity,
  computeLightColor,
} from './coverageLightingUtils';

export interface CoverageLightingProps {
  node: GraphNode;
  position: Position3D;
  buildingHeight: number;
}

export function CoverageLighting({ node, position, buildingHeight }: CoverageLightingProps) {
  const lodLevel = useCanvasStore((s) => s.lodLevel);
  const lightingEnabled = useCanvasStore(
    (s) => s.citySettings.atmosphereOverlays.lighting,
  );

  // AC-6: visible at LOD 3+ only
  // AC-4: toggleable via atmosphereOverlays.lighting
  if (lodLevel < 3 || !lightingEnabled) return null;

  const coverage = getTestCoverage(node);
  const intensity = computeLightIntensity(coverage);

  // AC-2 / AC-5: no light added for low coverage or absent data
  if (intensity === 0) return null;

  const color = computeLightColor(coverage);
  const yOffset = buildingHeight + buildingHeight * 0.3;

  return (
    <pointLight
      position={[position.x, yOffset, position.z]}
      color={color}
      intensity={intensity}
      distance={buildingHeight * 4}
      decay={2}
    />
  );
}
