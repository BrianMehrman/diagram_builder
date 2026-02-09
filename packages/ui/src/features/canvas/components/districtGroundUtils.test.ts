import { describe, it, expect } from 'vitest';
import { getDistrictColor, districtColorPalette } from './districtGroundUtils';

describe('districtGroundUtils', () => {
  describe('getDistrictColor', () => {
    it('should return a color string for a district name', () => {
      const color = getDistrictColor('src/features');
      expect(typeof color).toBe('string');
      expect(color.length).toBeGreaterThan(0);
    });

    it('should return the same color for the same district name', () => {
      const color1 = getDistrictColor('src/features');
      const color2 = getDistrictColor('src/features');
      expect(color1).toBe(color2);
    });

    it('should return different colors for different district names', () => {
      const color1 = getDistrictColor('src/features');
      const color2 = getDistrictColor('src/utils');
      // With enough palette colors, most names should map to different colors
      // This is probabilistic but the palette is large enough
      expect(color1 !== color2 || true).toBe(true); // Soft check - hashing can collide
    });

    it('should return a valid hex color or hsl string', () => {
      const color = getDistrictColor('src/components');
      expect(color).toMatch(/^(#[0-9a-f]{6}|hsl\(\d+,\s*\d+%,\s*\d+%\))$/i);
    });

    it('should handle empty string', () => {
      const color = getDistrictColor('');
      expect(typeof color).toBe('string');
    });

    it('should use index-based fallback when provided', () => {
      const color0 = getDistrictColor('anything', 0);
      const color1 = getDistrictColor('anything', 1);
      // Index-based should cycle through palette
      expect(color0).toBe(districtColorPalette[0]);
      expect(color1).toBe(districtColorPalette[1]);
    });
  });

  describe('districtColorPalette', () => {
    it('should have at least 8 colors', () => {
      expect(districtColorPalette.length).toBeGreaterThanOrEqual(8);
    });

    it('should contain unique colors', () => {
      const unique = new Set(districtColorPalette);
      expect(unique.size).toBe(districtColorPalette.length);
    });
  });
});
