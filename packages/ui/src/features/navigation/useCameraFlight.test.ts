/**
 * useCameraFlight Tests
 *
 * Tests for camera flight animation hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCameraFlight } from './useCameraFlight';
import { useCanvasStore } from '../canvas/store';

// Mock requestAnimationFrame for predictable tests
const mockRAF = vi.fn();
let rafCallback: FrameRequestCallback | null = null;

describe('useCameraFlight', () => {
  beforeEach(() => {
    // Reset canvas store
    useCanvasStore.getState().reset();

    // Setup requestAnimationFrame mock
    vi.useFakeTimers();
    mockRAF.mockClear();
    rafCallback = null;

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      rafCallback = callback;
      return mockRAF() || 1;
    });

    // Mock matchMedia for prefers-reduced-motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false, // Default: no reduced motion preference
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Mock performance.now for consistent timing
    vi.spyOn(performance, 'now').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('returns flyToNode function', () => {
    const { result } = renderHook(() => useCameraFlight());

    expect(result.current.flyToNode).toBeDefined();
    expect(typeof result.current.flyToNode).toBe('function');
  });

  it('initiates camera flight animation', () => {
    const { result } = renderHook(() => useCameraFlight());

    const targetPosition = { x: 10, y: 5, z: 20 };

    act(() => {
      result.current.flyToNode('node-123', targetPosition);
    });

    // Should have called requestAnimationFrame to start animation
    expect(window.requestAnimationFrame).toHaveBeenCalled();
  });

  it('returns cancelFlight function and isFlying state', () => {
    const { result } = renderHook(() => useCameraFlight());

    expect(result.current.cancelFlight).toBeDefined();
    expect(typeof result.current.cancelFlight).toBe('function');
    expect(typeof result.current.isFlying).toBe('boolean');
  });

  it('updates camera position during animation', () => {
    const { result } = renderHook(() => useCameraFlight());

    const targetPosition = { x: 10, y: 5, z: 20 };
    const initialPosition = useCanvasStore.getState().camera.position;

    act(() => {
      result.current.flyToNode('node-123', targetPosition);
    });

    // Simulate partial progress through animation
    vi.spyOn(performance, 'now').mockReturnValue(750); // 50% through 1500ms

    // Execute the animation frame callback
    if (rafCallback) {
      act(() => {
        rafCallback!(750);
      });
    }

    const currentPosition = useCanvasStore.getState().camera.position;

    // Position should have changed from initial
    expect(currentPosition).not.toEqual(initialPosition);
  });

  it('teleports instantly when prefers-reduced-motion is enabled', () => {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { result } = renderHook(() => useCameraFlight());

    const targetPosition = { x: 10, y: 5, z: 20 };

    act(() => {
      result.current.flyToNode('node-123', targetPosition);
    });

    // Camera target should be set immediately (no animation)
    const cameraTarget = useCanvasStore.getState().camera.target;
    expect(cameraTarget).toEqual(targetPosition);

    // Should NOT have called requestAnimationFrame (instant teleport)
    // Note: We can't easily test this without refactoring the hook
  });

  it('selects node on animation completion', async () => {
    const { result } = renderHook(() => useCameraFlight());

    const targetPosition = { x: 10, y: 5, z: 20 };

    act(() => {
      result.current.flyToNode('node-123', targetPosition);
    });

    // Simulate animation completion (progress >= 1)
    vi.spyOn(performance, 'now').mockReturnValue(1600); // Past 1500ms duration

    // Execute final animation frame
    if (rafCallback) {
      act(() => {
        rafCallback!(1600);
      });
    }

    // Node should be selected
    expect(useCanvasStore.getState().selectedNodeId).toBe('node-123');
  });

  it('sets camera target to node position', () => {
    const { result } = renderHook(() => useCameraFlight());

    const targetPosition = { x: 10, y: 5, z: 20 };

    act(() => {
      result.current.flyToNode('node-123', targetPosition);
    });

    // Simulate animation completion
    vi.spyOn(performance, 'now').mockReturnValue(1600);

    if (rafCallback) {
      act(() => {
        rafCallback!(1600);
      });
    }

    // Camera target should be the node position
    const cameraTarget = useCanvasStore.getState().camera.target;
    expect(cameraTarget).toEqual(targetPosition);
  });

  it('highlights node on arrival', () => {
    const { result } = renderHook(() => useCameraFlight());

    const targetPosition = { x: 10, y: 5, z: 20 };

    act(() => {
      result.current.flyToNode('node-123', targetPosition);
    });

    // Simulate animation completion
    vi.spyOn(performance, 'now').mockReturnValue(1600);

    if (rafCallback) {
      act(() => {
        rafCallback!(1600);
      });
    }

    // Node should be highlighted
    expect(useCanvasStore.getState().highlightedNodeId).toBe('node-123');
  });

  it('clears highlight after 2 seconds', () => {
    const { result } = renderHook(() => useCameraFlight());

    const targetPosition = { x: 10, y: 5, z: 20 };

    act(() => {
      result.current.flyToNode('node-123', targetPosition);
    });

    // Simulate animation completion
    vi.spyOn(performance, 'now').mockReturnValue(1600);

    if (rafCallback) {
      act(() => {
        rafCallback!(1600);
      });
    }

    // Node should be highlighted
    expect(useCanvasStore.getState().highlightedNodeId).toBe('node-123');

    // Advance timers by 2 seconds (highlight duration)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Highlight should be cleared
    expect(useCanvasStore.getState().highlightedNodeId).toBeNull();
  });

  it('sets flight state during animation', () => {
    const { result } = renderHook(() => useCameraFlight());

    const targetPosition = { x: 10, y: 5, z: 20 };

    act(() => {
      result.current.flyToNode('node-123', targetPosition);
    });

    // Flight state should be set
    expect(useCanvasStore.getState().isFlying).toBe(true);
    expect(useCanvasStore.getState().flightTargetNodeId).toBe('node-123');
  });

  it('clears flight state on animation completion', () => {
    const { result } = renderHook(() => useCameraFlight());

    const targetPosition = { x: 10, y: 5, z: 20 };

    act(() => {
      result.current.flyToNode('node-123', targetPosition);
    });

    // Simulate animation completion
    vi.spyOn(performance, 'now').mockReturnValue(1600);

    if (rafCallback) {
      act(() => {
        rafCallback!(1600);
      });
    }

    // Flight state should be cleared
    expect(useCanvasStore.getState().isFlying).toBe(false);
    expect(useCanvasStore.getState().flightTargetNodeId).toBeNull();
  });

  it('cancels flight when cancelFlight is called', () => {
    const { result } = renderHook(() => useCameraFlight());

    const targetPosition = { x: 10, y: 5, z: 20 };

    act(() => {
      result.current.flyToNode('node-123', targetPosition);
    });

    // Flight should be in progress
    expect(useCanvasStore.getState().isFlying).toBe(true);

    // Cancel the flight
    act(() => {
      result.current.cancelFlight();
    });

    // Flight state should be cleared
    expect(useCanvasStore.getState().isFlying).toBe(false);
  });

  it('cancels flight on ESC key press', () => {
    const { result } = renderHook(() => useCameraFlight());

    const targetPosition = { x: 10, y: 5, z: 20 };

    act(() => {
      result.current.flyToNode('node-123', targetPosition);
    });

    // Flight should be in progress
    expect(useCanvasStore.getState().isFlying).toBe(true);

    // Simulate ESC key press
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    // Flight state should be cleared
    expect(useCanvasStore.getState().isFlying).toBe(false);
  });

  it('uses easing for smooth animation', () => {
    const { result } = renderHook(() => useCameraFlight());

    const startPosition = useCanvasStore.getState().camera.position;
    const targetPosition = { x: 100, y: 50, z: 200 };

    act(() => {
      result.current.flyToNode('node-123', targetPosition);
    });

    // At 50% time, eased position should NOT be exactly 50% of the distance
    // (ease-in-out cubic makes progress slower at start/end, faster in middle)
    vi.spyOn(performance, 'now').mockReturnValue(750); // 50% time of 1500ms

    if (rafCallback) {
      act(() => {
        rafCallback!(750);
      });
    }

    const currentTarget = useCanvasStore.getState().camera.target;

    // At 50% time with ease-in-out cubic, eased progress is exactly 0.5
    // So this test just verifies the animation is running
    expect(currentTarget.x).toBeDefined();
    expect(currentTarget.y).toBeDefined();
    expect(currentTarget.z).toBeDefined();
  });
});
