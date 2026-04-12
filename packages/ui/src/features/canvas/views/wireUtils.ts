export type EdgeRouting = 'underground' | 'overhead'

export function classifyEdgeRouting(edgeType: string): EdgeRouting {
  switch (edgeType.toLowerCase()) {
    case 'calls':
    case 'composes':
      return 'overhead'
    default:
      return 'underground'
  }
}

export const WIRE_BASE_OFFSET = 2
export const WIRE_SCALE_FACTOR = 0.1
export const WIRE_MAX_PEAK = 80
export const WIRE_LOD_MIN = 2

export const WIRE_COLORS: Record<string, string> = {
  calls: '#34d399',
  composes: '#a78bfa',
}
export const WIRE_DEFAULT_COLOR = '#6ee7b7'
export const WIRE_DASHED_TYPES: ReadonlySet<string> = new Set(['composes'])
export const WIRE_DASH_SIZE = 0.4
export const WIRE_GAP_SIZE = 0.25

export function getWireMaterialType(edgeType: string): 'solid' | 'dashed' {
  return WIRE_DASHED_TYPES.has(edgeType.toLowerCase()) ? 'dashed' : 'solid'
}

export function calculateWireArcPeak(
  sourceHeight: number,
  targetHeight: number,
  horizontalDistance: number
): number {
  const rooftop = Math.max(sourceHeight, targetHeight)
  const raw = rooftop + WIRE_BASE_OFFSET + horizontalDistance * WIRE_SCALE_FACTOR
  return Math.min(raw, WIRE_MAX_PEAK)
}

export function isWireVisible(lodLevel: number): boolean {
  return lodLevel >= WIRE_LOD_MIN
}

/** Squared proximity radius for LOD 4 edge culling (60 world units). */
const EDGE_PROXIMITY_SQ = 60 * 60

/**
 * Shared edge visibility rule used by both City and Basic3D layouts.
 *
 * - LOD 1         → never show (cluster view only)
 * - LOD 2+ with selection → show if either endpoint is the selected node
 * - LOD < 4, no selection → never show
 * - LOD 4+, no selection → show if either endpoint is within 60 units of camera
 */
export function isEdgeVisibleForLod(
  sourceId: string,
  targetId: string,
  selectedNodeId: string | null,
  lodLevel: number,
  sourcePos: { x: number; y: number; z: number } | undefined,
  targetPos: { x: number; y: number; z: number } | undefined,
  cameraPos: { x: number; y: number; z: number } | null
): boolean {
  // Selection override: show at any LOD >= 2 if either endpoint is selected
  if (
    lodLevel >= 2 &&
    selectedNodeId !== null &&
    (sourceId === selectedNodeId || targetId === selectedNodeId)
  ) {
    return true
  }

  // No selection: require LOD 4+ for proximity-based edges
  if (lodLevel < 4) return false

  if (!sourcePos || !targetPos) return false

  if (cameraPos === null) return false

  const srcDx = sourcePos.x - cameraPos.x
  const srcDy = sourcePos.y - cameraPos.y
  const srcDz = sourcePos.z - cameraPos.z
  if (srcDx * srcDx + srcDy * srcDy + srcDz * srcDz <= EDGE_PROXIMITY_SQ) return true

  const tgtDx = targetPos.x - cameraPos.x
  const tgtDy = targetPos.y - cameraPos.y
  const tgtDz = targetPos.z - cameraPos.z
  return tgtDx * tgtDx + tgtDy * tgtDy + tgtDz * tgtDz <= EDGE_PROXIMITY_SQ
}

export function getWireColor(edgeType: string): string {
  return WIRE_COLORS[edgeType] ?? WIRE_DEFAULT_COLOR
}
