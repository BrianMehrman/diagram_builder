import { describe, it, expect } from 'vitest';
import type { Graph, GraphNode } from '../../../../shared/types';
import { CellLayoutEngine } from './cellLayout';

function makeNode(
  id: string,
  type: GraphNode['type'],
  label: string,
  opts: { parentId?: string; position?: { x: number; y: number; z: number } } = {}
): GraphNode {
  return {
    id,
    type,
    label,
    metadata: {},
    lod: 0,
    parentId: opts.parentId,
    position: opts.position,
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

function distance(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

describe('CellLayoutEngine', () => {
  const engine = new CellLayoutEngine();

  describe('type', () => {
    it('should have type "cell"', () => {
      expect(engine.type).toBe('cell');
    });
  });

  describe('canHandle', () => {
    it('should return true when graph has nodes with parentId', () => {
      const graph = makeGraph([
        makeNode('c1', 'class', 'MyClass'),
        makeNode('m1', 'method', 'doStuff', { parentId: 'c1' }),
      ]);
      expect(engine.canHandle(graph)).toBe(true);
    });

    it('should return false when no nodes have parentId', () => {
      const graph = makeGraph([makeNode('c1', 'class', 'MyClass')]);
      expect(engine.canHandle(graph)).toBe(false);
    });

    it('should return false for empty graph', () => {
      expect(engine.canHandle(makeGraph([]))).toBe(false);
    });
  });

  describe('layout', () => {
    it('should position cell node at center', () => {
      const graph = makeGraph([
        makeNode('c1', 'class', 'MyClass'),
        makeNode('m1', 'method', 'run', { parentId: 'c1' }),
      ]);

      const result = engine.layout(graph, {});

      expect(result.positions.get('c1')).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should use cell node position as center when available', () => {
      const graph = makeGraph([
        makeNode('c1', 'class', 'MyClass', { position: { x: 10, y: 5, z: 20 } }),
        makeNode('m1', 'method', 'run', { parentId: 'c1' }),
      ]);

      const result = engine.layout(graph, {});

      expect(result.positions.get('c1')).toEqual({ x: 10, y: 5, z: 20 });
    });

    it('should position all organelles within membrane radius', () => {
      const graph = makeGraph([
        makeNode('c1', 'class', 'MyClass'),
        makeNode('m1', 'method', 'alpha', { parentId: 'c1' }),
        makeNode('m2', 'method', 'beta', { parentId: 'c1' }),
        makeNode('m3', 'method', 'gamma', { parentId: 'c1' }),
        makeNode('m4', 'function', 'helper', { parentId: 'c1' }),
        makeNode('v1', 'variable', 'state', { parentId: 'c1' }),
      ]);

      const membraneRadius = 15;
      const result = engine.layout(graph, { membraneRadius });
      const center = result.positions.get('c1')!;

      for (const [id, pos] of result.positions) {
        if (id === 'c1') continue;
        const dist = distance(center, pos);
        expect(dist).toBeLessThanOrEqual(membraneRadius + 0.01);
      }
    });

    it('should position variable nodes closer to center than methods', () => {
      const graph = makeGraph([
        makeNode('c1', 'class', 'MyClass'),
        makeNode('v1', 'variable', 'state', { parentId: 'c1' }),
        makeNode('v2', 'variable', 'count', { parentId: 'c1' }),
        makeNode('m1', 'method', 'doStuff', { parentId: 'c1' }),
        makeNode('m2', 'method', 'process', { parentId: 'c1' }),
        makeNode('m3', 'method', 'render', { parentId: 'c1' }),
        makeNode('m4', 'method', 'update', { parentId: 'c1' }),
      ]);

      const result = engine.layout(graph, { membraneRadius: 15, nucleusRadius: 3 });
      const center = result.positions.get('c1')!;

      const varDistances = ['v1', 'v2'].map((id) =>
        distance(center, result.positions.get(id)!)
      );
      const methodDistances = ['m1', 'm2', 'm3', 'm4'].map((id) =>
        distance(center, result.positions.get(id)!)
      );

      const avgVarDist = varDistances.reduce((a, b) => a + b, 0) / varDistances.length;
      const avgMethodDist = methodDistances.reduce((a, b) => a + b, 0) / methodDistances.length;

      expect(avgVarDist).toBeLessThan(avgMethodDist);
    });

    it('should produce deterministic output', () => {
      const graph = makeGraph([
        makeNode('c1', 'class', 'MyClass'),
        makeNode('m1', 'method', 'alpha', { parentId: 'c1' }),
        makeNode('m2', 'method', 'beta', { parentId: 'c1' }),
        makeNode('v1', 'variable', 'state', { parentId: 'c1' }),
      ]);

      const r1 = engine.layout(graph, {});
      const r2 = engine.layout(graph, {});

      for (const [id, pos1] of r1.positions) {
        const pos2 = r2.positions.get(id)!;
        expect(pos1.x).toBeCloseTo(pos2.x, 10);
        expect(pos1.y).toBeCloseTo(pos2.y, 10);
        expect(pos1.z).toBeCloseTo(pos2.z, 10);
      }
    });

    it('should return empty positions when no cell node found', () => {
      const graph = makeGraph([
        makeNode('m1', 'method', 'orphan'),
      ]);

      const result = engine.layout(graph, {});
      expect(result.positions.size).toBe(0);
    });

    it('should handle cell with no children', () => {
      const graph = makeGraph([
        makeNode('c1', 'class', 'EmptyClass'),
      ]);

      const result = engine.layout(graph, {});

      expect(result.positions.size).toBe(1);
      expect(result.positions.has('c1')).toBe(true);
    });

    it('should include cell metadata', () => {
      const graph = makeGraph([
        makeNode('c1', 'class', 'MyClass'),
        makeNode('m1', 'method', 'run', { parentId: 'c1' }),
      ]);

      const result = engine.layout(graph, { membraneRadius: 12, nucleusRadius: 4 });

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.membraneRadius).toBe(12);
      expect(result.metadata!.nucleusRadius).toBe(4);
    });

    it('should compute spherical bounds around the cell', () => {
      const membraneRadius = 10;
      const graph = makeGraph([
        makeNode('c1', 'class', 'MyClass'),
        makeNode('m1', 'method', 'run', { parentId: 'c1' }),
      ]);

      const result = engine.layout(graph, { membraneRadius });

      expect(result.bounds.min).toEqual({ x: -membraneRadius, y: -membraneRadius, z: -membraneRadius });
      expect(result.bounds.max).toEqual({ x: membraneRadius, y: membraneRadius, z: membraneRadius });
    });

    it('should handle many organelles without overlap issues', () => {
      const nodes: GraphNode[] = [makeNode('c1', 'class', 'BigClass')];
      for (let i = 0; i < 20; i++) {
        nodes.push(makeNode(`m${i}`, 'method', `method${i}`, { parentId: 'c1' }));
      }

      const graph = makeGraph(nodes);
      const result = engine.layout(graph, { membraneRadius: 20 });

      // All 21 nodes should be positioned
      expect(result.positions.size).toBe(21);
    });
  });
});
