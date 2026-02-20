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
 * Height of a single method room inside a building (Epic 11).
 * Buildings must be tall enough to stack this many rooms vertically.
 */
export const METHOD_ROOM_HEIGHT = 2;

/**
 * Padding above method rooms inside a building (roof/lobby space).
 */
export const BUILDING_PADDING = 1;

/**
 * Y-offset for buildings sitting on top of file block foundations.
 * Buildings render with their base at this Z value (above ground plane).
 */
export const BUILDING_Y_OFFSET = 0.1;

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

/**
 * Kiosk dimensions for standalone function nodes (Story 11-12).
 * Kiosks are compact single-story boxes — visually smaller than class buildings.
 */
export const KIOSK_WIDTH = 1.5;
export const KIOSK_DEPTH = 1.5;
export const KIOSK_HEIGHT = 1.0;
/** Flat awning overhang extending beyond each side of the kiosk footprint. */
export const KIOSK_AWNING_OVERHANG = 0.25;
/** Awning slab thickness. */
export const KIOSK_AWNING_THICKNESS = 0.12;

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
 * Calculate containment-driven building height (Epic 11).
 *
 * Height is determined by how many method rooms must fit vertically.
 * Minimum 1 floor (lobby) for zero-method classes.
 *
 * @param methodCount - Number of methods in the class
 * @returns Building height in world units
 */
export function getContainmentHeight(methodCount: number): number {
  const floors = Math.max(methodCount, 1);
  return floors * METHOD_ROOM_HEIGHT + BUILDING_PADDING;
}

/**
 * Calculate building footprint scale factor from a secondary encoding metric (Epic 11).
 *
 * When containment drives height, the encoding metric (loc, complexity, etc.)
 * influences footprint width/depth instead. Returns a multiplier (1.0 = base size).
 *
 * @param node - Graph node with metadata
 * @param options - Encoding options (metric type + edge count)
 * @returns Scale multiplier for width and depth (1.0 to 2.0 range)
 */
