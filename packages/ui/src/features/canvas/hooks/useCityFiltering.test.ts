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

    it('only counts file nodes toward the clustering threshold', () => {
      useCanvasStore.getState().setLodLevel(1);

      // 5 files (below threshold of 20) + 20 classes — classes must not trigger clustering
      const nodes: GraphNode[] = [];
      for (let i = 0; i < 5; i++) {
        nodes.push(createNode(`file-${i}`, 'file', 'src/big'));
      }
      for (let i = 0; i < 20; i++) {
        nodes.push(createNode(`class-${i}`, 'class', 'src/big', { parentId: `file-${i % 5}` }));
      }
      const graph: Graph = {
        nodes,
        edges: [],
        metadata: { repositoryId: 'test', name: 'T', totalNodes: nodes.length, totalEdges: 0 },
      };
      const positions = buildPositions(nodes);

      const { result } = renderHook(() => useCityFiltering(graph, positions));

      expect(result.current.clusters).toHaveLength(0);
      expect(result.current.clusteredNodeIds.size).toBe(0);
    });

    it('also hides child nodes of clustered files', () => {
      useCanvasStore.getState().setLodLevel(1);

      const nodes: GraphNode[] = [];
      // 25 file nodes — triggers clustering
      for (let i = 0; i < 25; i++) {
        nodes.push(createNode(`file-${i}`, 'file', 'src/big'));
      }
      // 5 classes as children of file-0
      for (let i = 0; i < 5; i++) {
        nodes.push(createNode(`class-${i}`, 'class', 'src/big', { parentId: 'file-0' }));
      }
      // 2 methods as grandchildren (children of class-0)
      for (let i = 0; i < 2; i++) {
        nodes.push(createNode(`method-${i}`, 'method', 'src/big', { parentId: 'class-0' }));
      }
      const graph: Graph = {
        nodes,
        edges: [],
        metadata: { repositoryId: 'test', name: 'T', totalNodes: nodes.length, totalEdges: 0 },
      };
      const positions = buildPositions(nodes);

      const { result } = renderHook(() => useCityFiltering(graph, positions));

      // 25 files + 5 classes + 2 methods = 32 hidden nodes
      expect(result.current.clusteredNodeIds.size).toBe(32);
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

    it('includes inherits edges', () => {
      const nodes = [
        createNode('a', 'file', 'src/models'),
        createNode('b', 'file', 'src/services'),
      ];
      const graph: Graph = {
        nodes,
        edges: [createEdge('a', 'b', 'inherits')],
        metadata: { repositoryId: 'test', name: 'T', totalNodes: 2, totalEdges: 1 },
      };
      const positions = buildPositions(nodes);

      const { result } = renderHook(() => useCityFiltering(graph, positions));

      expect(result.current.visibleEdges).toHaveLength(1);
    });
  });

  describe('visibleEdges — city-v2 cross-district filtering', () => {
    it('hides intra-district imports in v2 mode', () => {
      useCanvasStore.getState().setCityVersion('v2');

      // Both nodes in same directory
      const nodes = [
        createNode('a', 'file', 'src/features'),
        createNode('b', 'file', 'src/features'),
      ];
      const graph: Graph = {
        nodes,
        edges: [createEdge('a', 'b', 'imports')],
        metadata: { repositoryId: 'test', name: 'T', totalNodes: 2, totalEdges: 1 },
      };
      const positions = buildPositions(nodes);

      const { result } = renderHook(() => useCityFiltering(graph, positions));

      expect(result.current.visibleEdges).toHaveLength(0);
    });

    it('shows cross-district imports in v2 mode', () => {
      useCanvasStore.getState().setCityVersion('v2');

      // Nodes in different directories
      const nodes = [
        createNode('a', 'file', 'src/features'),
        createNode('b', 'file', 'src/utils'),
      ];
      const graph: Graph = {
        nodes,
        edges: [createEdge('a', 'b', 'imports')],
        metadata: { repositoryId: 'test', name: 'T', totalNodes: 2, totalEdges: 1 },
      };
      const positions = buildPositions(nodes);

      const { result } = renderHook(() => useCityFiltering(graph, positions));

      expect(result.current.visibleEdges).toHaveLength(1);
    });

    it('shows all edges in v1 mode regardless of district', () => {
      // v1 is the default
      const nodes = [
        createNode('a', 'file', 'src/features'),
        createNode('b', 'file', 'src/features'),
      ];
      const graph: Graph = {
        nodes,
        edges: [createEdge('a', 'b', 'imports')],
        metadata: { repositoryId: 'test', name: 'T', totalNodes: 2, totalEdges: 1 },
      };
      const positions = buildPositions(nodes);

      const { result } = renderHook(() => useCityFiltering(graph, positions));

      expect(result.current.visibleEdges).toHaveLength(1);
    });

    it('still hides contains edges in v2 mode', () => {
      useCanvasStore.getState().setCityVersion('v2');

      const nodes = [
        createNode('a', 'file', 'src/features'),
        createNode('b', 'file', 'src/utils'),
      ];
      const graph: Graph = {
        nodes,
        edges: [createEdge('a', 'b', 'contains')],
        metadata: { repositoryId: 'test', name: 'T', totalNodes: 2, totalEdges: 1 },
      };
      const positions = buildPositions(nodes);

      const { result } = renderHook(() => useCityFiltering(graph, positions));

      expect(result.current.visibleEdges).toHaveLength(0);
    });

    it('hides intra-district depends_on and calls in v2 mode', () => {
      useCanvasStore.getState().setCityVersion('v2');

      const nodes = [
        createNode('a', 'file', 'src/features'),
        createNode('b', 'file', 'src/features'),
        createNode('c', 'file', 'src/features'),
      ];
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

      expect(result.current.visibleEdges).toHaveLength(0);
    });

    it('keeps cross-district inherits in v2 mode', () => {
      useCanvasStore.getState().setCityVersion('v2');

      const nodes = [
        createNode('a', 'file', 'src/models'),
        createNode('b', 'file', 'src/services'),
      ];
      const graph: Graph = {
        nodes,
        edges: [createEdge('a', 'b', 'inherits')],
        metadata: { repositoryId: 'test', name: 'T', totalNodes: 2, totalEdges: 1 },
      };
      const positions = buildPositions(nodes);

      const { result } = renderHook(() => useCityFiltering(graph, positions));

      expect(result.current.visibleEdges).toHaveLength(1);
    });
  });
});
