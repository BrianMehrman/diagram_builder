import { describe, it, expect } from 'vitest';
import type { Graph, GraphNode } from '../../../../shared/types';
import { RadialCityLayoutEngine } from './radialCityLayout';
import type { RadialCityLayoutConfig } from './radialCityLayout';

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

describe('RadialCityLayoutEngine', () => {
  const engine = new RadialCityLayoutEngine();

  describe('type', () => {
    it('should have type "radial-city"', () => {
      expect(engine.type).toBe('radial-city');
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
    it('should position all nodes for a simple graph', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
        makeFileNode('f2', 'src/app.ts', { depth: 1, path: 'src/app.ts' }),
        makeFileNode('f3', 'src/service.ts', { depth: 1, path: 'src/service.ts' }),
        makeFileNode('f4', 'src/db.ts', { depth: 2, path: 'src/db.ts' }),
        makeFileNode('f5', 'src/utils.ts', { depth: 2, path: 'src/utils.ts' }),
      ]);

      const result = engine.layout(graph);

      expect(result.positions.size).toBe(5);
      for (const node of graph.nodes) {
        expect(result.positions.has(node.id)).toBe(true);
      }
    });

    it('should place depth-0 nodes closer to center than deeper nodes', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
        makeFileNode('f2', 'src/deep.ts', { depth: 3, path: 'src/deep.ts' }),
      ]);

      const result = engine.layout(graph);

      const p1 = result.positions.get('f1')!;
      const p2 = result.positions.get('f2')!;

      const dist1 = Math.sqrt(p1.x ** 2 + p1.z ** 2);
      const dist2 = Math.sqrt(p2.x ** 2 + p2.z ** 2);

      expect(dist1).toBeLessThan(dist2);
    });

    it('should position external nodes at outermost ring', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
        makeFileNode('f2', 'src/deep.ts', { depth: 2, path: 'src/deep.ts' }),
        makeFileNode('ext1', 'express', { isExternal: true }),
        makeFileNode('ext2', 'react', { isExternal: true }),
      ]);

      const result = engine.layout(graph);

      const f2Pos = result.positions.get('f2')!;
      const ext1Pos = result.positions.get('ext1')!;

      const f2Dist = Math.sqrt(f2Pos.x ** 2 + f2Pos.z ** 2);
      const ext1Dist = Math.sqrt(ext1Pos.x ** 2 + ext1Pos.z ** 2);

      // External nodes should be further from center than deepest internal nodes
      expect(ext1Dist).toBeGreaterThan(f2Dist);
    });

    it('should handle multiple directories at the same depth', () => {
      const graph = makeGraph([
        makeFileNode('a1', 'src/a/one.ts', { depth: 1, path: 'src/a/one.ts' }),
        makeFileNode('a2', 'src/a/two.ts', { depth: 1, path: 'src/a/two.ts' }),
        makeFileNode('b1', 'src/b/three.ts', { depth: 1, path: 'src/b/three.ts' }),
      ]);

      const result = engine.layout(graph);

      expect(result.positions.size).toBe(3);
      // All positions should be defined
      expect(result.positions.get('a1')).toBeDefined();
      expect(result.positions.get('a2')).toBeDefined();
      expect(result.positions.get('b1')).toBeDefined();
    });

    it('should return valid LayoutResult with bounds and metadata', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
        makeFileNode('f2', 'src/app.ts', { depth: 1, path: 'src/app.ts' }),
      ]);

      const result = engine.layout(graph);

      // Bounds should be defined
      expect(result.bounds).toBeDefined();
      expect(result.bounds.min).toBeDefined();
      expect(result.bounds.max).toBeDefined();

      // Metadata should contain layout info
      expect(result.metadata).toBeDefined();
      expect(result.metadata!.districtCount).toBeDefined();
      expect(result.metadata!.ringCount).toBeDefined();
    });

    it('should apply custom config values', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
        makeFileNode('f2', 'src/deep.ts', { depth: 1, path: 'src/deep.ts' }),
      ]);

      const smallConfig: RadialCityLayoutConfig = {
        centerRadius: 5,
        ringSpacing: 10,
      };
      const largeConfig: RadialCityLayoutConfig = {
        centerRadius: 20,
        ringSpacing: 40,
      };

      const smallResult = engine.layout(graph, smallConfig);
      const largeResult = engine.layout(graph, largeConfig);

      // Larger config should produce positions further from origin
      const smallDist = Math.sqrt(
        smallResult.positions.get('f2')!.x ** 2 +
        smallResult.positions.get('f2')!.z ** 2
      );
      const largeDist = Math.sqrt(
        largeResult.positions.get('f2')!.x ** 2 +
        largeResult.positions.get('f2')!.z ** 2
      );

      expect(largeDist).toBeGreaterThan(smallDist);
    });

    it('should produce deterministic output', () => {
      const graph = makeGraph([
        makeFileNode('f3', 'src/c.ts', { depth: 1, path: 'src/c.ts' }),
        makeFileNode('f1', 'src/a.ts', { depth: 0, path: 'src/a.ts' }),
        makeFileNode('f2', 'src/b.ts', { depth: 1, path: 'src/b.ts' }),
      ]);

      const result1 = engine.layout(graph);
      const result2 = engine.layout(graph);

      for (const [id, pos1] of result1.positions) {
        const pos2 = result2.positions.get(id)!;
        expect(pos1.x).toBe(pos2.x);
        expect(pos1.y).toBe(pos2.y);
        expect(pos1.z).toBe(pos2.z);
      }
    });

    it('should return empty positions for empty graph', () => {
      const graph = makeGraph([]);
      const result = engine.layout(graph);
      expect(result.positions.size).toBe(0);
    });

    it('should only layout file-type nodes', () => {
      const graph: Graph = {
        nodes: [
          makeFileNode('f1', 'src/app.ts', { depth: 0, path: 'src/app.ts' }),
          { id: 'c1', type: 'class', label: 'App', metadata: {}, lod: 0 },
          { id: 'fn1', type: 'function', label: 'main', metadata: {}, lod: 0 },
        ],
        edges: [],
        metadata: { repositoryId: 'test', name: 'Test', totalNodes: 3, totalEdges: 0 },
      };

      const result = engine.layout(graph);

      expect(result.positions.has('f1')).toBe(true);
      expect(result.positions.has('c1')).toBe(false);
      expect(result.positions.has('fn1')).toBe(false);
    });

    it('should set y=0 for all positioned nodes', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
        makeFileNode('f2', 'src/app.ts', { depth: 2, path: 'src/app.ts' }),
        makeFileNode('ext1', 'express', { isExternal: true }),
      ]);

      const result = engine.layout(graph);

      for (const pos of result.positions.values()) {
        expect(pos.y).toBe(0);
      }
    });
  });

  describe('districtArcs metadata', () => {
    it('should include districtArcs in metadata for deeper nodes', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
        makeFileNode('f2', 'src/a/app.ts', { depth: 1, path: 'src/a/app.ts' }),
        makeFileNode('f3', 'src/b/svc.ts', { depth: 1, path: 'src/b/svc.ts' }),
      ]);

      const result = engine.layout(graph);
      const arcs = result.metadata!.districtArcs as Array<{
        id: string;
        arcStart: number;
        arcEnd: number;
        innerRadius: number;
        outerRadius: number;
        ringDepth: number;
        nodeCount: number;
      }>;

      expect(arcs).toBeDefined();
      expect(arcs.length).toBe(2); // Two districts at depth 1
      expect(arcs[0].ringDepth).toBe(1);
      expect(arcs[0].innerRadius).toBeLessThan(arcs[0].outerRadius);
      expect(arcs[0].nodeCount).toBe(1);
    });

    it('should return empty districtArcs when all nodes are entry points', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
      ]);

      const result = engine.layout(graph);
      const arcs = result.metadata!.districtArcs as unknown[];

      expect(arcs).toBeDefined();
      expect(arcs.length).toBe(0);
    });
  });

  describe('config defaults', () => {
    it('should work with no config provided', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
      ]);

      expect(() => engine.layout(graph)).not.toThrow();
    });

    it('should work with partial config', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
      ]);

      expect(() => engine.layout(graph, { ringSpacing: 25 })).not.toThrow();
    });
  });
});
