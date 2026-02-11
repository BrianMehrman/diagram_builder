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
import { useCanvasStore } from '../store';
import type { Graph, Position3D } from '../../../shared/types';
import type { DistrictArcMetadata } from '../layout/engines/radialCityLayout';
import type { BoundingBox } from '../layout/types';

export interface CityLayoutResult {
  /** Computed position for each node by ID */
  positions: Map<string, Position3D>;
  /** District arc metadata from the radial layout */
  districtArcs: DistrictArcMetadata[];
  /** Bounding box enclosing all positioned nodes */
  bounds: BoundingBox;
  /** Ground plane width derived from bounds */
  groundWidth: number;
  /** Ground plane depth derived from bounds */
  groundDepth: number;
}

/**
 * Computes the radial city layout for a graph.
 *
 * Memoized on `[graph, layoutDensity]`. Publishes positions to the
 * canvas store so camera flight can use them.
 */
export function useCityLayout(graph: Graph): CityLayoutResult {
  const layoutDensity = useCanvasStore((s) => s.layoutDensity);
  const setLayoutPositions = useCanvasStore((s) => s.setLayoutPositions);

  const layout = useMemo(() => {
    const engine = new RadialCityLayoutEngine();
    return engine.layout(graph, { density: layoutDensity });
  }, [graph, layoutDensity]);

  // Publish layout positions to store so camera flight can use them
  useEffect(() => {
    setLayoutPositions(layout.positions);
  }, [layout.positions, setLayoutPositions]);

  const groundWidth = layout.bounds.max.x - layout.bounds.min.x;
  const groundDepth = layout.bounds.max.z - layout.bounds.min.z;
  const districtArcs = (layout.metadata?.districtArcs ?? []) as DistrictArcMetadata[];

  return {
    positions: layout.positions,
    districtArcs,
    bounds: layout.bounds,
    groundWidth,
    groundDepth,
  };
}
