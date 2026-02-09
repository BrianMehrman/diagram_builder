import type { Position3D } from '../../../../shared/types';

/**
 * Config fields needed by calculateRingRadius
 */
export interface RingRadiusConfig {
  centerRadius: number;
  ringSpacing: number;
}

/**
 * Config fields needed by assignDistrictArcs
 */
export interface ArcAssignmentConfig {
  arcPadding: number;
}

/**
 * Config fields needed by positionNodesInArc
 */
export interface ArcPositionConfig {
  buildingSpacing: number;
}

/**
 * Config fields needed by calculateEntryPointPosition
 */
export interface EntryPointConfig {
  centerRadius: number;
}

/**
 * Config fields needed by distributeDistrictsAcrossRings
 */
export interface DistributionConfig {
  centerRadius: number;
  ringSpacing: number;
}

/**
 * Input district descriptor for arc assignment
 */
export interface DistrictDescriptor {
  id: string;
  nodeCount: number;
}

/**
 * Result of arc assignment for a single district
 */
export interface DistrictArc {
  id: string;
  arcStart: number;
  arcEnd: number;
}

/**
 * Minimal node reference for positioning
 */
export interface NodeRef {
  id: string;
}

/**
 * Positioned node result
 */
export interface PositionedNode {
  id: string;
  position: Position3D;
}

/**
 * Input district for multi-ring distribution
 */
export interface DistrictNodes {
  id: string;
  nodeIds: string[];
}

/**
 * Result of distributing a district across rings
 */
export interface RingAssignment {
  districtId: string;
  ringDepth: number;
  nodeIds: string[];
}

/**
 * Calculate the radius for a given depth ring.
 *
 * Depth 0 nodes sit at centerRadius, each subsequent depth adds ringSpacing.
 *
 * @param depth - Abstraction depth (0 = entry point)
 * @param config - Ring radius configuration
 * @returns Radius in world units
 */
export function calculateRingRadius(depth: number, config: RingRadiusConfig): number {
  return config.centerRadius + depth * config.ringSpacing;
}

/**
 * Divide a ring into contiguous arc segments proportional to each district's node count.
 *
 * The full circle (2PI) is split proportionally by nodeCount, with arcPadding
 * inserted between adjacent segments.
 *
 * @param districts - Districts to assign arcs to
 * @param _ringDepth - The ring depth (reserved for future use)
 * @param config - Arc assignment configuration
 * @returns Array of district arcs with start/end angles in radians
 */
export function assignDistrictArcs(
  districts: DistrictDescriptor[],
  _ringDepth: number,
  config: ArcAssignmentConfig,
): DistrictArc[] {
  if (districts.length === 0) return [];

  const totalNodes = districts.reduce((sum, d) => sum + d.nodeCount, 0);
  if (totalNodes === 0) return [];

  const totalPadding = config.arcPadding * districts.length;
  const usableArc = Math.max(0, 2 * Math.PI - totalPadding);

  let currentAngle = 0;
  const result: DistrictArc[] = [];

  for (const district of districts) {
    const proportion = district.nodeCount / totalNodes;
    const arcSize = proportion * usableArc;

    result.push({
      id: district.id,
      arcStart: currentAngle,
      arcEnd: currentAngle + arcSize,
    });

    currentAngle += arcSize + config.arcPadding;
  }

  return result;
}

/**
 * Position nodes evenly within an arc segment at a given radius.
 *
 * Converts from polar coordinates (angle, radius) to cartesian (x, z).
 * Y is always 0 — height is handled separately by the layout engine.
 *
 * @param nodes - Nodes to position
 * @param arcStart - Start angle in radians
 * @param arcEnd - End angle in radians
 * @param radius - Distance from origin
 * @param _config - Arc position configuration (reserved for spacing refinements)
 * @returns Positioned nodes with cartesian coordinates
 */
export function positionNodesInArc(
  nodes: NodeRef[],
  arcStart: number,
  arcEnd: number,
  radius: number,
  _config: ArcPositionConfig,
): PositionedNode[] {
  if (nodes.length === 0) return [];

  const arcSpan = arcEnd - arcStart;

  return nodes.map((node, i) => {
    // Distribute evenly: for N nodes, place at (i + 0.5) / N of the arc
    const t = (i + 0.5) / nodes.length;
    const angle = arcStart + t * arcSpan;

    return {
      id: node.id,
      position: {
        x: Math.cos(angle) * radius,
        y: 0,
        z: Math.sin(angle) * radius,
      },
    };
  });
}

/**
 * Position entry-point nodes at or near the center of the radial layout.
 *
 * A single entry node is placed at the exact center (0, 0, 0).
 * Multiple entry nodes are distributed in a small circle within centerRadius.
 *
 * @param entryNodes - Entry point nodes to position
 * @param config - Entry point configuration
 * @returns Positioned entry nodes
 */
export function calculateEntryPointPosition(
  entryNodes: NodeRef[],
  config: EntryPointConfig,
): PositionedNode[] {
  if (entryNodes.length === 0) return [];

  if (entryNodes.length === 1) {
    return [{
      id: entryNodes[0]!.id,
      position: { x: 0, y: 0, z: 0 },
    }];
  }

  // Distribute multiple entry points in a small circle at half centerRadius
  const entryRadius = config.centerRadius * 0.5;
  const angleStep = (2 * Math.PI) / entryNodes.length;

  return entryNodes.map((node, i) => {
    const angle = i * angleStep;
    return {
      id: node.id,
      position: {
        x: Math.cos(angle) * entryRadius,
        y: 0,
        z: Math.sin(angle) * entryRadius,
      },
    };
  });
}

/**
 * Distribute districts across multiple rings based on the depths of their nodes.
 *
 * A district that has nodes at different depths is split into multiple ring
 * assignments — one per unique depth level. Each ring assignment contains only
 * the node IDs that belong to that depth.
 *
 * @param districts - Districts with their node IDs
 * @param nodeDepths - Map of nodeId → depth
 * @param _config - Distribution configuration (reserved for future use)
 * @returns Ring assignments grouping district nodes by depth
 */
export function distributeDistrictsAcrossRings(
  districts: DistrictNodes[],
  nodeDepths: Map<string, number>,
  _config: DistributionConfig,
): RingAssignment[] {
  if (districts.length === 0) return [];

  const assignments: RingAssignment[] = [];

  for (const district of districts) {
    // Group node IDs by their depth
    const depthGroups = new Map<number, string[]>();

    for (const nodeId of district.nodeIds) {
      const depth = nodeDepths.get(nodeId) ?? 0;
      if (!depthGroups.has(depth)) depthGroups.set(depth, []);
      depthGroups.get(depth)!.push(nodeId);
    }

    // Create one ring assignment per depth group
    for (const [depth, nodeIds] of depthGroups) {
      assignments.push({
        districtId: district.id,
        ringDepth: depth,
        nodeIds,
      });
    }
  }

  return assignments;
}
