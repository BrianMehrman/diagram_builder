/**
 * Color utilities for directory-based building coloring and base class visuals.
 *
 * Extracted from cityViewUtils.ts for focused testability.
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
]

const directoryColorMap: Record<string, string> = {}
let colorIndex = 0

/**
 * Reset directory color assignments (for testing).
 */
export function resetDirectoryColors(): void {
  for (const key of Object.keys(directoryColorMap)) {
    delete directoryColorMap[key]
  }
  colorIndex = 0
}

/**
 * Extract directory path from a node label.
 */
export function getDirectoryFromLabel(label: string | undefined): string {
  if (!label) return 'root'
  const lastSlash = label.lastIndexOf('/')
  if (lastSlash === -1) return 'root'
  return label.substring(0, lastSlash)
}

/**
 * Get a consistent color for a given directory.
 * Same directory always returns same color. Colors cycle through the palette.
 */
export function getDirectoryColor(directory: string): string {
  const existing = directoryColorMap[directory]
  if (existing) {
    return existing
  }
  const color = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length]!
  directoryColorMap[directory] = color
  colorIndex++
  return color
}

/**
 * External building color (distinct from directory colors).
 */
export const EXTERNAL_COLOR = '#475569' // Slate

/**
 * Base class building color palette (Story 11-6).
 *
 * Warm sandstone/amber tones communicate "foundational, load-bearing" at a glance.
 * Distinct from interface (glass), abstract (cone), and regular class (directory color).
 */
export const BASE_CLASS_COLOR = '#b45309' // Amber-700 — warm sandstone
export const BASE_CLASS_EMISSIVE = '#78350f' // Amber-900 — subtle warm glow
export const BASE_CLASS_ROUGHNESS = 0.9 // Stone-like (vs class 0.7)
export const BASE_CLASS_METALNESS = 0.05 // Matte stone (vs class 0.1)

/**
 * Footprint size multiplier for base class buildings (Story 11-6).
 * Wider base reinforces "foundational" reading at city-level zoom.
 */
export const BASE_CLASS_FOOTPRINT_MULTIPLIER = 1.3
