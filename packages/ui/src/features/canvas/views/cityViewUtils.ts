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
 * External building color (distinct from directory colors).
 */
export const EXTERNAL_COLOR = '#475569'; // Slate
