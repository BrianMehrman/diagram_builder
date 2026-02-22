export type EdgeRouting = 'underground' | 'overhead';

export function classifyEdgeRouting(edgeType: string): EdgeRouting {
  switch (edgeType.toLowerCase()) {
    case 'calls':
    case 'composes':
      return 'overhead';
    default:
      return 'underground';
  }
}

export const WIRE_BASE_OFFSET = 2;
export const WIRE_SCALE_FACTOR = 0.1;
export const WIRE_MAX_PEAK = 80;
export const WIRE_LOD_MIN = 2;

export const WIRE_COLORS: Record<string, string> = {
  calls:    '#34d399',
  composes: '#a78bfa',
};
export const WIRE_DEFAULT_COLOR = '#6ee7b7';
export const WIRE_DASHED_TYPES: ReadonlySet<string> = new Set(['composes']);
export const WIRE_DASH_SIZE = 0.4;
export const WIRE_GAP_SIZE = 0.25;

export function getWireMaterialType(edgeType: string): 'solid' | 'dashed' {
  return WIRE_DASHED_TYPES.has(edgeType.toLowerCase()) ? 'dashed' : 'solid';
}

export function calculateWireArcPeak(
  sourceHeight: number,
  targetHeight: number,
  horizontalDistance: number,
): number {
  const rooftop = Math.max(sourceHeight, targetHeight);
  const raw = rooftop + WIRE_BASE_OFFSET + horizontalDistance * WIRE_SCALE_FACTOR;
  return Math.min(raw, WIRE_MAX_PEAK);
}

export function isWireVisible(lodLevel: number): boolean {
  return lodLevel >= WIRE_LOD_MIN;
}

export function getWireColor(edgeType: string): string {
  return WIRE_COLORS[edgeType] ?? WIRE_DEFAULT_COLOR;
}
