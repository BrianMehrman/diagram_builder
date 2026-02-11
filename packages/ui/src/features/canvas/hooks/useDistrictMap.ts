/**
 * useDistrictMap Hook
 *
 * Builds the nested type map (parentId → children) for RooftopGarden rendering.
 *
 * Extracted from CityView to enable sharing across sub-orchestrators.
 */

import { useMemo } from 'react';
import { buildNestedTypeMap } from '../components/buildings/nestedTypeUtils';
import type { GraphNode } from '../../../shared/types';

export interface DistrictMapResult {
  /** Parent ID → nested type children for rooftop garden rendering */
  nestedTypeMap: Map<string, GraphNode[]>;
}

/**
 * Builds a nested type map from graph nodes.
 *
 * @param nodes - All graph nodes
 */
export function useDistrictMap(nodes: GraphNode[]): DistrictMapResult {
  const nestedTypeMap = useMemo(
    () => buildNestedTypeMap(nodes),
    [nodes],
  );

  return { nestedTypeMap };
}
