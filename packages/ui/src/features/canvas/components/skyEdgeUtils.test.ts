/**
 * skyEdgeUtils Tests
 *
 * After Story 11-9 reclassification:
 * - Only 'calls' (and future 'composes') are overhead/sky edges.
 * - 'imports', 'depends_on', 'inherits' moved to underground layer.
 */
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
    it('maps "calls" → "crossDistrict" (the only overhead type)', () => {
      expect(getSkyEdgeTier('calls')).toBe('crossDistrict');
    });

    it('returns null for "imports" — now routes underground', () => {
      expect(getSkyEdgeTier('imports')).toBeNull();
    });

    it('returns null for "depends_on" — now routes underground', () => {
      expect(getSkyEdgeTier('depends_on')).toBeNull();
    });

    it('returns null for "inherits" — now routes underground', () => {
      expect(getSkyEdgeTier('inherits')).toBeNull();
    });

    it('returns null for "contains"', () => {
      expect(getSkyEdgeTier('contains')).toBeNull();
    });
  });

  // ── getSkyEdgeHeight ───────────────────────────────────────────
  describe('getSkyEdgeHeight', () => {
    it('returns 40 for "calls" (method call arc height)', () => {
      expect(getSkyEdgeHeight('calls')).toBe(40);
    });

    it.each<EdgeType>(['imports', 'depends_on', 'inherits', 'contains'])(
      'returns 0 for "%s" (not a sky edge)',
      (edgeType) => {
        expect(getSkyEdgeHeight(edgeType)).toBe(0);
      },
    );
  });

  // ── getSkyEdgeColor ────────────────────────────────────────────
  describe('getSkyEdgeColor', () => {
    it('returns green for "calls"', () => {
      expect(getSkyEdgeColor('calls')).toBe('#34d399');
    });

    it.each<EdgeType>(['imports', 'depends_on', 'inherits', 'contains'])(
      'returns fallback gray for "%s" (not a sky edge)',
      (edgeType) => {
        expect(getSkyEdgeColor(edgeType)).toBe('#6b7280');
      },
    );
  });

  // ── isSkyEdgeVisible ──────────────────────────────────────────
  describe('isSkyEdgeVisible', () => {
    const allEnabled = { crossDistrict: true, inheritance: true };
    const allDisabled = { crossDistrict: false, inheritance: false };

    it('returns false when lodLevel < 2', () => {
      expect(isSkyEdgeVisible('calls', 1, allEnabled)).toBe(false);
      expect(isSkyEdgeVisible('calls', 0, allEnabled)).toBe(false);
    });

    it('returns false for "contains" at any LOD', () => {
      expect(isSkyEdgeVisible('contains', 3, allEnabled)).toBe(false);
    });

    it('returns true for "calls" at LOD 2+ with crossDistrict enabled', () => {
      expect(isSkyEdgeVisible('calls', 2, allEnabled)).toBe(true);
      expect(isSkyEdgeVisible('calls', 3, allEnabled)).toBe(true);
    });

    it('returns false for "calls" when crossDistrict disabled', () => {
      expect(isSkyEdgeVisible('calls', 3, allDisabled)).toBe(false);
    });

    it('returns false for "imports" — now underground, not a sky edge', () => {
      expect(isSkyEdgeVisible('imports', 3, allEnabled)).toBe(false);
    });

    it('returns false for "depends_on" — now underground, not a sky edge', () => {
      expect(isSkyEdgeVisible('depends_on', 3, allEnabled)).toBe(false);
    });

    it('returns false for "inherits" — now underground, not a sky edge', () => {
      expect(isSkyEdgeVisible('inherits', 3, allEnabled)).toBe(false);
    });
  });

  // ── isSkyEdgeDashed ───────────────────────────────────────────
  describe('isSkyEdgeDashed', () => {
    it('returns false for all edge types (dashes removed — inherits is now underground)', () => {
      const allTypes: EdgeType[] = ['imports', 'depends_on', 'calls', 'inherits', 'contains'];
      for (const t of allTypes) {
        expect(isSkyEdgeDashed(t)).toBe(false);
      }
    });
  });
});
