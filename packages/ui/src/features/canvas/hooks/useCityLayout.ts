/**
 * useCityLayout Hook
 *
 * Runs the RadialCityLayoutEngine on the provided graph and returns
 * layout positions, district arc metadata, and ground plane dimensions.
 *
 * Extracted from CityView to enable sharing across sub-orchestrators.
 */

import { useMemo, useEffect } from 'react';
import { RadialCityLayoutEngine } from '../layout/engines/radialCityLayout';
import { flattenHierarchicalLayout } from '../layout/hierarchicalUtils';
import { useCanvasStore } from '../store';
import type { Graph, Position3D } from '../../../shared/types';
import type { DistrictArcMetadata } from '../layout/engines/radialCityLayout';
import type {
  BoundingBox,
  DistrictLayout,
  ExternalZoneLayout,
} from '../layout/types';

export interface CityLayoutResult {
  /** Computed position for each node by ID (flattened from hierarchical result) */
  positions: Map<string, Position3D>;
  /** District arc metadata from the radial layout */
  districtArcs: DistrictArcMetadata[];
  /** Bounding box enclosing all positioned nodes */
  bounds: BoundingBox;
  /** Ground plane width derived from bounds */
  groundWidth: number;
  /** Ground plane depth derived from bounds */
  groundDepth: number;
  /** Hierarchical district layouts with blocks and children */
  districts: DistrictLayout[];
  /** External infrastructure zone layouts */
  externalZones: ExternalZoneLayout[];
}

/**
 * Computes the radial city layout for a graph.
 *
 * Memoized on `[graph, layoutDensity]`. Publishes positions to the
 * canvas store so camera flight can use them.
 *
 * Uses flattenHierarchicalLayout() to produce a flat position map from
 * the two-phase hierarchical result.
 */
export function useCityLayout(graph: Graph): CityLayoutResult {
  const layoutDensity = useCanvasStore((s) => s.layoutDensity);
  const setLayoutPositions = useCanvasStore((s) => s.setLayoutPositions);

  const layout = useMemo(() => {
    const engine = new RadialCityLayoutEngine();
    const result = engine.layout(graph, { density: layoutDensity });
    const flatPositions = flattenHierarchicalLayout(result);
    return { ...result, flatPositions };
  }, [graph, layoutDensity]);

  // Publish flattened layout positions to store so camera flight can use them
  useEffect(() => {
    setLayoutPositions(layout.flatPositions);
  }, [layout.flatPositions, setLayoutPositions]);

  const groundWidth = layout.bounds.max.x - layout.bounds.min.x;
  const groundDepth = layout.bounds.max.z - layout.bounds.min.z;
  const districtArcs = (layout.metadata?.districtArcs ?? []) as DistrictArcMetadata[];

  return {
    positions: layout.flatPositions,
    districtArcs,
    bounds: layout.bounds,
    groundWidth,
    groundDepth,
    districts: layout.districts,
    externalZones: layout.externalZones,
  };
}
