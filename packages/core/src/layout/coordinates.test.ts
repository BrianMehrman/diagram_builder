/**
 * Coordinate Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  zero,
  vec3,
  add,
  subtract,
  scale,
  divide,
  negate,
  dot,
  cross,
  magnitude,
  magnitudeSquared,
  normalize,
  distance,
  distanceSquared,
  lerp,
  clamp,
  isInsideBounds,
  cartesianToSpherical,
  sphericalToCartesian,
  cartesianToCylindrical,
  cylindricalToCartesian,
  emptyBounds,
  boundsFromPoint,
  expandBounds,
  mergeBounds,
  boundsCenter,
  boundsSize,
  boundsDiagonal,
  boundsIntersect,
  padBounds,
  degToRad,
  radToDeg,
  angleBetween,
  randomInBounds,
  randomInSphere,
  randomOnSphere,
} from './coordinates.js';

describe('Coordinate Utilities', () => {
  describe('Basic Vector Operations', () => {
    it('zero should return origin', () => {
      expect(zero()).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('vec3 should create position', () => {
      expect(vec3(1, 2, 3)).toEqual({ x: 1, y: 2, z: 3 });
    });

    it('add should add vectors', () => {
      expect(add({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 })).toEqual({ x: 5, y: 7, z: 9 });
    });

    it('subtract should subtract vectors', () => {
      expect(subtract({ x: 5, y: 7, z: 9 }, { x: 1, y: 2, z: 3 })).toEqual({ x: 4, y: 5, z: 6 });
    });

    it('scale should multiply by scalar', () => {
      expect(scale({ x: 1, y: 2, z: 3 }, 2)).toEqual({ x: 2, y: 4, z: 6 });
    });

    it('divide should divide by scalar', () => {
      expect(divide({ x: 2, y: 4, z: 6 }, 2)).toEqual({ x: 1, y: 2, z: 3 });
    });

    it('divide should throw on zero', () => {
      expect(() => divide({ x: 1, y: 2, z: 3 }, 0)).toThrow('Cannot divide by zero');
    });

    it('negate should negate vector', () => {
      expect(negate({ x: 1, y: -2, z: 3 })).toEqual({ x: -1, y: 2, z: -3 });
    });

    it('dot should calculate dot product', () => {
      expect(dot({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 })).toBe(32); // 1*4 + 2*5 + 3*6
    });

    it('cross should calculate cross product', () => {
      const result = cross({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
      expect(result).toEqual({ x: 0, y: 0, z: 1 });
    });

    it('magnitude should calculate length', () => {
      expect(magnitude({ x: 3, y: 4, z: 0 })).toBe(5); // 3-4-5 triangle
    });

    it('magnitudeSquared should calculate squared length', () => {
      expect(magnitudeSquared({ x: 3, y: 4, z: 0 })).toBe(25);
    });

    it('normalize should create unit vector', () => {
      const result = normalize({ x: 3, y: 4, z: 0 });
      expect(result.x).toBeCloseTo(0.6);
      expect(result.y).toBeCloseTo(0.8);
      expect(result.z).toBeCloseTo(0);
    });

    it('normalize should handle zero vector', () => {
      expect(normalize({ x: 0, y: 0, z: 0 })).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('distance should calculate distance between points', () => {
      expect(distance({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 })).toBe(5);
    });

    it('distanceSquared should calculate squared distance', () => {
      expect(distanceSquared({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 })).toBe(25);
    });

    it('lerp should interpolate between points', () => {
      const a = { x: 0, y: 0, z: 0 };
      const b = { x: 10, y: 20, z: 30 };
      expect(lerp(a, b, 0)).toEqual(a);
      expect(lerp(a, b, 1)).toEqual(b);
      expect(lerp(a, b, 0.5)).toEqual({ x: 5, y: 10, z: 15 });
    });
  });

  describe('Bounds Operations', () => {
    it('clamp should constrain point to bounds', () => {
      const bounds = { min: { x: 0, y: 0, z: 0 }, max: { x: 10, y: 10, z: 10 } };
      expect(clamp({ x: -5, y: 5, z: 15 }, bounds)).toEqual({ x: 0, y: 5, z: 10 });
    });

    it('isInsideBounds should check containment', () => {
      const bounds = { min: { x: 0, y: 0, z: 0 }, max: { x: 10, y: 10, z: 10 } };
      expect(isInsideBounds({ x: 5, y: 5, z: 5 }, bounds)).toBe(true);
      expect(isInsideBounds({ x: -1, y: 5, z: 5 }, bounds)).toBe(false);
      expect(isInsideBounds({ x: 0, y: 0, z: 0 }, bounds)).toBe(true); // on boundary
    });

    it('emptyBounds should create infinite bounds', () => {
      const bounds = emptyBounds();
      expect(bounds.min.x).toBe(Infinity);
      expect(bounds.max.x).toBe(-Infinity);
    });

    it('boundsFromPoint should create bounds from single point', () => {
      const bounds = boundsFromPoint({ x: 5, y: 10, z: 15 });
      expect(bounds.min).toEqual({ x: 5, y: 10, z: 15 });
      expect(bounds.max).toEqual({ x: 5, y: 10, z: 15 });
    });

    it('expandBounds should include new point', () => {
      const bounds = boundsFromPoint({ x: 0, y: 0, z: 0 });
      const expanded = expandBounds(bounds, { x: 10, y: 10, z: 10 });
      expect(expanded.min).toEqual({ x: 0, y: 0, z: 0 });
      expect(expanded.max).toEqual({ x: 10, y: 10, z: 10 });
    });

    it('mergeBounds should combine two bounds', () => {
      const a = { min: { x: 0, y: 0, z: 0 }, max: { x: 5, y: 5, z: 5 } };
      const b = { min: { x: 3, y: 3, z: 3 }, max: { x: 10, y: 10, z: 10 } };
      const merged = mergeBounds(a, b);
      expect(merged.min).toEqual({ x: 0, y: 0, z: 0 });
      expect(merged.max).toEqual({ x: 10, y: 10, z: 10 });
    });

    it('boundsCenter should calculate center', () => {
      const bounds = { min: { x: 0, y: 0, z: 0 }, max: { x: 10, y: 20, z: 30 } };
      expect(boundsCenter(bounds)).toEqual({ x: 5, y: 10, z: 15 });
    });

    it('boundsSize should calculate size', () => {
      const bounds = { min: { x: 0, y: 0, z: 0 }, max: { x: 10, y: 20, z: 30 } };
      expect(boundsSize(bounds)).toEqual({ x: 10, y: 20, z: 30 });
    });

    it('boundsDiagonal should calculate diagonal length', () => {
      const bounds = { min: { x: 0, y: 0, z: 0 }, max: { x: 3, y: 4, z: 0 } };
      expect(boundsDiagonal(bounds)).toBe(5);
    });

    it('boundsIntersect should detect intersection', () => {
      const a = { min: { x: 0, y: 0, z: 0 }, max: { x: 5, y: 5, z: 5 } };
      const b = { min: { x: 3, y: 3, z: 3 }, max: { x: 10, y: 10, z: 10 } };
      const c = { min: { x: 10, y: 10, z: 10 }, max: { x: 20, y: 20, z: 20 } };

      expect(boundsIntersect(a, b)).toBe(true);
      expect(boundsIntersect(a, c)).toBe(false);
    });

    it('padBounds should expand bounds by padding', () => {
      const bounds = { min: { x: 0, y: 0, z: 0 }, max: { x: 10, y: 10, z: 10 } };
      const padded = padBounds(bounds, 5);
      expect(padded.min).toEqual({ x: -5, y: -5, z: -5 });
      expect(padded.max).toEqual({ x: 15, y: 15, z: 15 });
    });
  });

  describe('Coordinate Conversions', () => {
    it('cartesianToSpherical and back should round-trip', () => {
      const original = { x: 3, y: 4, z: 5 };
      const spherical = cartesianToSpherical(original);
      const result = sphericalToCartesian(spherical);

      expect(result.x).toBeCloseTo(original.x);
      expect(result.y).toBeCloseTo(original.y);
      expect(result.z).toBeCloseTo(original.z);
    });

    it('cartesianToSpherical should handle origin', () => {
      const result = cartesianToSpherical({ x: 0, y: 0, z: 0 });
      expect(result).toEqual({ r: 0, theta: 0, phi: 0 });
    });

    it('cartesianToCylindrical and back should round-trip', () => {
      const original = { x: 3, y: 4, z: 5 };
      const cylindrical = cartesianToCylindrical(original);
      const result = cylindricalToCartesian(cylindrical);

      expect(result.x).toBeCloseTo(original.x);
      expect(result.y).toBeCloseTo(original.y);
      expect(result.z).toBeCloseTo(original.z);
    });
  });

  describe('Angle Utilities', () => {
    it('degToRad should convert degrees to radians', () => {
      expect(degToRad(180)).toBeCloseTo(Math.PI);
      expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
      expect(degToRad(0)).toBe(0);
    });

    it('radToDeg should convert radians to degrees', () => {
      expect(radToDeg(Math.PI)).toBeCloseTo(180);
      expect(radToDeg(Math.PI / 2)).toBeCloseTo(90);
      expect(radToDeg(0)).toBe(0);
    });

    it('angleBetween should calculate angle', () => {
      const a = { x: 1, y: 0, z: 0 };
      const b = { x: 0, y: 1, z: 0 };
      expect(angleBetween(a, b)).toBeCloseTo(Math.PI / 2); // 90 degrees

      const c = { x: 1, y: 0, z: 0 };
      const d = { x: 1, y: 0, z: 0 };
      expect(angleBetween(c, d)).toBeCloseTo(0); // parallel

      const e = { x: 1, y: 0, z: 0 };
      const f = { x: -1, y: 0, z: 0 };
      expect(angleBetween(e, f)).toBeCloseTo(Math.PI); // opposite
    });

    it('angleBetween should handle zero vectors', () => {
      expect(angleBetween({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 })).toBe(0);
    });
  });

  describe('Random Generation', () => {
    it('randomInBounds should generate points within bounds', () => {
      const bounds = { min: { x: 0, y: 0, z: 0 }, max: { x: 10, y: 10, z: 10 } };

      for (let i = 0; i < 100; i++) {
        const point = randomInBounds(bounds);
        expect(isInsideBounds(point, bounds)).toBe(true);
      }
    });

    it('randomInSphere should generate points within radius', () => {
      const center = { x: 5, y: 5, z: 5 };
      const radius = 10;

      for (let i = 0; i < 100; i++) {
        const point = randomInSphere(center, radius);
        const dist = distance(point, center);
        expect(dist).toBeLessThanOrEqual(radius);
      }
    });

    it('randomOnSphere should generate points on surface', () => {
      const center = { x: 0, y: 0, z: 0 };
      const radius = 10;

      for (let i = 0; i < 100; i++) {
        const point = randomOnSphere(center, radius);
        const dist = distance(point, center);
        expect(dist).toBeCloseTo(radius, 5);
      }
    });
  });
});
