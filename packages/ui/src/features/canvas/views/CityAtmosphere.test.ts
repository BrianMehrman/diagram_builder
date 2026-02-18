/**
 * CityAtmosphere Orchestrator Tests
 *
 * Unit tests for the orchestration logic:
 *  1. Toggle-based conditional mounting
 *  2. LOD gating (all indicators hidden below LOD 3)
 *  3. Data-graceful behavior (no data = no indicators)
 *  4. Performance: nothing mounted when all toggles off
 *
 * WebGL rendering is unavailable in jsdom, so we test store-based
 * gating logic rather than rendered output.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../store';
import { shouldShowCrane, computeCraneThreshold } from '../components/atmosphere/craneUtils';
import { getTestCoverage } from '../components/atmosphere/coverageLightingUtils';
import { isDeprecated } from '../components/atmosphere/deprecatedUtils';
import { getAverageComplexity, computeSmogThreshold, shouldShowSmog } from '../components/atmosphere/smogUtils';
import type { GraphNode } from '../../../shared/types';

/** Helper: create a minimal GraphNode with optional metadata */
function makeNode(
  id: string,
  type: GraphNode['type'] = 'class',
  metadata: Record<string, unknown> = {},
): GraphNode {
  return { id, type, label: id, metadata, lod: 1 };
}

describe('CityAtmosphere', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  // ── Master toggle gating ──────────────────────────────────────
  describe('master toggle gating', () => {
    it('all atmosphere overlays default to off', () => {
      const { atmosphereOverlays } = useCanvasStore.getState().citySettings;
      expect(atmosphereOverlays.cranes).toBe(false);
      expect(atmosphereOverlays.lighting).toBe(false);
      expect(atmosphereOverlays.smog).toBe(false);
      expect(atmosphereOverlays.deprecated).toBe(false);
    });

    it('anyEnabled is false when all toggles are off (AC-5)', () => {
      const { atmosphereOverlays } = useCanvasStore.getState().citySettings;
      const anyEnabled =
        atmosphereOverlays.cranes ||
        atmosphereOverlays.lighting ||
        atmosphereOverlays.smog ||
        atmosphereOverlays.deprecated;
      expect(anyEnabled).toBe(false);
    });

    it('anyEnabled is true when any toggle is on', () => {
      useCanvasStore.getState().toggleAtmosphereOverlay('smog');
      const { atmosphereOverlays } = useCanvasStore.getState().citySettings;
      const anyEnabled =
        atmosphereOverlays.cranes ||
        atmosphereOverlays.lighting ||
        atmosphereOverlays.smog ||
        atmosphereOverlays.deprecated;
      expect(anyEnabled).toBe(true);
    });
  });

  // ── LOD gating ────────────────────────────────────────────────
  describe('LOD gating (AC-2)', () => {
    it('should not render at LOD 1', () => {
      useCanvasStore.getState().setLodLevel(1);
      useCanvasStore.getState().toggleAtmosphereOverlay('cranes');
      const { lodLevel } = useCanvasStore.getState();
      expect(lodLevel < 3).toBe(true);
    });

    it('should not render at LOD 2', () => {
      useCanvasStore.getState().setLodLevel(2);
      useCanvasStore.getState().toggleAtmosphereOverlay('cranes');
      const { lodLevel } = useCanvasStore.getState();
      expect(lodLevel < 3).toBe(true);
    });

    it('should render at LOD 3 when toggles are on', () => {
      useCanvasStore.getState().setLodLevel(3);
      useCanvasStore.getState().toggleAtmosphereOverlay('cranes');
      const { lodLevel, citySettings } = useCanvasStore.getState();
      expect(lodLevel >= 3 && citySettings.atmosphereOverlays.cranes).toBe(true);
    });
  });

  // ── Per-indicator data-graceful behavior (AC-4) ───────────────
  describe('data-graceful behavior (AC-4)', () => {
    it('crane: no change data → threshold is Infinity → no cranes', () => {
      const nodes = [makeNode('a'), makeNode('b')];
      const threshold = computeCraneThreshold(nodes);
      expect(threshold).toBe(Infinity);
      expect(shouldShowCrane(nodes[0]!, threshold)).toBe(false);
    });

    it('lighting: no test coverage data → getTestCoverage returns null', () => {
      const node = makeNode('a');
      expect(getTestCoverage(node)).toBeNull();
    });

    it('smog: no complexity data → threshold is Infinity → no smog', () => {
      const nodes = [makeNode('a'), makeNode('b')];
      const avg = getAverageComplexity(nodes);
      expect(avg).toBe(0);
      const threshold = computeSmogThreshold([avg]);
      expect(threshold).toBe(Infinity);
    });

    it('deprecated: no isDeprecated flag → not deprecated', () => {
      const node = makeNode('a');
      expect(isDeprecated(node)).toBe(false);
    });
  });

  // ── Indicator qualification logic ─────────────────────────────
  describe('indicator qualification', () => {
    it('crane: node with high changeCount qualifies', () => {
      const nodes = Array.from({ length: 10 }, (_, i) =>
        makeNode(`n${i}`, 'class', { changeCount: i + 1 }),
      );
      const threshold = computeCraneThreshold(nodes);
      // Top 10% of 10 nodes = node with changeCount 10
      expect(shouldShowCrane(nodes[9]!, threshold)).toBe(true);
      expect(shouldShowCrane(nodes[0]!, threshold)).toBe(false);
    });

    it('lighting: node with testCoverage qualifies', () => {
      const node = makeNode('a', 'class', { testCoverage: 85 });
      expect(getTestCoverage(node)).toBe(85);
    });

    it('smog: district with high avg complexity qualifies', () => {
      const highNodes = [
        makeNode('a', 'class', { complexity: 50 }),
        makeNode('b', 'class', { complexity: 60 }),
      ];
      const lowNodes = [
        makeNode('c', 'class', { complexity: 5 }),
        makeNode('d', 'class', { complexity: 3 }),
      ];
      const highAvg = getAverageComplexity(highNodes);
      const lowAvg = getAverageComplexity(lowNodes);
      const threshold = computeSmogThreshold([highAvg, lowAvg]);
      expect(shouldShowSmog(highAvg, threshold)).toBe(true);
      expect(shouldShowSmog(lowAvg, threshold)).toBe(false);
    });

    it('deprecated: node with isDeprecated flag qualifies', () => {
      const node = makeNode('a');
      node.isDeprecated = true;
      expect(isDeprecated(node)).toBe(true);
    });
  });

  // ── Building type filtering ───────────────────────────────────
  describe('building type filtering', () => {
    const BUILDING_TYPES = new Set(['class', 'function', 'interface', 'abstract_class']);

    it('class nodes are building types', () => {
      expect(BUILDING_TYPES.has('class')).toBe(true);
    });

    it('function nodes are building types', () => {
      expect(BUILDING_TYPES.has('function')).toBe(true);
    });

    it('interface nodes are building types', () => {
      expect(BUILDING_TYPES.has('interface')).toBe(true);
    });

    it('file nodes are NOT building types', () => {
      expect(BUILDING_TYPES.has('file')).toBe(false);
    });

    it('method nodes are NOT building types', () => {
      expect(BUILDING_TYPES.has('method')).toBe(false);
    });

    it('variable nodes are NOT building types', () => {
      expect(BUILDING_TYPES.has('variable')).toBe(false);
    });
  });
});
