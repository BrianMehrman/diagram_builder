/**
 * UndergroundPipe Utility Tests (Story 11-8)
 *
 * Tests cover the pure routing and styling utilities used by the component.
 * R3F rendering is not tested here (no jsdom dependency).
 */

import { describe, it, expect } from 'vitest';
import {
  calculatePipeRoute,
  getPipeDepth,
  PIPE_COLORS,
  PIPE_DEFAULT_COLOR,
  PIPE_RADIUS,
  PIPE_DEFAULT_RADIUS,
  SHORT_PIPE_THRESHOLD,
  SHORT_PIPE_DEPTH,
  LONG_PIPE_DEPTH,
} from '../views/cityViewUtils';

const src = { x: 0, y: 0, z: 0 };
const nearTarget = { x: 5, y: 0, z: 0 };        // distance = 5 < threshold
const farTarget  = { x: 20, y: 0, z: 0 };        // distance = 20 > threshold

describe('calculatePipeRoute', () => {
  it('returns first and last waypoints at y=0 (ground surface)', () => {
    const route = calculatePipeRoute(src, nearTarget, SHORT_PIPE_DEPTH);
    expect(route[0]!.y).toBe(0);
    expect(route[route.length - 1]!.y).toBe(0);
  });

  it('all interior waypoints are below y=0 (underground)', () => {
    const route = calculatePipeRoute(src, nearTarget, SHORT_PIPE_DEPTH);
    const interior = route.slice(1, -1);
    for (const pt of interior) {
      expect(pt.y).toBeLessThan(0);
    }
  });

  it('connects source XZ to target XZ', () => {
    const route = calculatePipeRoute(src, { x: 10, y: 0, z: 5 }, SHORT_PIPE_DEPTH);
    expect(route[0]!.x).toBe(0);
    expect(route[0]!.z).toBe(0);
    expect(route[route.length - 1]!.x).toBe(10);
    expect(route[route.length - 1]!.z).toBe(5);
  });

  it('deepest point reaches -pipeDepth', () => {
    const depth = 3;
    const route = calculatePipeRoute(src, nearTarget, depth);
    const minY = Math.min(...route.map((p) => p.y));
    expect(minY).toBe(-depth);
  });

  it('has correct shape: drop → horizontal → rise', () => {
    const route = calculatePipeRoute(src, nearTarget, SHORT_PIPE_DEPTH);
    // First segment descends
    expect(route[1]!.y).toBeLessThan(route[0]!.y);
    // Last segment ascends
    expect(route[route.length - 1]!.y).toBeGreaterThan(route[route.length - 2]!.y);
    // Middle waypoints share the same depth
    const deepPts = route.slice(1, -1);
    const depths = deepPts.map((p) => p.y);
    const uniqueDepths = new Set(depths);
    expect(uniqueDepths.size).toBe(1); // all at same depth
  });

  it('places midpoint at XZ midpoint between source and target', () => {
    const route = calculatePipeRoute({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 6 }, 2);
    const mid = route[2]!;
    expect(mid.x).toBe(5);
    expect(mid.z).toBe(3);
  });
});

describe('getPipeDepth', () => {
  it('returns SHORT_PIPE_DEPTH for distance less than threshold', () => {
    const depth = getPipeDepth({ x: 0, z: 0 }, { x: SHORT_PIPE_THRESHOLD - 1, z: 0 });
    expect(depth).toBe(SHORT_PIPE_DEPTH);
  });

  it('returns LONG_PIPE_DEPTH for distance greater than threshold', () => {
    const depth = getPipeDepth({ x: 0, z: 0 }, { x: SHORT_PIPE_THRESHOLD + 1, z: 0 });
    expect(depth).toBe(LONG_PIPE_DEPTH);
  });

  it('short-distance pipe is shallower than long-distance pipe', () => {
    const short = getPipeDepth({ x: 0, z: 0 }, { x: 5, z: 0 });
    const long  = getPipeDepth({ x: 0, z: 0 }, { x: 50, z: 0 });
    expect(short).toBeLessThan(long);
  });

  it('works with diagonal distance', () => {
    // distance = sqrt(10^2 + 10^2) ≈ 14.14 < SHORT_PIPE_THRESHOLD (15)
    const depth = getPipeDepth({ x: 0, z: 0 }, { x: 10, z: 10 });
    expect(depth).toBe(SHORT_PIPE_DEPTH);
  });
});

describe('PIPE_COLORS', () => {
  it('imports and depends_on share the same blue-gray color', () => {
    expect(PIPE_COLORS['imports']).toBe(PIPE_COLORS['depends_on']);
  });

  it('extends and inherits share the same copper/bronze color', () => {
    expect(PIPE_COLORS['extends']).toBe(PIPE_COLORS['inherits']);
  });

  it('extends color differs from imports color', () => {
    expect(PIPE_COLORS['extends']).not.toBe(PIPE_COLORS['imports']);
  });

  it('implements color differs from imports and extends', () => {
    expect(PIPE_COLORS['implements']).not.toBe(PIPE_COLORS['imports']);
    expect(PIPE_COLORS['implements']).not.toBe(PIPE_COLORS['extends']);
  });

  it('all colors are valid hex strings', () => {
    for (const color of Object.values(PIPE_COLORS)) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('PIPE_DEFAULT_COLOR is a valid hex string', () => {
    expect(PIPE_DEFAULT_COLOR).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe('PIPE_RADIUS', () => {
  it('inheritance pipes (extends/inherits) are thicker than import pipes', () => {
    expect(PIPE_RADIUS['extends']!).toBeGreaterThan(PIPE_RADIUS['imports']!);
    expect(PIPE_RADIUS['inherits']!).toBeGreaterThan(PIPE_RADIUS['imports']!);
  });

  it('implements pipe is thicker than imports but thinner than extends', () => {
    expect(PIPE_RADIUS['implements']!).toBeGreaterThan(PIPE_RADIUS['imports']!);
    expect(PIPE_RADIUS['implements']!).toBeLessThan(PIPE_RADIUS['extends']!);
  });

  it('all radii are positive numbers', () => {
    for (const r of Object.values(PIPE_RADIUS)) {
      expect(r).toBeGreaterThan(0);
    }
  });

  it('PIPE_DEFAULT_RADIUS is positive', () => {
    expect(PIPE_DEFAULT_RADIUS).toBeGreaterThan(0);
  });
});
