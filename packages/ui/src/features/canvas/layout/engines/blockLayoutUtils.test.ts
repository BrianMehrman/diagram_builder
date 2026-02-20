import { describe, it, expect } from 'vitest';
import type { GraphNode } from '../../../../shared/types';
import {
  calculateBlockFootprint,
  placeChildrenInGrid,
  buildFileBlockHierarchy,
  createCompoundBlock,
  positionBlocksInArc,
} from './blockLayoutUtils';
import { BUILDING_Y_OFFSET } from '../../views/cityViewUtils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNode(
  id: string,
  type: GraphNode['type'],
  opts: { parentId?: string } = {},
): GraphNode {
  return {
    id,
    type,
    label: id,
    metadata: {},
    lod: 0,
    parentId: opts.parentId,
  };
}

function makeFileNode(id: string, opts: { parentId?: string } = {}): GraphNode {
  return makeNode(id, 'file', opts);
}

// ---------------------------------------------------------------------------
// calculateBlockFootprint
// ---------------------------------------------------------------------------

describe('calculateBlockFootprint', () => {
  it('returns minimum 4x4 for zero children', () => {
    const fp = calculateBlockFootprint(0, []);
    expect(fp).toEqual({ width: 4, depth: 4 });
  });

  it('returns minimum 4x4 for a single function child', () => {
    const fp = calculateBlockFootprint(1, ['function']);
    // sqrt(1)*2+2 = 4 → clamped to 4
    expect(fp.width).toBe(4);
    expect(fp.depth).toBe(4);
  });

  it('weights classes at 1.5x', () => {
    const fpClasses = calculateBlockFootprint(4, ['class', 'class', 'class', 'class']);
    const fpFuncs = calculateBlockFootprint(4, ['function', 'function', 'function', 'function']);
    // 4 classes = 6.0 weighted → ceil(sqrt(6))*2+2 = ceil(2.449)*2+2 = 3*2+2 = 8
    // 4 functions = 4.0 weighted → ceil(sqrt(4))*2+2 = 2*2+2 = 6
    expect(fpClasses.width).toBeGreaterThan(fpFuncs.width);
  });

  it('weights interfaces at 1.5x', () => {
    const fp = calculateBlockFootprint(2, ['interface', 'interface']);
    // 2 interfaces = 3.0 weighted → ceil(sqrt(3))*2+2 = 2*2+2 = 6
    expect(fp.width).toBe(6);
  });

  it('weights abstract_class at 1.5x', () => {
    const fp = calculateBlockFootprint(1, ['abstract_class']);
    // 1.5 weighted → ceil(sqrt(1.5))*2+2 = ceil(1.22)*2+2 = 2*2+2 = 6
    expect(fp.width).toBe(6);
  });

  it('clamps to maximum 20x20', () => {
    const types: GraphNode['type'][] = Array(200).fill('class');
    const fp = calculateBlockFootprint(200, types);
    expect(fp.width).toBe(20);
    expect(fp.depth).toBe(20);
  });

  it('returns square footprints (width === depth)', () => {
    const fp = calculateBlockFootprint(10, Array(10).fill('function'));
    expect(fp.width).toBe(fp.depth);
  });
});

// ---------------------------------------------------------------------------
// placeChildrenInGrid
// ---------------------------------------------------------------------------

