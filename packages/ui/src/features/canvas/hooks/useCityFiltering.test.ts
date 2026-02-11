/**
 * useCityFiltering Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCityFiltering } from './useCityFiltering';
import { useCanvasStore } from '../store';
import type { Graph, GraphNode, GraphEdge, Position3D } from '../../../shared/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../layout/engines/clusterUtils', () => ({
  shouldCluster: (count: number, threshold: number) => count > threshold,
  createClusterMetadata: (
    districtId: string,
    nodeIds: string[],
    positions: Map<string, Position3D>,
  ) => ({
    districtId,
    nodeIds,
    nodeCount: nodeIds.length,
    center: { x: 0, y: 0, z: 0 },
    size: { width: 10, depth: 10, height: 5 },
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createNode(
  id: string,
  type: GraphNode['type'] = 'file',
  dir = 'src/features',
  overrides: Partial<GraphNode> = {},
): GraphNode {
  return {
    id,
    type,
    label: id,
    metadata: { path: `${dir}/${id}.ts` },
    lod: 3,
    depth: 1,
    isExternal: false,
    ...overrides,
  };
}

function createEdge(
  source: string,
  target: string,
  type: GraphEdge['type'] = 'imports',
): GraphEdge {
  return {
    id: `${source}--${type}--${target}`,
    source,
    target,
    type,
    metadata: {},
  };
}

function buildPositions(nodes: GraphNode[]): Map<string, Position3D> {
  const positions = new Map<string, Position3D>();
  nodes.forEach((n, i) => {
    positions.set(n.id, { x: i * 5, y: 0, z: i * 3 });
  });
  return positions;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useCityFiltering', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  describe('internal/external split', () => {
    it('separates internal and external nodes', () => {
      const nodes = [
        createNode('a', 'file'),
        createNode('b', 'class'),
        createNode('ext', 'file', 'node_modules/lodash', { isExternal: true }),
      ];
      const graph: Graph = {
        nodes,
        edges: [],
        metadata: { repositoryId: 'test', name: 'T', totalNodes: 3, totalEdges: 0 },
      };
      const positions = buildPositions(nodes);

      const { result } = renderHook(() => useCityFiltering(graph, positions));

      expect(result.current.internalNodes).toHaveLength(2);
      expect(result.current.externalNodes).toHaveLength(1);
      expect(result.current.externalNodes[0]!.id).toBe('ext');
    });
  });

  describe('district grouping', () => {
    it('groups nodes by directory path', () => {
      const nodes = [
        createNode('a', 'file', 'src/features'),
        createNode('b', 'file', 'src/features'),
        createNode('c', 'file', 'src/utils'),
      ];
      const graph: Graph = {
        nodes,
        edges: [],
        metadata: { repositoryId: 'test', name: 'T', totalNodes: 3, totalEdges: 0 },
      };
      const positions = buildPositions(nodes);

      const { result } = renderHook(() => useCityFiltering(graph, positions));

      expect(result.current.districtGroups.get('src/features')).toHaveLength(2);
      expect(result.current.districtGroups.get('src/utils')).toHaveLength(1);
    });

    it('groups nodes without path into root district', () => {
      const nodes = [
        createNode('a', 'file', '', { metadata: {}, label: 'index.ts' }),
      ];
      const graph: Graph = {
        nodes,
        edges: [],
        metadata: { repositoryId: 'test', name: 'T', totalNodes: 1, totalEdges: 0 },
      };
      const positions = buildPositions(nodes);

      const { result } = renderHook(() => useCityFiltering(graph, positions));

      expect(result.current.districtGroups.has('root')).toBe(true);
    });
  });

  describe('clustering at LOD 1', () => {
    it('creates clusters for large districts at LOD 1', () => {
      useCanvasStore.getState().setLodLevel(1);

      const nodes: GraphNode[] = [];
      for (let i = 0; i < 25; i++) {
        nodes.push(createNode(`n-${i}`, 'file', 'src/big'));
      }
      const graph: Graph = {
        nodes,
        edges: [],
        metadata: { repositoryId: 'test', name: 'T', totalNodes: 25, totalEdges: 0 },
      };
      const positions = buildPositions(nodes);

      const { result } = renderHook(() => useCityFiltering(graph, positions));

      expect(result.current.clusters).toHaveLength(1);
      expect(result.current.clusters[0]!.districtId).toBe('src/big');
      expect(result.current.clusteredNodeIds.size).toBe(25);
    });

    it('does not cluster at LOD 2+', () => {
      useCanvasStore.getState().setLodLevel(2);

      const nodes: GraphNode[] = [];
      for (let i = 0; i < 25; i++) {
        nodes.push(createNode(`n-${i}`, 'file', 'src/big'));
      }
      const graph: Graph = {
        nodes,
        edges: [],
        metadata: { repositoryId: 'test', name: 'T', totalNodes: 25, totalEdges: 0 },
      };
      const positions = buildPositions(nodes);

      const { result } = renderHook(() => useCityFiltering(graph, positions));

      expect(result.current.clusters).toHaveLength(0);
      expect(result.current.clusteredNodeIds.size).toBe(0);
    });

    it('does not cluster small districts', () => {
      useCanvasStore.getState().setLodLevel(1);

      const nodes = [
        createNode('a', 'file', 'src/small'),
        createNode('b', 'file', 'src/small'),
      ];
      const graph: Graph = {
        nodes,
        edges: [],
        metadata: { repositoryId: 'test', name: 'T', totalNodes: 2, totalEdges: 0 },
      };
      const positions = buildPositions(nodes);

      const { result } = renderHook(() => useCityFiltering(graph, positions));

      expect(result.current.clusters).toHaveLength(0);
    });
  });

  describe('childrenByFile (x-ray)', () => {
    it('returns empty map when x-ray is off', () => {
      // x-ray is off by default
      const nodes = [
        createNode('file-1', 'file'),
        createNode('class-1', 'class', 'src/features', { parentId: 'file-1' }),
      ];
      const graph: Graph = {
        nodes,
        edges: [],
        metadata: { repositoryId: 'test', name: 'T', totalNodes: 2, totalEdges: 0 },
      };
      const positions = buildPositions(nodes);

      const { result } = renderHook(() => useCityFiltering(graph, positions));

      expect(result.current.childrenByFile.size).toBe(0);
    });

    it('builds parent→children map when x-ray is on', () => {
      useCanvasStore.getState().toggleXRay();

      const nodes = [
        createNode('file-1', 'file'),
        createNode('class-1', 'class', 'src/features', { parentId: 'file-1' }),
        createNode('func-1', 'function', 'src/features', { parentId: 'file-1' }),
      ];
      const graph: Graph = {
        nodes,
        edges: [],
        metadata: { repositoryId: 'test', name: 'T', totalNodes: 3, totalEdges: 0 },
      };
      const positions = buildPositions(nodes);

      const { result } = renderHook(() => useCityFiltering(graph, positions));

      expect(result.current.childrenByFile.get('file-1')).toHaveLength(2);
    });
  });

  describe('nodeMap', () => {
    it('maps every node by id', () => {
      const nodes = [
        createNode('a', 'file'),
        createNode('b', 'class'),
      ];
      const graph: Graph = {
        nodes,
        edges: [],
        metadata: { repositoryId: 'test', name: 'T', totalNodes: 2, totalEdges: 0 },
      };
      const positions = buildPositions(nodes);

      const { result } = renderHook(() => useCityFiltering(graph, positions));

      expect(result.current.nodeMap.size).toBe(2);
      expect(result.current.nodeMap.get('a')!.type).toBe('file');
    });
  });

  describe('visibleEdges', () => {
    it('includes imports edges with both endpoints positioned', () => {
      const nodes = [createNode('a'), createNode('b')];
      const graph: Graph = {
        nodes,
        edges: [createEdge('a', 'b', 'imports')],
        metadata: { repositoryId: 'test', name: 'T', totalNodes: 2, totalEdges: 1 },
      };
      const positions = buildPositions(nodes);

      const { result } = renderHook(() => useCityFiltering(graph, positions));

      expect(result.current.visibleEdges).toHaveLength(1);
    });

    it('filters out contains edges', () => {
      const nodes = [createNode('a'), createNode('b')];
      const graph: Graph = {
        nodes,
        edges: [createEdge('a', 'b', 'contains')],
        metadata: { repositoryId: 'test', name: 'T', totalNodes: 2, totalEdges: 1 },
      };
      const positions = buildPositions(nodes);

      const { result } = renderHook(() => useCityFiltering(graph, positions));

      expect(result.current.visibleEdges).toHaveLength(0);
    });

    it('filters out edges without positioned endpoints', () => {
      const nodes = [createNode('a'), createNode('b')];
      const graph: Graph = {
        nodes,
        edges: [createEdge('a', 'b', 'imports')],
        metadata: { repositoryId: 'test', name: 'T', totalNodes: 2, totalEdges: 1 },
      };
      // Only position node 'a'
      const positions = new Map<string, Position3D>();
      positions.set('a', { x: 0, y: 0, z: 0 });

      const { result } = renderHook(() => useCityFiltering(graph, positions));

      expect(result.current.visibleEdges).toHaveLength(0);
    });

    it('includes depends_on and calls edges', () => {
      const nodes = [createNode('a'), createNode('b'), createNode('c')];
      const graph: Graph = {
        nodes,
        edges: [
          createEdge('a', 'b', 'depends_on'),
          createEdge('b', 'c', 'calls'),
        ],
        metadata: { repositoryId: 'test', name: 'T', totalNodes: 3, totalEdges: 2 },
      };
      const positions = buildPositions(nodes);

      const { result } = renderHook(() => useCityFiltering(graph, positions));

      expect(result.current.visibleEdges).toHaveLength(2);
    });
  });
});
