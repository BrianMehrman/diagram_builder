/**
 * IVM Validator Tests
 */

import { describe, it, expect } from 'vitest';
import {
  isValidNodeType,
  isValidEdgeType,
  isValidLODLevel,
  isValidPosition,
  validatePosition,
  validateNodeMetadata,
  validateNode,
  validateEdge,
  validateGraphMetadata,
  validateGraph,
  assertValidGraph,
  assertValidNode,
  assertValidEdge,
} from './validator.js';
import { buildGraph } from './builder.js';

describe('IVM Validator', () => {
  describe('Type Guards', () => {
    describe('isValidNodeType', () => {
      it('should return true for valid node types', () => {
        expect(isValidNodeType('file')).toBe(true);
        expect(isValidNodeType('class')).toBe(true);
        expect(isValidNodeType('function')).toBe(true);
        expect(isValidNodeType('repository')).toBe(true);
      });

      it('should return false for invalid node types', () => {
        expect(isValidNodeType('invalid')).toBe(false);
        expect(isValidNodeType('')).toBe(false);
        expect(isValidNodeType(123)).toBe(false);
        expect(isValidNodeType(null)).toBe(false);
        expect(isValidNodeType(undefined)).toBe(false);
      });
    });

    describe('isValidEdgeType', () => {
      it('should return true for valid edge types', () => {
        expect(isValidEdgeType('imports')).toBe(true);
        expect(isValidEdgeType('extends')).toBe(true);
        expect(isValidEdgeType('implements')).toBe(true);
      });

      it('should return false for invalid edge types', () => {
        expect(isValidEdgeType('invalid')).toBe(false);
        expect(isValidEdgeType('')).toBe(false);
        expect(isValidEdgeType(123)).toBe(false);
      });
    });

    describe('isValidLODLevel', () => {
      it('should return true for valid LOD levels', () => {
        expect(isValidLODLevel(0)).toBe(true);
        expect(isValidLODLevel(1)).toBe(true);
        expect(isValidLODLevel(5)).toBe(true);
      });

      it('should return false for invalid LOD levels', () => {
        expect(isValidLODLevel(-1)).toBe(false);
        expect(isValidLODLevel(6)).toBe(false);
        expect(isValidLODLevel(1.5)).toBe(false);
        expect(isValidLODLevel('3')).toBe(false);
      });
    });

    describe('isValidPosition', () => {
      it('should return true for valid positions', () => {
        expect(isValidPosition({ x: 0, y: 0, z: 0 })).toBe(true);
        expect(isValidPosition({ x: -100, y: 200.5, z: -300 })).toBe(true);
      });

      it('should return false for invalid positions', () => {
        expect(isValidPosition({ x: 0, y: 0 })).toBe(false);
        expect(isValidPosition({ x: NaN, y: 0, z: 0 })).toBe(false);
        expect(isValidPosition({ x: Infinity, y: 0, z: 0 })).toBe(false);
        expect(isValidPosition(null)).toBe(false);
        expect(isValidPosition(undefined)).toBe(false);
        expect(isValidPosition('0,0,0')).toBe(false);
      });
    });
  });

  describe('validatePosition', () => {
    it('should pass for valid position', () => {
      const result = validatePosition({ x: 10, y: 20, z: 30 }, 'test.position');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for invalid position', () => {
      const result = validatePosition({ x: NaN }, 'test.position');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]?.code).toBe('INVALID_POSITION');
    });
  });

  describe('validateNodeMetadata', () => {
    it('should pass for valid metadata', () => {
      const result = validateNodeMetadata(
        { label: 'test', path: '/test', loc: 100 },
        'node.metadata'
      );
      expect(result.valid).toBe(true);
    });

    it('should fail for missing label', () => {
      const result = validateNodeMetadata({ path: '/test' }, 'node.metadata');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_LABEL')).toBe(true);
    });

    it('should fail for missing path', () => {
      const result = validateNodeMetadata({ label: 'test' }, 'node.metadata');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_PATH')).toBe(true);
    });

    it('should warn for invalid loc', () => {
      const result = validateNodeMetadata(
        { label: 'test', path: '/test', loc: -5 },
        'node.metadata'
      );
      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.code === 'INVALID_LOC')).toBe(true);
    });
  });

  describe('validateNode', () => {
    const validNode = {
      id: 'test-node',
      type: 'file',
      position: { x: 0, y: 0, z: 0 },
      lod: 3,
      metadata: { label: 'test', path: '/test' },
    };

    it('should pass for valid node', () => {
      const result = validateNode(validNode, 'nodes[0]');
      expect(result.valid).toBe(true);
    });

    it('should fail for missing id', () => {
      const result = validateNode({ ...validNode, id: '' }, 'nodes[0]');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_ID')).toBe(true);
    });

    it('should fail for invalid type', () => {
      const result = validateNode({ ...validNode, type: 'invalid' }, 'nodes[0]');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_NODE_TYPE')).toBe(true);
    });

    it('should fail for invalid LOD', () => {
      const result = validateNode({ ...validNode, lod: 10 }, 'nodes[0]');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_LOD')).toBe(true);
    });

    it('should fail for non-object', () => {
      const result = validateNode(null, 'nodes[0]');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_NODE')).toBe(true);
    });
  });

  describe('validateEdge', () => {
    const nodeIds = new Set(['n1', 'n2']);
    const validEdge = {
      id: 'e1',
      source: 'n1',
      target: 'n2',
      type: 'imports',
      lod: 3,
      metadata: {},
    };

    it('should pass for valid edge', () => {
      const result = validateEdge(validEdge, 'edges[0]', nodeIds);
      expect(result.valid).toBe(true);
    });

    it('should fail for missing source', () => {
      const result = validateEdge({ ...validEdge, source: '' }, 'edges[0]', nodeIds);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_SOURCE')).toBe(true);
    });

    it('should fail for non-existent source', () => {
      const result = validateEdge({ ...validEdge, source: 'n3' }, 'edges[0]', nodeIds);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_SOURCE')).toBe(true);
    });

    it('should fail for non-existent target', () => {
      const result = validateEdge({ ...validEdge, target: 'n3' }, 'edges[0]', nodeIds);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_TARGET')).toBe(true);
    });

    it('should fail for invalid edge type', () => {
      const result = validateEdge({ ...validEdge, type: 'invalid' }, 'edges[0]', nodeIds);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_EDGE_TYPE')).toBe(true);
    });

    it('should warn for self-referential edge', () => {
      const result = validateEdge({ ...validEdge, target: 'n1' }, 'edges[0]', nodeIds);
      expect(result.warnings.some((w) => w.code === 'SELF_REFERENCE')).toBe(true);
    });
  });

  describe('validateGraphMetadata', () => {
    const validMetadata = {
      name: 'test-project',
      schemaVersion: '1.0.0',
      generatedAt: '2025-01-01T00:00:00.000Z',
      rootPath: '/project',
      stats: { totalNodes: 0, totalEdges: 0, nodesByType: {}, edgesByType: {} },
      languages: [],
    };

    it('should pass for valid metadata', () => {
      const result = validateGraphMetadata(validMetadata, 'metadata');
      expect(result.valid).toBe(true);
    });

    it('should fail for missing name', () => {
      const result = validateGraphMetadata({ ...validMetadata, name: '' }, 'metadata');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MISSING_NAME')).toBe(true);
    });

    it('should warn for version mismatch', () => {
      const result = validateGraphMetadata(
        { ...validMetadata, schemaVersion: '0.9.0' },
        'metadata'
      );
      expect(result.warnings.some((w) => w.code === 'VERSION_MISMATCH')).toBe(true);
    });
  });

  describe('validateGraph', () => {
    it('should pass for valid graph', () => {
      const graph = buildGraph({
        nodes: [
          { id: 'n1', type: 'file', metadata: { label: 'a', path: '/a' } },
          { id: 'n2', type: 'file', metadata: { label: 'b', path: '/b' } },
        ],
        edges: [{ source: 'n1', target: 'n2', type: 'imports' }],
        metadata: { name: 'test', rootPath: '/' },
      });

      const result = validateGraph(graph);
      expect(result.valid).toBe(true);
    });

    it('should fail for duplicate node IDs', () => {
      const graph = {
        nodes: [
          {
            id: 'n1',
            type: 'file',
            position: { x: 0, y: 0, z: 0 },
            lod: 3,
            metadata: { label: 'a', path: '/a' },
          },
          {
            id: 'n1',
            type: 'file',
            position: { x: 0, y: 0, z: 0 },
            lod: 3,
            metadata: { label: 'b', path: '/b' },
          },
        ],
        edges: [],
        metadata: {
          name: 'test',
          schemaVersion: '1.0.0',
          generatedAt: new Date().toISOString(),
          rootPath: '/',
          stats: { totalNodes: 2, totalEdges: 0, nodesByType: {}, edgesByType: {} },
          languages: [],
        },
        bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
      };

      const result = validateGraph(graph);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'DUPLICATE_NODE_IDS')).toBe(true);
    });

    it('should fail for invalid parent reference', () => {
      const graph = {
        nodes: [
          {
            id: 'n1',
            type: 'file',
            position: { x: 0, y: 0, z: 0 },
            lod: 3,
            parentId: 'non-existent',
            metadata: { label: 'a', path: '/a' },
          },
        ],
        edges: [],
        metadata: {
          name: 'test',
          schemaVersion: '1.0.0',
          generatedAt: new Date().toISOString(),
          rootPath: '/',
          stats: { totalNodes: 1, totalEdges: 0, nodesByType: {}, edgesByType: {} },
          languages: [],
        },
        bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
      };

      const result = validateGraph(graph);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_PARENT_REFERENCE')).toBe(true);
    });

    it('should fail for non-object input', () => {
      const result = validateGraph(null);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_GRAPH')).toBe(true);
    });
  });

  describe('Assertion Helpers', () => {
    describe('assertValidGraph', () => {
      it('should not throw for valid graph', () => {
        const graph = buildGraph({
          nodes: [{ id: 'n1', type: 'file', metadata: { label: 'a', path: '/a' } }],
          edges: [],
          metadata: { name: 'test', rootPath: '/' },
        });

        expect(() => assertValidGraph(graph)).not.toThrow();
      });

      it('should throw for invalid graph', () => {
        expect(() => assertValidGraph(null)).toThrow('Invalid IVM graph');
      });
    });

    describe('assertValidNode', () => {
      it('should not throw for valid node', () => {
        const node = {
          id: 'n1',
          type: 'file',
          position: { x: 0, y: 0, z: 0 },
          lod: 3,
          metadata: { label: 'test', path: '/test' },
        };

        expect(() => assertValidNode(node)).not.toThrow();
      });

      it('should throw for invalid node', () => {
        expect(() => assertValidNode({ id: '' })).toThrow('Invalid IVM node');
      });
    });

    describe('assertValidEdge', () => {
      const nodeIds = new Set(['n1', 'n2']);

      it('should not throw for valid edge', () => {
        const edge = {
          id: 'e1',
          source: 'n1',
          target: 'n2',
          type: 'imports',
          lod: 3,
          metadata: {},
        };

        expect(() => assertValidEdge(edge, nodeIds)).not.toThrow();
      });

      it('should throw for invalid edge', () => {
        expect(() => assertValidEdge({ source: 'n3' }, nodeIds)).toThrow('Invalid IVM edge');
      });
    });
  });
});
