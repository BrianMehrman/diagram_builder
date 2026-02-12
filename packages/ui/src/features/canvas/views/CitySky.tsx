/**
 * CitySky Sub-Orchestrator
 *
 * Renders sky-level city elements: dependency edges between buildings.
 *
 * Extracted from CityView as part of Epic 10, Story 10-3.
 */

import { CityEdge } from './CityEdge';
import { useCityLayout } from '../hooks/useCityLayout';
import { useCityFiltering } from '../hooks/useCityFiltering';
import type { Graph } from '../../../shared/types';

interface CitySkyProps {
  graph: Graph;
}

export function CitySky({ graph }: CitySkyProps) {
  const { positions } = useCityLayout(graph);
  const { visibleEdges, nodeMap } = useCityFiltering(graph, positions);

  return (
    <>
      {/* Dependency edges between buildings */}
      {visibleEdges.map((edge) => {
        const srcPos = positions.get(edge.source)!;
        const tgtPos = positions.get(edge.target)!;
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