describe('placeChildrenInGrid', () => {
  it('returns empty array for no children', () => {
    const result = placeChildrenInGrid([], { width: 4, depth: 4 });
    expect(result).toEqual([]);
  });

  it('places single child at center of block', () => {
    const child = makeNode('c1', 'function');
    const result = placeChildrenInGrid([child], { width: 4, depth: 4 });

    expect(result).toHaveLength(1);
    expect(result[0]!.nodeId).toBe('c1');
    // 1x1 grid, cell center: (0.5*4 - 2, 0.5*4 - 2) = (0, 0)
    expect(result[0]!.localPosition.x).toBe(0);
    expect(result[0]!.localPosition.z).toBe(0);
    expect(result[0]!.localPosition.y).toBe(BUILDING_Y_OFFSET);
  });

  it('places 4 children in a 2x2 grid', () => {
    const children = ['a', 'b', 'c', 'd'].map((id) => makeNode(id, 'function'));
    const result = placeChildrenInGrid(children, { width: 8, depth: 8 });

    expect(result).toHaveLength(4);
    // All positions should be within footprint bounds
    for (const r of result) {
      expect(Math.abs(r.localPosition.x)).toBeLessThanOrEqual(4);
      expect(Math.abs(r.localPosition.z)).toBeLessThanOrEqual(4);
    }
  });

  it('sorts children by ID for determinism', () => {
    const children = [
      makeNode('z', 'function'),
      makeNode('a', 'function'),
      makeNode('m', 'function'),
    ];
    const result = placeChildrenInGrid(children, { width: 6, depth: 6 });

    expect(result[0]!.nodeId).toBe('a');
    expect(result[1]!.nodeId).toBe('m');
    expect(result[2]!.nodeId).toBe('z');
  });

  it('places all children within footprint bounds', () => {
    const children = Array.from({ length: 9 }, (_, i) =>
      makeNode(`n${i}`, 'function'),
    );
    const fp = { width: 10, depth: 10 };
    const result = placeChildrenInGrid(children, fp);

    for (const r of result) {
      expect(r.localPosition.x).toBeGreaterThanOrEqual(-fp.width / 2);
      expect(r.localPosition.x).toBeLessThanOrEqual(fp.width / 2);
      expect(r.localPosition.z).toBeGreaterThanOrEqual(-fp.depth / 2);
      expect(r.localPosition.z).toBeLessThanOrEqual(fp.depth / 2);
    }
  });

  it('does not produce overlapping positions', () => {
    const children = Array.from({ length: 7 }, (_, i) =>
      makeNode(`n${i}`, 'function'),
    );
    const result = placeChildrenInGrid(children, { width: 10, depth: 10 });

    const positions = new Set<string>();
    for (const r of result) {
      const key = `${r.localPosition.x},${r.localPosition.z}`;
      expect(positions.has(key)).toBe(false);
      positions.add(key);
    }
  });
});

// ---------------------------------------------------------------------------
// buildFileBlockHierarchy
// ---------------------------------------------------------------------------

describe('buildFileBlockHierarchy', () => {
  it('assigns children to their parent file', () => {
    const nodes: GraphNode[] = [
      makeFileNode('f1'),
      makeNode('c1', 'class', { parentId: 'f1' }),
      makeNode('m1', 'method', { parentId: 'c1' }),
    ];

    const result = buildFileBlockHierarchy(nodes);

    expect(result.fileBlocks.get('f1')).toHaveLength(2);
    expect(result.orphans).toHaveLength(0);
    expect(result.cycleBreaks).toHaveLength(0);
  });

  it('walks parentId chain to find owning file', () => {
    const nodes: GraphNode[] = [
      makeFileNode('f1'),
      makeNode('c1', 'class', { parentId: 'f1' }),
      makeNode('m1', 'method', { parentId: 'c1' }),
    ];

    const result = buildFileBlockHierarchy(nodes);

    // m1 → c1 → f1, so m1 should be under f1
    const f1Children = result.fileBlocks.get('f1')!;
    expect(f1Children.some((n) => n.id === 'm1')).toBe(true);
  });

  it('collects orphans with missing parentId', () => {
    const nodes: GraphNode[] = [
      makeFileNode('f1'),
      makeNode('orphan', 'function'),
    ];

    const result = buildFileBlockHierarchy(nodes);

    expect(result.orphans).toHaveLength(1);
    expect(result.orphans[0]!.id).toBe('orphan');
  });

  it('collects orphans whose parentId references a non-existent node', () => {
    const nodes: GraphNode[] = [
      makeFileNode('f1'),
      makeNode('orphan', 'function', { parentId: 'missing' }),
    ];

    const result = buildFileBlockHierarchy(nodes);

    expect(result.orphans).toHaveLength(1);
    expect(result.orphans[0]!.id).toBe('orphan');
  });

  it('detects cycles and breaks them', () => {
    // Create a cycle: c1 -> c2 -> c1
    const nodes: GraphNode[] = [
      makeFileNode('f1'),
      { ...makeNode('c1', 'class', { parentId: 'c2' }) },
      { ...makeNode('c2', 'class', { parentId: 'c1' }) },
    ];

    const result = buildFileBlockHierarchy(nodes);

    expect(result.cycleBreaks.length).toBeGreaterThan(0);
    // Cycled nodes become orphans
    expect(result.orphans.length).toBeGreaterThan(0);
  });

  it('returns empty collections for empty input', () => {
    const result = buildFileBlockHierarchy([]);

    expect(result.fileBlocks.size).toBe(0);
    expect(result.orphans).toHaveLength(0);
    expect(result.cycleBreaks).toHaveLength(0);
  });

  it('handles file-only input with no children', () => {
    const nodes: GraphNode[] = [makeFileNode('f1'), makeFileNode('f2')];

    const result = buildFileBlockHierarchy(nodes);

    expect(result.fileBlocks.size).toBe(2);
    expect(result.fileBlocks.get('f1')).toHaveLength(0);
    expect(result.fileBlocks.get('f2')).toHaveLength(0);
  });

  it('assigns children to correct files when multiple files exist', () => {
    const nodes: GraphNode[] = [
      makeFileNode('f1'),
      makeFileNode('f2'),
      makeNode('c1', 'class', { parentId: 'f1' }),
      makeNode('c2', 'class', { parentId: 'f2' }),
    ];

    const result = buildFileBlockHierarchy(nodes);

    expect(result.fileBlocks.get('f1')!.map((n) => n.id)).toEqual(['c1']);
    expect(result.fileBlocks.get('f2')!.map((n) => n.id)).toEqual(['c2']);
  });
});

