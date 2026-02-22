export const SHORT_PIPE_THRESHOLD = 15;
export const SHORT_PIPE_DEPTH = 2;
export const LONG_PIPE_DEPTH = 4;

export const PIPE_COLORS: Record<string, string> = {
  imports: '#475569',
  depends_on: '#475569',
  extends: '#92400e',
  inherits: '#92400e',
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
  return Math.sqrt(dx * dx + dz * dz) > SHORT_PIPE_THRESHOLD ? LONG_PIPE_DEPTH : SHORT_PIPE_DEPTH;
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
