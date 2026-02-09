/**
 * DensitySlider Tests
 *
 * Tests the store integration for the density slider.
 * The component reads/writes layoutDensity from the canvas store.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../store';

describe('DensitySlider store integration', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('has default layoutDensity of 1.0', () => {
    expect(useCanvasStore.getState().layoutDensity).toBe(1.0);
  });

  it('updates layoutDensity via setLayoutDensity', () => {
    useCanvasStore.getState().setLayoutDensity(0.5);
    expect(useCanvasStore.getState().layoutDensity).toBe(0.5);
  });

  it('allows density values below 1.0 (dense)', () => {
    useCanvasStore.getState().setLayoutDensity(0.2);
    expect(useCanvasStore.getState().layoutDensity).toBe(0.2);
  });

  it('allows density values above 1.0 (spread)', () => {
    useCanvasStore.getState().setLayoutDensity(2.0);
    expect(useCanvasStore.getState().layoutDensity).toBe(2.0);
  });

  it('resets layoutDensity to 1.0 on reset()', () => {
    useCanvasStore.getState().setLayoutDensity(0.3);
    useCanvasStore.getState().reset();
    expect(useCanvasStore.getState().layoutDensity).toBe(1.0);
  });
});
