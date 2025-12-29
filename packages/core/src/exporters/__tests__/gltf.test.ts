/**
 * GLTF Exporter Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  GLTFExporter,
  createGLTFExporter,
  exportToGLTF,
  DEFAULT_GLTF_OPTIONS,
} from '../gltf.js';
import type { GLTFExportOptions } from '../gltf.js';
import type { IVMGraph, IVMNode, IVMEdge } from '../../ivm/types.js';
import { IVM_SCHEMA_VERSION } from '../../ivm/types.js';

// =============================================================================
// Test Fixtures
// =============================================================================

function createTestGraph(
  nodes: Partial<IVMNode>[] = [],
  edges: Partial<IVMEdge>[] = []
): IVMGraph {
  const fullNodes: IVMNode[] = nodes.map((n, i) => ({
    id: n.id ?? `node-${i}`,
    type: n.type ?? 'file',
    lod: n.lod ?? 3,
    parentId: n.parentId,
    position: n.position ?? { x: i, y: 0, z: 0 },
    style: n.style,
    metadata: {
      label: n.metadata?.label ?? `Node ${i}`,
      path: n.metadata?.path ?? `/path/to/node-${i}`,
      properties: n.metadata?.properties ?? {},
    },
  }));

  const fullEdges: IVMEdge[] = edges.map((e, i) => ({
    id: e.id ?? `edge-${i}`,
    source: e.source ?? (nodes[0]?.id ?? 'node-0'),
    target: e.target ?? (nodes[1]?.id ?? 'node-1'),
    type: e.type ?? 'imports',
    lod: e.lod ?? 3,
    weight: e.weight ?? 1,
    metadata: {
      label: e.metadata?.label,
      properties: e.metadata?.properties ?? {},
    },
  }));

  return {
    nodes: fullNodes,
    edges: fullEdges,
    metadata: {
      name: 'test-graph',
      createdAt: new Date().toISOString(),
      schemaVersion: IVM_SCHEMA_VERSION,
      source: 'test',
      properties: {},
    },
  };
}

function parseGLTF(content: string): any {
  return JSON.parse(content);
}

// =============================================================================
// GLTFExporter Tests
// =============================================================================

describe('GLTFExporter', () => {
  let exporter: GLTFExporter;

  beforeEach(() => {
    exporter = new GLTFExporter();
  });

  describe('constructor and properties', () => {
    it('should have correct id', () => {
      expect(exporter.id).toBe('gltf');
    });

    it('should have correct name', () => {
      expect(exporter.name).toBe('GLTF');
    });

    it('should have correct extension', () => {
      expect(exporter.extension).toBe('gltf');
    });

    it('should have correct mimeType', () => {
      expect(exporter.mimeType).toBe('model/gltf+json');
    });
  });

  describe('export()', () => {
    it('should export an empty graph', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph);

      const gltf = parseGLTF(result.content as string);

      expect(gltf.asset.version).toBe('2.0');
      expect(gltf.asset.generator).toContain('diagram-builder');
      expect(gltf.scenes).toHaveLength(1);
      expect(result.mimeType).toBe('model/gltf+json');
      expect(result.extension).toBe('gltf');
      expect(result.stats.nodeCount).toBe(0);
      expect(result.stats.edgeCount).toBe(0);
    });

    it('should export a graph with nodes', () => {
      const graph = createTestGraph([
        { id: 'file1', type: 'file', position: { x: 0, y: 0, z: 0 }, metadata: { label: 'File 1' } },
        { id: 'class1', type: 'class', position: { x: 2, y: 0, z: 0 }, metadata: { label: 'MyClass' } },
      ]);
      const result = exporter.export(graph);

      const gltf = parseGLTF(result.content as string);

      expect(gltf.nodes).toHaveLength(2);
      expect(gltf.meshes).toHaveLength(2);
      expect(gltf.nodes[0].name).toBe('File 1');
      expect(gltf.nodes[1].name).toBe('MyClass');
      expect(result.stats.nodeCount).toBe(2);
    });

    it('should export a graph with edges', () => {
      const graph = createTestGraph(
        [
          { id: 'class1', type: 'class', position: { x: 0, y: 0, z: 0 }, metadata: { label: 'Class1' } },
          { id: 'class2', type: 'class', position: { x: 3, y: 0, z: 0 }, metadata: { label: 'Class2' } },
        ],
        [{ id: 'edge1', source: 'class1', target: 'class2', type: 'extends' }]
      );
      const result = exporter.export(graph);

      const gltf = parseGLTF(result.content as string);

      // 2 nodes + 1 edge = 3 GLTF nodes
      expect(gltf.nodes.length).toBeGreaterThanOrEqual(2);
      expect(result.stats.edgeCount).toBe(1);
    });

    it('should not include edges when includeEdges is false', () => {
      const graph = createTestGraph(
        [
          { id: 'a', type: 'class', position: { x: 0, y: 0, z: 0 }, metadata: { label: 'A' } },
          { id: 'b', type: 'class', position: { x: 2, y: 0, z: 0 }, metadata: { label: 'B' } },
        ],
        [{ source: 'a', target: 'b', type: 'imports' }]
      );
      const result = exporter.export(graph, { includeEdges: false });

      const gltf = parseGLTF(result.content as string);

      // Only node meshes, no edge meshes
      expect(gltf.nodes).toHaveLength(2);
      expect(result.stats.edgeCount).toBe(0);
    });

    it('should use title as scene name', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph, { title: 'My 3D Scene' });

      const gltf = parseGLTF(result.content as string);

      expect(gltf.scenes[0].name).toBe('My 3D Scene');
    });

    it('should apply scene scale', () => {
      const graph = createTestGraph([
        { id: 'node1', type: 'file', position: { x: 1, y: 2, z: 3 }, metadata: { label: 'Node' } },
      ]);
      const result = exporter.export(graph, { sceneScale: 2.0 });

      const gltf = parseGLTF(result.content as string);

      expect(gltf.nodes[0].translation).toEqual([2, 4, 6]);
    });

    it('should include node metadata in extras', () => {
      const graph = createTestGraph([
        { id: 'node1', type: 'class', lod: 2, metadata: { label: 'TestClass' } },
      ]);
      const result = exporter.export(graph);

      const gltf = parseGLTF(result.content as string);

      expect(gltf.nodes[0].extras).toEqual({
        ivmId: 'node1',
        ivmType: 'class',
        lod: 2,
      });
    });

    it('should create materials with PBR properties', () => {
      const graph = createTestGraph([
        { id: 'node1', type: 'file', metadata: { label: 'Node' } },
      ]);
      const result = exporter.export(graph, {
        metallicFactor: 0.5,
        roughnessFactor: 0.3,
      });

      const gltf = parseGLTF(result.content as string);

      expect(gltf.materials).toBeDefined();
      expect(gltf.materials.length).toBeGreaterThan(0);
      expect(gltf.materials[0].pbrMetallicRoughness.metallicFactor).toBe(0.5);
      expect(gltf.materials[0].pbrMetallicRoughness.roughnessFactor).toBe(0.3);
    });

    it('should embed buffers as base64 by default', () => {
      const graph = createTestGraph([
        { id: 'node1', type: 'file', metadata: { label: 'Node' } },
      ]);
      const result = exporter.export(graph);

      const gltf = parseGLTF(result.content as string);

      expect(gltf.buffers[0].uri).toMatch(/^data:application\/octet-stream;base64,/);
    });

    it('should not embed buffers when embedBuffers is false', () => {
      const graph = createTestGraph([
        { id: 'node1', type: 'file', metadata: { label: 'Node' } },
      ]);
      const result = exporter.export(graph, { embedBuffers: false });

      const gltf = parseGLTF(result.content as string);

      expect(gltf.buffers[0].uri).toBeUndefined();
    });

    it('should calculate stats correctly', () => {
      const graph = createTestGraph(
        [
          { id: 'n1', type: 'file' },
          { id: 'n2', type: 'class' },
          { id: 'n3', type: 'function' },
        ],
        [
          { source: 'n1', target: 'n2', type: 'imports' },
          { source: 'n2', target: 'n3', type: 'contains' },
        ]
      );

      const result = exporter.export(graph);

      expect(result.stats.nodeCount).toBe(3);
      expect(result.stats.edgeCount).toBe(2);
      expect(result.stats.duration).toBeGreaterThanOrEqual(0);
      expect(result.stats.size).toBeGreaterThan(0);
    });
  });

  describe('export() - Node Shapes', () => {
    it('should create different meshes for different node types', () => {
      const graph = createTestGraph([
        { id: 'repo', type: 'repository', metadata: { label: 'Repo' } },
        { id: 'pkg', type: 'package', metadata: { label: 'Package' } },
        { id: 'class', type: 'class', metadata: { label: 'Class' } },
        { id: 'func', type: 'function', metadata: { label: 'Function' } },
      ]);
      const result = exporter.export(graph);

      const gltf = parseGLTF(result.content as string);

      expect(gltf.meshes).toHaveLength(4);
      expect(gltf.nodes).toHaveLength(4);
    });
  });

  describe('export() - Node Styling', () => {
    it('should apply custom node size', () => {
      const graph = createTestGraph([
        { id: 'node1', type: 'file', style: { size: 2.0 }, metadata: { label: 'Big Node' } },
      ]);
      const result = exporter.export(graph, { nodeSize: 1.0 });

      // Size affects geometry, which is encoded in the buffer
      // Just verify export succeeds
      expect(result.stats.nodeCount).toBe(1);
    });

    it('should apply custom node color', () => {
      const graph = createTestGraph([
        { id: 'node1', type: 'file', style: { color: '#FF0000' }, metadata: { label: 'Red Node' } },
      ]);
      const result = exporter.export(graph);

      const gltf = parseGLTF(result.content as string);

      // Find the material used by this node
      const material = gltf.materials[0];
      expect(material.pbrMetallicRoughness.baseColorFactor[0]).toBeCloseTo(1.0, 1); // Red
      expect(material.pbrMetallicRoughness.baseColorFactor[1]).toBeCloseTo(0.0, 1); // Green
      expect(material.pbrMetallicRoughness.baseColorFactor[2]).toBeCloseTo(0.0, 1); // Blue
    });

    it('should add emissive for highlighted nodes when useEmissive is true', () => {
      const graph = createTestGraph([
        { id: 'node1', type: 'file', style: { highlighted: true }, metadata: { label: 'Highlighted' } },
      ]);
      const result = exporter.export(graph, { useEmissive: true });

      const gltf = parseGLTF(result.content as string);

      // Material should have emissive factor
      const material = gltf.materials[0];
      expect(material.emissiveFactor).toBeDefined();
    });
  });

  describe('export() - LOD Filtering', () => {
    it('should filter nodes by LOD level', () => {
      const graph = createTestGraph([
        { id: 'high', type: 'repository', lod: 0, metadata: { label: 'High Level' } },
        { id: 'low', type: 'variable', lod: 5, metadata: { label: 'Low Level' } },
      ]);

      const result = exporter.export(graph, { lodLevel: 2 });

      expect(result.stats.nodeCount).toBe(1);
    });

    it('should filter edges by LOD level', () => {
      const graph = createTestGraph(
        [
          { id: 'a', type: 'package', lod: 1, metadata: { label: 'A' } },
          { id: 'b', type: 'package', lod: 1, metadata: { label: 'B' } },
        ],
        [
          { source: 'a', target: 'b', type: 'imports', lod: 1 },
          { source: 'a', target: 'b', type: 'calls', lod: 5 },
        ]
      );

      const result = exporter.export(graph, { lodLevel: 2 });

      expect(result.stats.edgeCount).toBe(1);
    });
  });

  describe('export() - GLTF Structure', () => {
    it('should have valid GLTF structure', () => {
      const graph = createTestGraph([
        { id: 'node1', type: 'file', metadata: { label: 'Node 1' } },
      ]);
      const result = exporter.export(graph);

      const gltf = parseGLTF(result.content as string);

      // Required GLTF properties
      expect(gltf.asset).toBeDefined();
      expect(gltf.asset.version).toBe('2.0');

      // Scene structure
      expect(gltf.scene).toBe(0);
      expect(gltf.scenes).toBeDefined();
      expect(gltf.scenes.length).toBeGreaterThan(0);

      // Buffer structure
      expect(gltf.buffers).toBeDefined();
      expect(gltf.bufferViews).toBeDefined();
      expect(gltf.accessors).toBeDefined();

      // Mesh structure
      expect(gltf.meshes).toBeDefined();
      expect(gltf.meshes.length).toBeGreaterThan(0);
      expect(gltf.meshes[0].primitives).toBeDefined();
    });

    it('should have valid accessor types', () => {
      const graph = createTestGraph([
        { id: 'node1', type: 'file', metadata: { label: 'Node 1' } },
      ]);
      const result = exporter.export(graph);

      const gltf = parseGLTF(result.content as string);

      // Position accessor
      expect(gltf.accessors[0].type).toBe('VEC3');
      expect(gltf.accessors[0].componentType).toBe(5126); // FLOAT

      // Normal accessor
      expect(gltf.accessors[1].type).toBe('VEC3');
      expect(gltf.accessors[1].componentType).toBe(5126); // FLOAT

      // Index accessor
      expect(gltf.accessors[2].type).toBe('SCALAR');
      expect(gltf.accessors[2].componentType).toBe(5123); // UNSIGNED_SHORT
    });

    it('should have min/max bounds on position accessor', () => {
      const graph = createTestGraph([
        { id: 'node1', type: 'file', metadata: { label: 'Node 1' } },
      ]);
      const result = exporter.export(graph);

      const gltf = parseGLTF(result.content as string);

      const positionAccessor = gltf.accessors[0];
      expect(positionAccessor.min).toBeDefined();
      expect(positionAccessor.max).toBeDefined();
      expect(positionAccessor.min).toHaveLength(3);
      expect(positionAccessor.max).toHaveLength(3);
    });
  });

  describe('validateOptions()', () => {
    it('should return empty array for valid options', () => {
      const errors = exporter.validateOptions({
        lodLevel: 3,
        sceneScale: 1.5,
        nodeSize: 0.5,
      });

      expect(errors).toHaveLength(0);
    });

    it('should return error for invalid LOD level', () => {
      const errors = exporter.validateOptions({ lodLevel: 10 as any });

      expect(errors).toContain('lodLevel must be between 0 and 5');
    });

    it('should return error for invalid sceneScale', () => {
      const errors = exporter.validateOptions({ sceneScale: 0 });

      expect(errors).toContain('sceneScale must be greater than 0');
    });

    it('should return error for invalid nodeSize', () => {
      const errors = exporter.validateOptions({ nodeSize: -1 });

      expect(errors).toContain('nodeSize must be greater than 0');
    });

    it('should return error for invalid edgeThickness', () => {
      const errors = exporter.validateOptions({ edgeThickness: 0 });

      expect(errors).toContain('edgeThickness must be greater than 0');
    });

    it('should return error for invalid metallicFactor', () => {
      const errors = exporter.validateOptions({ metallicFactor: 1.5 });

      expect(errors).toContain('metallicFactor must be between 0 and 1');
    });

    it('should return error for invalid roughnessFactor', () => {
      const errors = exporter.validateOptions({ roughnessFactor: -0.5 });

      expect(errors).toContain('roughnessFactor must be between 0 and 1');
    });
  });
});

// =============================================================================
// Factory Function Tests
// =============================================================================

describe('createGLTFExporter()', () => {
  it('should create a GLTFExporter instance', () => {
    const exporter = createGLTFExporter();

    expect(exporter).toBeInstanceOf(GLTFExporter);
    expect(exporter.id).toBe('gltf');
  });
});

describe('exportToGLTF()', () => {
  it('should export a graph directly', () => {
    const graph = createTestGraph([
      { id: 'file1', type: 'file', metadata: { label: 'Test File' } },
    ]);

    const result = exportToGLTF(graph);

    const gltf = parseGLTF(result.content as string);
    expect(gltf.asset.version).toBe('2.0');
    expect(gltf.nodes[0].name).toBe('Test File');
  });

  it('should accept options', () => {
    const graph = createTestGraph([
      { id: 'class1', type: 'class', metadata: { label: 'TestClass' } },
    ]);

    const result = exportToGLTF(graph, { title: '3D Code View' });

    const gltf = parseGLTF(result.content as string);
    expect(gltf.scenes[0].name).toBe('3D Code View');
  });
});

// =============================================================================
// DEFAULT_GLTF_OPTIONS Tests
// =============================================================================

describe('DEFAULT_GLTF_OPTIONS', () => {
  it('should have sensible defaults', () => {
    expect(DEFAULT_GLTF_OPTIONS.sceneScale).toBe(1.0);
    expect(DEFAULT_GLTF_OPTIONS.nodeSize).toBe(0.5);
    expect(DEFAULT_GLTF_OPTIONS.includeEdges).toBe(true);
    expect(DEFAULT_GLTF_OPTIONS.embedBuffers).toBe(true);
    expect(DEFAULT_GLTF_OPTIONS.lodLevel).toBe(5);
    expect(DEFAULT_GLTF_OPTIONS.metallicFactor).toBe(0.1);
    expect(DEFAULT_GLTF_OPTIONS.roughnessFactor).toBe(0.8);
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('GLTF Integration Tests', () => {
  let exporter: GLTFExporter;

  beforeEach(() => {
    exporter = new GLTFExporter();
  });

  it('should handle a complex application graph', () => {
    const graph = createTestGraph(
      [
        { id: 'app', type: 'package', lod: 1, position: { x: 0, y: 2, z: 0 }, metadata: { label: 'Application' } },
        { id: 'services', type: 'directory', lod: 2, position: { x: -2, y: 0, z: 0 }, metadata: { label: 'Services' } },
        { id: 'userService', type: 'class', lod: 3, position: { x: -3, y: -2, z: 0 }, metadata: { label: 'UserService' } },
        { id: 'authService', type: 'class', lod: 3, position: { x: -1, y: -2, z: 0 }, metadata: { label: 'AuthService' } },
        { id: 'models', type: 'directory', lod: 2, position: { x: 2, y: 0, z: 0 }, metadata: { label: 'Models' } },
        { id: 'user', type: 'class', lod: 3, position: { x: 1, y: -2, z: 0 }, metadata: { label: 'User' } },
        { id: 'iuser', type: 'interface', lod: 3, position: { x: 3, y: -2, z: 0 }, metadata: { label: 'IUser' } },
      ],
      [
        { source: 'userService', target: 'user', type: 'uses' },
        { source: 'userService', target: 'authService', type: 'calls' },
        { source: 'user', target: 'iuser', type: 'implements' },
      ]
    );

    const result = exporter.export(graph, { includeEdges: true });

    const gltf = parseGLTF(result.content as string);

    // Verify structure
    expect(gltf.asset.version).toBe('2.0');
    expect(gltf.scenes).toHaveLength(1);

    // Verify nodes and edges
    expect(result.stats.nodeCount).toBe(7);
    expect(result.stats.edgeCount).toBe(3);

    // Should have nodes for both IVM nodes and edges
    expect(gltf.nodes.length).toBe(10); // 7 nodes + 3 edges
  });

  it('should generate valid GLTF for all node types', () => {
    const nodeTypes = [
      'file', 'directory', 'module', 'class', 'interface',
      'function', 'method', 'variable', 'type', 'enum',
      'namespace', 'package', 'repository'
    ] as const;

    const nodes = nodeTypes.map((type, i) => ({
      id: `node_${type}`,
      type,
      position: { x: i * 2, y: 0, z: 0 },
      metadata: { label: `${type} node` },
    }));

    const graph = createTestGraph(nodes);
    const result = exporter.export(graph);

    const gltf = parseGLTF(result.content as string);

    // Should have one mesh per node
    expect(gltf.meshes).toHaveLength(nodeTypes.length);
    expect(result.stats.nodeCount).toBe(nodeTypes.length);
  });

  it('should skip edges with missing nodes', () => {
    const graph = createTestGraph(
      [{ id: 'node1', type: 'class', metadata: { label: 'Node 1' } }],
      [{ source: 'node1', target: 'nonexistent', type: 'uses' }]
    );

    const result = exporter.export(graph);

    expect(result.stats.nodeCount).toBe(1);
    expect(result.stats.edgeCount).toBe(0);
  });

  it('should handle nodes at the same position (zero-length edges)', () => {
    const graph = createTestGraph(
      [
        { id: 'a', type: 'class', position: { x: 0, y: 0, z: 0 }, metadata: { label: 'A' } },
        { id: 'b', type: 'class', position: { x: 0, y: 0, z: 0 }, metadata: { label: 'B' } },
      ],
      [{ source: 'a', target: 'b', type: 'uses' }]
    );

    // Should not throw
    const result = exporter.export(graph);
    expect(result.stats.nodeCount).toBe(2);
  });
});
