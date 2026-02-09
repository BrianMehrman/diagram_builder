/**
 * Cluster Utilities
 *
 * Pure functions for clustering district nodes into compound buildings
 * when the node count exceeds a configurable threshold. Used at city-level
 * zoom (LOD 1) for performance and readability.
 */

import type { Position3D } from '../../../../shared/types';

/**
 * Metadata describing a cluster of nodes from a single district.
 */
export interface ClusterMetadata {
  /** District identifier */
  districtId: string;
  /** Number of nodes collapsed into this cluster */
  nodeCount: number;
  /** Centroid position of the clustered nodes */
  center: Position3D;
  /** Bounding size (max spread in X and Z, max Y) */
  size: { width: number; depth: number; height: number };
  /** IDs of all nodes in the cluster */
  nodeIds: string[];
}

/**
 * Returns true if a district should be rendered as a cluster.
 */
export function shouldCluster(nodeCount: number, threshold: number): boolean {
  return nodeCount > threshold;
}

/**
 * Computes cluster metadata from a set of node positions.
 *
 * @param districtId - The district identifier
 * @param nodeIds - IDs of nodes in this district
 * @param positions - Map of node id → Position3D from the layout engine
 * @returns ClusterMetadata with centroid, size, and node info
 */
export function createClusterMetadata(
  districtId: string,
  nodeIds: string[],
  positions: Map<string, Position3D>,
): ClusterMetadata {
  const nodePositions = nodeIds
    .map((id) => positions.get(id))
    .filter((p): p is Position3D => p !== undefined);

  if (nodePositions.length === 0) {
    return {
      districtId,
      nodeCount: nodeIds.length,
      center: { x: 0, y: 0, z: 0 },
      size: { width: 1, depth: 1, height: 1 },
      nodeIds,
    };
  }

  const xs = nodePositions.map((p) => p.x);
  const ys = nodePositions.map((p) => p.y);
  const zs = nodePositions.map((p) => p.z);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);

  const width = Math.max(maxX - minX, 1);
  const depth = Math.max(maxZ - minZ, 1);
  const height = Math.max(maxY - minY, 1);

  return {
    districtId,
    nodeCount: nodeIds.length,
    center: {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2,
      z: (minZ + maxZ) / 2,
    },
    size: { width, depth, height },
    nodeIds,
  };
}
