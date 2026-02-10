/**
 * LayerToggle Tests
 *
 * Tests the store integration for layer visibility toggling.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../store';

describe('LayerToggle store integration', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('has default visibleLayers with both true', () => {
    const { visibleLayers } = useCanvasStore.getState();
    expect(visibleLayers.aboveGround).toBe(true);
    expect(visibleLayers.underground).toBe(true);
  });

  it('toggleLayer("aboveGround") toggles above-ground visibility', () => {
    useCanvasStore.getState().toggleLayer('aboveGround');
    expect(useCanvasStore.getState().visibleLayers.aboveGround).toBe(false);
    expect(useCanvasStore.getState().visibleLayers.underground).toBe(true);

    useCanvasStore.getState().toggleLayer('aboveGround');
    expect(useCanvasStore.getState().visibleLayers.aboveGround).toBe(true);
  });

  it('toggleLayer("underground") toggles underground visibility', () => {
    useCanvasStore.getState().toggleLayer('underground');
    expect(useCanvasStore.getState().visibleLayers.underground).toBe(false);
    expect(useCanvasStore.getState().visibleLayers.aboveGround).toBe(true);

    useCanvasStore.getState().toggleLayer('underground');
    expect(useCanvasStore.getState().visibleLayers.underground).toBe(true);
  });

  it('toggleLayer("underground") syncs with isUndergroundMode', () => {
    expect(useCanvasStore.getState().isUndergroundMode).toBe(false);

    useCanvasStore.getState().toggleLayer('underground');
    expect(useCanvasStore.getState().isUndergroundMode).toBe(false);

    useCanvasStore.getState().toggleLayer('underground');
    expect(useCanvasStore.getState().isUndergroundMode).toBe(true);
  });

  it('toggleLayer("aboveGround") does not affect isUndergroundMode', () => {
    useCanvasStore.getState().toggleLayer('aboveGround');
    expect(useCanvasStore.getState().isUndergroundMode).toBe(false);
  });

  it('both layers can be toggled independently', () => {
    useCanvasStore.getState().toggleLayer('aboveGround');
    useCanvasStore.getState().toggleLayer('underground');

    const { visibleLayers } = useCanvasStore.getState();
    expect(visibleLayers.aboveGround).toBe(false);
    expect(visibleLayers.underground).toBe(false);
  });

  it('resets visibleLayers to defaults on reset()', () => {
    useCanvasStore.getState().toggleLayer('aboveGround');
    useCanvasStore.getState().toggleLayer('underground');
    useCanvasStore.getState().reset();

    const { visibleLayers } = useCanvasStore.getState();
    expect(visibleLayers.aboveGround).toBe(true);
    expect(visibleLayers.underground).toBe(true);
  });
});
