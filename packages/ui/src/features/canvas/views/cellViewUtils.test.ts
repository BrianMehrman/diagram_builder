/**
 * Cell View Utility Tests
 *
 * Tests for pure utility functions used by the CellView renderer.
 */

import { describe, it, expect } from 'vitest';
import type { Graph, GraphNode, GraphEdge } from '../../../shared/types';
import {
  getOrganelleColor,
  getOrganelleShape,
  getOrganelleSize,
  extractCellSubgraph,
  ORGANELLE_COLORS,
} from './cellViewUtils';

function makeNode(
  id: string,
  type: GraphNode['type'],
  label: string,
  opts: { parentId?: string; metadata?: Record<string, unknown> } = {}
): GraphNode {
  return {
    id,
    type,
    label,
    metadata: opts.metadata ?? {},
    lod: 0,
    parentId: opts.parentId,
  };
}

function makeEdge(
  source: string,
  target: string,
  type: GraphEdge['type'] = 'calls'
): GraphEdge {
  return { id: `${source}-${target}`, source, target, type, metadata: {} };
}

function makeGraph(nodes: GraphNode[], edges: GraphEdge[] = []): Graph {
  return {
    nodes,
    edges,
    metadata: {
      repositoryId: 'test',
      name: 'Test',
      totalNodes: nodes.length,
      totalEdges: edges.length,
    },
  };
}

describe('cellViewUtils', () => {
  describe('getOrganelleColor', () => {
    it('should return blue for function type', () => {
      expect(getOrganelleColor('function')).toBe(ORGANELLE_COLORS.function);
    });

    it('should return light blue for method type', () => {
      expect(getOrganelleColor('method')).toBe(ORGANELLE_COLORS.method);
    });

    it('should return green for variable type', () => {
      expect(getOrganelleColor('variable')).toBe(ORGANELLE_COLORS.variable);
    });

    it('should return gray for unknown types', () => {
      expect(getOrganelleColor('file')).toBe('#6b7280');
      expect(getOrganelleColor('class')).toBe('#6b7280');
    });
  });

  describe('getOrganelleShape', () => {
    it('should return sphere for function', () => {
      expect(getOrganelleShape('function')).toBe('sphere');
    });

    it('should return sphere for method', () => {
      expect(getOrganelleShape('method')).toBe('sphere');
    });

    it('should return cube for variable', () => {
      expect(getOrganelleShape('variable')).toBe('cube');
    });

    it('should return sphere for unknown types', () => {
      expect(getOrganelleShape('file')).toBe('sphere');
    });
  });

  describe('getOrganelleSize', () => {
    it('should return base size for no metadata', () => {
      const size = getOrganelleSize({});
      expect(size).toBeGreaterThan(0);
    });

    it('should return larger size for higher line count', () => {
      const small = getOrganelleSize({ lineCount: 5 });
      const large = getOrganelleSize({ lineCount: 100 });
      expect(large).toBeGreaterThan(small);
    });

    it('should handle zero line count', () => {
      const size = getOrganelleSize({ lineCount: 0 });
      expect(size).toBeGreaterThan(0);
    });

    it('should handle missing lineCount', () => {
      const size = getOrganelleSize({ someOtherField: true });
      expect(size).toBeGreaterThan(0);
    });
  });

  describe('extractCellSubgraph', () => {
    it('should extract class node and its children', () => {
      const graph = makeGraph([
        makeNode('f1', 'file', 'app.ts'),
        makeNode('c1', 'class', 'MyClass', { parentId: 'f1' }),
        makeNode('m1', 'method', 'run', { parentId: 'c1' }),
        makeNode('m2', 'method', 'stop', { parentId: 'c1' }),
      ]);

      const sub = extractCellSubgraph(graph, 'c1');
      expect(sub).not.toBeNull();
      expect(sub!.nodes.map((n) => n.id).sort()).toEqual(['c1', 'm1', 'm2']);
    });

    it('should filter edges to only include organelles', () => {
      const graph = makeGraph(
        [
          makeNode('c1', 'class', 'MyClass'),
          makeNode('m1', 'method', 'run', { parentId: 'c1' }),
          makeNode('m2', 'method', 'stop', { parentId: 'c1' }),
          makeNode('ext', 'function', 'external'),
        ],
        [
          makeEdge('m1', 'm2', 'calls'),
          makeEdge('m1', 'ext', 'calls'), // cross-cell — excluded
        ]
      );

      const sub = extractCellSubgraph(graph, 'c1');
      expect(sub!.edges).toHaveLength(1);
      expect(sub!.edges[0]!.source).toBe('m1');
      expect(sub!.edges[0]!.target).toBe('m2');
    });

    it('should return null for non-existent node', () => {
      const graph = makeGraph([makeNode('c1', 'class', 'MyClass')]);
      expect(extractCellSubgraph(graph, 'missing')).toBeNull();
    });

    it('should return class with no children', () => {
      const graph = makeGraph([makeNode('c1', 'class', 'EmptyClass')]);
      const sub = extractCellSubgraph(graph, 'c1');
      expect(sub!.nodes).toHaveLength(1);
      expect(sub!.nodes[0]!.id).toBe('c1');
    });

    it('should not include siblings from the same file', () => {
      const graph = makeGraph([
        makeNode('f1', 'file', 'app.ts'),
        makeNode('c1', 'class', 'ClassA', { parentId: 'f1' }),
        makeNode('c2', 'class', 'ClassB', { parentId: 'f1' }),
        makeNode('m1', 'method', 'run', { parentId: 'c1' }),
        makeNode('m2', 'method', 'exec', { parentId: 'c2' }),
      ]);

      const sub = extractCellSubgraph(graph, 'c1');
      expect(sub!.nodes.map((n) => n.id).sort()).toEqual(['c1', 'm1']);
    });

    it('should include variable children', () => {
      const graph = makeGraph([
        makeNode('c1', 'class', 'MyClass'),
        makeNode('v1', 'variable', 'state', { parentId: 'c1' }),
        makeNode('m1', 'method', 'run', { parentId: 'c1' }),
      ]);

      const sub = extractCellSubgraph(graph, 'c1');
      expect(sub!.nodes.map((n) => n.id).sort()).toEqual(['c1', 'm1', 'v1']);
    });
  });
});
