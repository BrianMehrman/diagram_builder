import { describe, it, expect } from 'vitest';
import type { Graph, GraphNode } from '../../../../shared/types';
import { BuildingLayoutEngine } from './buildingLayout';

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

describe('BuildingLayoutEngine', () => {
  const engine = new BuildingLayoutEngine();

  describe('type', () => {
    it('should have type "building"', () => {
      expect(engine.type).toBe('building');
    });
  });

  describe('canHandle', () => {
    it('should return true when graph has nodes with parentId', () => {
      const graph = makeGraph([
        makeNode('f1', 'file', 'app.ts'),
        makeNode('c1', 'class', 'App', { parentId: 'f1' }),
      ]);
      expect(engine.canHandle(graph)).toBe(true);
    });

    it('should return false when no nodes have parentId', () => {
      const graph = makeGraph([
        makeNode('f1', 'file', 'app.ts'),
      ]);
      expect(engine.canHandle(graph)).toBe(false);
    });

    it('should return false for empty graph', () => {
      expect(engine.canHandle(makeGraph([]))).toBe(false);
    });
  });

  describe('layout', () => {
    it('should position file node at origin', () => {
      const graph = makeGraph([
        makeNode('f1', 'file', 'app.ts'),
      ]);

      const result = engine.layout(graph, {});

      expect(result.positions.get('f1')).toEqual({ x: 0, y: 0, z: 0 });
    });

    it('should position classes as floors stacked vertically', () => {
      const graph = makeGraph([
        makeNode('f1', 'file', 'models.ts'),
        makeNode('c1', 'class', 'User', { parentId: 'f1' }),
        makeNode('c2', 'class', 'Admin', { parentId: 'f1' }),
      ]);

      const result = engine.layout(graph, { floorHeight: 4 });

      const c1Pos = result.positions.get('c1')!;
      const c2Pos = result.positions.get('c2')!;

      // Classes should be at different Y levels (sorted alphabetically: Admin, User)
      expect(c1Pos.y).not.toBe(c2Pos.y);
      // Each floor at a multiple of floorHeight
      expect(c1Pos.y % 4).toBe(0);
      expect(c2Pos.y % 4).toBe(0);
    });

    it('should put file-level functions on ground floor', () => {
      const graph = makeGraph([
        makeNode('f1', 'file', 'utils.ts'),
        makeNode('fn1', 'function', 'helper', { parentId: 'f1' }),
        makeNode('fn2', 'function', 'format', { parentId: 'f1' }),
        makeNode('c1', 'class', 'Util', { parentId: 'f1' }),
      ]);

      const result = engine.layout(graph, { floorHeight: 4 });

      const fn1Pos = result.positions.get('fn1')!;
      const fn2Pos = result.positions.get('fn2')!;
      const clasPos = result.positions.get('c1')!;

      // Functions should be on the ground floor (lowest Y)
      expect(fn1Pos.y).toBeLessThan(clasPos.y);
      expect(fn2Pos.y).toBeLessThan(clasPos.y);
    });

    it('should handle file with only functions (no classes)', () => {
      const graph = makeGraph([
        makeNode('f1', 'file', 'helpers.ts'),
        makeNode('fn1', 'function', 'add', { parentId: 'f1' }),
        makeNode('fn2', 'function', 'sub', { parentId: 'f1' }),
      ]);

      const result = engine.layout(graph, {});

      expect(result.positions.has('fn1')).toBe(true);
      expect(result.positions.has('fn2')).toBe(true);
      // Both on ground floor
      expect(result.positions.get('fn1')!.y).toBe(result.positions.get('fn2')!.y);
    });

    it('should handle file with only classes (no loose functions)', () => {
      const graph = makeGraph([
        makeNode('f1', 'file', 'models.ts'),
        makeNode('c1', 'class', 'User', { parentId: 'f1' }),
      ]);

      const result = engine.layout(graph, { floorHeight: 4 });

      expect(result.positions.has('c1')).toBe(true);
      expect(result.positions.get('c1')!.y).toBe(0); // First floor at Y=0
    });

    it('should return empty positions for graph with no file node', () => {
      const graph = makeGraph([
        makeNode('c1', 'class', 'Orphan'),
      ]);

      const result = engine.layout(graph, {});

      expect(result.positions.size).toBe(0);
    });

    it('should produce deterministic output', () => {
      const graph = makeGraph([
        makeNode('f1', 'file', 'app.ts'),
        makeNode('c2', 'class', 'Zebra', { parentId: 'f1' }),
        makeNode('c1', 'class', 'Alpha', { parentId: 'f1' }),
      ]);

      const r1 = engine.layout(graph, {});
      const r2 = engine.layout(graph, {});

      for (const [id, pos1] of r1.positions) {
        const pos2 = r2.positions.get(id)!;
        expect(pos1).toEqual(pos2);
      }
    });

    it('should compute building bounds', () => {
      const graph = makeGraph([
        makeNode('f1', 'file', 'app.ts'),
        makeNode('c1', 'class', 'A', { parentId: 'f1' }),
        makeNode('c2', 'class', 'B', { parentId: 'f1' }),
      ]);

      const result = engine.layout(graph, { floorHeight: 4 });

      expect(result.bounds.min.y).toBeLessThanOrEqual(0);
      expect(result.bounds.max.y).toBeGreaterThan(0);
    });

    it('should include floor metadata', () => {
      const graph = makeGraph([
        makeNode('f1', 'file', 'models.ts'),
        makeNode('c1', 'class', 'User', { parentId: 'f1' }),
        makeNode('c2', 'class', 'Admin', { parentId: 'f1' }),
      ]);

      const result = engine.layout(graph, { floorHeight: 4 });

      expect(result.metadata).toBeDefined();
      expect(result.metadata!.floorCount).toBeGreaterThanOrEqual(2);
      expect(result.metadata!.floorHeight).toBe(4);
    });

    it('should use file node position as building origin when available', () => {
      const graph = makeGraph([
        makeNode('f1', 'file', 'app.ts', { position: { x: 10, y: 5, z: 20 } }),
        makeNode('c1', 'class', 'App', { parentId: 'f1' }),
      ]);

      const result = engine.layout(graph, {});

      const filePos = result.positions.get('f1')!;
      expect(filePos).toEqual({ x: 10, y: 5, z: 20 });

      // Class should be positioned relative to the file's origin
      const classPos = result.positions.get('c1')!;
      expect(classPos.x).toBeGreaterThanOrEqual(10);
    });

    it('should respect custom config values', () => {
      const graph = makeGraph([
        makeNode('f1', 'file', 'app.ts'),
        makeNode('c1', 'class', 'A', { parentId: 'f1' }),
        makeNode('c2', 'class', 'B', { parentId: 'f1' }),
      ]);

      const result = engine.layout(graph, {
        floorHeight: 10,
        roomSize: 5,
        roomSpacing: 2,
        wallPadding: 3,
      });

      // Second class should be at floorHeight = 10
      const positions = Array.from(result.positions.values());
      const yValues = positions.map((p) => p.y).filter((y) => y > 0);
      expect(yValues.some((y) => y === 10)).toBe(true);
    });
  });
});
