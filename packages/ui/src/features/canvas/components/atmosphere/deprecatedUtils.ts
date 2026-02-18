/**
 * Deprecated Utilities
 *
 * Detection and material configuration for deprecated code indicators.
 * Deprecated buildings get a darker, striped "boarded-up" appearance.
 */

import type { GraphNode } from '../../../../shared/types';

/**
 * Check if a node is deprecated.
 * Checks both `node.isDeprecated` and `metadata.isDeprecated`.
 * Returns false if absent — satisfies AC-4 (graceful when no flag).
 */
export function isDeprecated(node: GraphNode): boolean {
  // Direct field on GraphNode
  if (node.isDeprecated === true) return true;

  // Fallback: check metadata
  const meta = node.metadata;
  if (meta == null) return false;

  if (meta.isDeprecated === true) return true;

  // Nested under properties (parser output format)
  const props = meta.properties;
  if (props != null && typeof props === 'object' && !Array.isArray(props)) {
    const nested = (props as Record<string, unknown>).isDeprecated;
    if (nested === true) return nested;
  }

  return false;
}

/** Deprecated building color — dark desaturated gray */
export const DEPRECATED_COLOR = '#4B5563';

/** Stripe color for hatched pattern — slightly lighter gray */
export const DEPRECATED_STRIPE_COLOR = '#6B7280';

/** Deprecated material roughness — weathered look */
export const DEPRECATED_ROUGHNESS = 0.9;

/** Deprecated material metalness — dull, non-reflective */
export const DEPRECATED_METALNESS = 0.1;
