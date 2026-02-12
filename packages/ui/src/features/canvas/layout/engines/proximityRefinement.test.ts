import { describe, it, expect } from 'vitest';
import type { GraphEdge } from '../../../../shared/types';
import type { BlockLayout } from '../types';
import {
  hashSeed,
  createSeededRng,
  refineDistrictProximity,
} from './proximityRefinement';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBlock(
  fileId: string,
  x: number,
  z: number,
  width = 4,
): BlockLayout {
  return {
    fileId,
    position: { x, y: 0, z },
    footprint: { width, depth: width },
    children: [],
    isMerged: false,
  };
}

function makeEdge(source: string, target: string): GraphEdge {
  return {
    id: `${source}->${target}`,
    source,
    target,
    type: 'imports',
    metadata: {},
  };
}

// ---------------------------------------------------------------------------
// hashSeed
// ---------------------------------------------------------------------------

describe('hashSeed', () => {
  it('produces a non-negative number', () => {
    expect(hashSeed(['a', 'b', 'c'])).toBeGreaterThanOrEqual(0);
  });

  it('produces the same hash for same IDs regardless of order', () => {
    const h1 = hashSeed(['c', 'a', 'b']);
    const h2 = hashSeed(['a', 'b', 'c']);
    expect(h1).toBe(h2);
  });

  it('produces different hashes for different IDs', () => {
    const h1 = hashSeed(['foo', 'bar']);
    const h2 = hashSeed(['baz', 'qux']);
    expect(h1).not.toBe(h2);
  });

  it('handles empty array', () => {
    expect(hashSeed([])).toBe(5381);
  });
});

// ---------------------------------------------------------------------------
// createSeededRng
// ---------------------------------------------------------------------------

describe('createSeededRng', () => {
  it('produces values in [0, 1)', () => {
    const rng = createSeededRng(42);
    for (let i = 0; i < 100; i++) {
      const val = rng();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('produces deterministic sequence for same seed', () => {
    const rng1 = createSeededRng(12345);
    const rng2 = createSeededRng(12345);

    for (let i = 0; i < 20; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('produces different sequences for different seeds', () => {
    const rng1 = createSeededRng(1);
    const rng2 = createSeededRng(2);

    const vals1 = Array.from({ length: 5 }, () => rng1());
    const vals2 = Array.from({ length: 5 }, () => rng2());

    expect(vals1).not.toEqual(vals2);
  });
});

// ---------------------------------------------------------------------------
// refineDistrictProximity
// ---------------------------------------------------------------------------

describe('refineDistrictProximity', () => {
  it('returns unchanged blocks when only one block exists', () => {
    const blocks = [makeBlock('f1', 10, 5)];
    const result = refineDistrictProximity(blocks, [], 42);

    expect(result).toHaveLength(1);
    expect(result[0]!.fileId).toBe('f1');
  });

  it('does not mutate input blocks', () => {
    const blocks = [makeBlock('f1', 0, 0), makeBlock('f2', 1, 1)];
    const originalX = blocks[0]!.position.x;

    refineDistrictProximity(blocks, [], 42);

    expect(blocks[0]!.position.x).toBe(originalX);
  });

  it('pushes overlapping blocks apart', () => {
    const blocks = [
      makeBlock('f1', 0, 0, 6),
      makeBlock('f2', 1, 0, 6),
    ];

    const result = refineDistrictProximity(blocks, [], 42);

    const dx = Math.abs(result[0]!.position.x - result[1]!.position.x);
    const origDx = Math.abs(blocks[0]!.position.x - blocks[1]!.position.x);

    // Blocks should be pushed further apart
    expect(dx).toBeGreaterThan(origDx);
  });

  it('pulls connected blocks closer together', () => {
    const blocks = [
      makeBlock('f1', -20, 0, 4),
      makeBlock('f2', 20, 0, 4),
    ];
    const edges = [makeEdge('f1', 'f2')];

    const result = refineDistrictProximity(blocks, edges, 42, 100);

    const newDist = Math.sqrt(
      (result[0]!.position.x - result[1]!.position.x) ** 2 +
      (result[0]!.position.z - result[1]!.position.z) ** 2,
    );
    const origDist = 40; // original distance

    expect(newDist).toBeLessThan(origDist);
  });

  it('produces deterministic output with same seed', () => {
    const blocks = [
      makeBlock('f1', 5, 5, 6),
      makeBlock('f2', 8, 5, 6),
      makeBlock('f3', 5, 8, 6),
    ];
    const edges = [makeEdge('f1', 'f2')];

    const result1 = refineDistrictProximity(blocks, edges, 42);
    const result2 = refineDistrictProximity(blocks, edges, 42);

    for (let i = 0; i < result1.length; i++) {
      expect(result1[i]!.position.x).toBe(result2[i]!.position.x);
      expect(result1[i]!.position.z).toBe(result2[i]!.position.z);
    }
  });

  it('produces different output with different seeds', () => {
    const blocks = [
      makeBlock('f1', 5, 5, 6),
      makeBlock('f2', 8, 5, 6),
    ];

    const result1 = refineDistrictProximity(blocks, [], 1);
    const result2 = refineDistrictProximity(blocks, [], 999);

    // At least one position should differ
    const anyDiff = result1.some((b, i) =>
      b.position.x !== result2[i]!.position.x || b.position.z !== result2[i]!.position.z,
    );
    expect(anyDiff).toBe(true);
  });

  it('ignores edges of non-import types', () => {
    const blocks = [
      makeBlock('f1', -20, 0, 4),
      makeBlock('f2', 20, 0, 4),
    ];
    const edges: GraphEdge[] = [{
      id: 'e1',
      source: 'f1',
      target: 'f2',
      type: 'contains',
      metadata: {},
    }];

    const result = refineDistrictProximity(blocks, edges, 42, 100);

    // With only a 'contains' edge (not imports/depends_on), there should be
    // no attractive force — distance should not decrease significantly
    const newDist = Math.sqrt(
      (result[0]!.position.x - result[1]!.position.x) ** 2 +
      (result[0]!.position.z - result[1]!.position.z) ** 2,
    );
    expect(newDist).toBeGreaterThan(35); // Mostly unchanged
  });

  it('preserves y=0 for all blocks', () => {
    const blocks = [
      makeBlock('f1', 0, 0),
      makeBlock('f2', 5, 5),
    ];

    const result = refineDistrictProximity(blocks, [], 42);

    for (const b of result) {
      expect(b.position.y).toBe(0);
    }
  });

  it('respects maxIterations parameter', () => {
    const blocks = [
      makeBlock('f1', 0, 0, 6),
      makeBlock('f2', 1, 0, 6),
    ];

    // Very few iterations should produce less separation than many
    const fewIter = refineDistrictProximity(blocks, [], 42, 1);
    const manyIter = refineDistrictProximity(blocks, [], 42, 100);

    const dxFew = Math.abs(fewIter[0]!.position.x - fewIter[1]!.position.x);
    const dxMany = Math.abs(manyIter[0]!.position.x - manyIter[1]!.position.x);

    expect(dxMany).toBeGreaterThanOrEqual(dxFew);
  });
});
