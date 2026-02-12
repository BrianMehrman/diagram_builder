import { describe, it, expect } from 'vitest';
import type { Graph, GraphNode, GraphEdge } from '../../../../shared/types';
import { RadialCityLayoutEngine } from './radialCityLayout';
import type { RadialCityLayoutConfig, InfrastructureZoneMetadata } from './radialCityLayout';
import type { HierarchicalLayoutResult } from '../types';

function makeFileNode(
  id: string,
  label: string,
  opts: { depth?: number; isExternal?: boolean; path?: string; infrastructureType?: string } = {}
): GraphNode {
  const metadata: Record<string, unknown> = { path: opts.path ?? label };
  if (opts.infrastructureType) {
    metadata.infrastructureType = opts.infrastructureType;
  }
  return {
    id,
    type: 'file',
    label,
    metadata,
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

    it('should return true when graph has any nodes', () => {
      const graph = makeGraph([
        { id: '1', type: 'class', label: 'Foo', metadata: {}, lod: 0 },
      ]);
      expect(engine.canHandle(graph)).toBe(true);
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

    it('should layout all non-external node types', () => {
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
      expect(result.positions.has('c1')).toBe(true);
      expect(result.positions.has('fn1')).toBe(true);
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

  describe('infrastructure zones', () => {
    it('should group external nodes by infrastructureType into separate zones', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
        makeFileNode('db1', 'pg', { isExternal: true, infrastructureType: 'database' }),
        makeFileNode('db2', 'mongoose', { isExternal: true, infrastructureType: 'database' }),
        makeFileNode('api1', 'express', { isExternal: true, infrastructureType: 'api' }),
      ]);

      const result = engine.layout(graph);
      const zones = result.metadata!.infrastructureZones as InfrastructureZoneMetadata[];

      expect(zones).toBeDefined();
      expect(zones.length).toBe(2); // database and api zones
      expect(zones[0]!.type).toBe('database');
      expect(zones[0]!.nodeCount).toBe(2);
      expect(zones[1]!.type).toBe('api');
      expect(zones[1]!.nodeCount).toBe(1);
    });

    it('should follow ZONE_ORDER for consistent zone positioning', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
        makeFileNode('log1', 'winston', { isExternal: true, infrastructureType: 'logging' }),
        makeFileNode('db1', 'pg', { isExternal: true, infrastructureType: 'database' }),
        makeFileNode('api1', 'express', { isExternal: true, infrastructureType: 'api' }),
        makeFileNode('cache1', 'redis', { isExternal: true, infrastructureType: 'cache' }),
      ]);

      const result = engine.layout(graph);
      const zones = result.metadata!.infrastructureZones as InfrastructureZoneMetadata[];

      // Should be ordered: database, api, cache, logging
      expect(zones.map((z) => z.type)).toEqual(['database', 'api', 'cache', 'logging']);
    });

    it('should have visual separation (gaps) between adjacent zones', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
        makeFileNode('db1', 'pg', { isExternal: true, infrastructureType: 'database' }),
        makeFileNode('api1', 'express', { isExternal: true, infrastructureType: 'api' }),
      ]);

      const result = engine.layout(graph);
      const zones = result.metadata!.infrastructureZones as InfrastructureZoneMetadata[];

      expect(zones.length).toBe(2);
      // The end of zone 0 should be less than the start of zone 1 (gap between them)
      expect(zones[0]!.arcEnd).toBeLessThan(zones[1]!.arcStart);
    });

    it('should cluster same-type nodes close together', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
        makeFileNode('db1', 'pg', { isExternal: true, infrastructureType: 'database' }),
        makeFileNode('db2', 'mongoose', { isExternal: true, infrastructureType: 'database' }),
        makeFileNode('api1', 'express', { isExternal: true, infrastructureType: 'api' }),
        makeFileNode('api2', 'fastify', { isExternal: true, infrastructureType: 'api' }),
      ]);

      const result = engine.layout(graph);

      const db1Pos = result.positions.get('db1')!;
      const db2Pos = result.positions.get('db2')!;
      const api1Pos = result.positions.get('api1')!;

      // Distance between same-type nodes should be less than distance to other-type nodes
      const db1ToDb2 = Math.sqrt((db1Pos.x - db2Pos.x) ** 2 + (db1Pos.z - db2Pos.z) ** 2);
      const db1ToApi1 = Math.sqrt((db1Pos.x - api1Pos.x) ** 2 + (db1Pos.z - api1Pos.z) ** 2);

      expect(db1ToDb2).toBeLessThan(db1ToApi1);
    });

    it('should fall back to "general" zone when infrastructureType is missing', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
        makeFileNode('ext1', 'lodash', { isExternal: true }),
        makeFileNode('ext2', 'uuid', { isExternal: true }),
      ]);

      const result = engine.layout(graph);
      const zones = result.metadata!.infrastructureZones as InfrastructureZoneMetadata[];

      expect(zones.length).toBe(1);
      expect(zones[0]!.type).toBe('general');
      expect(zones[0]!.nodeCount).toBe(2);
    });

    it('should mix classified and unclassified external nodes', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
        makeFileNode('db1', 'pg', { isExternal: true, infrastructureType: 'database' }),
        makeFileNode('ext1', 'lodash', { isExternal: true }),
        makeFileNode('ext2', 'uuid', { isExternal: true }),
      ]);

      const result = engine.layout(graph);
      const zones = result.metadata!.infrastructureZones as InfrastructureZoneMetadata[];

      // Should have database and general zones
      expect(zones.length).toBe(2);
      expect(zones[0]!.type).toBe('database');
      expect(zones[0]!.nodeCount).toBe(1);
      expect(zones[1]!.type).toBe('general');
      expect(zones[1]!.nodeCount).toBe(2);
    });

    it('should return empty infrastructureZones when no external nodes exist', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
        makeFileNode('f2', 'src/app.ts', { depth: 1, path: 'src/app.ts' }),
      ]);

      const result = engine.layout(graph);
      const zones = result.metadata!.infrastructureZones as InfrastructureZoneMetadata[];

      expect(zones).toBeDefined();
      expect(zones.length).toBe(0);
    });

    it('should include zone arc information in metadata', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
        makeFileNode('db1', 'pg', { isExternal: true, infrastructureType: 'database' }),
        makeFileNode('api1', 'express', { isExternal: true, infrastructureType: 'api' }),
      ]);

      const result = engine.layout(graph);
      const zones = result.metadata!.infrastructureZones as InfrastructureZoneMetadata[];

      for (const zone of zones) {
        expect(zone.type).toBeDefined();
        expect(typeof zone.arcStart).toBe('number');
        expect(typeof zone.arcEnd).toBe('number');
        expect(zone.arcStart).toBeLessThan(zone.arcEnd);
        expect(zone.nodeCount).toBeGreaterThan(0);
      }
    });

    it('should produce deterministic zone output', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
        makeFileNode('api1', 'express', { isExternal: true, infrastructureType: 'api' }),
        makeFileNode('db1', 'pg', { isExternal: true, infrastructureType: 'database' }),
        makeFileNode('cache1', 'redis', { isExternal: true, infrastructureType: 'cache' }),
      ]);

      const result1 = engine.layout(graph);
      const result2 = engine.layout(graph);

      const zones1 = result1.metadata!.infrastructureZones as InfrastructureZoneMetadata[];
      const zones2 = result2.metadata!.infrastructureZones as InfrastructureZoneMetadata[];

      expect(zones1.length).toBe(zones2.length);
      for (let i = 0; i < zones1.length; i++) {
        expect(zones1[i]!.type).toBe(zones2[i]!.type);
        expect(zones1[i]!.arcStart).toBe(zones2[i]!.arcStart);
        expect(zones1[i]!.arcEnd).toBe(zones2[i]!.arcEnd);
        expect(zones1[i]!.nodeCount).toBe(zones2[i]!.nodeCount);
      }
    });
  });

  describe('hierarchical output', () => {
    it('should return districts and externalZones arrays', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
        makeFileNode('f2', 'src/a/app.ts', { depth: 1, path: 'src/a/app.ts' }),
        makeFileNode('ext1', 'express', { isExternal: true, infrastructureType: 'api' }),
      ]);

      const result = engine.layout(graph) as HierarchicalLayoutResult;

      expect(result.districts).toBeDefined();
      expect(Array.isArray(result.districts)).toBe(true);
      expect(result.externalZones).toBeDefined();
      expect(Array.isArray(result.externalZones)).toBe(true);
    });

    it('should create district layouts with blocks for file nodes', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
        makeFileNode('f2', 'src/a/app.ts', { depth: 1, path: 'src/a/app.ts' }),
        makeFileNode('f3', 'src/a/svc.ts', { depth: 1, path: 'src/a/svc.ts' }),
      ]);

      const result = engine.layout(graph) as HierarchicalLayoutResult;

      expect(result.districts.length).toBeGreaterThan(0);
      const district = result.districts[0]!;
      expect(district.blocks.length).toBeGreaterThan(0);
      expect(district.arc).toBeDefined();
    });

    it('should place child nodes inside file blocks', () => {
      const graph: Graph = {
        nodes: [
          makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
          makeFileNode('f2', 'src/a/app.ts', { depth: 1, path: 'src/a/app.ts' }),
          {
            id: 'c1',
            type: 'class',
            label: 'AppClass',
            metadata: { path: 'src/a/app.ts' },
            lod: 0,
            parentId: 'f2',
          },
          {
            id: 'm1',
            type: 'method',
            label: 'run',
            metadata: { path: 'src/a/app.ts' },
            lod: 0,
            parentId: 'c1',
          },
        ],
        edges: [],
        metadata: { repositoryId: 'test', name: 'Test', totalNodes: 4, totalEdges: 0 },
      };

      const result = engine.layout(graph) as HierarchicalLayoutResult;

      // All nodes should have positions
      expect(result.positions.has('f1')).toBe(true);
      expect(result.positions.has('f2')).toBe(true);
      expect(result.positions.has('c1')).toBe(true);
      expect(result.positions.has('m1')).toBe(true);

      // Find the block containing f2
      const district = result.districts.find((d) =>
        d.blocks.some((b) => b.fileId === 'f2'),
      );
      expect(district).toBeDefined();

      const block = district!.blocks.find((b) => b.fileId === 'f2');
      expect(block).toBeDefined();
      expect(block!.children.length).toBe(2); // c1 and m1
    });

    it('should create compound blocks for districts with 1-3 files', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
        makeFileNode('f2', 'src/a/app.ts', { depth: 1, path: 'src/a/app.ts' }),
      ]);

      const result = engine.layout(graph) as HierarchicalLayoutResult;

      const compoundDistrict = result.districts.find((d) => d.isCompound);
      expect(compoundDistrict).toBeDefined();
      expect(compoundDistrict!.blocks.length).toBe(1);
      expect(compoundDistrict!.blocks[0]!.isMerged).toBe(true);
    });

    it('should handle orphan nodes without parentId', () => {
      const graph: Graph = {
        nodes: [
          makeFileNode('f1', 'src/app.ts', { depth: 0, path: 'src/app.ts' }),
          {
            id: 'orphan1',
            type: 'function',
            label: 'orphanFn',
            metadata: {},
            lod: 0,
          },
        ],
        edges: [],
        metadata: { repositoryId: 'test', name: 'Test', totalNodes: 2, totalEdges: 0 },
      };

      const result = engine.layout(graph);

      // Orphan should still get a position
      expect(result.positions.has('orphan1')).toBe(true);
    });

    it('should handle cycles in parentId chains', () => {
      const graph: Graph = {
        nodes: [
          makeFileNode('f1', 'src/app.ts', { depth: 0, path: 'src/app.ts' }),
          {
            id: 'a',
            type: 'class',
            label: 'A',
            metadata: {},
            lod: 0,
            parentId: 'b',
          },
          {
            id: 'b',
            type: 'class',
            label: 'B',
            metadata: {},
            lod: 0,
            parentId: 'a',
          },
        ],
        edges: [],
        metadata: { repositoryId: 'test', name: 'Test', totalNodes: 3, totalEdges: 0 },
      };

      // Should not throw
      const result = engine.layout(graph);

      // Cycled nodes should still get positions (as orphans)
      expect(result.positions.has('a')).toBe(true);
      expect(result.positions.has('b')).toBe(true);
    });

    it('should populate externalZones in hierarchical result', () => {
      const graph = makeGraph([
        makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
        makeFileNode('ext1', 'express', { isExternal: true, infrastructureType: 'api' }),
        makeFileNode('ext2', 'pg', { isExternal: true, infrastructureType: 'database' }),
      ]);

      const result = engine.layout(graph) as HierarchicalLayoutResult;

      expect(result.externalZones.length).toBe(2);
      expect(result.externalZones[0]!.zoneMetadata.type).toBe('database');
      expect(result.externalZones[0]!.nodes.length).toBe(1);
    });
  });

  describe('performance', () => {
    it('should layout 1000 nodes in under 50ms', () => {
      const nodes: GraphNode[] = [];
      // Create 200 file nodes across 10 directories
      for (let d = 0; d < 10; d++) {
        for (let f = 0; f < 20; f++) {
          nodes.push(
            makeFileNode(`f${d}-${f}`, `src/dir${d}/file${f}.ts`, {
              depth: d % 3 + 1,
              path: `src/dir${d}/file${f}.ts`,
            }),
          );
        }
      }
      // Add 800 child nodes with parentIds
      for (let i = 0; i < 800; i++) {
        const parentDir = i % 10;
        const parentFile = i % 20;
        nodes.push({
          id: `child-${i}`,
          type: i % 2 === 0 ? 'class' : 'function',
          label: `Child${i}`,
          metadata: {},
          lod: 0,
          parentId: `f${parentDir}-${parentFile}`,
        });
      }

      const graph = makeGraph(nodes);
      // Add entry point
      graph.nodes.unshift(
        makeFileNode('entry', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
      );

      const start = performance.now();
      engine.layout(graph);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(50);
    });
  });

  describe('determinism (hierarchical)', () => {
    it('should produce identical hierarchical output across 10 runs', () => {
      const graph: Graph = {
        nodes: [
          makeFileNode('f1', 'src/index.ts', { depth: 0, path: 'src/index.ts' }),
          makeFileNode('f2', 'src/a/app.ts', { depth: 1, path: 'src/a/app.ts' }),
          makeFileNode('f3', 'src/a/svc.ts', { depth: 1, path: 'src/a/svc.ts' }),
          makeFileNode('f4', 'src/b/db.ts', { depth: 2, path: 'src/b/db.ts' }),
          {
            id: 'c1',
            type: 'class',
            label: 'AppClass',
            metadata: {},
            lod: 0,
            parentId: 'f2',
          },
          {
            id: 'fn1',
            type: 'function',
            label: 'helper',
            metadata: {},
            lod: 0,
            parentId: 'f3',
          },
        ],
        edges: [
          { id: 'e1', source: 'f2', target: 'f3', type: 'imports', metadata: {} },
        ],
        metadata: { repositoryId: 'test', name: 'Test', totalNodes: 6, totalEdges: 1 },
      };

      const baseline = engine.layout(graph) as HierarchicalLayoutResult;

      for (let i = 0; i < 9; i++) {
        const result = engine.layout(graph) as HierarchicalLayoutResult;

        // Check positions match
        for (const [id, pos1] of baseline.positions) {
          const pos2 = result.positions.get(id)!;
          expect(pos1.x).toBe(pos2.x);
          expect(pos1.y).toBe(pos2.y);
          expect(pos1.z).toBe(pos2.z);
        }

        // Check district count and block count match
        expect(result.districts.length).toBe(baseline.districts.length);
        for (let d = 0; d < baseline.districts.length; d++) {
          expect(result.districts[d]!.blocks.length).toBe(
            baseline.districts[d]!.blocks.length,
          );
        }
      }
    });
  });
});
