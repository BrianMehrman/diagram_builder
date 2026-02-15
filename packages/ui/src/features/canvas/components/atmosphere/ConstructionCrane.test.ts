/**
 * ConstructionCrane Tests
 *
 * Unit tests for crane threshold utilities and visibility gating.
 * WebGL rendering is unavailable in jsdom, so we test:
 *  1. Threshold utility logic (craneUtils)
 *  2. Visibility gating via store state
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../../store';
import { getChangeCount, computeCraneThreshold, shouldShowCrane } from './craneUtils';
import type { GraphNode } from '../../../../shared/types';

/** Helper: create a minimal GraphNode with optional changeCount */
function makeNode(id: string, changeCount?: number, nested = false): GraphNode {
  const metadata: Record<string, unknown> = {};
  if (changeCount !== undefined) {
    if (nested) {
      metadata.properties = { changeCount };
    } else {
      metadata.changeCount = changeCount;
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

describe('ConstructionCrane', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  // ── getChangeCount ──────────────────────────────────────────────
  describe('getChangeCount', () => {
    it('returns changeCount from direct metadata', () => {
      const node = makeNode('a', 42);
      expect(getChangeCount(node)).toBe(42);
    });

    it('returns changeCount from nested metadata.properties', () => {
      const node = makeNode('a', 10, true);
      expect(getChangeCount(node)).toBe(10);
    });

    it('returns 0 when metadata has no changeCount (AC-4)', () => {
      const node = makeNode('a');
      expect(getChangeCount(node)).toBe(0);
    });

    it('returns 0 when metadata is empty object', () => {
      const node: GraphNode = {
        id: 'x',
        type: 'file',
        label: 'x',
        metadata: {},
        lod: 1,
      };
      expect(getChangeCount(node)).toBe(0);
    });
  });

  // ── computeCraneThreshold ───────────────────────────────────────
  describe('computeCraneThreshold', () => {
    it('returns top 10% cutoff correctly', () => {
      // 10 nodes with counts 1..10 — top 10% = the node with count 10
      const nodes = Array.from({ length: 10 }, (_, i) => makeNode(`n${i}`, i + 1));
      const threshold = computeCraneThreshold(nodes);
      expect(threshold).toBe(10);
    });

    it('returns correct threshold for 20 nodes', () => {
      // 20 nodes: counts 1..20 — top 10% = 2 nodes (counts 19, 20)
      const nodes = Array.from({ length: 20 }, (_, i) => makeNode(`n${i}`, i + 1));
      const threshold = computeCraneThreshold(nodes);
      expect(threshold).toBe(19);
    });

    it('returns Infinity when no change data present (AC-4)', () => {
      const nodes = [makeNode('a'), makeNode('b'), makeNode('c')];
      expect(computeCraneThreshold(nodes)).toBe(Infinity);
    });

    it('returns Infinity for empty node array', () => {
      expect(computeCraneThreshold([])).toBe(Infinity);
    });

    it('handles single node with change data', () => {
      const nodes = [makeNode('a', 5)];
      expect(computeCraneThreshold(nodes)).toBe(5);
    });

    it('ignores nodes with zero change count', () => {
      const nodes = [makeNode('a', 0), makeNode('b', 0)];
      expect(computeCraneThreshold(nodes)).toBe(Infinity);
    });
  });

  // ── shouldShowCrane ─────────────────────────────────────────────
  describe('shouldShowCrane', () => {
    it('returns true for nodes above threshold', () => {
      const node = makeNode('a', 15);
      expect(shouldShowCrane(node, 10)).toBe(true);
    });

    it('returns true for nodes equal to threshold', () => {
      const node = makeNode('a', 10);
      expect(shouldShowCrane(node, 10)).toBe(true);
    });

    it('returns false for nodes below threshold', () => {
      const node = makeNode('a', 5);
      expect(shouldShowCrane(node, 10)).toBe(false);
    });

    it('returns false when threshold is Infinity', () => {
      const node = makeNode('a', 100);
      expect(shouldShowCrane(node, Infinity)).toBe(false);
    });
  });

  // ── Visibility gating (store-based) ─────────────────────────────
  describe('visibility gating', () => {
    it('should be hidden when lodLevel < 3 (AC-5)', () => {
      useCanvasStore.getState().setLodLevel(2);
      const { lodLevel, citySettings } = useCanvasStore.getState();
      expect(lodLevel).toBe(2);
      // Component would early-return null
      expect(lodLevel < 3).toBe(true);
      expect(citySettings.atmosphereOverlays.cranes).toBe(false);
    });

    it('should be visible when lodLevel >= 3 and cranes toggle is on', () => {
      useCanvasStore.getState().setLodLevel(3);
      useCanvasStore.getState().toggleAtmosphereOverlay('cranes');
      const { lodLevel, citySettings } = useCanvasStore.getState();
      expect(lodLevel).toBe(3);
      expect(citySettings.atmosphereOverlays.cranes).toBe(true);
      // Component would render
      const shouldRender = lodLevel >= 3 && citySettings.atmosphereOverlays.cranes;
      expect(shouldRender).toBe(true);
    });

    it('should be hidden when atmosphereOverlays.cranes is false (AC-3)', () => {
      useCanvasStore.getState().setLodLevel(4);
      // cranes defaults to false — don't toggle it
      const { lodLevel, citySettings } = useCanvasStore.getState();
      expect(lodLevel).toBe(4);
      expect(citySettings.atmosphereOverlays.cranes).toBe(false);
      const shouldRender = lodLevel >= 3 && citySettings.atmosphereOverlays.cranes;
      expect(shouldRender).toBe(false);
    });

    it('toggling cranes twice returns to original state', () => {
      useCanvasStore.getState().toggleAtmosphereOverlay('cranes');
      expect(useCanvasStore.getState().citySettings.atmosphereOverlays.cranes).toBe(true);
      useCanvasStore.getState().toggleAtmosphereOverlay('cranes');
      expect(useCanvasStore.getState().citySettings.atmosphereOverlays.cranes).toBe(false);
    });
  });
});
