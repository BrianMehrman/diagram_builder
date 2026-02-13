/**
 * City View Utility Tests
 *
 * Tests for pure utility functions used by the CityView renderer.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDirectoryColor,
  getBuildingHeight,
  getMethodBasedHeight,
  getEncodedHeight,
  buildIncomingEdgeCounts,
  getDirectoryFromLabel,
  COLOR_PALETTE,
  FLOOR_HEIGHT,
  resetDirectoryColors,
} from './cityViewUtils';

describe('cityViewUtils', () => {
  beforeEach(() => {
    resetDirectoryColors();
  });

  describe('getDirectoryFromLabel', () => {
    it('should extract directory from path with slashes', () => {
      expect(getDirectoryFromLabel('src/components/Button.tsx')).toBe(
        'src/components'
      );
    });

    it('should return "root" for files without directory', () => {
      expect(getDirectoryFromLabel('index.ts')).toBe('root');
    });

    it('should handle deeply nested paths', () => {
      expect(
        getDirectoryFromLabel('src/features/canvas/views/CityView.tsx')
      ).toBe('src/features/canvas/views');
    });

    it('should handle single directory level', () => {
      expect(getDirectoryFromLabel('src/index.ts')).toBe('src');
    });
  });

  describe('getDirectoryColor', () => {
    it('should return a color string', () => {
      const color = getDirectoryColor('src/utils');
      expect(typeof color).toBe('string');
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should return same color for same directory', () => {
      const color1 = getDirectoryColor('src/utils');
      const color2 = getDirectoryColor('src/utils');
      expect(color1).toBe(color2);
    });

    it('should return different colors for different directories', () => {
      const color1 = getDirectoryColor('src/utils');
      const color2 = getDirectoryColor('src/features');
      // Different directories should get different colors (at least initially)
      expect(color1).not.toBe(color2);
    });

    it('should cycle through palette when many directories used', () => {
      const colors: string[] = [];
      for (let i = 0; i < COLOR_PALETTE.length + 1; i++) {
        colors.push(getDirectoryColor(`dir-${i}`));
      }
      // After cycling, should wrap around
      expect(colors[COLOR_PALETTE.length]).toBe(colors[0]);
    });

    it('should return color from the palette', () => {
      const color = getDirectoryColor('src/models');
      expect(COLOR_PALETTE).toContain(color);
    });
  });

  describe('getBuildingHeight', () => {
    it('should return minimum height for depth 0', () => {
      expect(getBuildingHeight(0)).toBeGreaterThan(0);
    });

    it('should return greater height for greater depth', () => {
      const h0 = getBuildingHeight(0);
      const h2 = getBuildingHeight(2);
      expect(h2).toBeGreaterThan(h0);
    });

    it('should handle undefined depth', () => {
      const height = getBuildingHeight(undefined);
      expect(height).toBeGreaterThan(0);
    });

    it('should scale linearly with depth', () => {
      const h1 = getBuildingHeight(1);
      const h2 = getBuildingHeight(2);
      const h3 = getBuildingHeight(3);
      // Differences should be equal (linear scaling)
      expect(h2 - h1).toBeCloseTo(h3 - h2, 5);
    });
  });

  describe('getMethodBasedHeight', () => {
    it('returns log-scaled height for positive methodCount', () => {
      const h = getMethodBasedHeight(5, 0);
      expect(h).toBeCloseTo(Math.log2(6) * FLOOR_HEIGHT);
    });

    it('returns depth-based height when methodCount is undefined', () => {
      expect(getMethodBasedHeight(undefined, 2)).toBe(getBuildingHeight(2));
    });

    it('returns depth-based height when methodCount is 0', () => {
      expect(getMethodBasedHeight(0, 1)).toBe(getBuildingHeight(1));
    });

    it('returns at least 1 * FLOOR_HEIGHT for 1 method', () => {
      // log2(2) = 1
      expect(getMethodBasedHeight(1, 0)).toBeCloseTo(FLOOR_HEIGHT);
    });

    it('grows sub-linearly', () => {
      const h10 = getMethodBasedHeight(10, 0);
      const h100 = getMethodBasedHeight(100, 0);
      // 10x more methods should NOT produce 10x more height
      expect(h100 / h10).toBeLessThan(3);
    });
  });

  describe('getEncodedHeight', () => {
    const baseNode = { methodCount: 5, depth: 2, metadata: {} };

    it('delegates to getMethodBasedHeight for methodCount encoding', () => {
      const h = getEncodedHeight(baseNode, { encoding: 'methodCount' });
      expect(h).toBe(getMethodBasedHeight(5, 2));
    });

    it('uses incoming edge count for dependencies encoding', () => {
      const h = getEncodedHeight(baseNode, { encoding: 'dependencies', incomingEdgeCount: 10 });
      expect(h).toBeCloseTo(Math.log2(11) * FLOOR_HEIGHT);
    });

    it('falls back to methodCount when dependencies count is 0', () => {
      const h = getEncodedHeight(baseNode, { encoding: 'dependencies', incomingEdgeCount: 0 });
      expect(h).toBe(getMethodBasedHeight(5, 2));
    });

    it('falls back to methodCount when incomingEdgeCount is undefined', () => {
      const h = getEncodedHeight(baseNode, { encoding: 'dependencies' });
      expect(h).toBe(getMethodBasedHeight(5, 2));
    });

    it('uses loc metadata for loc encoding', () => {
      const node = { ...baseNode, metadata: { loc: 500 } };
      const h = getEncodedHeight(node, { encoding: 'loc' });
      expect(h).toBeCloseTo(Math.log2(500 / 50 + 1) * FLOOR_HEIGHT);
    });

    it('falls back to methodCount when loc is 0 or missing', () => {
      const h = getEncodedHeight(baseNode, { encoding: 'loc' });
      expect(h).toBe(getMethodBasedHeight(5, 2));
    });

    it('uses complexity metadata for complexity encoding', () => {
      const node = { ...baseNode, metadata: { complexity: 15 } };
      const h = getEncodedHeight(node, { encoding: 'complexity' });
      expect(h).toBeCloseTo(Math.log2(16) * FLOOR_HEIGHT);
    });

    it('falls back to methodCount when complexity is 0 or missing', () => {
      const h = getEncodedHeight(baseNode, { encoding: 'complexity' });
      expect(h).toBe(getMethodBasedHeight(5, 2));
    });

    it('uses churn metadata for churn encoding', () => {
      const node = { ...baseNode, metadata: { churn: 20 } };
      const h = getEncodedHeight(node, { encoding: 'churn' });
      expect(h).toBeCloseTo(Math.log2(21) * FLOOR_HEIGHT);
    });

    it('falls back to methodCount when churn is 0 or missing', () => {
      const h = getEncodedHeight(baseNode, { encoding: 'churn' });
      expect(h).toBe(getMethodBasedHeight(5, 2));
    });

    it('returns at least 1 * FLOOR_HEIGHT for any positive metric', () => {
      const h = getEncodedHeight(baseNode, { encoding: 'dependencies', incomingEdgeCount: 1 });
      expect(h).toBeGreaterThanOrEqual(FLOOR_HEIGHT);
    });

    it('handles unknown encoding by falling back to methodCount', () => {
      const h = getEncodedHeight(baseNode, { encoding: 'unknown' as never });
      expect(h).toBe(getMethodBasedHeight(5, 2));
    });
  });

  describe('buildIncomingEdgeCounts', () => {
    it('returns empty map for empty edges array', () => {
      const counts = buildIncomingEdgeCounts([]);
      expect(counts.size).toBe(0);
    });

    it('counts single edge to a target', () => {
      const counts = buildIncomingEdgeCounts([{ target: 'A' }]);
      expect(counts.get('A')).toBe(1);
    });

    it('accumulates multiple edges to the same target', () => {
      const counts = buildIncomingEdgeCounts([
        { target: 'A' },
        { target: 'A' },
        { target: 'A' },
      ]);
      expect(counts.get('A')).toBe(3);
    });

    it('tracks different targets independently', () => {
      const counts = buildIncomingEdgeCounts([
        { target: 'A' },
        { target: 'B' },
        { target: 'A' },
        { target: 'C' },
      ]);
      expect(counts.get('A')).toBe(2);
      expect(counts.get('B')).toBe(1);
      expect(counts.get('C')).toBe(1);
    });

    it('returns undefined for nodes with no incoming edges', () => {
      const counts = buildIncomingEdgeCounts([{ target: 'A' }]);
      expect(counts.get('B')).toBeUndefined();
    });
  });
});
