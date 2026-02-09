/**
 * X-Ray Mode Tests
 *
 * Tests for x-ray state management and pure utility functions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from './store';
import {
  computeXRayWallOpacity,
  shouldShowXRayDetail,
} from './xrayUtils';

describe('X-Ray store state', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('should default isXRayMode to false', () => {
    expect(useCanvasStore.getState().isXRayMode).toBe(false);
  });

  it('should default xrayOpacity to 0.05', () => {
    expect(useCanvasStore.getState().xrayOpacity).toBe(0.05);
  });

  it('should toggle x-ray mode on', () => {
    useCanvasStore.getState().toggleXRay();
    expect(useCanvasStore.getState().isXRayMode).toBe(true);
  });

  it('should toggle x-ray mode off', () => {
    useCanvasStore.getState().toggleXRay();
    useCanvasStore.getState().toggleXRay();
    expect(useCanvasStore.getState().isXRayMode).toBe(false);
  });

  it('should reset x-ray mode on full reset', () => {
    useCanvasStore.getState().toggleXRay();
    useCanvasStore.getState().reset();
    expect(useCanvasStore.getState().isXRayMode).toBe(false);
  });
});

describe('computeXRayWallOpacity', () => {
  it('should return normal opacity when x-ray is off', () => {
    expect(computeXRayWallOpacity(false, 0.05)).toBe(1);
  });

  it('should return xrayOpacity when x-ray is on', () => {
    expect(computeXRayWallOpacity(true, 0.05)).toBe(0.05);
  });

  it('should use custom opacity value', () => {
    expect(computeXRayWallOpacity(true, 0.1)).toBe(0.1);
  });
});

describe('shouldShowXRayDetail', () => {
  it('should return false when x-ray is off', () => {
    expect(shouldShowXRayDetail(false, 10, 30)).toBe(false);
  });

  it('should return true when within detail distance', () => {
    expect(shouldShowXRayDetail(true, 10, 30)).toBe(true);
  });

  it('should return false when beyond detail distance', () => {
    expect(shouldShowXRayDetail(true, 50, 30)).toBe(false);
  });

  it('should return true at exact boundary', () => {
    expect(shouldShowXRayDetail(true, 30, 30)).toBe(true);
  });
});
