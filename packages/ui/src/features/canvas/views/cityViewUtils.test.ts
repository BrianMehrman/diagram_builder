/**
 * City View Utility Tests
 *
 * Tests for pure utility functions used by the CityView renderer.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDirectoryColor,
  getBuildingHeight,
  getDirectoryFromLabel,
  COLOR_PALETTE,
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
});
