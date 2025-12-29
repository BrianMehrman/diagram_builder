/**
 * IVM Builder Tests
 */

import { describe, it, expect } from 'vitest';
import {
  generateEdgeId,
  generateId,
  assignLOD,
  assignEdgeLOD,
  createDefaultPosition,
  assignInitialPositions,
  assignHierarchicalPositions,
  calculateBounds,
  calculateStats,
  createNode,
  createNodes,
  createEdge,
  createEdges,
  buildGraph,
  addNode,
  addEdge,
  removeNode,
  removeEdge,
  updateNode,
  IVMBuilder,
  createBuilder,
} from './builder.js';
import type { NodeInput, EdgeInput, IVMNode } from './types.js';

describe('IVM Builder', () => {
  describe('generateEdgeId', () => {
    it('should generate consistent edge IDs', () => {
      const id = generateEdgeId('source', 'target', 'imports');
      expect(id).toBe('source--imports-->target');
    });

    it('should generate unique IDs for different edges', () => {
      const id1 = generateEdgeId('a', 'b', 'imports');
      const id2 = generateEdgeId('a', 'b', 'extends');
      const id3 = generateEdgeId('b', 'a', 'imports');

      expect(id1).not.toBe(id2);
      expect(id1).not.toBe(id3);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });

    it('should use prefix when provided', () => {
      const id = generateId('custom');
      expect(id).toMatch(/^custom_/);
    });
  });

  describe('assignLOD', () => {
    it('should assign correct LOD for repository', () => {
      expect(assignLOD('repository')).toBe(0);
    });

    it('should assign correct LOD for package/namespace', () => {
      expect(assignLOD('package')).toBe(1);
      expect(assignLOD('namespace')).toBe(1);
    });

    it('should assign correct LOD for directory/module', () => {
      expect(assignLOD('directory')).toBe(2);
      expect(assignLOD('module')).toBe(2);
    });

    it('should assign correct LOD for file', () => {
      expect(assignLOD('file')).toBe(3);
    });

    it('should assign correct LOD for class-level items', () => {
      expect(assignLOD('class')).toBe(4);
      expect(assignLOD('interface')).toBe(4);
      expect(assignLOD('function')).toBe(4);
      expect(assignLOD('enum')).toBe(4);
    });

    it('should assign correct LOD for detail items', () => {
      expect(assignLOD('method')).toBe(5);
      expect(assignLOD('variable')).toBe(5);
      expect(assignLOD('type')).toBe(5);
    });
  });

  describe('assignEdgeLOD', () => {
    it('should use maximum LOD of connected nodes', () => {
      expect(assignEdgeLOD(2, 3)).toBe(3);
      expect(assignEdgeLOD(4, 1)).toBe(4);
      expect(assignEdgeLOD(3, 3)).toBe(3);
    });
  });

  describe('createDefaultPosition', () => {
    it('should return origin position', () => {
      const pos = createDefaultPosition();
      expect(pos).toEqual({ x: 0, y: 0, z: 0 });
    });
  });

  describe('assignInitialPositions', () => {
    it('should assign grid positions to nodes', () => {
      const nodes: IVMNode[] = [
        createNode({ id: 'n1', type: 'file', metadata: { label: 'a', path: '/a' } }),
        createNode({ id: 'n2', type: 'file', metadata: { label: 'b', path: '/b' } }),
        createNode({ id: 'n3', type: 'file', metadata: { label: 'c', path: '/c' } }),
        createNode({ id: 'n4', type: 'file', metadata: { label: 'd', path: '/d' } }),
      ];

      assignInitialPositions(nodes, 100);

      // Check all nodes have valid positions
      for (const node of nodes) {
        expect(Number.isFinite(node.position.x)).toBe(true);
        expect(Number.isFinite(node.position.y)).toBe(true);
        expect(Number.isFinite(node.position.z)).toBe(true);
      }

      // Check nodes have different x or z positions
      const positions = nodes.map((n) => `${n.position.x},${n.position.z}`);
      const uniquePositions = new Set(positions);
      expect(uniquePositions.size).toBe(4);
    });
  });

  describe('assignHierarchicalPositions', () => {
    it('should assign hierarchical positions based on parent-child', () => {
      const nodes: IVMNode[] = [
        createNode({ id: 'root', type: 'directory', metadata: { label: 'root', path: '/' } }),
        createNode({
          id: 'child1',
          type: 'file',
          parentId: 'root',
          metadata: { label: 'child1', path: '/child1' },
        }),
        createNode({
          id: 'child2',
          type: 'file',
          parentId: 'root',
          metadata: { label: 'child2', path: '/child2' },
        }),
      ];

      assignHierarchicalPositions(nodes);

      // Root should be at y=0
      const root = nodes.find((n) => n.id === 'root');
      expect(root?.position.y).toBe(0);

      // Children should be below root (negative y)
      const child1 = nodes.find((n) => n.id === 'child1');
      const child2 = nodes.find((n) => n.id === 'child2');
      expect(child1?.position.y).toBeLessThan(0);
      expect(child2?.position.y).toBeLessThan(0);
    });
  });

  describe('calculateBounds', () => {
    it('should return zero bounds for empty array', () => {
      const bounds = calculateBounds([]);
      expect(bounds.min).toEqual({ x: 0, y: 0, z: 0 });
      expect(bounds.max).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should calculate correct bounds', () => {
      const nodes: IVMNode[] = [
        {
          id: 'n1',
          type: 'file',
          position: { x: -10, y: 5, z: 0 },
          lod: 3,
          metadata: { label: 'a', path: '/a' },
        },
        {
          id: 'n2',
          type: 'file',
          position: { x: 20, y: -5, z: 15 },
          lod: 3,
          metadata: { label: 'b', path: '/b' },
        },
      ];

      const bounds = calculateBounds(nodes);
      expect(bounds.min).toEqual({ x: -10, y: -5, z: 0 });
      expect(bounds.max).toEqual({ x: 20, y: 5, z: 15 });
    });
  });

  describe('calculateStats', () => {
    it('should calculate correct statistics', () => {
      const nodes: IVMNode[] = [
        {
          id: 'n1',
          type: 'file',
          position: { x: 0, y: 0, z: 0 },
          lod: 3,
          metadata: { label: 'a', path: '/a', loc: 100, complexity: 5 },
        },
        {
          id: 'n2',
          type: 'class',
          position: { x: 0, y: 0, z: 0 },
          lod: 4,
          metadata: { label: 'b', path: '/b', loc: 50, complexity: 10 },
        },
      ];

      const edges = [
        { id: 'e1', source: 'n1', target: 'n2', type: 'imports' as const, lod: 4 as const, metadata: {} },
        { id: 'e2', source: 'n1', target: 'n2', type: 'imports' as const, lod: 4 as const, metadata: {} },
      ];

      const stats = calculateStats(nodes, edges);

      expect(stats.totalNodes).toBe(2);
      expect(stats.totalEdges).toBe(2);
      expect(stats.nodesByType['file']).toBe(1);
      expect(stats.nodesByType['class']).toBe(1);
      expect(stats.edgesByType['imports']).toBe(2);
      expect(stats.totalLoc).toBe(150);
      expect(stats.avgComplexity).toBe(7.5);
    });
  });

  describe('createNode', () => {
    it('should create a node with auto-assigned LOD and position', () => {
      const input: NodeInput = {
        id: 'test-node',
        type: 'class',
        metadata: { label: 'MyClass', path: '/src/MyClass.ts' },
      };

      const node = createNode(input);

      expect(node.id).toBe('test-node');
      expect(node.type).toBe('class');
      expect(node.lod).toBe(4); // class LOD
      expect(node.position).toEqual({ x: 0, y: 0, z: 0 });
      expect(node.metadata.label).toBe('MyClass');
    });
  });

  describe('createEdge', () => {
    it('should create an edge with auto-generated ID and LOD', () => {
      const nodeMap = new Map<string, IVMNode>([
        ['n1', { id: 'n1', type: 'file', position: { x: 0, y: 0, z: 0 }, lod: 3, metadata: { label: 'a', path: '/a' } }],
        ['n2', { id: 'n2', type: 'class', position: { x: 0, y: 0, z: 0 }, lod: 4, metadata: { label: 'b', path: '/b' } }],
      ]);

      const input: EdgeInput = {
        source: 'n1',
        target: 'n2',
        type: 'imports',
      };

      const edge = createEdge(input, nodeMap);

      expect(edge.id).toBe('n1--imports-->n2');
      expect(edge.source).toBe('n1');
      expect(edge.target).toBe('n2');
      expect(edge.type).toBe('imports');
      expect(edge.lod).toBe(4); // max(3, 4)
    });
  });

  describe('buildGraph', () => {
    it('should build a complete graph', () => {
      const graph = buildGraph({
        nodes: [
          { id: 'n1', type: 'file', metadata: { label: 'a.ts', path: '/a.ts' } },
          { id: 'n2', type: 'file', metadata: { label: 'b.ts', path: '/b.ts' } },
        ],
        edges: [{ source: 'n1', target: 'n2', type: 'imports' }],
        metadata: {
          name: 'test-project',
          rootPath: '/project',
        },
      });

      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(1);
      expect(graph.metadata.name).toBe('test-project');
      expect(graph.metadata.schemaVersion).toBe('1.0.0');
      expect(graph.metadata.generatedAt).toBeDefined();
      expect(graph.metadata.stats.totalNodes).toBe(2);
      expect(graph.bounds).toBeDefined();
    });

    it('should update dependency counts', () => {
      const graph = buildGraph({
        nodes: [
          { id: 'n1', type: 'file', metadata: { label: 'a.ts', path: '/a.ts' } },
          { id: 'n2', type: 'file', metadata: { label: 'b.ts', path: '/b.ts' } },
        ],
        edges: [{ source: 'n1', target: 'n2', type: 'imports' }],
        metadata: { name: 'test', rootPath: '/' },
      });

      const n1 = graph.nodes.find((n) => n.id === 'n1');
      const n2 = graph.nodes.find((n) => n.id === 'n2');

      expect(n1?.metadata.dependencyCount).toBe(1);
      expect(n2?.metadata.dependentCount).toBe(1);
    });
  });

  describe('Graph manipulation', () => {
    const baseGraph = buildGraph({
      nodes: [
        { id: 'n1', type: 'file', metadata: { label: 'a.ts', path: '/a.ts' } },
        { id: 'n2', type: 'file', metadata: { label: 'b.ts', path: '/b.ts' } },
      ],
      edges: [{ source: 'n1', target: 'n2', type: 'imports' }],
      metadata: { name: 'test', rootPath: '/' },
    });

    it('should add a node', () => {
      const updated = addNode(baseGraph, {
        id: 'n3',
        type: 'file',
        metadata: { label: 'c.ts', path: '/c.ts' },
      });

      expect(updated.nodes).toHaveLength(3);
      expect(updated.metadata.stats.totalNodes).toBe(3);
    });

    it('should add an edge', () => {
      const updated = addEdge(baseGraph, {
        source: 'n2',
        target: 'n1',
        type: 'imports',
      });

      expect(updated.edges).toHaveLength(2);
      expect(updated.metadata.stats.totalEdges).toBe(2);
    });

    it('should remove a node and its edges', () => {
      const updated = removeNode(baseGraph, 'n1');

      expect(updated.nodes).toHaveLength(1);
      expect(updated.edges).toHaveLength(0); // Edge was connected to n1
      expect(updated.metadata.stats.totalNodes).toBe(1);
    });

    it('should remove an edge', () => {
      const updated = removeEdge(baseGraph, 'n1--imports-->n2');

      expect(updated.edges).toHaveLength(0);
      expect(updated.metadata.stats.totalEdges).toBe(0);
    });

    it('should update a node', () => {
      const updated = updateNode(baseGraph, 'n1', {
        position: { x: 100, y: 200, z: 300 },
      });

      const n1 = updated.nodes.find((n) => n.id === 'n1');
      expect(n1?.position).toEqual({ x: 100, y: 200, z: 300 });
    });
  });

  describe('IVMBuilder class', () => {
    it('should build graph using fluent API', () => {
      const graph = createBuilder('my-project', '/project')
        .withRepository('https://github.com/user/repo', 'main', 'abc123')
        .withProperties({ custom: 'value' })
        .addNode({ id: 'n1', type: 'file', metadata: { label: 'a.ts', path: '/a.ts' } })
        .addNode({ id: 'n2', type: 'file', metadata: { label: 'b.ts', path: '/b.ts' } })
        .addEdge({ source: 'n1', target: 'n2', type: 'imports' })
        .build();

      expect(graph.metadata.name).toBe('my-project');
      expect(graph.metadata.rootPath).toBe('/project');
      expect(graph.metadata.repositoryUrl).toBe('https://github.com/user/repo');
      expect(graph.metadata.branch).toBe('main');
      expect(graph.metadata.commit).toBe('abc123');
      expect(graph.metadata.properties?.['custom']).toBe('value');
      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(1);
    });

    it('should support bulk add operations', () => {
      const graph = createBuilder('test', '/')
        .addNodes([
          { id: 'n1', type: 'file', metadata: { label: 'a', path: '/a' } },
          { id: 'n2', type: 'file', metadata: { label: 'b', path: '/b' } },
        ])
        .addEdges([
          { source: 'n1', target: 'n2', type: 'imports' },
          { source: 'n2', target: 'n1', type: 'imports' },
        ])
        .build();

      expect(graph.nodes).toHaveLength(2);
      expect(graph.edges).toHaveLength(2);
    });
  });
});
