import { describe, it, expect } from 'vitest';
import {
  getSkyEdgeTier,
  getSkyEdgeHeight,
  getSkyEdgeColor,
  isSkyEdgeVisible,
  isSkyEdgeDashed,
} from './skyEdgeUtils';
import type { GraphEdge } from '../../../shared/types';

type EdgeType = GraphEdge['type'];

describe('skyEdgeUtils', () => {
  // ── getSkyEdgeTier ─────────────────────────────────────────────
  describe('getSkyEdgeTier', () => {
    it.each<[EdgeType, string | null]>([
      ['imports', 'crossDistrict'],
      ['depends_on', 'crossDistrict'],
      ['calls', 'crossDistrict'],
      ['inherits', 'inheritance'],
    ])('maps "%s" → "%s"', (edgeType, expected) => {
      expect(getSkyEdgeTier(edgeType)).toBe(expected);
    });

    it('returns null for "contains"', () => {
      expect(getSkyEdgeTier('contains')).toBeNull();
    });
  });

  // ── getSkyEdgeHeight ───────────────────────────────────────────
  describe('getSkyEdgeHeight', () => {
    it.each<[EdgeType, number]>([
      ['imports', 40],
      ['depends_on', 40],
      ['calls', 40],
      ['inherits', 65],
      ['contains', 0],
    ])('returns %d for "%s"', (edgeType, expected) => {
      expect(getSkyEdgeHeight(edgeType)).toBe(expected);
    });
  });

  // ── getSkyEdgeColor ────────────────────────────────────────────
  describe('getSkyEdgeColor', () => {
    it.each<[EdgeType, string]>([
      ['imports', '#60a5fa'],
      ['depends_on', '#a78bfa'],
      ['calls', '#34d399'],
      ['inherits', '#f97316'],
      ['contains', '#6b7280'],
    ])('returns "%s" for "%s"', (edgeType, expected) => {
      expect(getSkyEdgeColor(edgeType)).toBe(expected);
    });
  });

  // ── isSkyEdgeVisible ──────────────────────────────────────────
  describe('isSkyEdgeVisible', () => {
    const allEnabled = { crossDistrict: true, inheritance: true };
    const allDisabled = { crossDistrict: false, inheritance: false };

    it('returns false when lodLevel < 2', () => {
      expect(isSkyEdgeVisible('imports', 1, allEnabled)).toBe(false);
      expect(isSkyEdgeVisible('inherits', 0, allEnabled)).toBe(false);
    });

    it('returns false for "contains" at any LOD', () => {
      expect(isSkyEdgeVisible('contains', 3, allEnabled)).toBe(false);
    });

    it('returns true for crossDistrict edge at LOD 2+ with tier enabled', () => {
      expect(isSkyEdgeVisible('imports', 2, allEnabled)).toBe(true);
      expect(isSkyEdgeVisible('depends_on', 3, allEnabled)).toBe(true);
      expect(isSkyEdgeVisible('calls', 2, allEnabled)).toBe(true);
    });

    it('returns false for crossDistrict edge when crossDistrict disabled', () => {
      expect(isSkyEdgeVisible('imports', 3, { crossDistrict: false, inheritance: true })).toBe(false);
    });

    it('returns true for inheritance edge at LOD 2+ with tier enabled', () => {
      expect(isSkyEdgeVisible('inherits', 2, allEnabled)).toBe(true);
    });

    it('returns false for inheritance edge when inheritance disabled', () => {
      expect(isSkyEdgeVisible('inherits', 3, { crossDistrict: true, inheritance: false })).toBe(false);
    });

    it('returns false when all tiers disabled', () => {
      expect(isSkyEdgeVisible('imports', 3, allDisabled)).toBe(false);
      expect(isSkyEdgeVisible('inherits', 3, allDisabled)).toBe(false);
    });
  });

  // ── isSkyEdgeDashed ───────────────────────────────────────────
  describe('isSkyEdgeDashed', () => {
    it('returns true only for "inherits"', () => {
      expect(isSkyEdgeDashed('inherits')).toBe(true);
    });

    it.each<EdgeType>(['imports', 'depends_on', 'calls', 'contains'])(
      'returns false for "%s"',
      (edgeType) => {
        expect(isSkyEdgeDashed(edgeType)).toBe(false);
      },
    );
  });
});
