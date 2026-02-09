import { describe, it, expect } from 'vitest';
import type { Graph, GraphNode } from '../../../../shared/types';
import { CityLayoutEngine } from './cityLayout';

function makeFileNode(
  id: string,
  label: string,
  opts: { depth?: number; isExternal?: boolean; path?: string } = {}
): GraphNode {
  return {
    id,
    type: 'file',
    label,
    metadata: { path: opts.path ?? label },
    lod: 0,
    depth: opts.depth ?? 0,
    isExternal: opts.isExternal ?? false,
  };
}

function makeGraph(nodes: GraphNode[]): Graph {
  return {
    nodes,
    edges: [],
    metadata: {
      repositoryId: 'test',
      name: 'Test',
      totalNodes: nodes.length,
      totalEdges: 0,
    },
  };
}

describe('CityLayoutEngine', () => {
  const engine = new CityLayoutEngine();

  describe('type', () => {
    it('should have type "city"', () => {
      expect(engine.type).toBe('city');
    });
  });

  describe('canHandle', () => {
    it('should return true when graph has file nodes', () => {
      const graph = makeGraph([makeFileNode('1', 'index.ts')]);
      expect(engine.canHandle(graph)).toBe(true);
    });

    it('should return false when graph has no file nodes', () => {
      const graph = makeGraph([
        { id: '1', type: 'class', label: 'Foo', metadata: {}, lod: 0 },
      ]);
      expect(engine.canHandle(graph)).toBe(false);
    });

    it('should return false for empty graph', () => {
      const graph = makeGraph([]);
      expect(engine.canHandle(graph)).toBe(false);
    });
  });

  describe('layout', () => {
    it('should position a single file at origin with depth=0', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0 }),
      ]);

      const result = engine.layout(graph, {});

      const pos = result.positions.get('f1');
      expect(pos).toBeDefined();
      expect(pos!.y).toBe(0); // depth 0 * floorHeight = 0
    });

    it('should set Y position from depth', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0 }),
        makeFileNode('f2', 'src/service.ts', { depth: 1 }),
        makeFileNode('f3', 'src/db.ts', { depth: 2 }),
      ]);

      const result = engine.layout(graph, { floorHeight: 5 });

      expect(result.positions.get('f1')!.y).toBe(0);
      expect(result.positions.get('f2')!.y).toBe(5);
      expect(result.positions.get('f3')!.y).toBe(10);
    });

    it('should handle undefined depth as 0', () => {
      const node = makeFileNode('f1', 'src/app.ts');
      delete (node as Partial<GraphNode>).depth;
      const graph = makeGraph([node]);

      const result = engine.layout(graph, {});

      expect(result.positions.get('f1')!.y).toBe(0);
    });

    it('should group files by directory', () => {
      const graph = makeGraph([
        makeFileNode('a1', 'src/a/one.ts', { path: 'src/a/one.ts' }),
        makeFileNode('a2', 'src/a/two.ts', { path: 'src/a/two.ts' }),
        makeFileNode('b1', 'src/b/three.ts', { path: 'src/b/three.ts' }),
      ]);

      const result = engine.layout(graph, {});

      // Files in same directory should be closer together than files in different directories
      const a1 = result.positions.get('a1')!;
      const a2 = result.positions.get('a2')!;
      const b1 = result.positions.get('b1')!;

      // a1 and a2 are in same neighborhood, should be closer in X
      const distA = Math.abs(a1.x - a2.x) + Math.abs(a1.z - a2.z);
      const distAB = Math.abs(a1.x - b1.x) + Math.abs(a1.z - b1.z);

      expect(distAB).toBeGreaterThan(distA);
    });

    it('should position external nodes in a ring', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts'),
        makeFileNode('ext1', 'express', { isExternal: true }),
        makeFileNode('ext2', 'react', { isExternal: true }),
      ]);

      const result = engine.layout(graph, { externalRingRadius: 50 });

      const ext1 = result.positions.get('ext1')!;
      const ext2 = result.positions.get('ext2')!;

      // External nodes should be at ring radius distance from origin
      const dist1 = Math.sqrt(ext1.x ** 2 + ext1.z ** 2);
      const dist2 = Math.sqrt(ext2.x ** 2 + ext2.z ** 2);

      expect(dist1).toBeCloseTo(50, 0);
      expect(dist2).toBeCloseTo(50, 0);
    });

    it('should produce deterministic output', () => {
      const graph = makeGraph([
        makeFileNode('f3', 'src/c.ts'),
        makeFileNode('f1', 'src/a.ts'),
        makeFileNode('f2', 'src/b.ts'),
      ]);

      const result1 = engine.layout(graph, {});
      const result2 = engine.layout(graph, {});

      for (const [id, pos1] of result1.positions) {
        const pos2 = result2.positions.get(id)!;
        expect(pos1.x).toBe(pos2.x);
        expect(pos1.y).toBe(pos2.y);
        expect(pos1.z).toBe(pos2.z);
      }
    });

    it('should return empty positions for empty graph', () => {
      const graph = makeGraph([]);

      const result = engine.layout(graph, {});

      expect(result.positions.size).toBe(0);
    });

    it('should compute bounding box', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/a.ts', { depth: 0 }),
        makeFileNode('f2', 'src/b.ts', { depth: 2 }),
      ]);

      const result = engine.layout(graph, { floorHeight: 3 });

      expect(result.bounds.min.y).toBe(0);
      expect(result.bounds.max.y).toBe(6); // depth 2 * floorHeight 3
    });

    it('should include metadata with neighborhood and external counts', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/a/one.ts', { path: 'src/a/one.ts' }),
        makeFileNode('f2', 'src/b/two.ts', { path: 'src/b/two.ts' }),
        makeFileNode('ext1', 'lodash', { isExternal: true }),
      ]);

      const result = engine.layout(graph, {});

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.neighborhoodCount).toBe(2);
      expect(result.metadata!.externalCount).toBe(1);
    });

    it('should only layout file-type nodes, ignoring class/function nodes', () => {
      const graph: Graph = {
        nodes: [
          makeFileNode('f1', 'src/app.ts'),
          { id: 'c1', type: 'class', label: 'App', metadata: {}, lod: 0 },
          { id: 'fn1', type: 'function', label: 'main', metadata: {}, lod: 0 },
        ],
        edges: [],
        metadata: { repositoryId: 'test', name: 'Test', totalNodes: 3, totalEdges: 0 },
      };

      const result = engine.layout(graph, {});

      // Only the file node should be positioned
      expect(result.positions.has('f1')).toBe(true);
      expect(result.positions.has('c1')).toBe(false);
      expect(result.positions.has('fn1')).toBe(false);
    });

    it('should respect custom config values', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/a.ts', { depth: 1 }),
        makeFileNode('f2', 'src/b.ts', { depth: 0 }),
      ]);

      const result = engine.layout(graph, {
        buildingSize: 4,
        streetWidth: 2,
        floorHeight: 10,
      });

      // f1 has depth 1, floorHeight 10
      expect(result.positions.get('f1')!.y).toBe(10);
      expect(result.positions.get('f2')!.y).toBe(0);
    });
  });
});
