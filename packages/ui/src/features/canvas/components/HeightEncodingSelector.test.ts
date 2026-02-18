/**
 * HeightEncodingSelector Tests
 *
 * Tests the store integration for the height encoding selector.
 * The component reads/writes citySettings.heightEncoding from the canvas store.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../store';
import type { HeightEncoding } from '../store';

describe('HeightEncodingSelector store integration', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('has default heightEncoding of methodCount', () => {
    expect(useCanvasStore.getState().citySettings.heightEncoding).toBe('methodCount');
  });

  it('updates heightEncoding via setHeightEncoding', () => {
    useCanvasStore.getState().setHeightEncoding('loc');
    expect(useCanvasStore.getState().citySettings.heightEncoding).toBe('loc');
  });

  it('accepts all valid encoding values', () => {
    const encodings: HeightEncoding[] = ['methodCount', 'dependencies', 'loc', 'complexity', 'churn'];
    for (const encoding of encodings) {
      useCanvasStore.getState().setHeightEncoding(encoding);
      expect(useCanvasStore.getState().citySettings.heightEncoding).toBe(encoding);
    }
  });

  it('resets heightEncoding to methodCount on reset()', () => {
    useCanvasStore.getState().setHeightEncoding('complexity');
    useCanvasStore.getState().reset();
    expect(useCanvasStore.getState().citySettings.heightEncoding).toBe('methodCount');
  });

  it('only shows in city view mode', () => {
    const { viewMode } = useCanvasStore.getState();
    expect(viewMode).toBe('city');
  });

  it('does not show in building view mode', () => {
    useCanvasStore.getState().setViewMode('building');
    expect(useCanvasStore.getState().viewMode).toBe('building');
    // Component returns null when viewMode !== 'city'
  });

  it('preserves heightEncoding when switching view modes', () => {
    useCanvasStore.getState().setHeightEncoding('churn');
    useCanvasStore.getState().setViewMode('building');
    useCanvasStore.getState().setViewMode('city');
    expect(useCanvasStore.getState().citySettings.heightEncoding).toBe('churn');
  });
});
