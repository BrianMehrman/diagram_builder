import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFocusEscape } from './useFocusEscape';
import { useCanvasStore } from '../store';

beforeEach(() => {
  useCanvasStore.getState().reset();
});

describe('useFocusEscape', () => {
  it('clears selectedNodeId on Escape key press', () => {
    useCanvasStore.getState().selectNode('node-1');
    renderHook(() => useFocusEscape());
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(useCanvasStore.getState().selectedNodeId).toBeNull();
  });

  it('clears showRadialOverlay on Escape key press', () => {
    useCanvasStore.getState().selectNode('node-1');
    useCanvasStore.getState().toggleRadialOverlay();
    renderHook(() => useFocusEscape());
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(useCanvasStore.getState().showRadialOverlay).toBe(false);
  });

  it('does not affect state for other key presses', () => {
    useCanvasStore.getState().selectNode('node-1');
    renderHook(() => useFocusEscape());
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(useCanvasStore.getState().selectedNodeId).toBe('node-1');
  });

  it('removes the event listener on unmount', () => {
    useCanvasStore.getState().selectNode('node-1');
    const { unmount } = renderHook(() => useFocusEscape());
    unmount();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    // After unmount, the listener should be gone — state should be unchanged from before the dispatch
    // We set selectedNodeId above, it should still be 'node-1' after Escape (since hook is unmounted)
    expect(useCanvasStore.getState().selectedNodeId).toBe('node-1');
  });
});
