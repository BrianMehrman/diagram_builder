/**
 * useCamera Hook Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCamera } from './useCamera';
import { useCanvasStore } from '../store';

describe('useCamera', () => {
  beforeEach(() => {
    // Reset store before each test
    useCanvasStore.getState().reset();
  });

  it('returns current camera state', () => {
    const { result } = renderHook(() => useCamera());

    expect(result.current.position).toEqual({ x: 0, y: 5, z: 10 });
    expect(result.current.target).toEqual({ x: 0, y: 0, z: 0 });
    expect(result.current.zoom).toBe(1);
  });

  it('sets camera position', () => {
    const { result } = renderHook(() => useCamera());

    act(() => {
      result.current.setPosition({ x: 10, y: 10, z: 10 });
    });

    expect(result.current.position).toEqual({ x: 10, y: 10, z: 10 });
  });

  it('sets camera target', () => {
    const { result } = renderHook(() => useCamera());

    act(() => {
      result.current.setTarget({ x: 5, y: 5, z: 5 });
    });

    expect(result.current.target).toEqual({ x: 5, y: 5, z: 5 });
  });

  it('sets zoom level', () => {
    const { result } = renderHook(() => useCamera());

    act(() => {
      result.current.setZoom(2);
    });

    expect(result.current.zoom).toBe(2);
  });

  it('looks at target', () => {
    const { result } = renderHook(() => useCamera());

    act(() => {
      result.current.lookAt({ x: 3, y: 3, z: 3 });
    });

    expect(result.current.target).toEqual({ x: 3, y: 3, z: 3 });
  });

  it('moves to position', () => {
    const { result } = renderHook(() => useCamera());

    act(() => {
      result.current.moveTo({ x: 15, y: 15, z: 15 });
    });

    expect(result.current.position).toEqual({ x: 15, y: 15, z: 15 });
  });

  it('moves to position and target', () => {
    const { result } = renderHook(() => useCamera());

    act(() => {
      result.current.moveTo(
        { x: 15, y: 15, z: 15 },
        { x: 5, y: 5, z: 5 }
      );
    });

    expect(result.current.position).toEqual({ x: 15, y: 15, z: 15 });
    expect(result.current.target).toEqual({ x: 5, y: 5, z: 5 });
  });

  it('resets camera', () => {
    const { result } = renderHook(() => useCamera());

    act(() => {
      result.current.setPosition({ x: 100, y: 100, z: 100 });
      result.current.reset();
    });

    expect(result.current.position).toEqual({ x: 0, y: 5, z: 10 });
    expect(result.current.target).toEqual({ x: 0, y: 0, z: 0 });
    expect(result.current.zoom).toBe(1);
  });
});
