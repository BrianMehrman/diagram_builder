/**
 * SkyEdge Utilities
 *
 * Pure utility functions for the SkyEdge component:
 * tier classification, height, color, visibility, and dash style.
 */

import type { GraphEdge } from '../../../shared/types';
import type { EdgeTierVisibility } from '../store';

/** Sky-edge tier classification */
export type SkyEdgeTier = 'crossDistrict' | 'inheritance';

/**
 * Map a GraphEdge type to its sky-edge tier.
 * Returns null for edge types that are not rendered as sky edges (e.g. 'contains').
 */
export function getSkyEdgeTier(edgeType: GraphEdge['type']): SkyEdgeTier | null {
  switch (edgeType) {
    case 'imports':
    case 'depends_on':
    case 'calls':
      return 'crossDistrict';
    case 'inherits':
      return 'inheritance';
    case 'contains':
      return null;
  }
}

/**
 * Type-based Y-height for the bezier arc peak.
 * Cross-district edges arc at Y=40; inheritance edges at Y=65.
 */
export function getSkyEdgeHeight(edgeType: GraphEdge['type']): number {
  switch (edgeType) {
    case 'imports':
    case 'depends_on':
    case 'calls':
      return 40;
    case 'inherits':
      return 65;
    case 'contains':
      return 0;
  }
}

/** Edge color by type */
export function getSkyEdgeColor(edgeType: GraphEdge['type']): string {
  switch (edgeType) {
    case 'imports':
      return '#60a5fa';
    case 'depends_on':
      return '#a78bfa';
    case 'calls':
      return '#34d399';
    case 'inherits':
      return '#f97316';
    case 'contains':
      return '#6b7280';
  }
}

/**
 * Whether a sky edge should be visible given the current LOD level
 * and the user's edge-tier visibility settings.
 *
 * - LOD < 2 → always hidden
 * - 'contains' edges → never shown as sky edges
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

/** Whether the edge should render as a dashed line (only 'inherits'). */
export function isSkyEdgeDashed(edgeType: GraphEdge['type']): boolean {
  return edgeType === 'inherits';
}