export function getFootprintScale(
  node: { methodCount?: number; depth?: number; metadata?: Record<string, unknown> },
  options: EncodedHeightOptions,
): number {
  const { encoding, incomingEdgeCount } = options;

  let rawValue = 0;
  switch (encoding) {
    case 'methodCount':
      rawValue = node.methodCount ?? 0;
      break;
    case 'dependencies':
      rawValue = incomingEdgeCount ?? 0;
      break;
    case 'loc':
      rawValue = (node.metadata?.loc as number | undefined) ?? 0;
      break;
    case 'complexity':
      rawValue = (node.metadata?.complexity as number | undefined) ?? 0;
      break;
    case 'churn':
      rawValue = (node.metadata?.churn as number | undefined) ?? 0;
      break;
    default:
      rawValue = 0;
  }

  if (rawValue <= 0) return 1.0;

  // Log scale the value and clamp to [1.0, 2.0] range
  return Math.min(1.0 + Math.log2(rawValue + 1) / 10, 2.0);
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
 *
 * @param resolvedMethodCount - Pre-resolved method count (from getMethodCount utility)
 *   so callers can check node.methodCount, metadata.methods, etc. before calling.
 */
export function getEncodedHeight(
  node: { methodCount?: number; depth?: number; metadata?: Record<string, unknown> },
  options: EncodedHeightOptions,
  resolvedMethodCount?: number,
): number {
  const { encoding, incomingEdgeCount } = options;
  const mc = resolvedMethodCount ?? node.methodCount;

  switch (encoding) {
    case 'methodCount':
      return getMethodBasedHeight(mc, node.depth);

    case 'dependencies': {
      const count = incomingEdgeCount ?? 0;
      if (count > 0) {
        return Math.max(Math.log2(count + 1), 1) * FLOOR_HEIGHT;
      }
      return getMethodBasedHeight(mc, node.depth);
    }

    case 'loc': {
      const loc = (node.metadata?.loc as number | undefined) ?? 0;
      if (loc > 0) {
        return Math.max(Math.log2(loc / 50 + 1), 1) * FLOOR_HEIGHT;
      }
      return getMethodBasedHeight(mc, node.depth);
    }

    case 'complexity': {
      const complexity = (node.metadata?.complexity as number | undefined) ?? 0;
      if (complexity > 0) {
        return Math.max(Math.log2(complexity + 1), 1) * FLOOR_HEIGHT;
      }
      return getMethodBasedHeight(mc, node.depth);
    }

    case 'churn': {
      const churn = (node.metadata?.churn as number | undefined) ?? 0;
      if (churn > 0) {
        return Math.max(Math.log2(churn + 1), 1) * FLOOR_HEIGHT;
      }
      // Churn requires git data — graceful fallback to methodCount
      return getMethodBasedHeight(mc, node.depth);
    }

    default:
      return getMethodBasedHeight(mc, node.depth);
  }
}

/**
 * Edge types that represent inheritance/implementation relationships (Story 11-5).
 * Handles both parser output ('extends', 'implements') and IVM/UI type ('inherits').
 */
const INHERITANCE_EDGE_TYPES = new Set(['extends', 'implements', 'inherits']);

/**
 * Determine whether a single node is a base class (i.e. inherited or implemented by another class).
 *
 * A class is a base class if any inheritance-type edge has it as the **target**.
 * Handles `extends`, `implements`, and `inherits` edge types.
 *
 * Pure function — no side effects, no store dependency.
 *
 * @param nodeId - The node ID to check
 * @param edges - All graph edges
 */
export function isBaseClass(
  nodeId: string,
  edges: ReadonlyArray<{ source: string; target: string; type: string }>,
): boolean {
  return edges.some(
    (e) => e.target === nodeId && INHERITANCE_EDGE_TYPES.has(e.type),
  );
}

/**
 * Compute the set of node IDs that are base classes across the entire graph.
 *
 * Single pass through edges for efficiency. Returns a Set so lookups are O(1).
 * Handles `extends`, `implements`, and `inherits` edge types (AC-3).
 *
 * @param edges - All graph edges
 * @returns Set of node IDs that are base classes
 */
export function detectBaseClasses(
  edges: ReadonlyArray<{ source: string; target: string; type: string }>,
): Set<string> {
  const baseClasses = new Set<string>();
  for (const edge of edges) {
    if (INHERITANCE_EDGE_TYPES.has(edge.type)) {
      baseClasses.add(edge.target);
    }
  }
  return baseClasses;
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

/**
 * Base class building color palette (Story 11-6).
 *
 * Warm sandstone/amber tones communicate "foundational, load-bearing" at a glance.
 * Distinct from interface (glass), abstract (cone), and regular class (directory color).
 */
export const BASE_CLASS_COLOR = '#b45309';       // Amber-700 — warm sandstone
export const BASE_CLASS_EMISSIVE = '#78350f';    // Amber-900 — subtle warm glow
export const BASE_CLASS_ROUGHNESS = 0.9;         // Stone-like (vs class 0.7)
export const BASE_CLASS_METALNESS = 0.05;        // Matte stone (vs class 0.1)

/**
 * Footprint size multiplier for base class buildings (Story 11-6).
 * Wider base reinforces "foundational" reading at city-level zoom.
 */
export const BASE_CLASS_FOOTPRINT_MULTIPLIER = 1.3;

// ─── Underground Pipe Constants & Routing (Story 11-8) ───────────────────────

/**
 * XZ-distance threshold separating "same-block" short pipes from cross-district long pipes.
 */
export const SHORT_PIPE_THRESHOLD = 15;

/** Pipe depth for short-distance (same-block) connections. */
export const SHORT_PIPE_DEPTH = 2;

/** Pipe depth for long-distance (cross-district) connections. */
export const LONG_PIPE_DEPTH = 4;

/**
 * Pipe colors by edge relationship type (Story 11-8).
 * Import/dependency → blue-gray; inheritance → copper/bronze; implements → steel/silver.
 */
export const PIPE_COLORS: Record<string, string> = {
  imports:    '#475569', // Slate blue-gray
  depends_on: '#475569', // Same as imports
  extends:    '#92400e', // Amber-800 copper/bronze
  inherits:   '#92400e', // UI canonical name for extends
  implements: '#94a3b8', // Slate-400 steel/silver
};
export const PIPE_DEFAULT_COLOR = '#475569';

/**
 * Pipe radius (tube thickness) by edge relationship type.
 * Inheritance pipes are thicker to emphasise structural coupling.
 */
export const PIPE_RADIUS: Record<string, number> = {
  imports:    0.08,
  depends_on: 0.08,
  extends:    0.12, // Thicker for inheritance
  inherits:   0.12,
  implements: 0.10,
};
export const PIPE_DEFAULT_RADIUS = 0.08;

/**
 * Determine underground pipe depth from the XZ distance between two positions.
 * Short connections stay shallow; long cross-district connections go deeper.
 */
export function getPipeDepth(
  source: { x: number; z: number },
  target: { x: number; z: number },
): number {
  const dx = target.x - source.x;
  const dz = target.z - source.z;
  return Math.sqrt(dx * dx + dz * dz) > SHORT_PIPE_THRESHOLD
    ? LONG_PIPE_DEPTH
    : SHORT_PIPE_DEPTH;
}

/**
 * Calculate waypoints for an underground pipe route (Story 11-8).
 *
 * Shape: source at ground (y=0) → drop to depth → horizontal run → rise to ground.
 * A midpoint is added at the deepest part to give the CatmullRomCurve3 a smooth U-bend.
 *
 * @param source  - Start position (y is ignored; pipe starts at y=0)
 * @param target  - End position  (y is ignored; pipe ends at y=0)
 * @param pipeDepth - How far below ground the horizontal run sits (positive number)
 */
export function calculatePipeRoute(
  source: { x: number; y: number; z: number },
  target: { x: number; y: number; z: number },
  pipeDepth: number,
): Array<{ x: number; y: number; z: number }> {
  const midX = (source.x + target.x) / 2;
  const midZ = (source.z + target.z) / 2;
  return [
    { x: source.x, y: 0,          z: source.z }, // surface entry
    { x: source.x, y: -pipeDepth, z: source.z }, // drop
    { x: midX,     y: -pipeDepth, z: midZ      }, // horizontal midpoint
    { x: target.x, y: -pipeDepth, z: target.z  }, // horizontal exit
    { x: target.x, y: 0,          z: target.z  }, // surface exit
  ];
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * LOD threshold at which method rooms appear (Story 11-4).
 * Below this value, floor bands render. Above it, individual rooms render.
 * Transition happens over the half-unit range [threshold-0.5, threshold].
 */
export const ROOM_LOD_THRESHOLD = 2;

/**
 * Calculate LOD transition state for floor-band → method-room crossfade (Story 11-4).
 *
 * Returns opacity multipliers and a flag indicating whether rooms should be mounted.
 * The crossfade window is [ROOM_LOD_THRESHOLD - 0.5, ROOM_LOD_THRESHOLD].
 *
 * @param lodLevel - Current LOD value (float, 0–4)
 */
export function getLodTransition(lodLevel: number): {
  /** Opacity multiplier for the floor-band mesh (1 → 0 as rooms appear) */
  bandOpacity: number;
  /** Opacity for individual room meshes (0 → 1 as rooms appear) */
  roomOpacity: number;
  /** True when at least one room should be visible (factor > 0) */
  showRooms: boolean;
} {
  const transitionStart = ROOM_LOD_THRESHOLD - 0.5;
  const factor = Math.max(0, Math.min(1, (lodLevel - transitionStart) / 0.5));
  return {
    bandOpacity: 1 - factor,
    roomOpacity: factor,
    showRooms: factor > 0,
  };
}

/**
 * Method room color palette by visibility/type (Story 11-3).
 *
 * Public methods get the brightest "storefront" color at ground level.
 * Protected is a muted middle tone. Private is the darkest (upper floors).
 * Constructor and static get accent colors for quick identification.
 */
export const METHOD_ROOM_COLORS = {
  public: '#60a5fa',      // Blue — public storefront
  protected: '#f59e0b',   // Amber — protected access
  private: '#6b7280',     // Gray — private internal
  constructor: '#34d399', // Green — constructor
  static: '#a78bfa',      // Purple — class-level static
  default: '#60a5fa',     // Blue fallback (public)
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Story 11-10: Underground Ground Plane Opacity
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ground plane opacity when the underground pipe layer is visible (Story 11-10).
 * Semi-transparent to reveal pipes below Y=0.
 */
export const UNDERGROUND_GROUND_OPACITY = 0.35;

/**
 * Ground plane opacity when the underground layer is hidden (normal/solid).
 */
export const SURFACE_GROUND_OPACITY = 1.0;

/**
 * Compute ground plane opacity based on underground layer visibility (Story 11-10).
 *
 * Returns full opacity when underground is hidden, semi-transparent when visible
 * so underground pipes are visible through the ground plane.
 */
export function computeUndergroundGroundOpacity(undergroundVisible: boolean): number {
  return undergroundVisible ? UNDERGROUND_GROUND_OPACITY : SURFACE_GROUND_OPACITY;
}

// ─────────────────────────────────────────────────────────────────────────────
// Story 11-9: Edge Routing Classification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Two-layer routing result for an edge.
 * - `underground`: structural relationships (imports, inheritance, dependencies)
 * - `overhead`: runtime relationships (method calls, composition)
 */
export type EdgeRouting = 'underground' | 'overhead';

/**
 * Classify a graph edge into its spatial rendering layer.
 *
 * Structural relationships route underground as pipes/conduit.
 * Runtime relationships route overhead as wires.
 *
 * Case-insensitive. Unknown types default to `underground` (safer structural assumption).
 */
export function classifyEdgeRouting(edgeType: string): EdgeRouting {
  switch (edgeType.toLowerCase()) {
    // Runtime relationships → overhead wires
    case 'calls':
    case 'composes':
      return 'overhead';
    // Structural relationships → underground pipes (and catch-all default)
    default:
      return 'underground';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Story 11-11: Overhead Wire Arc Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Minimum clearance above the tallest connected building rooftop (world units).
 * Ensures wires arc visibly above the buildings they connect.
 */
export const WIRE_BASE_OFFSET = 2;

/**
 * Arc height increase per unit of horizontal distance between buildings.
 * Longer connections arc higher to stay visually distinct.
 */
export const WIRE_SCALE_FACTOR = 0.1;

/**
 * Maximum permitted arc peak height (world units).
 * Prevents extreme visual distortion for very distant buildings.
 */
export const WIRE_MAX_PEAK = 80;

/**
 * Minimum LOD level at which overhead wires are rendered.
 * Below this level, wires are hidden to reduce visual noise.
 */
export const WIRE_LOD_MIN = 2;

/**
 * Wire colors by edge type (overhead / runtime relationships).
 * Method calls use green; composition uses purple.
 */
export const WIRE_COLORS: Record<string, string> = {
  calls:    '#34d399', // green  — method-to-method calls (solid line)
  composes: '#a78bfa', // purple — composition references  (dashed line)
};

/** Fallback wire color for unknown overhead edge types. */
export const WIRE_DEFAULT_COLOR = '#6ee7b7';

/**
 * Edge types that render as dashed wires (Story 11-13).
 * All other overhead edge types default to solid lines.
 */
export const WIRE_DASHED_TYPES: ReadonlySet<string> = new Set(['composes']);

/** LineDashedMaterial dash length in world-space units. */
export const WIRE_DASH_SIZE = 0.4;
/** LineDashedMaterial gap length in world-space units. */
export const WIRE_GAP_SIZE = 0.25;

/**
 * Returns the line material style for an overhead edge (Story 11-13).
 * - `'solid'`  → `LineBasicMaterial`   (method calls)
 * - `'dashed'` → `LineDashedMaterial`  (composition references)
 */
export function getWireMaterialType(edgeType: string): 'solid' | 'dashed' {
  return WIRE_DASHED_TYPES.has(edgeType.toLowerCase()) ? 'dashed' : 'solid';
}

/**
 * Calculate the Y-coordinate of the wire arc peak (Story 11-11).
 *
 * The peak clears the tallest connected building by at least `WIRE_BASE_OFFSET`
 * and scales up with horizontal distance so long wires stay visually distinct.
 * Capped at `WIRE_MAX_PEAK` to prevent extreme values.
 *
 * @param sourceHeight - Rooftop Y of the source building
 * @param targetHeight - Rooftop Y of the target building
 * @param horizontalDistance - XZ-plane distance between source and target positions
 */
export function calculateWireArcPeak(
  sourceHeight: number,
  targetHeight: number,
  horizontalDistance: number,
): number {
  const rooftop = Math.max(sourceHeight, targetHeight);
  const raw = rooftop + WIRE_BASE_OFFSET + horizontalDistance * WIRE_SCALE_FACTOR;
  return Math.min(raw, WIRE_MAX_PEAK);
}

/**
 * Whether overhead wires should be rendered at the current LOD level (Story 11-11).
 * Wires are shown at LOD 2+ (district level and closer).
 */
export function isWireVisible(lodLevel: number): boolean {
  return lodLevel >= WIRE_LOD_MIN;
}

/**
 * Wire color for the given edge type (Story 11-11).
 * Falls back to `WIRE_DEFAULT_COLOR` for unknown types.
 */
export function getWireColor(edgeType: string): string {
  return WIRE_COLORS[edgeType] ?? WIRE_DEFAULT_COLOR;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Visibility sort priority. Lower number = lower floor (closer to ground).
 * Public API is the "storefront" — placed at the bottom.
 */
const VISIBILITY_SORT_ORDER: Record<string, number> = {
  public: 0,
  protected: 1,
  private: 2,
};

/**
 * Sort methods by visibility for floor ordering inside class buildings.
 *
 * Order: public (bottom) → protected (middle) → private (top).
 * Within the same visibility tier, original source order is preserved (stable sort).
 *
 * @param methods - Array of method-like objects with optional visibility
 * @returns New sorted array (does not mutate input)
 */
export function sortMethodsByVisibility<T extends { visibility?: string }>(
  methods: readonly T[],
): T[] {
  // Use index-based stable sort: identical priorities retain original order
  return methods
    .map((m, i) => ({ m, i }))
    .sort((a, b) => {
      const aPri = VISIBILITY_SORT_ORDER[a.m.visibility ?? 'public'] ?? 0;
      const bPri = VISIBILITY_SORT_ORDER[b.m.visibility ?? 'public'] ?? 0;
      return aPri !== bPri ? aPri - bPri : a.i - b.i;
    })
    .map(({ m }) => m);
}
