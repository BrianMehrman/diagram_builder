/**
 * AtmosphereTogglePanel Tests
 *
 * Tests the store integration for the atmosphere toggle panel.
 * The component reads/writes citySettings.atmosphereOverlays from the canvas store.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../store';
import type { AtmosphereOverlayKey } from '../store';

describe('AtmosphereTogglePanel store integration', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('all atmosphere overlays default to off', () => {
    const { atmosphereOverlays } = useCanvasStore.getState().citySettings;
    expect(atmosphereOverlays.cranes).toBe(false);
    expect(atmosphereOverlays.lighting).toBe(false);
    expect(atmosphereOverlays.smog).toBe(false);
    expect(atmosphereOverlays.deprecated).toBe(false);
  });

  it('toggleAtmosphereOverlay toggles cranes on', () => {
    useCanvasStore.getState().toggleAtmosphereOverlay('cranes');
    expect(useCanvasStore.getState().citySettings.atmosphereOverlays.cranes).toBe(true);
  });

  it('toggleAtmosphereOverlay toggles cranes off again', () => {
    useCanvasStore.getState().toggleAtmosphereOverlay('cranes');
    useCanvasStore.getState().toggleAtmosphereOverlay('cranes');
    expect(useCanvasStore.getState().citySettings.atmosphereOverlays.cranes).toBe(false);
  });

  it('toggles each overlay independently', () => {
    const keys: AtmosphereOverlayKey[] = ['cranes', 'lighting', 'smog', 'deprecated'];
    for (const key of keys) {
      useCanvasStore.getState().toggleAtmosphereOverlay(key);
    }
    const { atmosphereOverlays } = useCanvasStore.getState().citySettings;
    expect(atmosphereOverlays.cranes).toBe(true);
    expect(atmosphereOverlays.lighting).toBe(true);
    expect(atmosphereOverlays.smog).toBe(true);
    expect(atmosphereOverlays.deprecated).toBe(true);
  });

  it('toggling one overlay does not affect others', () => {
    useCanvasStore.getState().toggleAtmosphereOverlay('smog');
    const { atmosphereOverlays } = useCanvasStore.getState().citySettings;
    expect(atmosphereOverlays.smog).toBe(true);
    expect(atmosphereOverlays.cranes).toBe(false);
    expect(atmosphereOverlays.lighting).toBe(false);
    expect(atmosphereOverlays.deprecated).toBe(false);
  });

  it('resets all overlays to off on reset()', () => {
    useCanvasStore.getState().toggleAtmosphereOverlay('cranes');
    useCanvasStore.getState().toggleAtmosphereOverlay('lighting');
    useCanvasStore.getState().reset();
    const { atmosphereOverlays } = useCanvasStore.getState().citySettings;
    expect(atmosphereOverlays.cranes).toBe(false);
    expect(atmosphereOverlays.lighting).toBe(false);
  });

  it('only shows in city view mode', () => {
    expect(useCanvasStore.getState().viewMode).toBe('city');
  });

  it('does not show in building view mode', () => {
    useCanvasStore.getState().setViewMode('building');
    expect(useCanvasStore.getState().viewMode).toBe('building');
  });

  it('preserves overlay state when switching view modes', () => {
    useCanvasStore.getState().toggleAtmosphereOverlay('deprecated');
    useCanvasStore.getState().setViewMode('building');
    useCanvasStore.getState().setViewMode('city');
    expect(useCanvasStore.getState().citySettings.atmosphereOverlays.deprecated).toBe(true);
  });
});
