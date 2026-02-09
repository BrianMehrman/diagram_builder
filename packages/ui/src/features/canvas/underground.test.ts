/**
 * Underground Mode Tests
 *
 * Tests for underground mode state, tunnel path generation,
 * and tunnel radius calculation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from './store';
import {
  computeGroundOpacity,
  computeTunnelRadius,
  generateTunnelPoints,
  filterImportEdges,
} from './undergroundUtils';
import type { GraphEdge, Position3D } from '../../shared/types';

describe('Underground Mode - Store State', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('should default to underground mode off', () => {
    const state = useCanvasStore.getState();
    expect(state.isUndergroundMode).toBe(false);
  });

  it('should toggle underground mode on', () => {
    useCanvasStore.getState().toggleUnderground();
    expect(useCanvasStore.getState().isUndergroundMode).toBe(true);
  });

  it('should toggle underground mode off', () => {
    useCanvasStore.getState().toggleUnderground();
    useCanvasStore.getState().toggleUnderground();
    expect(useCanvasStore.getState().isUndergroundMode).toBe(false);
  });

  it('should reset underground mode to default', () => {
    useCanvasStore.getState().toggleUnderground();
    useCanvasStore.getState().reset();
    expect(useCanvasStore.getState().isUndergroundMode).toBe(false);
  });
});

describe('Underground Mode - Ground Opacity', () => {
  it('should return 1 when underground mode is off', () => {
    expect(computeGroundOpacity(false)).toBe(1);
  });

  it('should return reduced opacity when underground mode is on', () => {
    expect(computeGroundOpacity(true)).toBe(0.15);
  });
});

describe('Underground Mode - Tunnel Radius', () => {
  it('should return minimum radius for import count of 1', () => {
    expect(computeTunnelRadius(1)).toBeCloseTo(0.12);
  });

  it('should scale radius with import count', () => {
    const r1 = computeTunnelRadius(1);
    const r5 = computeTunnelRadius(5);
    expect(r5).toBeGreaterThan(r1);
  });

  it('should cap radius at maximum', () => {
    const r100 = computeTunnelRadius(100);
    expect(r100).toBeLessThanOrEqual(0.5);
  });

  it('should handle zero import count', () => {
    const r0 = computeTunnelRadius(0);
    expect(r0).toBeGreaterThan(0);
  });
});

describe('Underground Mode - Tunnel Path Generation', () => {
  const source: Position3D = { x: 0, y: 0, z: 0 };
  const target: Position3D = { x: 10, y: 0, z: 10 };

  it('should generate an array of points', () => {
    const points = generateTunnelPoints(source, target);
    expect(points.length).toBeGreaterThanOrEqual(4);
  });

  it('should start at source position base', () => {
    const points = generateTunnelPoints(source, target);
    expect(points[0].x).toBe(source.x);
    expect(points[0].z).toBe(source.z);
  });

  it('should end at target position base', () => {
    const points = generateTunnelPoints(source, target);
    const last = points[points.length - 1];
    expect(last.x).toBe(target.x);
    expect(last.z).toBe(target.z);
  });

  it('should go underground (negative y) in middle points', () => {
    const points = generateTunnelPoints(source, target);
    const middlePoints = points.slice(1, -1);
    for (const p of middlePoints) {
      expect(p.y).toBeLessThan(0);
    }
  });

  it('should have midpoint between source and target in xz', () => {
    const points = generateTunnelPoints(source, target);
    // At least one point should be near the midpoint
    const midX = (source.x + target.x) / 2;
    const midZ = (source.z + target.z) / 2;
    const hasMidpoint = points.some(
      (p) => Math.abs(p.x - midX) < 1 && Math.abs(p.z - midZ) < 1
    );
    expect(hasMidpoint).toBe(true);
  });
});

describe('Underground Mode - Edge Filtering', () => {
  const edges: GraphEdge[] = [
    { id: 'e1', source: 'a', target: 'b', type: 'imports', metadata: {} },
    { id: 'e2', source: 'a', target: 'c', type: 'calls', metadata: {} },
    { id: 'e3', source: 'b', target: 'c', type: 'depends_on', metadata: {} },
    { id: 'e4', source: 'a', target: 'd', type: 'imports', metadata: {} },
    { id: 'e5', source: 'a', target: 'e', type: 'contains', metadata: {} },
  ];

  it('should filter only import and depends_on edges', () => {
    const result = filterImportEdges(edges);
    expect(result).toHaveLength(3);
  });

  it('should include imports edges', () => {
    const result = filterImportEdges(edges);
    expect(result.some((e) => e.id === 'e1')).toBe(true);
    expect(result.some((e) => e.id === 'e4')).toBe(true);
  });

  it('should include depends_on edges', () => {
    const result = filterImportEdges(edges);
    expect(result.some((e) => e.id === 'e3')).toBe(true);
  });

  it('should exclude calls and contains edges', () => {
    const result = filterImportEdges(edges);
    expect(result.some((e) => e.id === 'e2')).toBe(false);
    expect(result.some((e) => e.id === 'e5')).toBe(false);
  });

  it('should return empty for empty input', () => {
    expect(filterImportEdges([])).toHaveLength(0);
  });
});
