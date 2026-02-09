/**
 * District Ground Utilities
 *
 * Pure utility functions for deterministic district color assignment.
 */

/**
 * Color palette for district ground planes.
 * Muted, desaturated colors that work well as ground overlays.
 */
export const districtColorPalette: string[] = [
  '#2d4a3e', // dark teal
  '#4a3d2d', // dark amber
  '#2d3a4a', // dark slate blue
  '#4a2d3d', // dark mauve
  '#3d4a2d', // dark olive
  '#2d4a4a', // dark cyan
  '#4a3d4a', // dark purple
  '#4a4a2d', // dark gold
  '#2d2d4a', // dark indigo
  '#3d2d4a', // dark violet
  '#4a2d2d', // dark rust
  '#2d4a2d', // dark forest
];

/**
 * Simple string hash for deterministic color selection.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get a deterministic color for a district.
 *
 * When `index` is provided, uses index-based palette cycling (most predictable).
 * Otherwise, hashes the district name to select from the palette.
 *
 * @param districtName - The district identifier (directory path)
 * @param index - Optional index for palette cycling
 * @returns A hex color string from the palette
 */
export function getDistrictColor(districtName: string, index?: number): string {
  if (index !== undefined) {
    return districtColorPalette[index % districtColorPalette.length] ?? districtColorPalette[0]!;
  }
  const hash = hashString(districtName);
  return districtColorPalette[hash % districtColorPalette.length] ?? districtColorPalette[0]!;
}
