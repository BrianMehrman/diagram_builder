/**
 * SmogOverlay Component
 *
 * Semi-transparent particle cloud over districts with high average
 * complexity (above 75th percentile). Visible at LOD 3+ only.
 *
 * The caller provides district arc metadata and all graph nodes;
 * this component calculates per-district averages and renders
 * sprite-based smog where thresholds are exceeded.
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import { useCanvasStore } from '../../store';
import type { GraphNode } from '../../../../shared/types';
import type { DistrictArcMetadata } from '../../layout/engines/radialCityLayout';
import {
  getAverageComplexity,
  computeSmogThreshold,
  shouldShowSmog,
  computeSmogOpacity,
} from './smogUtils';

export interface SmogOverlayProps {
  districts: DistrictArcMetadata[];
  /** Map from district id to nodes in that district */
  districtNodeMap: Map<string, GraphNode[]>;
}

/** Smog color — gray-brown haze */
const SMOG_COLOR = new THREE.Color('#9CA3AF');

/** Height above ground plane for smog layer */
const SMOG_HEIGHT = 3;

/** Number of sprite particles per smog district */
const PARTICLES_PER_DISTRICT = 8;

/**
 * Generate deterministic particle positions within a district arc.
 * Uses simple seeded distribution across the arc area.
 */
function generateParticlePositions(
  arc: DistrictArcMetadata,
  count: number,
): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  const midRadius = (arc.innerRadius + arc.outerRadius) / 2;
  const radiusSpread = (arc.outerRadius - arc.innerRadius) * 0.4;
  const arcSpan = arc.arcEnd - arc.arcStart;

  for (let i = 0; i < count; i++) {
    // Distribute evenly across the arc with slight variation
    const t = (i + 0.5) / count;
    const angle = arc.arcStart + t * arcSpan;
    // Alternate inner/outer for spread
    const radiusOffset = (i % 2 === 0 ? 1 : -1) * radiusSpread * ((i % 3) / 3);
    const r = midRadius + radiusOffset;
    const yOffset = (i % 3) * 0.5; // slight vertical variation

    positions.push(
      new THREE.Vector3(
        Math.cos(angle) * r,
        SMOG_HEIGHT + yOffset,
        Math.sin(angle) * r,
      ),
    );
  }

  return positions;
}

export function SmogOverlay({ districts, districtNodeMap }: SmogOverlayProps) {
  const lodLevel = useCanvasStore((s) => s.lodLevel);
  const smogEnabled = useCanvasStore(
    (s) => s.citySettings.atmosphereOverlays.smog,
  );

  // AC-5: visible at LOD 3+ only
  // AC-3: toggleable via atmosphereOverlays.smog
  if (lodLevel < 3 || !smogEnabled) return null;

  // Compute per-district averages and threshold
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const smogDistricts = useMemo(() => {
    const districtAverages: { district: DistrictArcMetadata; avg: number }[] = [];

    for (const district of districts) {
      const districtNodes = districtNodeMap.get(district.id) ?? [];
      if (districtNodes.length === 0) continue;

      const avg = getAverageComplexity(districtNodes);
      if (avg > 0) {
        districtAverages.push({ district, avg });
      }
    }

    const averages = districtAverages.map((d) => d.avg);
    const threshold = computeSmogThreshold(averages);

    return districtAverages
      .filter((d) => shouldShowSmog(d.avg, threshold))
      .map((d) => ({
        ...d,
        opacity: computeSmogOpacity(d.avg, threshold),
        particles: generateParticlePositions(d.district, PARTICLES_PER_DISTRICT),
      }));
  }, [districts, districtNodeMap]);

  // AC-4: graceful when no qualifying districts
  if (smogDistricts.length === 0) return null;

  return (
    <group>
      {smogDistricts.map((sd) => (
        <group key={sd.district.id}>
          {sd.particles.map((pos, i) => (
            <sprite
              key={i}
              position={[pos.x, pos.y, pos.z]}
              scale={[2.5, 1.5, 1]}
            >
              <spriteMaterial
                color={SMOG_COLOR}
                transparent
                opacity={sd.opacity}
                depthWrite={false}
                sizeAttenuation
              />
            </sprite>
          ))}
        </group>
      ))}
    </group>
  );
}
