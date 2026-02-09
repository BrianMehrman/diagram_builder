/**
 * Sign Selection & Visibility Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import { getSignType, getSignVisibility } from './signUtils';
import type { GraphNode } from '../../../../shared/types';

function makeNode(overrides: Partial<GraphNode> & { type: GraphNode['type'] }): GraphNode {
  return {
    id: 'test-1',
    label: 'TestNode',
    metadata: {},
    lod: 1,
    ...overrides,
  };
}

describe('getSignType', () => {
  describe('priority 1: deprecated', () => {
    it('returns construction for deprecated nodes', () => {
      const node = makeNode({ type: 'class', metadata: { isDeprecated: true } });
      expect(getSignType(node)).toBe('construction');
    });

    it('deprecated takes priority over exported', () => {
      const node = makeNode({
        type: 'class',
        metadata: { isDeprecated: true, isExported: true },
      });
      expect(getSignType(node)).toBe('construction');
    });

    it('deprecated takes priority over visibility', () => {
      const node = makeNode({
        type: 'class',
        metadata: { isDeprecated: true, visibility: 'public' },
      });
      expect(getSignType(node)).toBe('construction');
    });
  });

  describe('priority 2: exported', () => {
    it('returns marquee for exported nodes', () => {
      const node = makeNode({ type: 'function', metadata: { isExported: true } });
      expect(getSignType(node)).toBe('marquee');
    });

    it('exported takes priority over visibility', () => {
      const node = makeNode({
        type: 'function',
        metadata: { isExported: true, visibility: 'public' },
      });
      expect(getSignType(node)).toBe('marquee');
    });

    it('exported takes priority over node type', () => {
      const node = makeNode({
        type: 'variable',
        metadata: { isExported: true },
      });
      expect(getSignType(node)).toBe('marquee');
    });
  });

  describe('priority 3-4: access visibility', () => {
    it('returns brass for private visibility', () => {
      const node = makeNode({ type: 'function', metadata: { visibility: 'private' } });
      expect(getSignType(node)).toBe('brass');
    });

    it('returns neon for public visibility', () => {
      const node = makeNode({ type: 'function', metadata: { visibility: 'public' } });
      expect(getSignType(node)).toBe('neon');
    });

    it('private takes priority over public (private checked first)', () => {
      // Should not happen in practice, but verifies order
      const node = makeNode({
        type: 'function',
        metadata: { visibility: 'private' },
      });
      expect(getSignType(node)).toBe('brass');
    });

    it('visibility takes priority over node type', () => {
      const node = makeNode({ type: 'class', metadata: { visibility: 'public' } });
      expect(getSignType(node)).toBe('neon');
    });
  });

  describe('priority 5-7: node type based', () => {
    it('returns hanging for class nodes', () => {
      const node = makeNode({ type: 'class' });
      expect(getSignType(node)).toBe('hanging');
    });

    it('returns hanging for abstract_class nodes', () => {
      const node = makeNode({ type: 'abstract_class' });
      expect(getSignType(node)).toBe('hanging');
    });

    it('returns highway for file nodes', () => {
      const node = makeNode({ type: 'file' });
      expect(getSignType(node)).toBe('highway');
    });

    it('returns labelTape for variable nodes', () => {
      const node = makeNode({ type: 'variable' });
      expect(getSignType(node)).toBe('labelTape');
    });
  });

  describe('fallback', () => {
    it('returns highway for function nodes without metadata', () => {
      const node = makeNode({ type: 'function' });
      expect(getSignType(node)).toBe('highway');
    });

    it('returns highway for method nodes without metadata', () => {
      const node = makeNode({ type: 'method' });
      expect(getSignType(node)).toBe('highway');
    });

    it('returns highway for interface nodes without metadata', () => {
      const node = makeNode({ type: 'interface' });
      expect(getSignType(node)).toBe('highway');
    });

    it('returns highway for enum nodes without metadata', () => {
      const node = makeNode({ type: 'enum' });
      expect(getSignType(node)).toBe('highway');
    });
  });

  describe('missing metadata', () => {
    it('handles empty metadata gracefully', () => {
      const node = makeNode({ type: 'file', metadata: {} });
      expect(getSignType(node)).toBe('highway');
    });

    it('handles metadata with unrelated fields', () => {
      const node = makeNode({ type: 'class', metadata: { path: '/src/foo.ts' } });
      expect(getSignType(node)).toBe('hanging');
    });
  });
});

describe('getSignVisibility', () => {
  describe('LOD 1 (city zoom)', () => {
    it('shows highway signs', () => {
      expect(getSignVisibility('highway', 1)).toBe(true);
    });

    it('hides hanging signs', () => {
      expect(getSignVisibility('hanging', 1)).toBe(false);
    });

    it('hides neon signs', () => {
      expect(getSignVisibility('neon', 1)).toBe(false);
    });

    it('hides brass signs', () => {
      expect(getSignVisibility('brass', 1)).toBe(false);
    });

    it('hides labelTape signs', () => {
      expect(getSignVisibility('labelTape', 1)).toBe(false);
    });

    it('hides marquee signs', () => {
      expect(getSignVisibility('marquee', 1)).toBe(false);
    });

    it('hides construction signs', () => {
      expect(getSignVisibility('construction', 1)).toBe(false);
    });
  });

  describe('LOD 2 (district)', () => {
    it('shows highway signs', () => {
      expect(getSignVisibility('highway', 2)).toBe(true);
    });

    it('shows hanging signs', () => {
      expect(getSignVisibility('hanging', 2)).toBe(true);
    });

    it('shows neon signs', () => {
      expect(getSignVisibility('neon', 2)).toBe(true);
    });

    it('shows marquee signs', () => {
      expect(getSignVisibility('marquee', 2)).toBe(true);
    });

    it('hides brass signs', () => {
      expect(getSignVisibility('brass', 2)).toBe(false);
    });

    it('hides labelTape signs', () => {
      expect(getSignVisibility('labelTape', 2)).toBe(false);
    });

    it('hides construction signs', () => {
      expect(getSignVisibility('construction', 2)).toBe(false);
    });
  });

  describe('LOD 3 (neighborhood)', () => {
    it('shows brass signs', () => {
      expect(getSignVisibility('brass', 3)).toBe(true);
    });

    it('shows labelTape signs', () => {
      expect(getSignVisibility('labelTape', 3)).toBe(true);
    });

    it('still shows highway, hanging, neon, marquee', () => {
      expect(getSignVisibility('highway', 3)).toBe(true);
      expect(getSignVisibility('hanging', 3)).toBe(true);
      expect(getSignVisibility('neon', 3)).toBe(true);
      expect(getSignVisibility('marquee', 3)).toBe(true);
    });

    it('hides construction signs', () => {
      expect(getSignVisibility('construction', 3)).toBe(false);
    });
  });

  describe('LOD 4 (street)', () => {
    it('shows all sign types', () => {
      expect(getSignVisibility('highway', 4)).toBe(true);
      expect(getSignVisibility('hanging', 4)).toBe(true);
      expect(getSignVisibility('neon', 4)).toBe(true);
      expect(getSignVisibility('brass', 4)).toBe(true);
      expect(getSignVisibility('labelTape', 4)).toBe(true);
      expect(getSignVisibility('marquee', 4)).toBe(true);
      expect(getSignVisibility('construction', 4)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('LOD 0 hides all signs', () => {
      expect(getSignVisibility('highway', 0)).toBe(false);
    });

    it('negative LOD hides all signs', () => {
      expect(getSignVisibility('highway', -1)).toBe(false);
    });

    it('LOD 5+ shows all signs', () => {
      expect(getSignVisibility('construction', 5)).toBe(true);
      expect(getSignVisibility('brass', 10)).toBe(true);
    });
  });
});
