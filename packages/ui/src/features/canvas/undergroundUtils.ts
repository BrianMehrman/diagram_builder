/**
 * Underground Mode Utilities
 *
 * Pure functions for underground dependency visualization calculations.
 * Extracted for testability without React Three Fiber dependencies.
 */

import type { GraphEdge, Position3D } from '../../shared/types';

/** Depth below ground plane for tunnel paths */
const UNDERGROUND_Y = -3;

/** Extra dip at the midpoint for visual curvature */
const MIDPOINT_DIP = -1;

/** Minimum tunnel radius */
const MIN_RADIUS = 0.1;

/** Maximum tunnel radius */
const MAX_RADIUS = 0.5;

/** Radius increment per import */
const RADIUS_PER_IMPORT = 0.02;

/**
 * Compute ground plane opacity based on underground mode state.
 * Returns 1 (solid) when off, 0.15 when underground mode is on.
 */
export function computeGroundOpacity(isUndergroundMode: boolean): number {
  return isUndergroundMode ? 0.15 : 1;
}

/**
 * Compute tunnel radius from import count.
 * Scales linearly with a min/max cap.
 */
export function computeTunnelRadius(importCount: number): number {
  const raw = MIN_RADIUS + Math.max(importCount, 1) * RADIUS_PER_IMPORT;
  return Math.min(raw, MAX_RADIUS);
}

/**
 * Generate control points for a tunnel path between two positions.
 * The path goes from source base → underground → midpoint → underground → target base.
 */
export function generateTunnelPoints(
  source: Position3D,
  target: Position3D
): Position3D[] {
  const midX = (source.x + target.x) / 2;
  const midZ = (source.z + target.z) / 2;

  return [
    { x: source.x, y: 0, z: source.z },
    { x: source.x, y: UNDERGROUND_Y, z: source.z },
    { x: midX, y: UNDERGROUND_Y + MIDPOINT_DIP, z: midZ },
    { x: target.x, y: UNDERGROUND_Y, z: target.z },
    { x: target.x, y: 0, z: target.z },
  ];
}

/**
 * Filter edges to only include dependency-related edges
 * (imports and depends_on).
 */
export function filterImportEdges(edges: GraphEdge[]): GraphEdge[] {
  return edges.filter(
    (e) => e.type === 'imports' || e.type === 'depends_on'
  );
}
