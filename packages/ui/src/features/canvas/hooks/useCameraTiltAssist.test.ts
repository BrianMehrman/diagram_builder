/**
 * useCameraTiltAssist Tests
 *
 * Tests the camera tilt-assist hook:
 * - easeOutCubic easing function
 * - Tilt triggers on new node selection
 * - Preference gating (cameraTiltAssist)
 * - View mode gating (city only)
 * - Flight gating (skip during camera flight)
 * - Cancellation on user camera movement
 * - Reduced motion support
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCanvasStore } from '../store';
import {
  useCameraTiltAssist,
  easeOutCubic,
  TILT_DURATION_MS,
  TILT_TARGET_Y_OFFSET,
} from './useCameraTiltAssist';

// Mock requestAnimationFrame / cancelAnimationFrame
let rafCallbacks: Array<(time: number) => void> = [];
let rafId = 0;

// Provide matchMedia polyfill for jsdom
function mockMatchMedia(matches = false): void {
  window.matchMedia = vi.fn().mockImplementation(() => ({
    matches,
    media: '',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

beforeEach(() => {
  rafCallbacks = [];
  rafId = 0;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    rafCallbacks.push(cb);
    return ++rafId;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {
    rafCallbacks = [];
  });
  vi.spyOn(performance, 'now').mockReturnValue(0);
  mockMatchMedia(false);
});

afterEach(() => {
  vi.restoreAllMocks();
  useCanvasStore.getState().reset();
});

// ── easeOutCubic ──────────────────────────────────────────────────
describe('easeOutCubic', () => {
  it('returns 0 at t=0', () => {
    expect(easeOutCubic(0)).toBe(0);
  });

  it('returns 1 at t=1', () => {
    expect(easeOutCubic(1)).toBe(1);
  });

  it('returns 0.5 at t≈0.206 (cubic ease-out)', () => {
    // ease-out cubic: 1 - (1 - t)^3 = 0.5  =>  (1 - t)^3 = 0.5  =>  t = 1 - 0.5^(1/3) ≈ 0.2063
    const t = 1 - Math.pow(0.5, 1 / 3);
    expect(easeOutCubic(t)).toBeCloseTo(0.5, 5);
  });

  it('is monotonically increasing', () => {
    let prev = 0;
    for (let i = 1; i <= 10; i++) {
      const val = easeOutCubic(i / 10);
      expect(val).toBeGreaterThan(prev);
      prev = val;
    }
  });
});

// ── Hook behavior ─────────────────────────────────────────────────
describe('useCameraTiltAssist', () => {
  it('triggers tilt on new node selection', () => {
    renderHook(() => useCameraTiltAssist());

    const initialTargetY = useCanvasStore.getState().camera.target.y;

    // Select a node
    act(() => {
      useCanvasStore.getState().selectNode('node-1');
    });

    // RAF should have been called
    expect(rafCallbacks.length).toBe(1);

    // Simulate animation completion (advance time to end)
    vi.spyOn(performance, 'now').mockReturnValue(TILT_DURATION_MS + 10);
    act(() => {
      rafCallbacks[0]!(TILT_DURATION_MS + 10);
    });

    const finalTargetY = useCanvasStore.getState().camera.target.y;
    expect(finalTargetY).toBeCloseTo(initialTargetY + TILT_TARGET_Y_OFFSET, 3);
  });

  it('does not tilt on deselection', () => {
    renderHook(() => useCameraTiltAssist());

    // First select
    act(() => {
      useCanvasStore.getState().selectNode('node-1');
    });
    rafCallbacks = [];

    // Deselect
    act(() => {
      useCanvasStore.getState().selectNode(null);
    });

    expect(rafCallbacks.length).toBe(0);
  });

  it('does not tilt when cameraTiltAssist is disabled', () => {
    renderHook(() => useCameraTiltAssist());

    act(() => {
      useCanvasStore.getState().toggleCameraTiltAssist();
    });

    act(() => {
      useCanvasStore.getState().selectNode('node-1');
    });

    expect(rafCallbacks.length).toBe(0);
  });

  it('does not tilt when not in city view mode', () => {
    renderHook(() => useCameraTiltAssist());

    act(() => {
      useCanvasStore.getState().setViewMode('building', 'some-file');
    });

    act(() => {
      useCanvasStore.getState().selectNode('node-1');
    });

    expect(rafCallbacks.length).toBe(0);
  });

  it('does not tilt during a camera flight', () => {
    renderHook(() => useCameraTiltAssist());

    act(() => {
      useCanvasStore.getState().setFlightState(true, 'target-node');
    });

    act(() => {
      useCanvasStore.getState().selectNode('node-1');
    });

    expect(rafCallbacks.length).toBe(0);
  });

  it('cancels tilt when user moves camera during animation', () => {
    renderHook(() => useCameraTiltAssist());

    const initialTargetY = useCanvasStore.getState().camera.target.y;

    act(() => {
      useCanvasStore.getState().selectNode('node-1');
    });

    expect(rafCallbacks.length).toBe(1);

    // Simulate user moving the camera
    act(() => {
      useCanvasStore.getState().setCameraPosition({ x: 100, y: 100, z: 100 });
    });

    // Run the animation frame — it should detect drift and bail
    vi.spyOn(performance, 'now').mockReturnValue(100);
    act(() => {
      rafCallbacks[0]!(100);
    });

    // Target should NOT have moved to full offset (animation cancelled)
    const finalTargetY = useCanvasStore.getState().camera.target.y;
    expect(finalTargetY).toBe(initialTargetY);
  });

  it('uses instant tilt when prefers-reduced-motion is set', () => {
    mockMatchMedia(true);

    renderHook(() => useCameraTiltAssist());

    const initialTargetY = useCanvasStore.getState().camera.target.y;

    act(() => {
      useCanvasStore.getState().selectNode('node-1');
    });

    // Should NOT use RAF (instant)
    expect(rafCallbacks.length).toBe(0);

    // Target should be at full offset immediately
    const finalTargetY = useCanvasStore.getState().camera.target.y;
    expect(finalTargetY).toBeCloseTo(initialTargetY + TILT_TARGET_Y_OFFSET, 3);
  });

  it('does not re-tilt when selecting the same node', () => {
    renderHook(() => useCameraTiltAssist());

    act(() => {
      useCanvasStore.getState().selectNode('node-1');
    });

    expect(rafCallbacks.length).toBe(1);
    rafCallbacks = [];

    // Select same node again (deselect + reselect won't happen in practice,
    // but simulating the same id)
    act(() => {
      useCanvasStore.getState().selectNode('node-1');
    });

    expect(rafCallbacks.length).toBe(0);
  });
});

// ── Store: cameraTiltAssist preference ────────────────────────────
describe('cameraTiltAssist store preference', () => {
  it('defaults to true', () => {
    expect(useCanvasStore.getState().citySettings.cameraTiltAssist).toBe(true);
  });

  it('toggles off and on', () => {
    useCanvasStore.getState().toggleCameraTiltAssist();
    expect(useCanvasStore.getState().citySettings.cameraTiltAssist).toBe(false);

    useCanvasStore.getState().toggleCameraTiltAssist();
    expect(useCanvasStore.getState().citySettings.cameraTiltAssist).toBe(true);
  });

  it('resets to true on store reset', () => {
    useCanvasStore.getState().toggleCameraTiltAssist();
    expect(useCanvasStore.getState().citySettings.cameraTiltAssist).toBe(false);

    useCanvasStore.getState().reset();
    expect(useCanvasStore.getState().citySettings.cameraTiltAssist).toBe(true);
  });
});
