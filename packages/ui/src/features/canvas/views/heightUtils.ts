export const FLOOR_HEIGHT = 3
export const METHOD_ROOM_HEIGHT = 2
export const BUILDING_PADDING = 1
export const BUILDING_Y_OFFSET = 0.1
export const BUILDING_WIDTH = 2
export const BUILDING_DEPTH = 2
export const CLASS_WIDTH = 2.5
export const CLASS_DEPTH = 2.5
export const SHOP_WIDTH = 3.5
export const SHOP_DEPTH = 1.5
export const KIOSK_WIDTH = 1.5
export const KIOSK_DEPTH = 1.5
export const KIOSK_HEIGHT = 1.0
export const KIOSK_AWNING_OVERHANG = 0.25
export const KIOSK_AWNING_THICKNESS = 0.12
export const CRATE_SIZE = 1.0
export const GLASS_OPACITY = 0.3
export const ABSTRACT_OPACITY = 0.5
export const ROOM_LOD_THRESHOLD = 2
export const UNDERGROUND_GROUND_OPACITY = 0.35
export const SURFACE_GROUND_OPACITY = 1.0

export type HeightEncodingType = 'methodCount' | 'dependencies' | 'loc' | 'complexity' | 'churn'

export interface EncodedHeightOptions {
  encoding: HeightEncodingType
  incomingEdgeCount?: number
}

/** Minimal node shape accepted by height/footprint utility functions */
export interface NodeWithMetadata {
  metadata: {
    loc?: number
    complexity?: number
    churn?: number
    properties?: Record<string, unknown>
    label?: string
    path?: string
    language?: string
    location?: unknown
    dependencyCount?: number
    dependentCount?: number
  }
}

export const METHOD_ROOM_COLORS = {
  public: '#60a5fa',
  protected: '#f59e0b',
  private: '#6b7280',
  constructor: '#34d399',
  static: '#a78bfa',
  default: '#60a5fa',
} as const

export function getBuildingHeight(depth: number | undefined): number {
  return ((depth ?? 0) + 1) * FLOOR_HEIGHT
}

export function getMethodBasedHeight(
  methodCount: number | undefined,
  depth: number | undefined
): number {
  if (methodCount !== undefined && methodCount > 0) {
    return Math.max(Math.log2(methodCount + 1), 1) * FLOOR_HEIGHT
  }
  return getBuildingHeight(depth)
}

export function getContainmentHeight(methodCount: number): number {
  return Math.max(methodCount, 1) * METHOD_ROOM_HEIGHT + BUILDING_PADDING
}

export function getFootprintScale(
  node: NodeWithMetadata,
  options: EncodedHeightOptions
): number {
  const { encoding, incomingEdgeCount } = options
  let rawValue = 0
  switch (encoding) {
    case 'methodCount':
      rawValue = (node.metadata.properties?.methodCount as number | undefined) ?? 0
      break
    case 'dependencies':
      rawValue = incomingEdgeCount ?? 0
      break
    case 'loc':
      rawValue = (node.metadata?.loc as number | undefined) ?? 0
      break
    case 'complexity':
      rawValue = (node.metadata?.complexity as number | undefined) ?? 0
      break
    case 'churn':
      rawValue = (node.metadata?.churn as number | undefined) ?? 0
      break
  }
  if (rawValue <= 0) return 1.0
  return Math.min(1.0 + Math.log2(rawValue + 1) / 10, 2.0)
}

export function getEncodedHeight(
  node: NodeWithMetadata,
  options: EncodedHeightOptions,
  resolvedMethodCount?: number
): number {
  const { encoding, incomingEdgeCount } = options
  const mc = resolvedMethodCount ?? (node.metadata.properties?.methodCount as number | undefined)
  switch (encoding) {
    case 'methodCount':
      return getMethodBasedHeight(mc, (node.metadata.properties?.depth as number | undefined))
    case 'dependencies': {
      const count = incomingEdgeCount ?? 0
      return count > 0
        ? Math.max(Math.log2(count + 1), 1) * FLOOR_HEIGHT
        : getMethodBasedHeight(mc, (node.metadata.properties?.depth as number | undefined))
    }
    case 'loc': {
      const loc = (node.metadata?.loc as number | undefined) ?? 0
      return loc > 0
        ? Math.max(Math.log2(loc / 50 + 1), 1) * FLOOR_HEIGHT
        : getMethodBasedHeight(mc, (node.metadata.properties?.depth as number | undefined))
    }
    case 'complexity': {
      const complexity = (node.metadata?.complexity as number | undefined) ?? 0
      return complexity > 0
        ? Math.max(Math.log2(complexity + 1), 1) * FLOOR_HEIGHT
        : getMethodBasedHeight(mc, (node.metadata.properties?.depth as number | undefined))
    }
    case 'churn': {
      const churn = (node.metadata?.churn as number | undefined) ?? 0
      return churn > 0
        ? Math.max(Math.log2(churn + 1), 1) * FLOOR_HEIGHT
        : getMethodBasedHeight(mc, (node.metadata.properties?.depth as number | undefined))
    }
    default:
      return getMethodBasedHeight(mc, (node.metadata.properties?.depth as number | undefined))
  }
}

export function getLodTransition(lodLevel: number): {
  bandOpacity: number
  roomOpacity: number
  showRooms: boolean
} {
  const transitionStart = ROOM_LOD_THRESHOLD - 0.5
  const factor = Math.max(0, Math.min(1, (lodLevel - transitionStart) / 0.5))
  return { bandOpacity: 1 - factor, roomOpacity: factor, showRooms: factor > 0 }
}

export function computeUndergroundGroundOpacity(undergroundVisible: boolean): number {
  return undergroundVisible ? UNDERGROUND_GROUND_OPACITY : SURFACE_GROUND_OPACITY
}
