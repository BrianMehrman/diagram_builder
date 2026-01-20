/**
 * Graph Quality Tests
 *
 * Comprehensive tests validating graph data quality using assertion utilities
 * Story: 6-4-end-to-end-integration-testing (Task 6)
 */

import { describe, it, expect } from 'vitest';
import {
  assertMinimumGraphSize,
  assertNodeStructure,
  assertEdgeStructure,
  assertEdgeReferences,
  assertNoSelfReferences,
  assertUniqueNodeIds,
  assertUniqueEdgeIds,
  assertGraphMetadata,
  assertLODConsistency,
  assertNoOrphanedNodes,
  assertGraphQuality,
} from '../utils/graph-quality-assertions';

describe('Graph Quality Assertions', () => {
  describe('assertMinimumGraphSize', () => {
    it('should pass when graph meets minimum size requirements', () => {
      const nodes = [
        { id: '1', type: 'file', label: 'a.ts', metadata: {}, lod: 0 },
        { id: '2', type: 'file', label: 'b.ts', metadata: {}, lod: 0 },
      ];
      const edges = [
        { id: 'e1', source: '1', target: '2', type: 'imports', metadata: {} },
      ];

      expect(() => assertMinimumGraphSize(nodes, edges, 2, 1)).not.toThrow();
      expect(() => assertMinimumGraphSize(nodes, edges, 1, 0)).not.toThrow();
    });

    it('should fail when graph has too few nodes', () => {
      const nodes = [{ id: '1', type: 'file', label: 'a.ts', metadata: {}, lod: 0 }];
      const edges: any[] = [];

      expect(() => assertMinimumGraphSize(nodes, edges, 5, 0)).toThrow();
    });

    it('should fail when graph has too few edges', () => {
      const nodes = [
        { id: '1', type: 'file', label: 'a.ts', metadata: {}, lod: 0 },
        { id: '2', type: 'file', label: 'b.ts', metadata: {}, lod: 0 },
      ];
      const edges: any[] = [];

      expect(() => assertMinimumGraphSize(nodes, edges, 2, 3)).toThrow();
    });
  });

  describe('assertNodeStructure', () => {
    it('should pass for valid nodes', () => {
      const nodes = [
        {
          id: 'file-1',
          type: 'file',
          label: 'index.ts',
          metadata: { path: 'src/index.ts' },
          position: { x: 0, y: 0, z: 0 },
          lod: 0,
        },
        {
          id: 'class-1',
          type: 'class',
          label: 'User',
          metadata: { methods: 3 },
          lod: 1,
        },
      ];

      expect(() => assertNodeStructure(nodes)).not.toThrow();
    });

    it('should fail for node missing id', () => {
      const nodes = [
        { type: 'file', label: 'test', metadata: {}, lod: 0 } as any,
      ];

      expect(() => assertNodeStructure(nodes)).toThrow(/missing 'id' field/);
    });

    it('should fail for node missing type', () => {
      const nodes = [
        { id: '1', label: 'test', metadata: {}, lod: 0 } as any,
      ];

      expect(() => assertNodeStructure(nodes)).toThrow(/missing 'type' field/);
    });

    it('should fail for invalid node type', () => {
      const nodes = [
        { id: '1', type: 'invalid', label: 'test', metadata: {}, lod: 0 },
      ];

      expect(() => assertNodeStructure(nodes)).toThrow(/invalid type/);
    });

    it('should fail for invalid LOD value', () => {
      const nodes = [
        { id: '1', type: 'file', label: 'test', metadata: {}, lod: -1 },
      ];

      expect(() => assertNodeStructure(nodes)).toThrow(/lod.*must be >= 0/);
    });

    it('should fail for invalid position coordinates', () => {
      const nodes = [
        {
          id: '1',
          type: 'file',
          label: 'test',
          metadata: {},
          position: { x: NaN, y: 0, z: 0 },
          lod: 0,
        },
      ];

      expect(() => assertNodeStructure(nodes)).toThrow(/position.x must be finite/);
    });
  });

  describe('assertEdgeStructure', () => {
    it('should pass for valid edges', () => {
      const edges = [
        {
          id: 'edge-1',
          source: 'node-1',
          target: 'node-2',
          type: 'imports',
          metadata: {},
        },
        {
          id: 'edge-2',
          source: 'node-2',
          target: 'node-3',
          type: 'contains',
          metadata: {},
        },
      ];

      expect(() => assertEdgeStructure(edges)).not.toThrow();
    });

    it('should fail for edge missing source', () => {
      const edges = [
        { id: 'e1', target: 'node-2', type: 'imports', metadata: {} } as any,
      ];

      expect(() => assertEdgeStructure(edges)).toThrow(/missing 'source' field/);
    });

    it('should fail for invalid edge type', () => {
      const edges = [
        { id: 'e1', source: 'n1', target: 'n2', type: 'invalid', metadata: {} },
      ];

      expect(() => assertEdgeStructure(edges)).toThrow(/invalid type/);
    });
  });

  describe('assertEdgeReferences', () => {
    it('should pass when all edges reference existing nodes', () => {
      const nodes = [
        { id: 'n1', type: 'file', label: 'a', metadata: {}, lod: 0 },
        { id: 'n2', type: 'file', label: 'b', metadata: {}, lod: 0 },
      ];
      const edges = [
        { id: 'e1', source: 'n1', target: 'n2', type: 'imports', metadata: {} },
      ];

      expect(() => assertEdgeReferences(nodes, edges)).not.toThrow();
    });

    it('should fail when edge references non-existent source', () => {
      const nodes = [
        { id: 'n1', type: 'file', label: 'a', metadata: {}, lod: 0 },
      ];
      const edges = [
        { id: 'e1', source: 'missing', target: 'n1', type: 'imports', metadata: {} },
      ];

      expect(() => assertEdgeReferences(nodes, edges)).toThrow(/source.*does not exist/);
    });

    it('should fail when edge references non-existent target', () => {
      const nodes = [
        { id: 'n1', type: 'file', label: 'a', metadata: {}, lod: 0 },
      ];
      const edges = [
        { id: 'e1', source: 'n1', target: 'missing', type: 'imports', metadata: {} },
      ];

      expect(() => assertEdgeReferences(nodes, edges)).toThrow(/target.*does not exist/);
    });
  });

  describe('assertNoSelfReferences', () => {
    it('should pass when no edges are self-referencing', () => {
      const edges = [
        { id: 'e1', source: 'n1', target: 'n2', type: 'imports', metadata: {} },
        { id: 'e2', source: 'n2', target: 'n3', type: 'imports', metadata: {} },
      ];

      expect(() => assertNoSelfReferences(edges)).not.toThrow();
    });

    it('should fail when edge is self-referencing', () => {
      const edges = [
        { id: 'e1', source: 'n1', target: 'n1', type: 'imports', metadata: {} },
      ];

      expect(() => assertNoSelfReferences(edges)).toThrow(/self-referencing/);
    });
  });

  describe('assertUniqueNodeIds', () => {
    it('should pass when all node IDs are unique', () => {
      const nodes = [
        { id: 'n1', type: 'file', label: 'a', metadata: {}, lod: 0 },
        { id: 'n2', type: 'file', label: 'b', metadata: {}, lod: 0 },
        { id: 'n3', type: 'file', label: 'c', metadata: {}, lod: 0 },
      ];

      expect(() => assertUniqueNodeIds(nodes)).not.toThrow();
    });

    it('should fail when node IDs are duplicated', () => {
      const nodes = [
        { id: 'n1', type: 'file', label: 'a', metadata: {}, lod: 0 },
        { id: 'n1', type: 'file', label: 'b', metadata: {}, lod: 0 },
      ];

      expect(() => assertUniqueNodeIds(nodes)).toThrow(/Duplicate node IDs/);
    });
  });

  describe('assertUniqueEdgeIds', () => {
    it('should pass when all edge IDs are unique', () => {
      const edges = [
        { id: 'e1', source: 'n1', target: 'n2', type: 'imports', metadata: {} },
        { id: 'e2', source: 'n2', target: 'n3', type: 'imports', metadata: {} },
      ];

      expect(() => assertUniqueEdgeIds(edges)).not.toThrow();
    });

    it('should fail when edge IDs are duplicated', () => {
      const edges = [
        { id: 'e1', source: 'n1', target: 'n2', type: 'imports', metadata: {} },
        { id: 'e1', source: 'n2', target: 'n3', type: 'imports', metadata: {} },
      ];

      expect(() => assertUniqueEdgeIds(edges)).toThrow(/Duplicate edge IDs/);
    });
  });

  describe('assertGraphMetadata', () => {
    it('should pass when metadata is correct', () => {
      const metadata = {
        repositoryId: 'repo-1',
        totalNodes: 5,
        totalEdges: 3,
      };

      expect(() => assertGraphMetadata(metadata, 5, 3)).not.toThrow();
    });

    it('should fail when totalNodes does not match actual count', () => {
      const metadata = {
        repositoryId: 'repo-1',
        totalNodes: 10,
        totalEdges: 3,
      };

      expect(() => assertGraphMetadata(metadata, 5, 3)).toThrow(/totalNodes/);
    });

    it('should fail when totalEdges does not match actual count', () => {
      const metadata = {
        repositoryId: 'repo-1',
        totalNodes: 5,
        totalEdges: 10,
      };

      expect(() => assertGraphMetadata(metadata, 5, 3)).toThrow(/totalEdges/);
    });
  });

  describe('assertLODConsistency', () => {
    it('should pass for nodes with correct LOD levels', () => {
      const nodes = [
        { id: 'f1', type: 'file', label: 'a.ts', metadata: {}, lod: 0 },
        { id: 'c1', type: 'class', label: 'User', metadata: {}, lod: 1 },
        { id: 'fn1', type: 'function', label: 'parse', metadata: {}, lod: 2 },
        { id: 'm1', type: 'method', label: 'getName', metadata: {}, lod: 3 },
        { id: 'v1', type: 'variable', label: 'config', metadata: {}, lod: 4 },
      ];

      expect(() => assertLODConsistency(nodes)).not.toThrow();
    });

    it('should fail when file node has wrong LOD', () => {
      const nodes = [
        { id: 'f1', type: 'file', label: 'a.ts', metadata: {}, lod: 1 },
      ];

      expect(() => assertLODConsistency(nodes)).toThrow(/File node.*should have LOD 0/);
    });

    it('should fail when class node has LOD > 1', () => {
      const nodes = [
        { id: 'c1', type: 'class', label: 'User', metadata: {}, lod: 3 },
      ];

      expect(() => assertLODConsistency(nodes)).toThrow(/Class node.*should have LOD <= 1/);
    });
  });

  describe('assertNoOrphanedNodes', () => {
    it('should pass when all non-file nodes are connected', () => {
      const nodes = [
        { id: 'f1', type: 'file', label: 'a.ts', metadata: {}, lod: 0 },
        { id: 'c1', type: 'class', label: 'User', metadata: {}, lod: 1 },
        { id: 'f2', type: 'file', label: 'b.ts', metadata: {}, lod: 0 },
      ];
      const edges = [
        { id: 'e1', source: 'f1', target: 'c1', type: 'contains', metadata: {} },
      ];

      expect(() => assertNoOrphanedNodes(nodes, edges)).not.toThrow();
    });

    it('should allow orphaned file nodes', () => {
      const nodes = [
        { id: 'f1', type: 'file', label: 'a.ts', metadata: {}, lod: 0 },
        { id: 'f2', type: 'file', label: 'b.ts', metadata: {}, lod: 0 },
      ];
      const edges: any[] = [];

      expect(() => assertNoOrphanedNodes(nodes, edges)).not.toThrow();
    });

    it('should fail when non-file node is orphaned', () => {
      const nodes = [
        { id: 'f1', type: 'file', label: 'a.ts', metadata: {}, lod: 0 },
        { id: 'c1', type: 'class', label: 'User', metadata: {}, lod: 1 },
      ];
      const edges: any[] = [];

      expect(() => assertNoOrphanedNodes(nodes, edges)).toThrow(/orphaned nodes/);
    });
  });

  describe('assertGraphQuality (comprehensive)', () => {
    it('should pass for a valid graph', () => {
      const graph = {
        nodes: [
          {
            id: 'file-1',
            type: 'file',
            label: 'index.ts',
            metadata: {},
            position: { x: 0, y: 0, z: 0 },
            lod: 0,
          },
          {
            id: 'class-1',
            type: 'class',
            label: 'App',
            metadata: {},
            position: { x: 1, y: 0, z: 0 },
            lod: 1,
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'file-1',
            target: 'class-1',
            type: 'contains',
            metadata: {},
          },
        ],
        metadata: {
          repositoryId: 'test-repo',
          totalNodes: 2,
          totalEdges: 1,
        },
      };

      expect(() => assertGraphQuality(graph)).not.toThrow();
    });

    it('should fail for invalid graph with multiple issues', () => {
      const graph = {
        nodes: [
          {
            id: 'file-1',
            type: 'file',
            label: 'index.ts',
            metadata: {},
            lod: 0,
          },
          {
            id: 'class-1',
            type: 'invalid-type', // Invalid type
            label: 'App',
            metadata: {},
            lod: 5, // Invalid LOD for class
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'file-1',
            target: 'missing-node', // Non-existent target
            type: 'contains',
            metadata: {},
          },
        ],
        metadata: {
          repositoryId: 'test-repo',
          totalNodes: 2,
          totalEdges: 1,
        },
      };

      expect(() => assertGraphQuality(graph)).toThrow();
    });
  });
});
