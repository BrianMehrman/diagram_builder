/**
 * CityUnderground Sub-Orchestrator (Stories 11-9, 11-10)
 *
 * Renders structural edges as underground pipe geometry.
 * Covers: imports, depends_on, inherits (extends/implements).
 *
 * Visibility is driven by:
 *   - `citySettings.undergroundVisible` — master toggle (default: off)
 *   - `citySettings.externalPipesVisible` — show external dependency pipes
 *     only when the underground layer is also on (default: off)
 *
 * External pipes (to/from isExternal nodes) are hidden by default to avoid
 * visual clutter from third-party library dependencies.
 */

import { useMemo } from 'react';
import { UndergroundPipe } from './UndergroundPipe';
import { useCityLayout } from '../hooks/useCityLayout';
import { useCityFiltering } from '../hooks/useCityFiltering';
import { classifyEdgeRouting } from '../views/cityViewUtils';
import { useCanvasStore } from '../store';
import type { Graph } from '../../../shared/types';

interface CityUndergroundProps {
  graph: Graph;
}

export function CityUnderground({ graph }: CityUndergroundProps) {
  const undergroundVisible = useCanvasStore((s) => s.citySettings.undergroundVisible);
  const externalPipesVisible = useCanvasStore((s) => s.citySettings.externalPipesVisible);
  const edgeTierVisibility = useCanvasStore((s) => s.citySettings.edgeTierVisibility);

  const { positions } = useCityLayout(graph);
  const { visibleEdges } = useCityFiltering(graph, positions);

  // Build a set of external node IDs for O(1) lookup
  const externalNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const node of graph.nodes) {
      if (node.isExternal) ids.add(node.id);
    }
    return ids;
  }, [graph.nodes]);

  // Master gate — render nothing when underground layer is off
  if (!undergroundVisible) return null;

  // Filter to underground-routed edges, then apply external and inheritance visibility rules
  const pipesToRender = visibleEdges.filter((edge) => {
    if (classifyEdgeRouting(edge.type) !== 'underground') return false;
    const isExternal =
      externalNodeIds.has(edge.source) || externalNodeIds.has(edge.target);
    // External pipes only shown when both toggles are on
    if (isExternal && !externalPipesVisible) return false;
    // Inheritance pipes (extends/implements/inherits) gated by the inheritance tier toggle
    const t = edge.type.toLowerCase();
    const isInheritance = t === 'extends' || t === 'implements' || t === 'inherits';
    if (isInheritance && !edgeTierVisibility.inheritance) return false;
    return true;
  });

  return (
    <group name="city-underground">
      {pipesToRender.map((edge) => {
        const srcPos = positions.get(edge.source);
        const tgtPos = positions.get(edge.target);
        if (!srcPos || !tgtPos) return null;

        return (
          <UndergroundPipe
            key={edge.id}
            sourcePosition={srcPos}
            targetPosition={tgtPos}
            edgeType={edge.type}
          />
        );
      })}
    </group>
  );
}
