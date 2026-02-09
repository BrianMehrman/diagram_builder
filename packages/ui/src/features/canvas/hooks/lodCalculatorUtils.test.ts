/**
 * LOD Calculator Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  calculateLodFromDistance,
  calculateLodWithHysteresis,
  cameraDistanceToOrigin,
  LOD_THRESHOLDS,
  HYSTERESIS_FACTOR,
} from './lodCalculatorUtils';

describe('cameraDistanceToOrigin', () => {
  it('returns 0 at origin', () => {
    expect(cameraDistanceToOrigin(0, 0, 0)).toBe(0);
  });

  it('calculates euclidean distance', () => {
    expect(cameraDistanceToOrigin(3, 4, 0)).toBe(5);
  });

  it('works in 3D', () => {
    const dist = cameraDistanceToOrigin(1, 2, 2);
    expect(dist).toBe(3);
  });
});

describe('calculateLodFromDistance', () => {
  it('returns LOD 4 (street) at very close distance', () => {
    expect(calculateLodFromDistance(10)).toBe(4);
    expect(calculateLodFromDistance(0)).toBe(4);
  });

  it('returns LOD 4 at the street threshold', () => {
    expect(calculateLodFromDistance(LOD_THRESHOLDS.street)).toBe(4);
  });

  it('returns LOD 3 (neighborhood) at medium-close distance', () => {
    expect(calculateLodFromDistance(40)).toBe(3);
    expect(calculateLodFromDistance(LOD_THRESHOLDS.street + 1)).toBe(3);
  });

  it('returns LOD 3 at the neighborhood threshold', () => {
    expect(calculateLodFromDistance(LOD_THRESHOLDS.neighborhood)).toBe(3);
  });

  it('returns LOD 2 (district) at medium distance', () => {
    expect(calculateLodFromDistance(80)).toBe(2);
    expect(calculateLodFromDistance(LOD_THRESHOLDS.neighborhood + 1)).toBe(2);
  });

  it('returns LOD 2 at the district threshold', () => {
    expect(calculateLodFromDistance(LOD_THRESHOLDS.district)).toBe(2);
  });

  it('returns LOD 1 (city) at far distance', () => {
    expect(calculateLodFromDistance(200)).toBe(1);
    expect(calculateLodFromDistance(LOD_THRESHOLDS.district + 1)).toBe(1);
  });
});

describe('calculateLodWithHysteresis', () => {
  describe('zooming in (higher LOD)', () => {
    it('transitions immediately when zooming in', () => {
      // At LOD 1, move close enough for LOD 2
      expect(calculateLodWithHysteresis(100, 1)).toBe(2);
    });

    it('transitions immediately from LOD 2 to LOD 3', () => {
      expect(calculateLodWithHysteresis(40, 2)).toBe(3);
    });

    it('transitions immediately from LOD 1 to LOD 4', () => {
      expect(calculateLodWithHysteresis(10, 1)).toBe(4);
    });
  });

  describe('zooming out (lower LOD)', () => {
    it('stays at current LOD within hysteresis zone', () => {
      // LOD 2 activates at district threshold (120)
      // When at LOD 2, zooming out slightly past 120 should NOT drop to LOD 1
      const buffer = LOD_THRESHOLDS.district * HYSTERESIS_FACTOR;
      const justPastThreshold = LOD_THRESHOLDS.district + buffer * 0.5;
      expect(calculateLodWithHysteresis(justPastThreshold, 2)).toBe(2);
    });

    it('drops LOD when past hysteresis buffer', () => {
      const buffer = LOD_THRESHOLDS.district * HYSTERESIS_FACTOR;
      const wellPastThreshold = LOD_THRESHOLDS.district + buffer + 1;
      expect(calculateLodWithHysteresis(wellPastThreshold, 2)).toBe(1);
    });

    it('stays at LOD 3 within neighborhood hysteresis zone', () => {
      const buffer = LOD_THRESHOLDS.neighborhood * HYSTERESIS_FACTOR;
      const justPast = LOD_THRESHOLDS.neighborhood + buffer * 0.5;
      expect(calculateLodWithHysteresis(justPast, 3)).toBe(3);
    });

    it('drops from LOD 3 to LOD 2 past hysteresis', () => {
      const buffer = LOD_THRESHOLDS.neighborhood * HYSTERESIS_FACTOR;
      const wellPast = LOD_THRESHOLDS.neighborhood + buffer + 1;
      expect(calculateLodWithHysteresis(wellPast, 3)).toBe(2);
    });

    it('stays at LOD 4 within street hysteresis zone', () => {
      const buffer = LOD_THRESHOLDS.street * HYSTERESIS_FACTOR;
      const justPast = LOD_THRESHOLDS.street + buffer * 0.5;
      expect(calculateLodWithHysteresis(justPast, 4)).toBe(4);
    });
  });

  describe('stable distance', () => {
    it('stays at same LOD when distance matches', () => {
      expect(calculateLodWithHysteresis(200, 1)).toBe(1);
      expect(calculateLodWithHysteresis(80, 2)).toBe(2);
      expect(calculateLodWithHysteresis(40, 3)).toBe(3);
      expect(calculateLodWithHysteresis(10, 4)).toBe(4);
    });
  });
});
