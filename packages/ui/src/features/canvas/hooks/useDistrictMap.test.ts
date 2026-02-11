/**
 * useDistrictMap Hook Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDistrictMap } from './useDistrictMap';
import type { GraphNode } from '../../../shared/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createNode(
  id: string,
  type: GraphNode['type'] = 'file',
  overrides: Partial<GraphNode> = {},
): GraphNode {
  return {
    id,
    type,
    label: id,
    metadata: {},
    lod: 3,
    depth: 1,
    isExternal: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useDistrictMap', () => {
  it('returns empty map when no nodes have parentId', () => {
    const nodes = [createNode('a'), createNode('b')];

    const { result } = renderHook(() => useDistrictMap(nodes));

    expect(result.current.nestedTypeMap.size).toBe(0);
  });

  it('groups nested type children by parentId', () => {
    const nodes = [
      createNode('file-1', 'file'),
      createNode('class-inner', 'class', { parentId: 'file-1' }),
      createNode('enum-inner', 'enum', { parentId: 'file-1' }),
    ];

    const { result } = renderHook(() => useDistrictMap(nodes));

    expect(result.current.nestedTypeMap.get('file-1')).toHaveLength(2);
  });

  it('excludes non-type children (methods, functions)', () => {
    const nodes = [
      createNode('file-1', 'file'),
      createNode('class-inner', 'class', { parentId: 'file-1' }),
      createNode('method-1', 'method', { parentId: 'file-1' }),
      createNode('func-1', 'function', { parentId: 'file-1' }),
    ];

    const { result } = renderHook(() => useDistrictMap(nodes));

    // Only class (a nested type) should be in the map, not method/function
    const children = result.current.nestedTypeMap.get('file-1');
    expect(children).toHaveLength(1);
    expect(children![0]!.type).toBe('class');
  });

  it('supports multiple parents', () => {
    const nodes = [
      createNode('file-1', 'file'),
      createNode('file-2', 'file'),
      createNode('class-a', 'class', { parentId: 'file-1' }),
      createNode('interface-b', 'interface', { parentId: 'file-2' }),
    ];

    const { result } = renderHook(() => useDistrictMap(nodes));

    expect(result.current.nestedTypeMap.get('file-1')).toHaveLength(1);
    expect(result.current.nestedTypeMap.get('file-2')).toHaveLength(1);
  });

  it('returns same reference when nodes array is unchanged', () => {
    const nodes = [
      createNode('file-1', 'file'),
      createNode('class-a', 'class', { parentId: 'file-1' }),
    ];

    const { result, rerender } = renderHook(() => useDistrictMap(nodes));
    const first = result.current.nestedTypeMap;

    rerender();
    expect(result.current.nestedTypeMap).toBe(first);
  });
});
