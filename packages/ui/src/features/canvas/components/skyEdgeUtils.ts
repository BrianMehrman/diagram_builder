/**
 * SkyEdge Utilities
 *
 * Pure utility functions for the SkyEdge component:
 * tier classification, height, color, visibility, and dash style.
 */

import type { GraphEdge } from '../../../shared/types';
import type { EdgeTierVisibility } from '../store';

/**
 * Sky-edge tier classification.
 *
 * After Story 11-9: only runtime relationships render as sky arcs.
 * - crossDistrict: method calls
 *
 * Structural relationships (imports, depends_on, inherits) were moved to the
 * underground layer in Story 11-9 and no longer appear in the sky.
 */
export type SkyEdgeTier = 'crossDistrict';

/**
 * Map a GraphEdge type to its sky-edge tier.
 * Returns null for edge types that are not rendered as sky edges.
 *
 * After Story 11-9: only 'calls' edges arc overhead.
 * Imports/inherits route underground and are excluded here.
 */
export function getSkyEdgeTier(edgeType: GraphEdge['type']): SkyEdgeTier | null {
  switch (edgeType) {
    case 'calls':
      return 'crossDistrict';
    default:
      return null;
  }
}

/**
 * Type-based Y-height for the bezier arc peak.
 * Method-call edges arc at Y=40.
 */
export function getSkyEdgeHeight(edgeType: GraphEdge['type']): number {
  switch (edgeType) {
    case 'calls':
      return 40;
    default:
      return 0;
  }
}

/** Edge color by type. Method calls = green. */
export function getSkyEdgeColor(edgeType: GraphEdge['type']): string {
  switch (edgeType) {
    case 'calls':
      return '#34d399';
    default:
      return '#6b7280';
  }
}

/**
 * Whether a sky edge should be visible given the current LOD level
 * and the user's edge-tier visibility settings.
 *
 * - LOD < 2 → always hidden
 * - Edge type not in sky tiers → hidden
 * - The matching tier toggle must be enabled
 */
export function isSkyEdgeVisible(
  edgeType: GraphEdge['type'],
  lodLevel: number,
  edgeTierVisibility: EdgeTierVisibility,
): boolean {
  if (lodLevel < 2) return false;

  const tier = getSkyEdgeTier(edgeType);
  if (tier === null) return false;

  return edgeTierVisibility[tier];
}

/** Whether the edge should render as a dashed line. None currently. */
export function isSkyEdgeDashed(_edgeType: GraphEdge['type']): boolean {
  return false;
}
