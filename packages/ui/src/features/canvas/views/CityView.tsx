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
import { LodController } from '../components/LodController';
import { useCanvasStore } from '../store';
import { useCityLayout } from '../hooks/useCityLayout';
import { computeGroundOpacity } from '../undergroundUtils';
import type { Graph } from '../../../shared/types';

interface CityViewProps {
  graph: Graph;
}

export function CityView({ graph }: CityViewProps) {
  const isUndergroundMode = useCanvasStore((s) => s.isUndergroundMode);
  const visibleLayers = useCanvasStore((s) => s.visibleLayers);

  const { positions, groundWidth, groundDepth } = useCityLayout(graph);

  return (
    <group name="city-view">
      {/* LOD level controller — updates lodLevel based on camera distance */}
      <LodController />

      {/* Ground plane */}
      <GroundPlane
        width={Math.max(groundWidth, 20)}
        depth={Math.max(groundDepth, 20)}
        opacity={computeGroundOpacity(isUndergroundMode)}
      />

      {/* Above-ground layer: buildings, edges */}
      {visibleLayers.aboveGround && (
        <>
          <CityBlocks graph={graph} />
          <CitySky graph={graph} />
        </>
      )}

      {/* Atmospheric effects */}
      <CityAtmosphere />

      {/* Underground dependency tunnels */}
      {visibleLayers.underground && (
        <UndergroundLayer graph={graph} positions={positions} />
      )}
    </group>
  );
}
