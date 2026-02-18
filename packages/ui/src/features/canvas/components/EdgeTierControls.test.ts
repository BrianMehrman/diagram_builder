/**
 * EdgeTierControls Tests
 *
 * Tests the store integration for edge tier visibility toggles
 * and transit map mode button.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../store';
import type { EdgeTierKey } from '../store';

describe('EdgeTierControls store integration', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  // ── Edge tier visibility ────────────────────────────────────────
  describe('edge tier visibility', () => {
    it('crossDistrict defaults to true', () => {
      expect(useCanvasStore.getState().citySettings.edgeTierVisibility.crossDistrict).toBe(true);
    });

    it('inheritance defaults to true', () => {
      expect(useCanvasStore.getState().citySettings.edgeTierVisibility.inheritance).toBe(true);
    });

    it('toggleEdgeTierVisibility toggles crossDistrict off', () => {
      useCanvasStore.getState().toggleEdgeTierVisibility('crossDistrict');
      expect(useCanvasStore.getState().citySettings.edgeTierVisibility.crossDistrict).toBe(false);
    });

    it('toggleEdgeTierVisibility toggles crossDistrict back on', () => {
      useCanvasStore.getState().toggleEdgeTierVisibility('crossDistrict');
      useCanvasStore.getState().toggleEdgeTierVisibility('crossDistrict');
      expect(useCanvasStore.getState().citySettings.edgeTierVisibility.crossDistrict).toBe(true);
    });

    it('toggles each tier independently', () => {
      useCanvasStore.getState().toggleEdgeTierVisibility('crossDistrict');
      const { edgeTierVisibility } = useCanvasStore.getState().citySettings;
      expect(edgeTierVisibility.crossDistrict).toBe(false);
      expect(edgeTierVisibility.inheritance).toBe(true);
    });

    it('resets edge tiers to defaults on reset()', () => {
      useCanvasStore.getState().toggleEdgeTierVisibility('crossDistrict');
      useCanvasStore.getState().toggleEdgeTierVisibility('inheritance');
      useCanvasStore.getState().reset();
      const { edgeTierVisibility } = useCanvasStore.getState().citySettings;
      expect(edgeTierVisibility.crossDistrict).toBe(true);
      expect(edgeTierVisibility.inheritance).toBe(true);
    });
  });

  // ── Transit map mode ────────────────────────────────────────────
  describe('transit map mode', () => {
    it('transitMapMode defaults to false', () => {
      expect(useCanvasStore.getState().citySettings.transitMapMode).toBe(false);
    });

    it('toggleTransitMapMode toggles on', () => {
      useCanvasStore.getState().toggleTransitMapMode();
      expect(useCanvasStore.getState().citySettings.transitMapMode).toBe(true);
    });

    it('toggleTransitMapMode toggles off again', () => {
      useCanvasStore.getState().toggleTransitMapMode();
      useCanvasStore.getState().toggleTransitMapMode();
      expect(useCanvasStore.getState().citySettings.transitMapMode).toBe(false);
    });

    it('resets transitMapMode to false on reset()', () => {
      useCanvasStore.getState().toggleTransitMapMode();
      useCanvasStore.getState().reset();
      expect(useCanvasStore.getState().citySettings.transitMapMode).toBe(false);
    });

    it('transit map mode is independent of edge tier toggles', () => {
      useCanvasStore.getState().toggleTransitMapMode();
      useCanvasStore.getState().toggleEdgeTierVisibility('crossDistrict');
      expect(useCanvasStore.getState().citySettings.transitMapMode).toBe(true);
      expect(useCanvasStore.getState().citySettings.edgeTierVisibility.crossDistrict).toBe(false);
    });
  });

  // ── View mode gating ────────────────────────────────────────────
  describe('view mode gating', () => {
    it('only shows in city view mode', () => {
      expect(useCanvasStore.getState().viewMode).toBe('city');
    });

    it('does not show in building view mode', () => {
      useCanvasStore.getState().setViewMode('building');
      expect(useCanvasStore.getState().viewMode).toBe('building');
    });

    it('preserves state when switching view modes', () => {
      useCanvasStore.getState().toggleEdgeTierVisibility('inheritance');
      useCanvasStore.getState().toggleTransitMapMode();
      useCanvasStore.getState().setViewMode('building');
      useCanvasStore.getState().setViewMode('city');
      expect(useCanvasStore.getState().citySettings.edgeTierVisibility.inheritance).toBe(false);
      expect(useCanvasStore.getState().citySettings.transitMapMode).toBe(true);
    });
  });
});
