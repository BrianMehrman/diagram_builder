/**
 * City View Utilities
 *
 * Pure utility functions for the CityView renderer.
 * Extracted for testability without React Three Fiber dependencies.
 */

// Re-export focused modules so all existing importers remain unaffected.
export * from './colorUtils';
export * from './inheritanceUtils';
export * from './heightUtils';

// Underground Pipe Constants & Routing (Story 11-8)

export const SHORT_PIPE_THRESHOLD = 15;
export const SHORT_PIPE_DEPTH = 2;
export const LONG_PIPE_DEPTH = 4;

export const PIPE_COLORS: Record<string, string> = {
  imports:    '#475569',
  depends_on: '#475569',
  extends:    '#92400e',
  inherits:   '#92400e',
  implements: '#94a3b8',
};
export const PIPE_DEFAULT_COLOR = '#475569';

export const PIPE_RADIUS: Record<string, number> = {
  imports:    0.08,
  depends_on: 0.08,
  extends:    0.12,
  inherits:   0.12,
  implements: 0.10,
};
export const PIPE_DEFAULT_RADIUS = 0.08;

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

export function calculatePipeRoute(
  source: { x: number; y: number; z: number },
  target: { x: number; y: number; z: number },
  pipeDepth: number,
): Array<{ x: number; y: number; z: number }> {
  const midX = (source.x + target.x) / 2;
  const midZ = (source.z + target.z) / 2;
  return [
    { x: source.x, y: 0,          z: source.z },
    { x: source.x, y: -pipeDepth, z: source.z },
    { x: midX,     y: -pipeDepth, z: midZ      },
    { x: target.x, y: -pipeDepth, z: target.z  },
    { x: target.x, y: 0,          z: target.z  },
  ];
}

// Story 11-9: Edge Routing Classification

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

// Story 11-11: Overhead Wire Arc Utilities

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

export function getNodeFocusOpacity(
  nodeId: string,
  selectedNodeId: string | null,
  directNodeIds: Set<string>,
  secondHopNodeIds: Set<string>,
): number {
  if (!selectedNodeId) return 1.0;
  if (nodeId === selectedNodeId) return 1.0;
  if (directNodeIds.has(nodeId)) return 1.0;
  if (secondHopNodeIds.has(nodeId)) return 0.5;
  return 0.15;
}

const VISIBILITY_SORT_ORDER: Record<string, number> = {
  public: 0,
  protected: 1,
  private: 2,
};

export function sortMethodsByVisibility<T extends { visibility?: string }>(
  methods: readonly T[],
): T[] {
  return methods
    .map((m, i) => ({ m, i }))
    .sort((a, b) => {
      const aPri = VISIBILITY_SORT_ORDER[a.m.visibility ?? 'public'] ?? 0;
      const bPri = VISIBILITY_SORT_ORDER[b.m.visibility ?? 'public'] ?? 0;
      return aPri !== bPri ? aPri - bPri : a.i - b.i;
    })
    .map(({ m }) => m);
}
