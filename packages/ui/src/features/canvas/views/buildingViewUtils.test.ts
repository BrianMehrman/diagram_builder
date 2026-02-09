/**
 * Building View Utility Tests
 *
 * Tests for pure utility functions used by the BuildingView renderer.
 */

import { describe, it, expect } from 'vitest';
import type { Graph, GraphNode, GraphEdge } from '../../../shared/types';
import {
  extractBuildingSubgraph,
  getRoomColor,
  ROOM_COLORS,
} from './buildingViewUtils';

function makeNode(
  id: string,
  type: GraphNode['type'],
  label: string,
  opts: { parentId?: string } = {}
): GraphNode {
  return { id, type, label, metadata: {}, lod: 0, parentId: opts.parentId };
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

describe('buildingViewUtils', () => {
  describe('extractBuildingSubgraph', () => {
    it('should extract file node and its direct children', () => {
      const graph = makeGraph([
        makeNode('f1', 'file', 'app.ts'),
        makeNode('c1', 'class', 'AppClass', { parentId: 'f1' }),
        makeNode('fn1', 'function', 'helper', { parentId: 'f1' }),
        makeNode('f2', 'file', 'other.ts'),
      ]);

      const sub = extractBuildingSubgraph(graph, 'f1');
      expect(sub).not.toBeNull();
      expect(sub!.nodes.map((n) => n.id).sort()).toEqual(['c1', 'f1', 'fn1']);
    });

    it('should include grandchildren (class methods)', () => {
      const graph = makeGraph([
        makeNode('f1', 'file', 'app.ts'),
        makeNode('c1', 'class', 'AppClass', { parentId: 'f1' }),
        makeNode('m1', 'method', 'run', { parentId: 'c1' }),
        makeNode('m2', 'method', 'stop', { parentId: 'c1' }),
      ]);

      const sub = extractBuildingSubgraph(graph, 'f1');
      expect(sub!.nodes.map((n) => n.id).sort()).toEqual([
        'c1',
        'f1',
        'm1',
        'm2',
      ]);
    });

    it('should filter edges to only include relevant nodes', () => {
      const graph = makeGraph(
        [
          makeNode('f1', 'file', 'app.ts'),
          makeNode('c1', 'class', 'AppClass', { parentId: 'f1' }),
          makeNode('m1', 'method', 'run', { parentId: 'c1' }),
          makeNode('m2', 'method', 'stop', { parentId: 'c1' }),
          makeNode('f2', 'file', 'other.ts'),
          makeNode('fn2', 'function', 'external', { parentId: 'f2' }),
        ],
        [
          makeEdge('m1', 'm2', 'calls'),
          makeEdge('m1', 'fn2', 'calls'), // cross-file edge — should be excluded
        ]
      );

      const sub = extractBuildingSubgraph(graph, 'f1');
      expect(sub!.edges).toHaveLength(1);
      expect(sub!.edges[0]!.source).toBe('m1');
      expect(sub!.edges[0]!.target).toBe('m2');
    });

    it('should return null for non-existent node', () => {
      const graph = makeGraph([makeNode('f1', 'file', 'app.ts')]);
      expect(extractBuildingSubgraph(graph, 'missing')).toBeNull();
    });

    it('should return file with no children', () => {
      const graph = makeGraph([makeNode('f1', 'file', 'empty.ts')]);
      const sub = extractBuildingSubgraph(graph, 'f1');
      expect(sub!.nodes).toHaveLength(1);
      expect(sub!.nodes[0]!.id).toBe('f1');
    });

    it('should not include nodes from other files', () => {
      const graph = makeGraph([
        makeNode('f1', 'file', 'a.ts'),
        makeNode('f2', 'file', 'b.ts'),
        makeNode('c1', 'class', 'A', { parentId: 'f1' }),
        makeNode('c2', 'class', 'B', { parentId: 'f2' }),
      ]);

      const sub = extractBuildingSubgraph(graph, 'f1');
      expect(sub!.nodes.map((n) => n.id).sort()).toEqual(['c1', 'f1']);
    });
  });

  describe('getRoomColor', () => {
    it('should return blue for function type', () => {
      expect(getRoomColor('function')).toBe(ROOM_COLORS.function);
    });

    it('should return blue for method type', () => {
      expect(getRoomColor('method')).toBe(ROOM_COLORS.method);
    });

    it('should return green for variable type', () => {
      expect(getRoomColor('variable')).toBe(ROOM_COLORS.variable);
    });

    it('should return gray for unknown type', () => {
      expect(getRoomColor('file')).toBe('#6b7280');
    });

    it('should return gray for class type', () => {
      expect(getRoomColor('class')).toBe('#6b7280');
    });
  });
});
