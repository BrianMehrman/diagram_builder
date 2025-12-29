/**
 * Draw.io Exporter Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  DrawioExporter,
  createDrawioExporter,
  exportToDrawio,
  DEFAULT_DRAWIO_OPTIONS,
} from '../drawio.js';
import type { DrawioExportOptions } from '../drawio.js';
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
    position: n.position ?? { x: 0, y: 0, z: 0 },
    style: n.style,
    metadata: {
      label: n.metadata?.label ?? `Node ${i}`,
      path: n.metadata?.path ?? `/path/to/node-${i}`,
      description: n.metadata?.description,
      filePath: n.metadata?.filePath,
      language: n.metadata?.language,
      startLine: n.metadata?.startLine,
      endLine: n.metadata?.endLine,
      visibility: n.metadata?.visibility,
      isExported: n.metadata?.isExported,
      isAsync: n.metadata?.isAsync,
      isStatic: n.metadata?.isStatic,
      complexity: n.metadata?.complexity,
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
      isOptional: e.metadata?.isOptional,
      count: e.metadata?.count,
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

// =============================================================================
// DrawioExporter Tests
// =============================================================================

describe('DrawioExporter', () => {
  let exporter: DrawioExporter;

  beforeEach(() => {
    exporter = new DrawioExporter();
  });

  describe('constructor and properties', () => {
    it('should have correct id', () => {
      expect(exporter.id).toBe('drawio');
    });

    it('should have correct name', () => {
      expect(exporter.name).toBe('Draw.io');
    });

    it('should have correct extension', () => {
      expect(exporter.extension).toBe('drawio');
    });

    it('should have correct mimeType', () => {
      expect(exporter.mimeType).toBe('application/vnd.jgraph.mxfile');
    });
  });

  describe('export()', () => {
    it('should export an empty graph', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph);

      expect(result.content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result.content).toContain('<mxfile');
      expect(result.content).toContain('<mxGraphModel');
      expect(result.content).toContain('</mxfile>');
      expect(result.mimeType).toBe('application/vnd.jgraph.mxfile');
      expect(result.extension).toBe('drawio');
      expect(result.stats.nodeCount).toBe(0);
      expect(result.stats.edgeCount).toBe(0);
    });

    it('should export a graph with nodes', () => {
      const graph = createTestGraph([
        { id: 'file1', type: 'file', metadata: { label: 'File 1' } },
        { id: 'class1', type: 'class', metadata: { label: 'MyClass' } },
      ]);
      const result = exporter.export(graph);

      expect(result.content).toContain('value="File 1"');
      expect(result.content).toContain('value="MyClass"');
      expect(result.content).toContain('vertex="1"');
      expect(result.stats.nodeCount).toBe(2);
    });

    it('should export a graph with edges', () => {
      const graph = createTestGraph(
        [
          { id: 'class1', type: 'class', metadata: { label: 'Class1' } },
          { id: 'class2', type: 'class', metadata: { label: 'Class2' } },
        ],
        [{ id: 'edge1', source: 'class1', target: 'class2', type: 'extends' }]
      );
      const result = exporter.export(graph);

      expect(result.content).toContain('edge="1"');
      expect(result.content).toContain('source="node-2"');
      expect(result.content).toContain('target="node-3"');
      expect(result.stats.edgeCount).toBe(1);
    });

    it('should include title when provided', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph, { title: 'My Diagram' });

      expect(result.content).toContain('name="My Diagram"');
    });

    it('should include metadata comments by default', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph);

      expect(result.content).toContain('<!-- Generated from: test-graph -->');
      expect(result.content).toContain('<!-- Schema version:');
    });

    it('should exclude metadata when includeMetadata is false', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph, { includeMetadata: false });

      expect(result.content).not.toContain('<!-- Generated from:');
    });

    it('should respect page dimensions', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph, { pageWidth: 1600, pageHeight: 1200 });

      expect(result.content).toContain('pageWidth="1600"');
      expect(result.content).toContain('pageHeight="1200"');
    });

    it('should show grid when enabled', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph, { showGrid: true, gridSize: 20 });

      expect(result.content).toContain('grid="1"');
      expect(result.content).toContain('gridSize="20"');
    });

    it('should hide grid when disabled', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph, { showGrid: false });

      expect(result.content).toContain('grid="0"');
    });

    it('should map node types to correct shapes', () => {
      const graph = createTestGraph([
        { id: 'file1', type: 'file', metadata: { label: 'File' } },
        { id: 'class1', type: 'class', metadata: { label: 'Class' } },
        { id: 'interface1', type: 'interface', metadata: { label: 'Interface' } },
        { id: 'folder1', type: 'directory', metadata: { label: 'Directory' } },
      ]);
      const result = exporter.export(graph);

      // File uses document shape
      expect(result.content).toContain('shape=document');
      // Class uses rectangle (rounded)
      expect(result.content).toContain('rounded=1');
      // Interface uses ellipse
      expect(result.content).toContain('ellipse');
      // Directory uses folder
      expect(result.content).toContain('shape=folder');
    });

    it('should map edge types to correct arrow styles', () => {
      const graph = createTestGraph(
        [
          { id: 'a', type: 'class', metadata: { label: 'A' } },
          { id: 'b', type: 'class', metadata: { label: 'B' } },
        ],
        [
          { source: 'a', target: 'b', type: 'extends' },
        ]
      );
      const result = exporter.export(graph);

      // extends uses block arrow
      expect(result.content).toContain('endArrow=block');
    });

    it('should include edge labels when present', () => {
      const graph = createTestGraph(
        [
          { id: 'a', type: 'class', metadata: { label: 'A' } },
          { id: 'b', type: 'class', metadata: { label: 'B' } },
        ],
        [{ source: 'a', target: 'b', type: 'uses', metadata: { label: 'uses for processing' } }]
      );
      const result = exporter.export(graph);

      expect(result.content).toContain('value="uses for processing"');
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

  describe('export() - LOD Filtering', () => {
    it('should filter nodes by LOD level', () => {
      const graph = createTestGraph([
        { id: 'high', type: 'repository', lod: 0, metadata: { label: 'High Level' } },
        { id: 'low', type: 'variable', lod: 5, metadata: { label: 'Low Level' } },
      ]);

      const result = exporter.export(graph, { lodLevel: 2 });

      expect(result.content).toContain('High Level');
      expect(result.content).not.toContain('Low Level');
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

  describe('export() - XML Escaping', () => {
    it('should escape special characters in labels', () => {
      const graph = createTestGraph([
        { id: 'file1', type: 'file', metadata: { label: 'File <with> "special" & chars' } },
      ]);

      const result = exporter.export(graph);

      expect(result.content).toContain('&lt;');
      expect(result.content).toContain('&gt;');
      expect(result.content).toContain('&quot;');
      expect(result.content).toContain('&amp;');
    });

    it('should escape special characters in title', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph, { title: 'Test & <Diagram>' });

      expect(result.content).toContain('Test &amp; &lt;Diagram&gt;');
    });
  });

  describe('export() - Node Positioning', () => {
    it('should use node 3D positions when available', () => {
      const graph = createTestGraph([
        { id: 'node1', type: 'file', position: { x: 2, y: 3, z: 0 }, metadata: { label: 'Node 1' } },
      ]);

      const result = exporter.export(graph);

      // Position should be scaled and offset
      expect(result.content).toContain('<mxGeometry');
    });

    it('should generate positions for nodes without positions', () => {
      const graph = createTestGraph([
        { id: 'node1', type: 'file', metadata: { label: 'Node 1' } },
        { id: 'node2', type: 'class', metadata: { label: 'Node 2' } },
      ]);

      const result = exporter.export(graph);

      // Should have geometry for both nodes
      const geometryMatches = result.content.match(/<mxGeometry/g);
      expect(geometryMatches?.length).toBe(2);
    });
  });

  describe('export() - Styling', () => {
    it('should apply custom node colors', () => {
      const graph = createTestGraph([
        { id: 'node1', type: 'file', style: { color: '#FF0000' }, metadata: { label: 'Red Node' } },
      ]);

      const result = exporter.export(graph);

      expect(result.content).toContain('fillColor=#FF0000');
    });

    it('should apply shadows when enabled', () => {
      const graph = createTestGraph([
        { id: 'node1', type: 'file', metadata: { label: 'Node' } },
      ]);

      const result = exporter.export(graph, { 
        styling: { shadows: true } 
      });

      expect(result.content).toContain('shadow=1');
    });

    it('should highlight nodes with strokeWidth', () => {
      const graph = createTestGraph([
        { id: 'node1', type: 'file', style: { highlighted: true }, metadata: { label: 'Highlighted' } },
      ]);

      const result = exporter.export(graph);

      expect(result.content).toContain('strokeWidth=3');
    });

    it('should apply custom opacity', () => {
      const graph = createTestGraph([
        { id: 'node1', type: 'file', style: { opacity: 0.5 }, metadata: { label: 'Semi-transparent' } },
      ]);

      const result = exporter.export(graph);

      expect(result.content).toContain('opacity=50');
    });
  });

  describe('validateOptions()', () => {
    it('should return empty array for valid options', () => {
      const errors = exporter.validateOptions({
        lodLevel: 3,
        pageWidth: 1200,
        pageHeight: 900,
      });

      expect(errors).toHaveLength(0);
    });

    it('should return error for invalid LOD level', () => {
      const errors = exporter.validateOptions({ lodLevel: 10 as any });

      expect(errors).toContain('lodLevel must be between 0 and 5');
    });

    it('should return error for invalid page dimensions', () => {
      const errors = exporter.validateOptions({ pageWidth: 50 });

      expect(errors).toContain('pageWidth must be at least 100');
    });

    it('should return error for invalid node dimensions', () => {
      const errors = exporter.validateOptions({ nodeWidth: 10 });

      expect(errors).toContain('nodeWidth must be at least 20');
    });

    it('should return error for invalid grid size', () => {
      const errors = exporter.validateOptions({ gridSize: 0 });

      expect(errors).toContain('gridSize must be at least 1');
    });
  });
});

// =============================================================================
// Factory Function Tests
// =============================================================================

describe('createDrawioExporter()', () => {
  it('should create a DrawioExporter instance', () => {
    const exporter = createDrawioExporter();

    expect(exporter).toBeInstanceOf(DrawioExporter);
    expect(exporter.id).toBe('drawio');
  });
});

describe('exportToDrawio()', () => {
  it('should export a graph directly', () => {
    const graph = createTestGraph([
      { id: 'file1', type: 'file', metadata: { label: 'Test File' } },
    ]);

    const result = exportToDrawio(graph);

    expect(result.content).toContain('<mxfile');
    expect(result.content).toContain('Test File');
  });

  it('should accept options', () => {
    const graph = createTestGraph([
      { id: 'class1', type: 'class', metadata: { label: 'TestClass' } },
    ]);

    const result = exportToDrawio(graph, { title: 'Custom Title' });

    expect(result.content).toContain('name="Custom Title"');
  });
});

// =============================================================================
// DEFAULT_DRAWIO_OPTIONS Tests
// =============================================================================

describe('DEFAULT_DRAWIO_OPTIONS', () => {
  it('should have sensible defaults', () => {
    expect(DEFAULT_DRAWIO_OPTIONS.pageWidth).toBe(1200);
    expect(DEFAULT_DRAWIO_OPTIONS.pageHeight).toBe(900);
    expect(DEFAULT_DRAWIO_OPTIONS.nodeWidth).toBe(120);
    expect(DEFAULT_DRAWIO_OPTIONS.nodeHeight).toBe(60);
    expect(DEFAULT_DRAWIO_OPTIONS.lodLevel).toBe(5);
    expect(DEFAULT_DRAWIO_OPTIONS.showGrid).toBe(true);
    expect(DEFAULT_DRAWIO_OPTIONS.includeMetadata).toBe(true);
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Draw.io Integration Tests', () => {
  let exporter: DrawioExporter;

  beforeEach(() => {
    exporter = new DrawioExporter();
  });

  it('should handle a complex application graph', () => {
    const graph = createTestGraph(
      [
        { id: 'app', type: 'package', lod: 1, metadata: { label: 'Application' } },
        { id: 'services', type: 'directory', lod: 2, parentId: 'app', metadata: { label: 'Services' } },
        { id: 'userService', type: 'class', lod: 3, parentId: 'services', metadata: { label: 'UserService' } },
        { id: 'authService', type: 'class', lod: 3, parentId: 'services', metadata: { label: 'AuthService' } },
        { id: 'models', type: 'directory', lod: 2, parentId: 'app', metadata: { label: 'Models' } },
        { id: 'user', type: 'class', lod: 3, parentId: 'models', metadata: { label: 'User' } },
        { id: 'iuser', type: 'interface', lod: 3, parentId: 'models', metadata: { label: 'IUser' } },
      ],
      [
        { source: 'userService', target: 'user', type: 'uses' },
        { source: 'userService', target: 'authService', type: 'calls' },
        { source: 'user', target: 'iuser', type: 'implements' },
      ]
    );

    const result = exporter.export(graph);

    // Verify XML structure
    expect(result.content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(result.content).toContain('<mxfile');
    expect(result.content).toContain('<mxGraphModel');
    expect(result.content).toContain('</mxfile>');

    // Verify nodes
    expect(result.content).toContain('Application');
    expect(result.content).toContain('Services');
    expect(result.content).toContain('UserService');
    expect(result.content).toContain('AuthService');

    // Verify edges
    expect(result.stats.nodeCount).toBe(7);
    expect(result.stats.edgeCount).toBe(3);
  });

  it('should generate valid XML for all node types', () => {
    const nodeTypes = [
      'file', 'directory', 'module', 'class', 'interface',
      'function', 'method', 'variable', 'type', 'enum',
      'namespace', 'package', 'repository'
    ] as const;

    const nodes = nodeTypes.map((type, i) => ({
      id: `node_${type}`,
      type,
      metadata: { label: `${type} node` },
    }));

    const graph = createTestGraph(nodes);
    const result = exporter.export(graph);

    // Should not throw and should contain all nodes
    expect(result.stats.nodeCount).toBe(nodeTypes.length);

    // Verify it's valid XML (basic check)
    expect(result.content).toContain('<?xml');
    expect(result.content).toContain('</mxfile>');
  });

  it('should generate valid XML for all edge types', () => {
    const edgeTypes = [
      'imports', 'exports', 'extends', 'implements', 'calls',
      'uses', 'contains', 'depends_on', 'type_of', 'returns', 'parameter_of'
    ] as const;

    const nodes = [
      { id: 'source', type: 'class' as const, metadata: { label: 'Source' } },
      { id: 'target', type: 'class' as const, metadata: { label: 'Target' } },
    ];

    const edges = edgeTypes.map((type, i) => ({
      id: `edge_${type}`,
      source: 'source',
      target: 'target',
      type,
    }));

    const graph = createTestGraph(nodes, edges);
    const result = exporter.export(graph);

    // Should contain edges
    expect(result.stats.edgeCount).toBe(edgeTypes.length);
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
});
