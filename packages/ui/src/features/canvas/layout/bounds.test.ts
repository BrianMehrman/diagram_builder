import { describe, it, expect } from 'vitest';
import type { BoundingBox } from './types';
import {
  boundsCenter,
  boundsSize,
  boundsContains,
  mergeBounds,
  boundsFromPositions,
} from './bounds';

describe('BoundingBox helpers', () => {
  const box: BoundingBox = {
    min: { x: 0, y: 0, z: 0 },
    max: { x: 10, y: 20, z: 30 },
  };

  describe('boundsCenter', () => {
    it('should return the center point', () => {
      const center = boundsCenter(box);
      expect(center).toEqual({ x: 5, y: 10, z: 15 });
    });

    it('should handle negative coordinates', () => {
      const negBox: BoundingBox = {
        min: { x: -10, y: -20, z: -30 },
        max: { x: 10, y: 20, z: 30 },
      };
      expect(boundsCenter(negBox)).toEqual({ x: 0, y: 0, z: 0 });
    });
  });

  describe('boundsSize', () => {
    it('should return dimensions', () => {
      const size = boundsSize(box);
      expect(size).toEqual({ x: 10, y: 20, z: 30 });
    });

    it('should return zero for zero-size box', () => {
      const zeroBox: BoundingBox = {
        min: { x: 5, y: 5, z: 5 },
        max: { x: 5, y: 5, z: 5 },
      };
      expect(boundsSize(zeroBox)).toEqual({ x: 0, y: 0, z: 0 });
    });
  });

  describe('boundsContains', () => {
    it('should return true for points inside', () => {
      expect(boundsContains(box, { x: 5, y: 10, z: 15 })).toBe(true);
    });

    it('should return true for points on boundary', () => {
      expect(boundsContains(box, { x: 0, y: 0, z: 0 })).toBe(true);
      expect(boundsContains(box, { x: 10, y: 20, z: 30 })).toBe(true);
    });

    it('should return false for points outside', () => {
      expect(boundsContains(box, { x: -1, y: 10, z: 15 })).toBe(false);
      expect(boundsContains(box, { x: 5, y: 21, z: 15 })).toBe(false);
      expect(boundsContains(box, { x: 5, y: 10, z: 31 })).toBe(false);
    });
  });

  describe('mergeBounds', () => {
    it('should merge two non-overlapping boxes', () => {
      const a: BoundingBox = {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 5, y: 5, z: 5 },
      };
      const b: BoundingBox = {
        min: { x: 10, y: 10, z: 10 },
        max: { x: 15, y: 15, z: 15 },
      };

      const merged = mergeBounds(a, b);
      expect(merged.min).toEqual({ x: 0, y: 0, z: 0 });
      expect(merged.max).toEqual({ x: 15, y: 15, z: 15 });
    });

    it('should merge overlapping boxes', () => {
      const a: BoundingBox = {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 10, y: 10, z: 10 },
      };
      const b: BoundingBox = {
        min: { x: 5, y: 5, z: 5 },
        max: { x: 15, y: 15, z: 15 },
      };

      const merged = mergeBounds(a, b);
      expect(merged.min).toEqual({ x: 0, y: 0, z: 0 });
      expect(merged.max).toEqual({ x: 15, y: 15, z: 15 });
    });
  });

  describe('boundsFromPositions', () => {
    it('should create bounds from multiple positions', () => {
      const positions = [
        { x: 1, y: 2, z: 3 },
        { x: 10, y: 20, z: 30 },
        { x: -5, y: 0, z: 15 },
      ];
      const bounds = boundsFromPositions(positions);
      expect(bounds.min).toEqual({ x: -5, y: 0, z: 3 });
      expect(bounds.max).toEqual({ x: 10, y: 20, z: 30 });
    });

    it('should return zero box for empty array', () => {
      const bounds = boundsFromPositions([]);
      expect(bounds.min).toEqual({ x: 0, y: 0, z: 0 });
      expect(bounds.max).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should handle single position', () => {
      const bounds = boundsFromPositions([{ x: 5, y: 10, z: 15 }]);
      expect(bounds.min).toEqual({ x: 5, y: 10, z: 15 });
      expect(bounds.max).toEqual({ x: 5, y: 10, z: 15 });
    });
  });
});
