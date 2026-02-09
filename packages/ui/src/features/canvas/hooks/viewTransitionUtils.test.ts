/**
 * View Transition Utility Tests
 *
 * Tests for pure transition math: easing, opacity calculations, progress stepping.
 */

import { describe, it, expect } from 'vitest';
import {
  easeInOutCubic,
  computeWallOpacity,
  computeMembraneOpacity,
  computeOrganelleOpacity,
  stepProgress,
} from './viewTransitionUtils';

describe('viewTransitionUtils', () => {
  describe('easeInOutCubic', () => {
    it('should return 0 at t=0', () => {
      expect(easeInOutCubic(0)).toBe(0);
    });

    it('should return 1 at t=1', () => {
      expect(easeInOutCubic(1)).toBe(1);
    });

    it('should return 0.5 at t=0.5', () => {
      expect(easeInOutCubic(0.5)).toBe(0.5);
    });

    it('should ease slowly at start', () => {
      // First quarter should have small progress
      const earlyValue = easeInOutCubic(0.25);
      expect(earlyValue).toBeLessThan(0.25);
    });

    it('should ease slowly at end', () => {
      // Last quarter should be close to 1
      const lateValue = easeInOutCubic(0.75);
      expect(lateValue).toBeGreaterThan(0.75);
    });

    it('should be monotonically increasing', () => {
      let prev = 0;
      for (let i = 1; i <= 10; i++) {
        const t = i / 10;
        const val = easeInOutCubic(t);
        expect(val).toBeGreaterThanOrEqual(prev);
        prev = val;
      }
    });
  });

  describe('computeWallOpacity', () => {
    it('should return full opacity at progress 0', () => {
      expect(computeWallOpacity(0)).toBeCloseTo(0.08);
    });

    it('should return 0 at progress 1', () => {
      expect(computeWallOpacity(1)).toBe(0);
    });

    it('should decrease as progress increases', () => {
      const mid = computeWallOpacity(0.5);
      expect(mid).toBeLessThan(0.08);
      expect(mid).toBeGreaterThan(0);
    });
  });

  describe('computeMembraneOpacity', () => {
    it('should return 0 at progress 0', () => {
      expect(computeMembraneOpacity(0)).toBe(0);
    });

    it('should return 0.1 at progress 1', () => {
      expect(computeMembraneOpacity(1)).toBeCloseTo(0.1);
    });

    it('should increase as progress increases', () => {
      const mid = computeMembraneOpacity(0.5);
      expect(mid).toBeGreaterThan(0);
      expect(mid).toBeLessThan(0.1);
    });
  });

  describe('computeOrganelleOpacity', () => {
    it('should return 0 at progress 0', () => {
      expect(computeOrganelleOpacity(0)).toBe(0);
    });

    it('should return near 1 at progress 1', () => {
      expect(computeOrganelleOpacity(1)).toBeCloseTo(0.85);
    });

    it('should increase with progress', () => {
      const early = computeOrganelleOpacity(0.2);
      const late = computeOrganelleOpacity(0.8);
      expect(late).toBeGreaterThan(early);
    });
  });

  describe('stepProgress', () => {
    it('should move toward target when below', () => {
      const result = stepProgress(0, 1, 0.016, 0.5);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(1);
    });

    it('should move toward target when above', () => {
      const result = stepProgress(1, 0, 0.016, 0.5);
      expect(result).toBeLessThan(1);
      expect(result).toBeGreaterThan(0);
    });

    it('should not overshoot target going forward', () => {
      const result = stepProgress(0.99, 1, 1.0, 0.5);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should not overshoot target going backward', () => {
      const result = stepProgress(0.01, 0, 1.0, 0.5);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should reach target in reasonable time', () => {
      let progress = 0;
      const duration = 0.5;
      const dt = 0.016; // ~60fps
      let frames = 0;
      while (progress < 0.99 && frames < 100) {
        progress = stepProgress(progress, 1, dt, duration);
        frames++;
      }
      // Should finish within ~35 frames at 60fps for 0.5s duration
      expect(frames).toBeLessThan(40);
    });

    it('should snap to target when very close', () => {
      const result = stepProgress(0.995, 1, 0.016, 0.5);
      expect(result).toBe(1);
    });
  });
});
