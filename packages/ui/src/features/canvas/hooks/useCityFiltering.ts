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
  const cityVersion = useCanvasStore((s) => s.citySettings.cityVersion);

  // Separate internal and external nodes
  const internalNodes = useMemo(
    () => graph.nodes.filter((n) => !n.isExternal),
    [graph.nodes],
  );

  const externalNodes = useMemo(
    () => graph.nodes.filter((n) => n.isExternal === true),
    [graph.nodes],
  );

  // Group ALL internal nodes by directory — used for cross-district edge detection
  // and district-level data (CityAtmosphere). Includes files, classes, methods, etc.
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

  // Group only FILE nodes by directory for clustering — mirrors radialCityLayout's
  // district grouping so cluster counts and centroids match the visible scene.
  const fileDistrictGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const node of internalNodes) {
      if (node.type !== 'file') continue;
      const filePath = (node.metadata?.path as string) ?? node.label ?? '';
      const lastSlash = filePath.lastIndexOf('/');
      const dir = lastSlash >= 0 ? filePath.substring(0, lastSlash) : 'root';
      if (!groups.has(dir)) groups.set(dir, []);
      groups.get(dir)!.push(node.id);
    }
    return groups;
  }, [internalNodes]);

  // Reverse lookup: nodeId → district path (for cross-district edge detection)
  const nodeDistrict = useMemo(() => {
    const map = new Map<string, string>();
    for (const [dir, nodeIds] of districtGroups) {
      for (const id of nodeIds) {
        map.set(id, dir);
      }
    }
    return map;
  }, [districtGroups]);

  // Compute cluster metadata for districts that exceed the threshold.
  // Uses fileDistrictGroups so counts and centroids match the layout engine's districts.
  const clusters = useMemo(() => {
    if (lodLevel > 1) return [];
    const result: ClusterMetadata[] = [];
    for (const [districtId, nodeIds] of fileDistrictGroups) {
      if (shouldCluster(nodeIds.length, DEFAULT_CLUSTER_THRESHOLD)) {
        result.push(createClusterMetadata(districtId, nodeIds, positions));
      }
    }
    return result;
  }, [fileDistrictGroups, positions, lodLevel]);

  // Set of node IDs hidden by clustering at LOD 1.
  // Includes the clustered file nodes AND their children (classes, methods, functions)
  // so none of them render individually while the ClusterBuilding represents the district.
  const clusteredNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const cluster of clusters) {
      for (const id of cluster.nodeIds) {
        ids.add(id);
      }
    }
    // Two passes handle file → class → method nesting depth
    for (let pass = 0; pass < 2; pass++) {
      for (const node of internalNodes) {
        if (node.parentId && ids.has(node.parentId)) {
          ids.add(node.id);
        }
      }
    }
    return ids;
  }, [clusters, internalNodes]);

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

  // Filter edges to only those with both endpoints having layout positions.
  // In city-v2 mode, additionally exclude intra-district edges (proximity-encoded).
  const visibleEdges = useMemo(() => {
    return graph.edges.filter((e) => {
      // Always exclude non-renderable edge types
      if (e.type !== 'imports' && e.type !== 'depends_on' && e.type !== 'calls' && e.type !== 'inherits') {
        return false;
      }

      // Both endpoints must have positions
      if (!positions.has(e.source) || !positions.has(e.target)) {
        return false;
      }

      // In v2 mode, only render cross-district edges
      if (cityVersion === 'v2') {
        const srcDistrict = nodeDistrict.get(e.source);
        const tgtDistrict = nodeDistrict.get(e.target);
        if (srcDistrict !== undefined && tgtDistrict !== undefined && srcDistrict === tgtDistrict) {
          return false;
        }
      }

      return true;
    });
  }, [graph.edges, positions, cityVersion, nodeDistrict]);

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
