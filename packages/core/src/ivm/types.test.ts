/**
 * IVM Types Tests
 */

import { describe, it, expect } from 'vitest';
import {
  IVM_SCHEMA_VERSION,
  DEFAULT_LOD,
  LOD_DESCRIPTIONS,
} from './types.js';
import type {
  IVMNode,
  IVMEdge,
  IVMGraph,
  NodeType,
  EdgeType,
  LODLevel,
} from './types.js';

describe('IVM Types', () => {
  describe('Constants', () => {
    it('should have a valid schema version', () => {
      expect(IVM_SCHEMA_VERSION).toBe('1.0.0');
      expect(IVM_SCHEMA_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should have a valid default LOD', () => {
      expect(DEFAULT_LOD).toBe(3);
      expect(DEFAULT_LOD).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_LOD).toBeLessThanOrEqual(5);
    });

    it('should have LOD descriptions for all levels', () => {
      const levels: LODLevel[] = [0, 1, 2, 3, 4, 5];
      for (const level of levels) {
        expect(LOD_DESCRIPTIONS[level]).toBeDefined();
        expect(typeof LOD_DESCRIPTIONS[level]).toBe('string');
        expect(LOD_DESCRIPTIONS[level].length).toBeGreaterThan(0);
      }
    });
  });

  describe('Node Types', () => {
    it('should allow all valid node types', () => {
      const validTypes: NodeType[] = [
        'file',
        'directory',
        'module',
        'class',
        'interface',
        'function',
        'method',
        'variable',
        'type',
        'enum',
        'namespace',
        'package',
        'repository',
      ];

      // This test verifies the types compile correctly
      for (const type of validTypes) {
        const node: Partial<IVMNode> = { type };
        expect(node.type).toBe(type);
      }
    });
  });

  describe('Edge Types', () => {
    it('should allow all valid edge types', () => {
      const validTypes: EdgeType[] = [
        'imports',
        'exports',
        'extends',
        'implements',
        'calls',
        'uses',
        'contains',
        'depends_on',
        'type_of',
        'returns',
        'parameter_of',
      ];

      // This test verifies the types compile correctly
      for (const type of validTypes) {
        const edge: Partial<IVMEdge> = { type };
        expect(edge.type).toBe(type);
      }
    });
  });

  describe('IVMNode structure', () => {
    it('should create a valid node object', () => {
      const node: IVMNode = {
        id: 'test-node-1',
        type: 'file',
        position: { x: 0, y: 0, z: 0 },
        lod: 3,
        metadata: {
          label: 'test.ts',
          path: '/src/test.ts',
          language: 'typescript',
          loc: 100,
        },
      };

      expect(node.id).toBe('test-node-1');
      expect(node.type).toBe('file');
      expect(node.position).toEqual({ x: 0, y: 0, z: 0 });
      expect(node.lod).toBe(3);
      expect(node.metadata.label).toBe('test.ts');
      expect(node.metadata.path).toBe('/src/test.ts');
    });

    it('should allow optional properties', () => {
      const node: IVMNode = {
        id: 'test-node-2',
        type: 'class',
        position: { x: 10, y: 20, z: 30 },
        lod: 4,
        parentId: 'parent-node',
        metadata: {
          label: 'MyClass',
          path: '/src/MyClass.ts#MyClass',
          complexity: 5,
          dependencyCount: 3,
          dependentCount: 7,
          location: {
            startLine: 10,
            endLine: 50,
          },
          properties: {
            isAbstract: true,
          },
        },
        style: {
          color: '#ff0000',
          size: 1.5,
          highlighted: true,
        },
      };

      expect(node.parentId).toBe('parent-node');
      expect(node.metadata.complexity).toBe(5);
      expect(node.metadata.location?.startLine).toBe(10);
      expect(node.style?.color).toBe('#ff0000');
    });
  });

  describe('IVMEdge structure', () => {
    it('should create a valid edge object', () => {
      const edge: IVMEdge = {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        type: 'imports',
        lod: 3,
        metadata: {},
      };

      expect(edge.id).toBe('edge-1');
      expect(edge.source).toBe('node-1');
      expect(edge.target).toBe('node-2');
      expect(edge.type).toBe('imports');
      expect(edge.lod).toBe(3);
    });

    it('should allow optional metadata and style', () => {
      const edge: IVMEdge = {
        id: 'edge-2',
        source: 'node-a',
        target: 'node-b',
        type: 'extends',
        lod: 4,
        metadata: {
          label: 'extends',
          weight: 2,
          circular: false,
          reference: 'BaseClass',
        },
        style: {
          color: '#00ff00',
          width: 2,
          lineStyle: 'dashed',
          arrow: true,
        },
      };

      expect(edge.metadata.weight).toBe(2);
      expect(edge.metadata.circular).toBe(false);
      expect(edge.style?.lineStyle).toBe('dashed');
    });
  });

  describe('IVMGraph structure', () => {
    it('should create a valid graph object', () => {
      const graph: IVMGraph = {
        nodes: [
          {
            id: 'node-1',
            type: 'file',
            position: { x: 0, y: 0, z: 0 },
            lod: 3,
            metadata: {
              label: 'index.ts',
              path: '/src/index.ts',
            },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2',
            type: 'imports',
            lod: 3,
            metadata: {},
          },
        ],
        metadata: {
          name: 'test-project',
          schemaVersion: '1.0.0',
          generatedAt: '2025-01-01T00:00:00.000Z',
          rootPath: '/project',
          stats: {
            totalNodes: 1,
            totalEdges: 1,
            nodesByType: { file: 1 } as Record<NodeType, number>,
            edgesByType: { imports: 1 } as Record<EdgeType, number>,
          },
          languages: ['typescript'],
        },
        bounds: {
          min: { x: 0, y: 0, z: 0 },
          max: { x: 100, y: 100, z: 100 },
        },
      };

      expect(graph.nodes).toHaveLength(1);
      expect(graph.edges).toHaveLength(1);
      expect(graph.metadata.name).toBe('test-project');
      expect(graph.metadata.stats.totalNodes).toBe(1);
      expect(graph.bounds.min).toEqual({ x: 0, y: 0, z: 0 });
    });
  });
});
