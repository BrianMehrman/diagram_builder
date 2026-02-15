/**
 * Coverage Lighting Utilities
 *
 * Extract test coverage from node metadata and map it to
 * point-light intensity and color values.
 */

import type { GraphNode } from '../../../../shared/types';

/**
 * Extract testCoverage (0-100) from node metadata.
 * Checks both `metadata.testCoverage` and `metadata.properties.testCoverage`.
 * Returns null if absent — distinguishes "untested" (0%) from "no data" (null).
 */
export function getTestCoverage(node: GraphNode): number | null {
  const meta = node.metadata;
  if (meta == null) return null;

  // Direct property
  if (typeof meta.testCoverage === 'number') return meta.testCoverage;

  // Nested under properties (parser output format)
  const props = meta.properties;
  if (props != null && typeof props === 'object' && !Array.isArray(props)) {
    const nested = (props as Record<string, unknown>).testCoverage;
    if (typeof nested === 'number') return nested;
  }

  return null;
}

/** Low-coverage ceiling — at or below this, intensity is 0 */
const LOW_THRESHOLD = 30;
/** High-coverage floor — at or above this, intensity is max */
const HIGH_THRESHOLD = 80;
/** Maximum point-light intensity */
const MAX_INTENSITY = 2.0;
/** Minimum non-zero intensity (at the low-threshold boundary) */
const MIN_INTENSITY = 0.0;

/**
 * Map coverage (0-100 | null) to point-light intensity (0.0 – 2.0).
 *
 * - 80-100%: high intensity (1.5 – 2.0)
 * - 30-80%: linearly interpolated between 0.0 and 1.5
 * - 0-30%: 0 (no added light)
 * - null: 0 (graceful fallback — AC-5)
 */
export function computeLightIntensity(coverage: number | null): number {
  if (coverage == null || coverage <= LOW_THRESHOLD) return MIN_INTENSITY;

  if (coverage >= HIGH_THRESHOLD) {
    // 80→1.5, 100→2.0 — linear within the high band
    const highT = (coverage - HIGH_THRESHOLD) / (100 - HIGH_THRESHOLD);
    return 1.5 + highT * (MAX_INTENSITY - 1.5);
  }

  // 30→0.0, 80→1.5 — linear interpolation in mid band
  const midT = (coverage - LOW_THRESHOLD) / (HIGH_THRESHOLD - LOW_THRESHOLD);
  return midT * 1.5;
}

/** Warm white for well-tested code */
const WARM_WHITE = '#FFF5E0';
/** Neutral white fallback */
const NEUTRAL_WHITE = '#FFFFFF';

/**
 * Map coverage to point-light color.
 *
 * - High (80+): warm white '#FFF5E0'
 * - Mid (30-80): blend toward neutral
 * - Low/null: '#FFFFFF' (intensity is 0 so color is unused, but safe default)
 */
export function computeLightColor(coverage: number | null): string {
  if (coverage == null || coverage <= LOW_THRESHOLD) return NEUTRAL_WHITE;
  if (coverage >= HIGH_THRESHOLD) return WARM_WHITE;

  // Mid-range: blend from neutral toward warm.
  // Simple approach — lerp the warm channel.
  // Warm white RGB: (255, 245, 224), Neutral: (255, 255, 255)
  const t = (coverage - LOW_THRESHOLD) / (HIGH_THRESHOLD - LOW_THRESHOLD);
  const g = Math.round(255 - t * (255 - 245));
  const b = Math.round(255 - t * (255 - 224));
  return `#FF${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