// ---------------------------------------------------------------------------
// createCompoundBlock
// ---------------------------------------------------------------------------

describe('createCompoundBlock', () => {
  it('merges children from multiple files', () => {
    const files = [makeFileNode('f1'), makeFileNode('f2')];
    const childrenByFile = new Map<string, GraphNode[]>([
      ['f1', [makeNode('c1', 'class')]],
      ['f2', [makeNode('c2', 'function')]],
    ]);
    const pos = { x: 10, y: 0, z: 5 };

    const block = createCompoundBlock(files, childrenByFile, pos);

    expect(block.isMerged).toBe(true);
    expect(block.children).toHaveLength(2);
    expect(block.position).toEqual(pos);
  });

  it('creates deterministic fileId from sorted file IDs', () => {
    const files = [makeFileNode('f2'), makeFileNode('f1')];
    const childrenByFile = new Map<string, GraphNode[]>();

    const block = createCompoundBlock(files, childrenByFile, { x: 0, y: 0, z: 0 });

    expect(block.fileId).toBe('f1+f2');
  });

  it('handles files with no children', () => {
    const files = [makeFileNode('f1')];
    const childrenByFile = new Map<string, GraphNode[]>();
    const pos = { x: 0, y: 0, z: 0 };

    const block = createCompoundBlock(files, childrenByFile, pos);

    expect(block.children).toHaveLength(0);
    expect(block.footprint).toEqual({ width: 4, depth: 4 });
  });
});

// ---------------------------------------------------------------------------
// positionBlocksInArc
// ---------------------------------------------------------------------------

describe('positionBlocksInArc', () => {
  it('returns empty array for no blocks', () => {
    expect(positionBlocksInArc([], 0, Math.PI, 20)).toEqual([]);
  });

  it('centers a single block in the arc', () => {
    const blocks = [{ id: 'b1', footprint: { width: 4, depth: 4 } }];
    const result = positionBlocksInArc(blocks, 0, Math.PI, 20);

    expect(result).toHaveLength(1);
    // Should be at arc midpoint (PI/2)
    const angle = Math.PI / 2;
    expect(result[0]!.position.x).toBeCloseTo(Math.cos(angle) * 20, 5);
    expect(result[0]!.position.z).toBeCloseTo(Math.sin(angle) * 20, 5);
  });

  it('allocates more angular space to wider blocks', () => {
    const blocks = [
      { id: 'small', footprint: { width: 4, depth: 4 } },
      { id: 'large', footprint: { width: 12, depth: 12 } },
    ];
    const result = positionBlocksInArc(blocks, 0, Math.PI, 20);

    // Extract angles from positions
    const angleSmall = Math.atan2(result[0]!.position.z, result[0]!.position.x);
    const angleLarge = Math.atan2(result[1]!.position.z, result[1]!.position.x);

    // Large block should occupy more of the arc
    expect(angleLarge).toBeGreaterThan(angleSmall);
  });

  it('positions all blocks at the specified radius', () => {
    const blocks = [
      { id: 'b1', footprint: { width: 6, depth: 6 } },
      { id: 'b2', footprint: { width: 6, depth: 6 } },
    ];
    const radius = 30;
    const result = positionBlocksInArc(blocks, 0, 2 * Math.PI, radius);

    for (const r of result) {
      const dist = Math.sqrt(r.position.x ** 2 + r.position.z ** 2);
      expect(dist).toBeCloseTo(radius, 5);
    }
  });

  it('sets y=0 for all positions', () => {
    const blocks = [
      { id: 'b1', footprint: { width: 4, depth: 4 } },
      { id: 'b2', footprint: { width: 4, depth: 4 } },
    ];
    const result = positionBlocksInArc(blocks, 0, Math.PI, 20);

    for (const r of result) {
      expect(r.position.y).toBe(0);
    }
  });
});
