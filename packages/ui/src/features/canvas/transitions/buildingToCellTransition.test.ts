/**
 * Building-to-Cell Transition Tests
 *
 * Tests for pure utility functions that calculate camera entry positions
 * and transition fade values for building → cell navigation.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCellEntryTarget,
  computeFloorFadeOpacity,
  computeRoomToCellProgress,
} from './buildingToCellTransition';

describe('calculateCellEntryTarget', () => {
  const defaultParams = {
    classPosition: { x: 0, y: 5, z: 0 },
    cellRadius: 10,
  };

  it('should offset camera X from class center', () => {
    const result = calculateCellEntryTarget(defaultParams);
    expect(result.position.x).toBe(0 + 10 * 0.3); // 3
  });

  it('should offset camera Y from class center', () => {
    const result = calculateCellEntryTarget(defaultParams);
    expect(result.position.y).toBe(5 + 10 * 0.2); // 7
  });

  it('should offset camera Z from class center', () => {
    const result = calculateCellEntryTarget(defaultParams);
    expect(result.position.z).toBe(0 + 10 * 0.5); // 5
  });

  it('should set look target at class center', () => {
    const result = calculateCellEntryTarget(defaultParams);
    expect(result.target.x).toBe(0);
    expect(result.target.y).toBe(5);
    expect(result.target.z).toBe(0);
  });

  it('should handle different cell radii', () => {
    const result = calculateCellEntryTarget({
      classPosition: { x: 10, y: 0, z: 20 },
      cellRadius: 20,
    });
    expect(result.position.x).toBe(10 + 20 * 0.3); // 16
    expect(result.position.y).toBe(0 + 20 * 0.2); // 4
    expect(result.position.z).toBe(20 + 20 * 0.5); // 30
    expect(result.target).toEqual({ x: 10, y: 0, z: 20 });
  });

  it('should handle negative positions', () => {
    const result = calculateCellEntryTarget({
      classPosition: { x: -5, y: -3, z: -10 },
      cellRadius: 8,
    });
    expect(result.position.x).toBeCloseTo(-5 + 8 * 0.3);
    expect(result.position.y).toBeCloseTo(-3 + 8 * 0.2);
    expect(result.position.z).toBeCloseTo(-10 + 8 * 0.5);
  });
});

describe('computeFloorFadeOpacity', () => {
  it('should return 1 for focused floor at any progress', () => {
    expect(computeFloorFadeOpacity(0, true)).toBe(1);
    expect(computeFloorFadeOpacity(0.5, true)).toBe(1);
    expect(computeFloorFadeOpacity(1, true)).toBe(1);
  });

  it('should return 1 for non-focused floor at progress 0', () => {
    expect(computeFloorFadeOpacity(0, false)).toBe(1);
  });

  it('should return 0 for non-focused floor at progress 1', () => {
    expect(computeFloorFadeOpacity(1, false)).toBe(0);
  });

  it('should decrease for non-focused floors as progress increases', () => {
    const values = [0, 0.25, 0.5, 0.75, 1].map((p) =>
      computeFloorFadeOpacity(p, false)
    );
    for (let i = 1; i < values.length; i++) {
      expect(values[i]!).toBeLessThanOrEqual(values[i - 1]!);
    }
  });
});

describe('computeRoomToCellProgress', () => {
  it('should return 0 (box visible) at progress 0', () => {
    const result = computeRoomToCellProgress(0);
    expect(result.boxOpacity).toBe(1);
    expect(result.sphereOpacity).toBe(0);
  });

  it('should return 1 (sphere visible) at progress 1', () => {
    const result = computeRoomToCellProgress(1);
    expect(result.boxOpacity).toBe(0);
    expect(result.sphereOpacity).toBe(1);
  });

  it('should crossfade at midpoint', () => {
    const result = computeRoomToCellProgress(0.5);
    expect(result.boxOpacity).toBe(0.5);
    expect(result.sphereOpacity).toBe(0.5);
  });

  it('should have complementary opacities', () => {
    for (const p of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
      const result = computeRoomToCellProgress(p);
      expect(result.boxOpacity + result.sphereOpacity).toBeCloseTo(1);
    }
  });
});
