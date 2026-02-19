/**
 * OverheadWire Utility Tests (Story 11-11, 11-13)
 *
 * Tests cover the pure arc-height, visibility, color, and material-type
 * utilities used by the component.
 * R3F rendering is not tested here (no jsdom dependency).
 */

import { describe, it, expect } from 'vitest';
import {
  calculateWireArcPeak,
  isWireVisible,
  getWireColor,
  getWireMaterialType,
  WIRE_BASE_OFFSET,
  WIRE_SCALE_FACTOR,
  WIRE_MAX_PEAK,
  WIRE_LOD_MIN,
  WIRE_COLORS,
  WIRE_DEFAULT_COLOR,
  WIRE_DASHED_TYPES,
  WIRE_DASH_SIZE,
  WIRE_GAP_SIZE,
} from '../views/cityViewUtils';

// ── calculateWireArcPeak ──────────────────────────────────────────────────────

describe('calculateWireArcPeak', () => {
  it('arc is above the tallest building by at least WIRE_BASE_OFFSET', () => {
    const srcH = 6;
    const tgtH = 10;
    const peak = calculateWireArcPeak(srcH, tgtH, 0);
    expect(peak).toBeGreaterThanOrEqual(tgtH + WIRE_BASE_OFFSET);
  });

  it('uses the taller building as the rooftop baseline', () => {
    const peak1 = calculateWireArcPeak(5, 15, 0);
    const peak2 = calculateWireArcPeak(15, 5, 0);
    // Symmetric — both should give the same peak for same distance
    expect(peak1).toBe(peak2);
  });

  it('arc height increases with horizontal distance', () => {
    const peakNear = calculateWireArcPeak(5, 5, 10);
    const peakFar  = calculateWireArcPeak(5, 5, 50);
    expect(peakFar).toBeGreaterThan(peakNear);
  });

  it('distance scaling uses WIRE_SCALE_FACTOR', () => {
    const baseH = 10;
    const dist = 20;
    const expected = baseH + WIRE_BASE_OFFSET + dist * WIRE_SCALE_FACTOR;
    expect(calculateWireArcPeak(baseH, baseH, dist)).toBeCloseTo(expected);
  });

  it('caps at WIRE_MAX_PEAK for very long distances', () => {
    const peak = calculateWireArcPeak(0, 0, 10_000);
    expect(peak).toBe(WIRE_MAX_PEAK);
  });

  it('minimum clearance holds when buildings are at ground level (height=0)', () => {
    const peak = calculateWireArcPeak(0, 0, 0);
    expect(peak).toBe(WIRE_BASE_OFFSET);
  });

  it('wire renders above both buildings (peak > max height)', () => {
    const srcH = 8;
    const tgtH = 12;
    const peak = calculateWireArcPeak(srcH, tgtH, 5);
    expect(peak).toBeGreaterThan(srcH);
    expect(peak).toBeGreaterThan(tgtH);
  });

  it('returns a finite positive number', () => {
    const peak = calculateWireArcPeak(3, 7, 25);
    expect(Number.isFinite(peak)).toBe(true);
    expect(peak).toBeGreaterThan(0);
  });
});

// ── isWireVisible ─────────────────────────────────────────────────────────────

describe('isWireVisible', () => {
  it('is hidden at LOD 1 (city far view)', () => {
    expect(isWireVisible(1)).toBe(false);
  });

  it('is hidden at LOD 0', () => {
    expect(isWireVisible(0)).toBe(false);
  });

  it('is visible at LOD 2 (district level)', () => {
    expect(isWireVisible(2)).toBe(true);
  });

  it('is visible at LOD 3', () => {
    expect(isWireVisible(3)).toBe(true);
  });

  it('is visible at LOD 4', () => {
    expect(isWireVisible(4)).toBe(true);
  });

  it('WIRE_LOD_MIN is the exact threshold', () => {
    expect(isWireVisible(WIRE_LOD_MIN - 1)).toBe(false);
    expect(isWireVisible(WIRE_LOD_MIN)).toBe(true);
  });
});

// ── getWireColor ──────────────────────────────────────────────────────────────

describe('getWireColor', () => {
  it('returns the calls color for "calls" edges', () => {
    expect(getWireColor('calls')).toBe(WIRE_COLORS['calls']);
  });

  it('returns the composes color for "composes" edges', () => {
    expect(getWireColor('composes')).toBe(WIRE_COLORS['composes']);
  });

  it('returns WIRE_DEFAULT_COLOR for unknown edge types', () => {
    expect(getWireColor('unknown')).toBe(WIRE_DEFAULT_COLOR);
    expect(getWireColor('')).toBe(WIRE_DEFAULT_COLOR);
  });

  it('calls and composes have different colors', () => {
    expect(WIRE_COLORS['calls']).not.toBe(WIRE_COLORS['composes']);
  });

  it('all WIRE_COLORS values are valid hex strings', () => {
    for (const color of Object.values(WIRE_COLORS)) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('WIRE_DEFAULT_COLOR is a valid hex string', () => {
    expect(WIRE_DEFAULT_COLOR).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

// ── Material type distinction (informational) ─────────────────────────────────

describe('OverheadWire visual distinction from UndergroundPipe', () => {
  it('OverheadWire uses LINE geometry (thin) vs TubeGeometry (thick) for pipes', () => {
    // This test documents the architectural decision:
    // OverheadWire → THREE.Line (thin wire)
    // UndergroundPipe → THREE.TubeGeometry (thick conduit)
    // Both are enforced at component construction time.
    // We assert the color palette differences as a proxy.
    const callsWireColor = getWireColor('calls');
    // Wire is green; pipe for calls/imports is blue-gray (from PIPE_COLORS)
    expect(callsWireColor).toBe('#34d399'); // green
  });
});

// ── getWireMaterialType (Story 11-13) ─────────────────────────────────────────

describe('getWireMaterialType', () => {
  it('returns "solid" for "calls" edges', () => {
    expect(getWireMaterialType('calls')).toBe('solid');
  });

  it('returns "dashed" for "composes" edges', () => {
    expect(getWireMaterialType('composes')).toBe('dashed');
  });

  it('returns "solid" for unknown edge types', () => {
    expect(getWireMaterialType('unknown')).toBe('solid');
    expect(getWireMaterialType('')).toBe('solid');
  });

  it('returns "solid" for "imports" (underground, not overhead)', () => {
    expect(getWireMaterialType('imports')).toBe('solid');
  });

  it('WIRE_DASHED_TYPES contains "composes"', () => {
    expect(WIRE_DASHED_TYPES.has('composes')).toBe(true);
  });

  it('WIRE_DASHED_TYPES does not contain "calls"', () => {
    expect(WIRE_DASHED_TYPES.has('calls')).toBe(false);
  });

  it('calls and composes have different material types', () => {
    expect(getWireMaterialType('calls')).not.toBe(getWireMaterialType('composes'));
  });

  it('WIRE_DASH_SIZE and WIRE_GAP_SIZE are positive numbers', () => {
    expect(WIRE_DASH_SIZE).toBeGreaterThan(0);
    expect(WIRE_GAP_SIZE).toBeGreaterThan(0);
  });

  it('dash size is larger than gap size (more line than gap)', () => {
    expect(WIRE_DASH_SIZE).toBeGreaterThan(WIRE_GAP_SIZE);
  });

  it('is case-insensitive for edge type lookup', () => {
    expect(getWireMaterialType('Composes')).toBe('dashed');
    expect(getWireMaterialType('COMPOSES')).toBe('dashed');
  });
});
