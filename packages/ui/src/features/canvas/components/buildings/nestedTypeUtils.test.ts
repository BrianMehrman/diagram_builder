/**
 * Nested Type Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  buildNestedTypeMap,
  collectNestingTiers,
  countOverflowChildren,
} from './nestedTypeUtils';
import type { GraphNode } from '../../../../shared/types';

function makeNode(overrides: Partial<GraphNode> & { id: string; type: GraphNode['type'] }): GraphNode {
  return {
    label: overrides.id,
    metadata: {},
    lod: 1,
    ...overrides,
  };
}

describe('buildNestedTypeMap', () => {
  it('returns empty map for nodes without parentId', () => {
    const nodes = [
      makeNode({ id: 'a', type: 'class' }),
      makeNode({ id: 'b', type: 'function' }),
    ];
    const map = buildNestedTypeMap(nodes);
    expect(map.size).toBe(0);
  });

  it('groups class-level children by parentId', () => {
    const nodes = [
      makeNode({ id: 'parent', type: 'class' }),
      makeNode({ id: 'inner1', type: 'class', parentId: 'parent' }),
      makeNode({ id: 'inner2', type: 'enum', parentId: 'parent' }),
    ];
    const map = buildNestedTypeMap(nodes);
    expect(map.get('parent')?.length).toBe(2);
    expect(map.get('parent')?.map((n) => n.id)).toEqual(['inner1', 'inner2']);
  });

  it('excludes methods and functions from nested type map', () => {
    const nodes = [
      makeNode({ id: 'parent', type: 'class' }),
      makeNode({ id: 'method1', type: 'method', parentId: 'parent' }),
      makeNode({ id: 'func1', type: 'function', parentId: 'parent' }),
    ];
    const map = buildNestedTypeMap(nodes);
    expect(map.size).toBe(0);
  });

  it('includes interface and abstract_class as nested types', () => {
    const nodes = [
      makeNode({ id: 'parent', type: 'class' }),
      makeNode({ id: 'iface', type: 'interface', parentId: 'parent' }),
      makeNode({ id: 'abs', type: 'abstract_class', parentId: 'parent' }),
    ];
    const map = buildNestedTypeMap(nodes);
    expect(map.get('parent')?.length).toBe(2);
  });

  it('handles empty array', () => {
    expect(buildNestedTypeMap([]).size).toBe(0);
  });
});

describe('collectNestingTiers', () => {
  it('returns empty array when node has no children', () => {
    const map = new Map<string, GraphNode[]>();
    const tiers = collectNestingTiers('parent', map);
    expect(tiers).toEqual([]);
  });

  it('returns one tier for direct children', () => {
    const child = makeNode({ id: 'child', type: 'class', parentId: 'parent' });
    const map = new Map<string, GraphNode[]>([['parent', [child]]]);
    const tiers = collectNestingTiers('parent', map);
    expect(tiers.length).toBe(1);
    expect(tiers[0]?.length).toBe(1);
    expect(tiers[0]?.[0]?.id).toBe('child');
  });

  it('returns multiple tiers for deep nesting', () => {
    const child = makeNode({ id: 'child', type: 'class', parentId: 'parent' });
    const grandchild = makeNode({ id: 'grandchild', type: 'enum', parentId: 'child' });
    const map = new Map<string, GraphNode[]>([
      ['parent', [child]],
      ['child', [grandchild]],
    ]);
    const tiers = collectNestingTiers('parent', map);
    expect(tiers.length).toBe(2);
    expect(tiers[0]?.[0]?.id).toBe('child');
    expect(tiers[1]?.[0]?.id).toBe('grandchild');
  });

  it('stops at maxTiers', () => {
    const t1 = makeNode({ id: 't1', type: 'class', parentId: 'root' });
    const t2 = makeNode({ id: 't2', type: 'class', parentId: 't1' });
    const t3 = makeNode({ id: 't3', type: 'class', parentId: 't2' });
    const t4 = makeNode({ id: 't4', type: 'class', parentId: 't3' });
    const map = new Map<string, GraphNode[]>([
      ['root', [t1]],
      ['t1', [t2]],
      ['t2', [t3]],
      ['t3', [t4]],
    ]);
    const tiers = collectNestingTiers('root', map, 3);
    expect(tiers.length).toBe(3);
    expect(tiers[2]?.[0]?.id).toBe('t3');
  });

  it('handles multiple children per tier', () => {
    const c1 = makeNode({ id: 'c1', type: 'class', parentId: 'root' });
    const c2 = makeNode({ id: 'c2', type: 'enum', parentId: 'root' });
    const map = new Map<string, GraphNode[]>([['root', [c1, c2]]]);
    const tiers = collectNestingTiers('root', map);
    expect(tiers.length).toBe(1);
    expect(tiers[0]?.length).toBe(2);
  });
});

describe('countOverflowChildren', () => {
  it('returns 0 when no children beyond last tier', () => {
    const map = new Map<string, GraphNode[]>();
    expect(countOverflowChildren(['t3'], map)).toBe(0);
  });

  it('counts direct overflow children', () => {
    const overflow = makeNode({ id: 'o1', type: 'class', parentId: 't3' });
    const map = new Map<string, GraphNode[]>([['t3', [overflow]]]);
    expect(countOverflowChildren(['t3'], map)).toBe(1);
  });

  it('counts deeply nested overflow children', () => {
    const o1 = makeNode({ id: 'o1', type: 'class', parentId: 't3' });
    const o2 = makeNode({ id: 'o2', type: 'class', parentId: 'o1' });
    const map = new Map<string, GraphNode[]>([
      ['t3', [o1]],
      ['o1', [o2]],
    ]);
    expect(countOverflowChildren(['t3'], map)).toBe(2);
  });

  it('counts across multiple last-tier nodes', () => {
    const o1 = makeNode({ id: 'o1', type: 'class', parentId: 'a' });
    const o2 = makeNode({ id: 'o2', type: 'class', parentId: 'b' });
    const map = new Map<string, GraphNode[]>([
      ['a', [o1]],
      ['b', [o2]],
    ]);
    expect(countOverflowChildren(['a', 'b'], map)).toBe(2);
  });
});
