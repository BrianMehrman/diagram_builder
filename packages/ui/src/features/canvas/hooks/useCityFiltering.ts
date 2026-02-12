/**
 * useCityFiltering Hook
 *
 * Splits graph nodes into internal vs external, groups districts,
 * computes LOD-based clustering, and filters visible edges.
 *
 * Extracted from CityView to enable sharing across sub-orchestrators.
 */

import { useMemo } from 'react';
import { shouldCluster, createClusterMetadata } from '../layout/engines/clusterUtils';
import { buildMethodChildMap } from '../components/buildings/floorBandUtils';
import { useCanvasStore } from '../store';
import type { Graph, GraphNode, Position3D } from '../../../shared/types';
import type { ClusterMetadata } from '../layout/engines/clusterUtils';

/** Default threshold for clustering — districts with more nodes collapse at LOD 1 */
const DEFAULT_CLUSTER_THRESHOLD = 20;

export interface CityFilteringResult {
  /** Nodes that are not external libraries */
  internalNodes: GraphNode[];
  /** External library nodes */
  externalNodes: GraphNode[];
  /** Directory path → list of node IDs */
  districtGroups: Map<string, string[]>;
  /** Cluster metadata for districts exceeding the threshold at LOD 1 */
  clusters: ClusterMetadata[];
  /** Set of node IDs that are collapsed into clusters */
  clusteredNodeIds: Set<string>;
  /** Parent ID → child nodes for x-ray mode */
  childrenByFile: Map<string, GraphNode[]>;
  /** Class ID → method child nodes (always computed for floor bands) */
  methodsByClass: Map<string, GraphNode[]>;
  /** Node ID → node lookup */
  nodeMap: Map<string, GraphNode>;
  /** Edges with both endpoints positioned and matching allowed types */
  visibleEdges: Graph['edges'];
}

/**
 * Filters and groups graph nodes for city rendering.
 *
 * @param graph - The full graph
 * @param positions - Layout positions from useCityLayout
 */
export function useCityFiltering(
  graph: Graph,
  positions: Map<string, Position3D>,
): CityFilteringResult {
  const lodLevel = useCanvasStore((s) => s.lodLevel);
  const isXRayMode = useCanvasStore((s) => s.isXRayMode);

  // Separate internal and external nodes
  const internalNodes = useMemo(
    () => graph.nodes.filter((n) => !n.isExternal),
    [graph.nodes],
  );

  const externalNodes = useMemo(
    () => graph.nodes.filter((n) => n.isExternal === true),
    [graph.nodes],
  );

  // Group internal files by directory for clustering
  const districtGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const node of internalNodes) {
      const filePath = (node.metadata?.path as string) ?? node.label ?? '';
      const lastSlash = filePath.lastIndexOf('/');
      const dir = lastSlash >= 0 ? filePath.substring(0, lastSlash) : 'root';
      if (!groups.has(dir)) groups.set(dir, []);
      groups.get(dir)!.push(node.id);
    }
    return groups;
  }, [internalNodes]);

  // Compute cluster metadata for districts that exceed the threshold
  const clusters = useMemo(() => {
    if (lodLevel > 1) return [];
    const result: ClusterMetadata[] = [];
    for (const [districtId, nodeIds] of districtGroups) {
      if (shouldCluster(nodeIds.length, DEFAULT_CLUSTER_THRESHOLD)) {
        result.push(createClusterMetadata(districtId, nodeIds, positions));
      }
    }
    return result;
  }, [districtGroups, positions, lodLevel]);

  // Set of node IDs that are clustered (hidden as individual buildings at LOD 1)
  const clusteredNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const cluster of clusters) {
      for (const id of cluster.nodeIds) {
        ids.add(id);
      }
    }
    return ids;
  }, [clusters]);

  // Build a map of class id -> method child nodes (always computed for floor bands)
  const methodsByClass = useMemo(
    () => buildMethodChildMap(graph.nodes),
    [graph.nodes],
  );

  // Build a map of file id -> child nodes for x-ray mode
  const childrenByFile = useMemo(() => {
    if (!isXRayMode) return new Map<string, GraphNode[]>();
    const map = new Map<string, GraphNode[]>();
    for (const node of graph.nodes) {
      if (node.type === 'class' || node.type === 'method' || node.type === 'function') {
        const parentId = node.parentId;
        if (parentId) {
          const existing = map.get(parentId) ?? [];
          existing.push(node);
          map.set(parentId, existing);
        }
      }
    }
    return map;
  }, [graph.nodes, isXRayMode]);

  // Build node lookup for edge rendering
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    for (const node of graph.nodes) {
      map.set(node.id, node);
    }
    return map;
  }, [graph.nodes]);

  // Filter edges to only those with both endpoints having layout positions
  const visibleEdges = useMemo(() => {
    return graph.edges.filter(
      (e) =>
        (e.type === 'imports' || e.type === 'depends_on' || e.type === 'calls') &&
        positions.has(e.source) &&
        positions.has(e.target),
    );
  }, [graph.edges, positions]);

  return {
    internalNodes,
    externalNodes,
    districtGroups,
    clusters,
    clusteredNodeIds,
    childrenByFile,
    methodsByClass,
    nodeMap,
    visibleEdges,
  };
}
