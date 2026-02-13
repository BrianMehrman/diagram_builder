/**
 * City View Utilities
 *
 * Pure utility functions for the CityView renderer.
 * Extracted for testability without React Three Fiber dependencies.
 */

/**
 * Color palette for directory-based building coloring.
 */
export const COLOR_PALETTE = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#84cc16', // Lime
  '#f59e0b', // Amber
  '#06b6d4', // Cyan
];

const directoryColorMap: Record<string, string> = {};
let colorIndex = 0;

/**
 * Reset directory color assignments (for testing).
 */
export function resetDirectoryColors(): void {
  for (const key of Object.keys(directoryColorMap)) {
    delete directoryColorMap[key];
  }
  colorIndex = 0;
}

/**
 * Extract directory path from a node label.
 */
export function getDirectoryFromLabel(label: string | undefined): string {
  if (!label) return 'root';
  const lastSlash = label.lastIndexOf('/');
  if (lastSlash === -1) return 'root';
  return label.substring(0, lastSlash);
}

/**
 * Get a consistent color for a given directory.
 * Same directory always returns same color. Colors cycle through the palette.
 */
export function getDirectoryColor(directory: string): string {
  const existing = directoryColorMap[directory];
  if (existing) {
    return existing;
  }
  const color = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length]!;
  directoryColorMap[directory] = color;
  colorIndex++;
  return color;
}

/**
 * Floor height constant for building height calculation.
 */
export const FLOOR_HEIGHT = 3;

/**
 * Calculate building height from abstraction depth.
 * Minimum height is one floor. Each additional depth level adds one floor.
 */
export function getBuildingHeight(depth: number | undefined): number {
  const d = depth ?? 0;
  return (d + 1) * FLOOR_HEIGHT;
}

/**
 * Default building dimensions.
 */
export const BUILDING_WIDTH = 2;
export const BUILDING_DEPTH = 2;

/**
 * Type-specific building dimensions (Epic 9-B).
 */
export const CLASS_WIDTH = 2.5;
export const CLASS_DEPTH = 2.5;
export const SHOP_WIDTH = 3.5;
export const SHOP_DEPTH = 1.5;
export const CRATE_SIZE = 1.0;
export const GLASS_OPACITY = 0.3;
export const ABSTRACT_OPACITY = 0.5;

/**
 * Calculate building height from method count (for classes).
 * Each method adds one floor. Minimum 1 floor.
 */
export function getMethodBasedHeight(methodCount: number | undefined, depth: number | undefined): number {
  if (methodCount !== undefined && methodCount > 0) {
    return Math.max(Math.log2(methodCount + 1), 1) * FLOOR_HEIGHT;
  }
  return getBuildingHeight(depth);
}

/**
 * Height encoding types (mirrors HeightEncoding from store).
 */
export type HeightEncodingType = 'methodCount' | 'dependencies' | 'loc' | 'complexity' | 'churn';

/**
 * Options for encoded height calculation.
 */
export interface EncodedHeightOptions {
  encoding: HeightEncodingType;
  incomingEdgeCount?: number;
}

/**
 * Calculate building height using the specified encoding metric.
 *
 * All encodings use log2 scaling for visual consistency.
 * Falls back to methodCount when data is unavailable.
 */
export function getEncodedHeight(
  node: { methodCount?: number; depth?: number; metadata?: Record<string, unknown> },
  options: EncodedHeightOptions,
): number {
  const { encoding, incomingEdgeCount } = options;

  switch (encoding) {
    case 'methodCount':
      return getMethodBasedHeight(node.methodCount, node.depth);

    case 'dependencies': {
      const count = incomingEdgeCount ?? 0;
      if (count > 0) {
        return Math.max(Math.log2(count + 1), 1) * FLOOR_HEIGHT;
      }
      return getMethodBasedHeight(node.methodCount, node.depth);
    }

    case 'loc': {
      const loc = (node.metadata?.loc as number | undefined) ?? 0;
      if (loc > 0) {
        return Math.max(Math.log2(loc / 50 + 1), 1) * FLOOR_HEIGHT;
      }
      return getMethodBasedHeight(node.methodCount, node.depth);
    }

    case 'complexity': {
      const complexity = (node.metadata?.complexity as number | undefined) ?? 0;
      if (complexity > 0) {
        return Math.max(Math.log2(complexity + 1), 1) * FLOOR_HEIGHT;
      }
      return getMethodBasedHeight(node.methodCount, node.depth);
    }

    case 'churn': {
      const churn = (node.metadata?.churn as number | undefined) ?? 0;
      if (churn > 0) {
        return Math.max(Math.log2(churn + 1), 1) * FLOOR_HEIGHT;
      }
      // Churn requires git data — graceful fallback to methodCount
      return getMethodBasedHeight(node.methodCount, node.depth);
    }

    default:
      return getMethodBasedHeight(node.methodCount, node.depth);
  }
}

/**
 * Build a map of node ID → incoming edge count from the graph's edges.
 * Counts edges where the node is the target.
 */
export function buildIncomingEdgeCounts(
  edges: ReadonlyArray<{ target: string }>,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const edge of edges) {
    counts.set(edge.target, (counts.get(edge.target) ?? 0) + 1);
  }
  return counts;
}

/**
 * External building color (distinct from directory colors).
 */
export const EXTERNAL_COLOR = '#475569'; // Slate
