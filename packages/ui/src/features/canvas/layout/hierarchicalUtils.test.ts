import { describe, it, expect } from 'vitest';
import { flattenHierarchicalLayout } from './hierarchicalUtils';
import type {
  HierarchicalLayoutResult,
  BlockLayout,
  DistrictLayout,
  ExternalZoneLayout,
} from './types';
import type { DistrictArcMetadata, InfrastructureZoneMetadata } from './engines/radialCityLayout';

/** Minimal arc metadata for test fixtures */
function makeArc(id: string): DistrictArcMetadata {
  return { id, arcStart: 0, arcEnd: 1, innerRadius: 10, outerRadius: 20, ringDepth: 1, nodeCount: 1 };
}

/** Minimal zone metadata for test fixtures */
function makeZoneMeta(type: string): InfrastructureZoneMetadata {
  return { type, arcStart: 0, arcEnd: 1, nodeCount: 1 };
}

/** Build a minimal HierarchicalLayoutResult */
function makeResult(
  overrides: Partial<HierarchicalLayoutResult> = {},
): HierarchicalLayoutResult {
  return {
    positions: new Map(),
    bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
    districts: [],
    externalZones: [],
    ...overrides,
  };
}

describe('flattenHierarchicalLayout', () => {
  it('returns empty map for empty result', () => {
    const map = flattenHierarchicalLayout(makeResult());
    expect(map.size).toBe(0);
  });

  it('positions a single block with no children', () => {
    const block: BlockLayout = {
      fileId: 'file-1',
      position: { x: 5, y: 0, z: 10 },
      footprint: { width: 2, depth: 2 },
      children: [],
      isMerged: false,
    };
    const district: DistrictLayout = {
      id: 'src',
      arc: makeArc('src'),
      blocks: [block],
      isCompound: false,
    };

    const map = flattenHierarchicalLayout(makeResult({ districts: [district] }));
    expect(map.size).toBe(1);
    expect(map.get('file-1')).toEqual({ x: 5, y: 0, z: 10 });
  });

  it('resolves children to absolute positions', () => {
    const block: BlockLayout = {
      fileId: 'file-1',
      position: { x: 10, y: 0, z: 20 },
      footprint: { width: 4, depth: 4 },
      children: [
        { nodeId: 'child-a', localPosition: { x: 1, y: 2, z: 3 } },
        { nodeId: 'child-b', localPosition: { x: -1, y: 0, z: -2 } },
      ],
      isMerged: false,
    };
    const district: DistrictLayout = {
      id: 'src',
      arc: makeArc('src'),
      blocks: [block],
      isCompound: false,
    };

    const map = flattenHierarchicalLayout(makeResult({ districts: [district] }));
    expect(map.get('child-a')).toEqual({ x: 11, y: 2, z: 23 });
    expect(map.get('child-b')).toEqual({ x: 9, y: 0, z: 18 });
    expect(map.get('file-1')).toEqual({ x: 10, y: 0, z: 20 });
  });

  it('positions merged blocks the same as normal blocks', () => {
    const block: BlockLayout = {
      fileId: 'merged-file',
      position: { x: 3, y: 0, z: 7 },
      footprint: { width: 2, depth: 2 },
      children: [],
      isMerged: true,
    };
    const district: DistrictLayout = {
      id: 'lib',
      arc: makeArc('lib'),
      blocks: [block],
      isCompound: false,
    };

    const map = flattenHierarchicalLayout(makeResult({ districts: [district] }));
    expect(map.get('merged-file')).toEqual({ x: 3, y: 0, z: 7 });
  });

  it('enumerates blocks in compound districts', () => {
    const blocks: BlockLayout[] = [
      {
        fileId: 'f1',
        position: { x: 1, y: 0, z: 1 },
        footprint: { width: 1, depth: 1 },
        children: [],
        isMerged: false,
      },
      {
        fileId: 'f2',
        position: { x: 2, y: 0, z: 2 },
        footprint: { width: 1, depth: 1 },
        children: [],
        isMerged: false,
      },
    ];
    const district: DistrictLayout = {
      id: 'utils',
      arc: makeArc('utils'),
      blocks,
      isCompound: true,
    };

    const map = flattenHierarchicalLayout(makeResult({ districts: [district] }));
    expect(map.get('f1')).toEqual({ x: 1, y: 0, z: 1 });
    expect(map.get('f2')).toEqual({ x: 2, y: 0, z: 2 });
  });

  it('handles multiple districts with multiple blocks', () => {
    const d1: DistrictLayout = {
      id: 'src',
      arc: makeArc('src'),
      blocks: [
        { fileId: 'a', position: { x: 1, y: 0, z: 0 }, footprint: { width: 1, depth: 1 }, children: [], isMerged: false },
        { fileId: 'b', position: { x: 2, y: 0, z: 0 }, footprint: { width: 1, depth: 1 }, children: [], isMerged: false },
      ],
      isCompound: false,
    };
    const d2: DistrictLayout = {
      id: 'lib',
      arc: makeArc('lib'),
      blocks: [
        { fileId: 'c', position: { x: 3, y: 0, z: 0 }, footprint: { width: 1, depth: 1 }, children: [], isMerged: false },
      ],
      isCompound: false,
    };

    const map = flattenHierarchicalLayout(makeResult({ districts: [d1, d2] }));
    expect(map.size).toBe(3);
    expect(map.has('a')).toBe(true);
    expect(map.has('b')).toBe(true);
    expect(map.has('c')).toBe(true);
  });

  it('includes external zone node positions', () => {
    const zone: ExternalZoneLayout = {
      zoneMetadata: makeZoneMeta('database'),
      nodes: [
        { nodeId: 'db-1', position: { x: 50, y: 0, z: 50 } },
        { nodeId: 'db-2', position: { x: 55, y: 0, z: 50 } },
      ],
    };

    const map = flattenHierarchicalLayout(makeResult({ externalZones: [zone] }));
    expect(map.get('db-1')).toEqual({ x: 50, y: 0, z: 50 });
    expect(map.get('db-2')).toEqual({ x: 55, y: 0, z: 50 });
  });

  it('produces complete map from mixed districts and zones', () => {
    const district: DistrictLayout = {
      id: 'src',
      arc: makeArc('src'),
      blocks: [
        {
          fileId: 'file-1',
          position: { x: 10, y: 0, z: 10 },
          footprint: { width: 2, depth: 2 },
          children: [{ nodeId: 'child-1', localPosition: { x: 0, y: 1, z: 0 } }],
          isMerged: false,
        },
      ],
      isCompound: false,
    };
    const zone: ExternalZoneLayout = {
      zoneMetadata: makeZoneMeta('api'),
      nodes: [{ nodeId: 'ext-1', position: { x: 40, y: 0, z: 40 } }],
    };

    const map = flattenHierarchicalLayout(
      makeResult({ districts: [district], externalZones: [zone] }),
    );

    expect(map.size).toBe(3);
    expect(map.get('file-1')).toEqual({ x: 10, y: 0, z: 10 });
    expect(map.get('child-1')).toEqual({ x: 10, y: 1, z: 10 });
    expect(map.get('ext-1')).toEqual({ x: 40, y: 0, z: 40 });
  });

  it('preserves pre-existing positions in result.positions', () => {
    const existing = new Map([['entry-0', { x: 0, y: 0, z: 0 }]]);
    const district: DistrictLayout = {
      id: 'src',
      arc: makeArc('src'),
      blocks: [
        { fileId: 'f1', position: { x: 5, y: 0, z: 5 }, footprint: { width: 1, depth: 1 }, children: [], isMerged: false },
      ],
      isCompound: false,
    };

    const map = flattenHierarchicalLayout(
      makeResult({ positions: existing, districts: [district] }),
    );

    expect(map.get('entry-0')).toEqual({ x: 0, y: 0, z: 0 });
    expect(map.get('f1')).toEqual({ x: 5, y: 0, z: 5 });
    expect(map.size).toBe(2);
  });
});
