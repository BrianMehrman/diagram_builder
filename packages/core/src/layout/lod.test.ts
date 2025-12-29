/**
 * LOD System Tests
 */

import { describe, it, expect } from 'vitest';
import {
  isNodeVisibleAtLOD,
  isEdgeVisibleAtLOD,
  getRecommendedLOD,
  buildAncestorMap,
  getAncestors,
  findVisibleAncestor,
  filterNodesByLOD,
  filterEdgesByLOD,
  filterGraphByLOD,
  createLODGraph,
  getNewlyVisibleNodes,
  getNewlyHiddenNodes,
  getNodeCountsByLOD,
  getCumulativeNodeCounts,
} from './lod.js';
import { buildGraph } from '../ivm/builder.js';
import type { IVMGraph, IVMNode, IVMEdge, LODLevel } from '../ivm/types.js';

describe('LOD System', () => {
  // Helper to create a hierarchical test graph
  function createHierarchicalGraph(): IVMGraph {
    return buildGraph({
      nodes: [
        { id: 'repo', type: 'repository', metadata: { label: 'repo', path: '/' } },
        { id: 'pkg', type: 'package', parentId: 'repo', metadata: { label: 'pkg', path: '/pkg' } },
        { id: 'dir', type: 'directory', parentId: 'pkg', metadata: { label: 'src', path: '/pkg/src' } },
        { id: 'file1', type: 'file', parentId: 'dir', metadata: { label: 'a.ts', path: '/pkg/src/a.ts' } },
        { id: 'file2', type: 'file', parentId: 'dir', metadata: { label: 'b.ts', path: '/pkg/src/b.ts' } },
        { id: 'class1', type: 'class', parentId: 'file1', metadata: { label: 'ClassA', path: '/pkg/src/a.ts#ClassA' } },
        { id: 'method1', type: 'method', parentId: 'class1', metadata: { label: 'foo', path: '/pkg/src/a.ts#ClassA.foo' } },
      ],
      edges: [
        { source: 'file1', target: 'file2', type: 'imports' },
        { source: 'class1', target: 'file2', type: 'imports' },
        { source: 'method1', target: 'class1', type: 'calls' },
      ],
      metadata: { name: 'test', rootPath: '/' },
    });
  }

  describe('isNodeVisibleAtLOD', () => {
    it('should return true when node LOD <= level', () => {
      const node: IVMNode = {
        id: 'test',
        type: 'file',
        position: { x: 0, y: 0, z: 0 },
        lod: 3,
        metadata: { label: 'test', path: '/test' },
      };

      expect(isNodeVisibleAtLOD(node, 3)).toBe(true);
      expect(isNodeVisibleAtLOD(node, 4)).toBe(true);
      expect(isNodeVisibleAtLOD(node, 5)).toBe(true);
    });

    it('should return false when node LOD > level', () => {
      const node: IVMNode = {
        id: 'test',
        type: 'method',
        position: { x: 0, y: 0, z: 0 },
        lod: 5,
        metadata: { label: 'test', path: '/test' },
      };

      expect(isNodeVisibleAtLOD(node, 4)).toBe(false);
      expect(isNodeVisibleAtLOD(node, 3)).toBe(false);
    });
  });

  describe('isEdgeVisibleAtLOD', () => {
    it('should return true when edge LOD <= level', () => {
      const edge: IVMEdge = {
        id: 'e1',
        source: 'a',
        target: 'b',
        type: 'imports',
        lod: 3,
        metadata: {},
      };

      expect(isEdgeVisibleAtLOD(edge, 3)).toBe(true);
      expect(isEdgeVisibleAtLOD(edge, 4)).toBe(true);
    });

    it('should return false when edge LOD > level', () => {
      const edge: IVMEdge = {
        id: 'e1',
        source: 'a',
        target: 'b',
        type: 'imports',
        lod: 5,
        metadata: {},
      };

      expect(isEdgeVisibleAtLOD(edge, 4)).toBe(false);
    });
  });

  describe('getRecommendedLOD', () => {
    it('should recommend appropriate LOD levels', () => {
      expect(getRecommendedLOD(10)).toBe(5);
      expect(getRecommendedLOD(100)).toBe(4);
      expect(getRecommendedLOD(300)).toBe(3);
      expect(getRecommendedLOD(700)).toBe(2);
      expect(getRecommendedLOD(3000)).toBe(1);
      expect(getRecommendedLOD(10000)).toBe(0);
    });
  });

  describe('buildAncestorMap', () => {
    it('should build correct ancestor chains', () => {
      const graph = createHierarchicalGraph();
      const ancestorMap = buildAncestorMap(graph.nodes);

      expect(getAncestors('method1', ancestorMap)).toEqual(['class1', 'file1', 'dir', 'pkg', 'repo']);
      expect(getAncestors('class1', ancestorMap)).toEqual(['file1', 'dir', 'pkg', 'repo']);
      expect(getAncestors('repo', ancestorMap)).toEqual([]);
    });
  });

  describe('findVisibleAncestor', () => {
    it('should find nearest visible ancestor', () => {
      const graph = createHierarchicalGraph();
      const ancestorMap = buildAncestorMap(graph.nodes);
      const visibleNodeIds = new Set(['repo', 'pkg', 'dir', 'file1', 'file2']);

      expect(findVisibleAncestor('method1', ancestorMap, visibleNodeIds)).toBe('file1');
      expect(findVisibleAncestor('class1', ancestorMap, visibleNodeIds)).toBe('file1');
      expect(findVisibleAncestor('file1', ancestorMap, visibleNodeIds)).toBe('dir');
    });

    it('should return undefined if no visible ancestor', () => {
      const graph = createHierarchicalGraph();
      const ancestorMap = buildAncestorMap(graph.nodes);
      const visibleNodeIds = new Set<string>();

      expect(findVisibleAncestor('method1', ancestorMap, visibleNodeIds)).toBeUndefined();
    });
  });

  describe('filterNodesByLOD', () => {
    it('should filter nodes by LOD level', () => {
      const graph = createHierarchicalGraph();

      // LOD 3 = file level (repo, pkg, dir, files visible)
      const lod3Nodes = filterNodesByLOD(graph.nodes, 3, false);
      const lod3Ids = new Set(lod3Nodes.map((n) => n.id));
      
      expect(lod3Ids.has('repo')).toBe(true);
      expect(lod3Ids.has('pkg')).toBe(true);
      expect(lod3Ids.has('dir')).toBe(true);
      expect(lod3Ids.has('file1')).toBe(true);
      expect(lod3Ids.has('file2')).toBe(true);
      expect(lod3Ids.has('class1')).toBe(false);
      expect(lod3Ids.has('method1')).toBe(false);
    });

    it('should include ancestors when requested', () => {
      const graph = createHierarchicalGraph();
      
      // Even with includeAncestors, should get same result since ancestors are at lower LOD
      const lod3Nodes = filterNodesByLOD(graph.nodes, 3, true);
      const lod3Ids = new Set(lod3Nodes.map((n) => n.id));
      
      expect(lod3Ids.has('repo')).toBe(true);
      expect(lod3Ids.has('file1')).toBe(true);
    });
  });

  describe('filterEdgesByLOD', () => {
    it('should filter edges by visible nodes', () => {
      const graph = createHierarchicalGraph();
      const visibleNodeIds = new Set(['file1', 'file2', 'dir', 'pkg', 'repo']);

      const { edges } = filterEdgesByLOD(graph.edges, 3, visibleNodeIds, false);

      // Only file1 -> file2 edge should be visible
      expect(edges.length).toBe(1);
      expect(edges[0]?.source).toBe('file1');
      expect(edges[0]?.target).toBe('file2');
    });

    it('should collapse edges to ancestors when requested', () => {
      const graph = createHierarchicalGraph();
      const ancestorMap = buildAncestorMap(graph.nodes);
      const visibleNodeIds = new Set(['file1', 'file2', 'dir', 'pkg', 'repo']);

      const { edges, collapsedEdges } = filterEdgesByLOD(
        graph.edges,
        5, // Allow all edges by LOD
        visibleNodeIds,
        true,
        ancestorMap
      );

      // class1 -> file2 should collapse to file1 -> file2
      // method1 -> class1 should be skipped (both collapse to same node)
      expect(edges.some((e) => e.source === 'file1' && e.target === 'file2')).toBe(true);
    });
  });

  describe('filterGraphByLOD', () => {
    it('should filter complete graph', () => {
      const graph = createHierarchicalGraph();
      const result = filterGraphByLOD(graph, { currentLevel: 3, minNodesForLOD: 1 });

      expect(result.visibleNodes.length).toBe(5); // repo, pkg, dir, file1, file2
      expect(result.hiddenNodeCount).toBe(2); // class1, method1
    });

    it('should skip filtering for small graphs', () => {
      const graph = createHierarchicalGraph();
      const result = filterGraphByLOD(graph, { currentLevel: 0, minNodesForLOD: 100 });

      // Should return all nodes since graph is small
      expect(result.visibleNodes.length).toBe(graph.nodes.length);
      expect(result.hiddenNodeCount).toBe(0);
    });
  });

  describe('createLODGraph', () => {
    it('should create filtered graph', () => {
      const graph = createHierarchicalGraph();
      const lodGraph = createLODGraph(graph, { currentLevel: 3, minNodesForLOD: 1 });

      expect(lodGraph.nodes.length).toBe(5);
      expect(lodGraph.metadata.stats.totalNodes).toBe(5);
    });
  });

  describe('LOD Transitions', () => {
    it('getNewlyVisibleNodes should find nodes that become visible', () => {
      const graph = createHierarchicalGraph();
      const newNodes = getNewlyVisibleNodes(graph, 3, 4);

      // class1 becomes visible at LOD 4
      expect(newNodes.some((n) => n.id === 'class1')).toBe(true);
      expect(newNodes.some((n) => n.id === 'method1')).toBe(false); // method1 is LOD 5
    });

    it('getNewlyHiddenNodes should find nodes that become hidden', () => {
      const graph = createHierarchicalGraph();
      const hiddenNodes = getNewlyHiddenNodes(graph, 4, 3);

      // class1 becomes hidden when going from LOD 4 to 3
      expect(hiddenNodes.some((n) => n.id === 'class1')).toBe(true);
    });
  });

  describe('LOD Statistics', () => {
    it('getNodeCountsByLOD should count nodes at each level', () => {
      const graph = createHierarchicalGraph();
      const counts = getNodeCountsByLOD(graph);

      expect(counts[0]).toBe(1); // repository
      expect(counts[1]).toBe(1); // package
      expect(counts[2]).toBe(1); // directory
      expect(counts[3]).toBe(2); // files
      expect(counts[4]).toBe(1); // class
      expect(counts[5]).toBe(1); // method
    });

    it('getCumulativeNodeCounts should calculate cumulative counts', () => {
      const graph = createHierarchicalGraph();
      const cumulative = getCumulativeNodeCounts(graph);

      expect(cumulative[0]).toBe(1); // just repo
      expect(cumulative[1]).toBe(2); // repo + pkg
      expect(cumulative[2]).toBe(3); // + dir
      expect(cumulative[3]).toBe(5); // + files
      expect(cumulative[4]).toBe(6); // + class
      expect(cumulative[5]).toBe(7); // + method
    });
  });
});
