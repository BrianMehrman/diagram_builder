/**
 * CityAtmosphere Sub-Orchestrator
 *
 * Orchestrates all atmospheric indicators on top of the city:
 * - ConstructionCrane: high-churn buildings (top 10% changeCount)
 * - CoverageLighting: test coverage point lights
 * - SmogOverlay: complexity haze over high-complexity districts
 * - DeprecatedOverlay: dark striped overlay on deprecated buildings
 *
 * All indicators are:
 * - Gated by LOD 3+ (each component handles its own check)
 * - Toggleable via `atmosphereOverlays` store settings
 * - Data-graceful: missing data → indicator simply doesn't render
 * - Not mounted when toggle is off (AC-5: zero render cost)
 */

import { useMemo } from 'react';
import { ConstructionCrane } from '../components/atmosphere/ConstructionCrane';
import { CoverageLighting } from '../components/atmosphere/CoverageLighting';
import { SmogOverlay } from '../components/atmosphere/SmogOverlay';
import { DeprecatedOverlay } from '../components/atmosphere/DeprecatedOverlay';
import { shouldShowCrane, computeCraneThreshold } from '../components/atmosphere/craneUtils';
import { getTestCoverage } from '../components/atmosphere/coverageLightingUtils';
import { isDeprecated } from '../components/atmosphere/deprecatedUtils';
import { getBuildingConfig } from '../components/buildingGeometry';
import { useCanvasStore } from '../store';
import { useCityLayout } from '../hooks/useCityLayout';
import { useCityFiltering } from '../hooks/useCityFiltering';
import type { Graph, GraphNode } from '../../../shared/types';

interface CityAtmosphereProps {
  graph: Graph;
}

/** Node types that represent buildings (cranes, lighting, deprecated apply to these) */
const BUILDING_TYPES = new Set(['class', 'function', 'interface', 'abstract_class']);

export function CityAtmosphere({ graph }: CityAtmosphereProps) {
  const overlays = useCanvasStore((s) => s.citySettings.atmosphereOverlays);
  const lodLevel = useCanvasStore((s) => s.lodLevel);

  const { positions, districtArcs } = useCityLayout(graph);
  const { internalNodes, districtGroups, nodeMap } = useCityFiltering(graph, positions);

  // All hooks must be called unconditionally (React rules of hooks)
  const buildingNodes = useMemo(() => {
    return internalNodes.filter(
      (n) => BUILDING_TYPES.has(n.type) && positions.has(n.id),
    );
  }, [internalNodes, positions]);

  const craneThreshold = useMemo(
    () => (overlays.cranes ? computeCraneThreshold(buildingNodes) : Infinity),
    [buildingNodes, overlays.cranes],
  );

  const districtNodeMap = useMemo(() => {
    const map = new Map<string, GraphNode[]>();
    for (const [dir, nodeIds] of districtGroups) {
      const nodes = nodeIds
        .map((id) => nodeMap.get(id))
        .filter((n): n is GraphNode => n != null);
      if (nodes.length > 0) {
        map.set(dir, nodes);
      }
    }
    return map;
  }, [districtGroups, nodeMap]);

  // AC-5: If all toggles are off OR LOD < 3, render nothing (zero cost)
  const anyEnabled = overlays.cranes || overlays.lighting || overlays.smog || overlays.deprecated;
  if (!anyEnabled || lodLevel < 3) return null;

  return (
    <group name="city-atmosphere">
      {/* Per-building indicators */}
      {buildingNodes.map((node) => {
        const pos = positions.get(node.id)!;
        const config = getBuildingConfig(node);
        const height = config.geometry.height;

        return (
          <group key={`atmo-${node.id}`}>
            {/* Construction crane — high churn buildings */}
            {overlays.cranes && shouldShowCrane(node, craneThreshold) && (
              <ConstructionCrane
                node={node}
                position={pos}
                buildingHeight={height}
              />
            )}

            {/* Coverage lighting — test coverage point lights */}
            {overlays.lighting && getTestCoverage(node) != null && (
              <CoverageLighting
                node={node}
                position={pos}
                buildingHeight={height}
              />
            )}

            {/* Deprecated overlay — dark striped buildings */}
            {overlays.deprecated && isDeprecated(node) && (
              <DeprecatedOverlay
                node={node}
                position={pos}
                buildingWidth={config.geometry.width}
                buildingDepth={config.geometry.depth}
                buildingHeight={height}
              />
            )}
          </group>
        );
      })}

      {/* Per-district indicator: smog overlay */}
      {overlays.smog && (
        <SmogOverlay
          districts={districtArcs}
          districtNodeMap={districtNodeMap}
        />
      )}
    </group>
  );
}
