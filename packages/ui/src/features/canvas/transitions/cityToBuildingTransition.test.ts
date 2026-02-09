/**
 * City-to-Building Transition Tests
 *
 * Tests for pure utility functions that calculate camera entry positions
 * and transition fade values for city → building navigation.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateBuildingEntryTarget,
  computeCityFadeOpacity,
  computeInteriorRevealOpacity,
} from './cityToBuildingTransition';

describe('calculateBuildingEntryTarget', () => {
  const defaultParams = {
    buildingPosition: { x: 10, y: 0, z: 20 },
    buildingWidth: 4,
    buildingHeight: 12,
    buildingDepth: 4,
  };

  it('should place entry position centered on building X axis', () => {
    const result = calculateBuildingEntryTarget(defaultParams);
    expect(result.position.x).toBe(10 + 4 / 2); // center X
  });

  it('should place entry position at 30% of building height', () => {
    const result = calculateBuildingEntryTarget(defaultParams);
    expect(result.position.y).toBe(0 + 12 * 0.3); // 30% up
  });

  it('should place entry position just outside front face', () => {
    const result = calculateBuildingEntryTarget(defaultParams);
    expect(result.position.z).toBe(20 + 4 + 2); // front face + offset
  });

  it('should set look target at center of building', () => {
    const result = calculateBuildingEntryTarget(defaultParams);
    expect(result.target.x).toBe(10 + 4 / 2); // center X
    expect(result.target.y).toBe(0 + 12 * 0.3); // same height
    expect(result.target.z).toBe(20 + 4 / 2); // center Z
  });

  it('should handle different building sizes', () => {
    const large = calculateBuildingEntryTarget({
      buildingPosition: { x: 0, y: 0, z: 0 },
      buildingWidth: 20,
      buildingHeight: 40,
      buildingDepth: 20,
    });
    expect(large.position.x).toBe(10); // 20/2
    expect(large.position.y).toBe(12); // 40*0.3
    expect(large.position.z).toBe(22); // 20 + 2
    expect(large.target.z).toBe(10); // 20/2
  });

  it('should handle negative positions', () => {
    const result = calculateBuildingEntryTarget({
      buildingPosition: { x: -10, y: -5, z: -20 },
      buildingWidth: 4,
      buildingHeight: 12,
      buildingDepth: 4,
    });
    expect(result.position.x).toBe(-8); // -10 + 2
    expect(result.position.y).toBeCloseTo(-1.4); // -5 + 3.6
    expect(result.position.z).toBe(-14); // -20 + 4 + 2
  });
});

describe('computeCityFadeOpacity', () => {
  it('should return 1 at progress 0 (city fully visible)', () => {
    expect(computeCityFadeOpacity(0)).toBe(1);
  });

  it('should return 0 at progress 1 (city fully hidden)', () => {
    expect(computeCityFadeOpacity(1)).toBe(0);
  });

  it('should return value between 0 and 1 at midpoint', () => {
    const mid = computeCityFadeOpacity(0.5);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });

  it('should decrease monotonically', () => {
    const values = [0, 0.25, 0.5, 0.75, 1].map(computeCityFadeOpacity);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]!).toBeLessThanOrEqual(values[i - 1]!);
    }
  });
});

describe('computeInteriorRevealOpacity', () => {
  it('should return 0 at progress 0 (interior hidden)', () => {
    expect(computeInteriorRevealOpacity(0)).toBe(0);
  });

  it('should return 1 at progress 1 (interior fully visible)', () => {
    expect(computeInteriorRevealOpacity(1)).toBe(1);
  });

  it('should return value between 0 and 1 at midpoint', () => {
    const mid = computeInteriorRevealOpacity(0.5);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });

  it('should increase monotonically', () => {
    const values = [0, 0.25, 0.5, 0.75, 1].map(computeInteriorRevealOpacity);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]!).toBeGreaterThanOrEqual(values[i - 1]!);
    }
  });
});
