/**
 * CityView Component
 *
 * Thin composition shell that orchestrates the three sub-orchestrators:
 * - CityBlocks: ground-level rendering (buildings, districts, signs, clusters)
 * - CitySky: sky-level rendering (dependency edges)
 * - CityAtmosphere: atmospheric effects (placeholder)
 *
 * Also manages shell concerns: LodController, GroundPlane, UndergroundLayer,
 * and layer visibility conditionals.
 */

import { CityBlocks } from './CityBlocks';
import { CitySky } from './CitySky';
import { CityAtmosphere } from './CityAtmosphere';
import { GroundPlane } from './GroundPlane';
import { UndergroundLayer } from './UndergroundLayer';
import { CityUnderground } from '../components/CityUnderground';
import { LodController } from '../components/LodController';
import { useCanvasStore } from '../store';
import { useCityLayout } from '../hooks/useCityLayout';
import { useCameraTiltAssist } from '../hooks/useCameraTiltAssist';
import { computeGroundOpacity } from '../undergroundUtils';
import { computeUndergroundGroundOpacity } from './cityViewUtils';
import type { Graph } from '../../../shared/types';

interface CityViewProps {
  graph: Graph;
}

export function CityView({ graph }: CityViewProps) {
  const isUndergroundMode = useCanvasStore((s) => s.isUndergroundMode);
  const visibleLayers = useCanvasStore((s) => s.visibleLayers);
  const cityVersion = useCanvasStore((s) => s.citySettings.cityVersion);
  const undergroundVisible = useCanvasStore((s) => s.citySettings.undergroundVisible);

  const { positions, groundWidth, groundDepth } = useCityLayout(graph);

  // Tilt camera upward on node selection to reveal sky edges
  useCameraTiltAssist();

  // In v2 mode, ground opacity tracks the new underground toggle.
  // In v1 mode, keep the existing isUndergroundMode-based opacity.
  const groundOpacity =
    cityVersion === 'v2'
      ? computeUndergroundGroundOpacity(undergroundVisible)
      : computeGroundOpacity(isUndergroundMode);

  return (
    <group name="city-view">
      {/* LOD level controller — updates lodLevel based on camera distance */}
      <LodController />

      {/* Ground plane — semi-transparent when underground pipes are visible */}
      <GroundPlane
        width={Math.max(groundWidth, 20)}
        depth={Math.max(groundDepth, 20)}
        opacity={groundOpacity}
      />

      {/* Above-ground layer: buildings, edges */}
      {visibleLayers.aboveGround && (
        <>
          <CityBlocks graph={graph} />
          <CitySky graph={graph} />
        </>
      )}

      {/* Atmospheric effects */}
      <CityAtmosphere graph={graph} />

      {/* Underground dependency layer */}
      {cityVersion !== 'v2' && visibleLayers.underground && (
        /* v1: tunnel-based underground (legacy) */
        <UndergroundLayer graph={graph} positions={positions} />
      )}
      {cityVersion === 'v2' && (
        /* v2: pipe-based underground — self-gated by citySettings.undergroundVisible */
        <CityUnderground graph={graph} />
      )}
    </group>
  );
}
