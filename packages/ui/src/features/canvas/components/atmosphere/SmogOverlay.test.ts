/**
 * SmogOverlay Tests
 *
 * Unit tests for smog threshold utilities and visibility gating.
 * WebGL rendering is unavailable in jsdom, so we test:
 *  1. Threshold utility logic (smogUtils)
 *  2. Visibility gating via store state
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../../store';
import {
  getComplexity,
  getAverageComplexity,
  computeSmogThreshold,
  shouldShowSmog,
  computeSmogOpacity,
} from './smogUtils';
import type { GraphNode } from '../../../../shared/types';

/** Helper: create a minimal GraphNode with optional complexity */
function makeNode(id: string, complexity?: number, nested = false): GraphNode {
  const metadata: Record<string, unknown> = {};
  if (complexity !== undefined) {
    if (nested) {
      metadata.properties = { complexity };
    } else {
      metadata.complexity = complexity;
    }
  }
  return {
    id,
    type: 'class',
    label: id,
    metadata,
    lod: 1,
  };
}

describe('SmogOverlay', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  // ── getComplexity ─────────────────────────────────────────────
  describe('getComplexity', () => {
    it('returns complexity from direct metadata', () => {
      const node = makeNode('a', 42);
      expect(getComplexity(node)).toBe(42);
    });

    it('returns complexity from nested metadata.properties', () => {
      const node = makeNode('a', 10, true);
      expect(getComplexity(node)).toBe(10);
    });

    it('returns 0 when metadata has no complexity (AC-4)', () => {
      const node = makeNode('a');
      expect(getComplexity(node)).toBe(0);
    });

    it('returns 0 when metadata is empty object', () => {
      const node: GraphNode = {
        id: 'x',
        type: 'file',
        label: 'x',
        metadata: {},
        lod: 1,
      };
      expect(getComplexity(node)).toBe(0);
    });
  });

  // ── getAverageComplexity ──────────────────────────────────────
  describe('getAverageComplexity', () => {
    it('returns average of nodes with complexity data', () => {
      const nodes = [makeNode('a', 10), makeNode('b', 20), makeNode('c', 30)];
      expect(getAverageComplexity(nodes)).toBe(20);
    });

    it('ignores nodes without complexity data', () => {
      const nodes = [makeNode('a', 10), makeNode('b'), makeNode('c', 30)];
      // Only a(10) and c(30) have data → average = 20
      expect(getAverageComplexity(nodes)).toBe(20);
    });

    it('returns 0 when no nodes have complexity', () => {
      const nodes = [makeNode('a'), makeNode('b')];
      expect(getAverageComplexity(nodes)).toBe(0);
    });

    it('returns 0 for empty array', () => {
      expect(getAverageComplexity([])).toBe(0);
    });
  });

  // ── computeSmogThreshold ──────────────────────────────────────
  describe('computeSmogThreshold', () => {
    it('returns 75th percentile cutoff correctly', () => {
      // 4 districts with averages [10, 20, 30, 40]
      // Top 25% = 1 district → cutoff = 40
      const threshold = computeSmogThreshold([10, 20, 30, 40]);
      expect(threshold).toBe(40);
    });

    it('returns correct threshold for 8 districts', () => {
      // 8 values: top 25% = 2 districts
      const averages = [5, 10, 15, 20, 25, 30, 35, 40];
      const threshold = computeSmogThreshold(averages);
      expect(threshold).toBe(35);
    });

    it('returns Infinity when no complexity data present (AC-4)', () => {
      expect(computeSmogThreshold([0, 0, 0])).toBe(Infinity);
    });

    it('returns Infinity for empty array', () => {
      expect(computeSmogThreshold([])).toBe(Infinity);
    });

    it('handles single district with complexity data', () => {
      expect(computeSmogThreshold([15])).toBe(15);
    });
  });

  // ── shouldShowSmog ────────────────────────────────────────────
  describe('shouldShowSmog', () => {
    it('returns true for average above threshold', () => {
      expect(shouldShowSmog(15, 10)).toBe(true);
    });

    it('returns true for average equal to threshold', () => {
      expect(shouldShowSmog(10, 10)).toBe(true);
    });

    it('returns false for average below threshold', () => {
      expect(shouldShowSmog(5, 10)).toBe(false);
    });

    it('returns false when threshold is Infinity', () => {
      expect(shouldShowSmog(100, Infinity)).toBe(false);
    });
  });

  // ── computeSmogOpacity ────────────────────────────────────────
  describe('computeSmogOpacity', () => {
    it('returns minimum opacity at threshold boundary', () => {
      const opacity = computeSmogOpacity(10, 10);
      expect(opacity).toBe(0.15);
    });

    it('returns higher opacity for values well above threshold', () => {
      const opacity = computeSmogOpacity(20, 10);
      expect(opacity).toBeGreaterThan(0.15);
    });

    it('caps opacity at maximum', () => {
      const opacity = computeSmogOpacity(1000, 10);
      expect(opacity).toBeLessThanOrEqual(0.45);
    });

    it('returns 0 when threshold is Infinity', () => {
      expect(computeSmogOpacity(10, Infinity)).toBe(0);
    });

    it('returns 0 when threshold is 0', () => {
      expect(computeSmogOpacity(10, 0)).toBe(0);
    });
  });

  // ── Visibility gating (store-based) ───────────────────────────
  describe('visibility gating', () => {
    it('should be hidden when lodLevel < 3 (AC-5)', () => {
      useCanvasStore.getState().setLodLevel(2);
      const { lodLevel, citySettings } = useCanvasStore.getState();
      expect(lodLevel).toBe(2);
      expect(lodLevel < 3).toBe(true);
      expect(citySettings.atmosphereOverlays.smog).toBe(false);
    });

    it('should be visible when lodLevel >= 3 and smog toggle is on', () => {
      useCanvasStore.getState().setLodLevel(3);
      useCanvasStore.getState().toggleAtmosphereOverlay('smog');
      const { lodLevel, citySettings } = useCanvasStore.getState();
      expect(lodLevel).toBe(3);
      expect(citySettings.atmosphereOverlays.smog).toBe(true);
      const shouldRender = lodLevel >= 3 && citySettings.atmosphereOverlays.smog;
      expect(shouldRender).toBe(true);
    });

    it('should be hidden when atmosphereOverlays.smog is false (AC-3)', () => {
      useCanvasStore.getState().setLodLevel(4);
      const { lodLevel, citySettings } = useCanvasStore.getState();
      expect(lodLevel).toBe(4);
      expect(citySettings.atmosphereOverlays.smog).toBe(false);
      const shouldRender = lodLevel >= 3 && citySettings.atmosphereOverlays.smog;
      expect(shouldRender).toBe(false);
    });

    it('toggling smog twice returns to original state', () => {
      useCanvasStore.getState().toggleAtmosphereOverlay('smog');
      expect(useCanvasStore.getState().citySettings.atmosphereOverlays.smog).toBe(true);
      useCanvasStore.getState().toggleAtmosphereOverlay('smog');
      expect(useCanvasStore.getState().citySettings.atmosphereOverlays.smog).toBe(false);
    });
  });
});
