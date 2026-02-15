/**
 * CitySky Sub-Orchestrator
 *
 * Renders sky-level city elements: dependency edges between buildings.
 *
 * v1 mode: flat CityEdge lines (original behaviour).
 * v2 mode: elevated bezier SkyEdge arcs with GroundShadow projections.
 *
 * Extracted from CityView as part of Epic 10, Story 10-3.
 * Updated in Story 10-17 to wire SkyEdge + GroundShadow.
 */

import { CityEdge } from './CityEdge';
import { SkyEdge } from '../components/SkyEdge';
import { GroundShadow } from '../components/GroundShadow';
import { useCityLayout } from '../hooks/useCityLayout';
import { useCityFiltering } from '../hooks/useCityFiltering';
import { useCanvasStore } from '../store';
import type { Graph } from '../../../shared/types';

interface CitySkyProps {
  graph: Graph;
}

export function CitySky({ graph }: CitySkyProps) {
  const { positions } = useCityLayout(graph);
  const { visibleEdges, nodeMap } = useCityFiltering(graph, positions);
  const cityVersion = useCanvasStore((s) => s.citySettings.cityVersion);

  const isV2 = cityVersion === 'v2';

  return (
    <>
      {/* Dependency edges between buildings */}
      {visibleEdges.map((edge) => {
        const srcPos = positions.get(edge.source)!;
        const tgtPos = positions.get(edge.target)!;

        if (isV2) {
          return (
            <group key={edge.id}>
              <SkyEdge
                edge={edge}
                sourcePosition={srcPos}
                targetPosition={tgtPos}
              />
              <GroundShadow
                edge={edge}
                sourcePosition={srcPos}
                targetPosition={tgtPos}
              />
            </group>
          );
        }

        const srcNode = nodeMap.get(edge.source);
        const tgtNode = nodeMap.get(edge.target);
        return (
          <CityEdge
            key={edge.id}
            edge={edge}
            sourcePosition={srcPos}
            targetPosition={tgtPos}
            sourceDepth={srcNode?.depth}
            targetDepth={tgtNode?.depth}
          />
        );
      })}
    </>
  );
}
