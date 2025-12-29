/**
 * Mermaid Exporter Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MermaidExporter,
  createMermaidExporter,
  exportToMermaid,
  DEFAULT_MERMAID_OPTIONS,
} from '../mermaid.js';
import type { MermaidExportOptions } from '../mermaid.js';
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
    metadata: {
      label: n.metadata?.label ?? `Node ${i}`,
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
// MermaidExporter Tests
// =============================================================================

describe('MermaidExporter', () => {
  let exporter: MermaidExporter;

  beforeEach(() => {
    exporter = new MermaidExporter();
  });

  describe('constructor and properties', () => {
    it('should have correct id', () => {
      expect(exporter.id).toBe('mermaid');
    });

    it('should have correct name', () => {
      expect(exporter.name).toBe('Mermaid');
    });

    it('should have correct extension', () => {
      expect(exporter.extension).toBe('mmd');
    });

    it('should have correct mimeType', () => {
      expect(exporter.mimeType).toBe('text/x-mermaid');
    });
  });

  describe('export() - Flowchart', () => {
    it('should export an empty graph', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph);

      expect(result.content).toContain('flowchart TB');
      expect(result.mimeType).toBe('text/x-mermaid');
      expect(result.extension).toBe('mmd');
      expect(result.stats.nodeCount).toBe(0);
      expect(result.stats.edgeCount).toBe(0);
    });

    it('should export a graph with nodes', () => {
      const graph = createTestGraph([
        { id: 'file1', type: 'file', metadata: { label: 'File 1' } },
        { id: 'class1', type: 'class', metadata: { label: 'MyClass' } },
      ]);
      const result = exporter.export(graph);

      expect(result.content).toContain('file1["File 1"]');
      expect(result.content).toContain('class1{{"MyClass"}}');
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

      expect(result.content).toContain('class1 -->|extends| class2');
      expect(result.stats.edgeCount).toBe(1);
    });

    it('should support different directions', () => {
      const graph = createTestGraph([
        { id: 'node1', type: 'file', metadata: { label: 'Node 1' } },
      ]);

      const tbResult = exporter.export(graph, { direction: 'TB' });
      expect(tbResult.content).toContain('flowchart TB');

      const lrResult = exporter.export(graph, { direction: 'LR' });
      expect(lrResult.content).toContain('flowchart LR');

      const btResult = exporter.export(graph, { direction: 'BT' });
      expect(btResult.content).toContain('flowchart BT');
    });

    it('should include metadata comments by default', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph);

      expect(result.content).toContain('%% Generated from: test-graph');
      expect(result.content).toContain('%% Schema version:');
    });

    it('should exclude metadata when includeMetadata is false', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph, { includeMetadata: false });

      expect(result.content).not.toContain('%% Generated from:');
    });

    it('should use subgraphs for parent-child relationships', () => {
      const graph = createTestGraph([
        { id: 'parent', type: 'package', metadata: { label: 'Parent Package' } },
        { id: 'child', type: 'file', parentId: 'parent', metadata: { label: 'Child File' } },
      ]);
      const result = exporter.export(graph, { useSubgraphs: true });

      expect(result.content).toContain('subgraph parent["Parent Package"]');
      expect(result.content).toContain('end');
    });

    it('should not use subgraphs when disabled', () => {
      const graph = createTestGraph([
        { id: 'parent', type: 'package', metadata: { label: 'Parent Package' } },
        { id: 'child', type: 'file', parentId: 'parent', metadata: { label: 'Child File' } },
      ]);
      const result = exporter.export(graph, { useSubgraphs: false });

      expect(result.content).not.toContain('subgraph');
    });

    it('should hide edge labels when showEdgeLabels is false', () => {
      const graph = createTestGraph(
        [
          { id: 'a', type: 'file', metadata: { label: 'A' } },
          { id: 'b', type: 'file', metadata: { label: 'B' } },
        ],
        [{ source: 'a', target: 'b', type: 'imports' }]
      );
      const result = exporter.export(graph, { showEdgeLabels: false });

      expect(result.content).toContain('a -.-> b');
      expect(result.content).not.toContain('|imports|');
    });

    it('should include legend when requested', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph, { includeLegend: true });

      expect(result.content).toContain('%% Legend:');
    });

    it('should add styling for nodes', () => {
      const graph = createTestGraph([
        { id: 'file1', type: 'file', metadata: { label: 'File 1' } },
      ]);
      const result = exporter.export(graph);

      expect(result.content).toContain('style file1 fill:');
    });
  });

  describe('export() - Class Diagram', () => {
    it('should generate a class diagram', () => {
      const graph = createTestGraph([
        { id: 'class1', type: 'class', metadata: { label: 'MyClass' } },
      ]);
      const result = exporter.export(graph, { diagramType: 'classDiagram' });

      expect(result.content).toContain('classDiagram');
      expect(result.content).toContain('class class1["MyClass"]');
    });

    it('should mark interfaces with <<interface>> stereotype', () => {
      const graph = createTestGraph([
        { id: 'iface1', type: 'interface', metadata: { label: 'IMyInterface' } },
      ]);
      const result = exporter.export(graph, { diagramType: 'classDiagram' });

      expect(result.content).toContain('<<interface>>');
    });

    it('should mark enums with <<enumeration>> stereotype', () => {
      const graph = createTestGraph([
        { id: 'enum1', type: 'enum', metadata: { label: 'MyEnum' } },
      ]);
      const result = exporter.export(graph, { diagramType: 'classDiagram' });

      expect(result.content).toContain('<<enumeration>>');
    });

    it('should use correct relationship arrows', () => {
      const graph = createTestGraph(
        [
          { id: 'child', type: 'class', metadata: { label: 'Child' } },
          { id: 'parent', type: 'class', metadata: { label: 'Parent' } },
        ],
        [{ source: 'child', target: 'parent', type: 'extends' }]
      );
      const result = exporter.export(graph, { diagramType: 'classDiagram' });

      expect(result.content).toContain('child <|-- parent');
    });

    it('should add edge labels when present', () => {
      const graph = createTestGraph(
        [
          { id: 'a', type: 'class', metadata: { label: 'A' } },
          { id: 'b', type: 'class', metadata: { label: 'B' } },
        ],
        [{ source: 'a', target: 'b', type: 'uses', metadata: { label: 'uses for processing' } }]
      );
      const result = exporter.export(graph, { diagramType: 'classDiagram' });

      expect(result.content).toContain(': uses for processing');
    });
  });

  describe('export() - C4 Diagrams', () => {
    it('should generate C4 Context diagram', () => {
      const graph = createTestGraph([
        { id: 'system1', type: 'repository', metadata: { label: 'My System', description: 'Main system' } },
      ]);
      const result = exporter.export(graph, { diagramType: 'c4Context' });

      expect(result.content).toContain('C4Context');
      expect(result.content).toContain('System_Ext(system1, "My System"');
    });

    it('should generate C4 Container diagram', () => {
      const graph = createTestGraph([
        { id: 'container1', type: 'package', metadata: { label: 'API Container', description: 'REST API' } },
      ]);
      const result = exporter.export(graph, { diagramType: 'c4Container' });

      expect(result.content).toContain('C4Container');
      expect(result.content).toContain('Container(container1, "API Container"');
    });

    it('should generate C4 Component diagram', () => {
      const graph = createTestGraph([
        { id: 'comp1', type: 'class', metadata: { label: 'UserService', description: 'Handles user operations' } },
      ]);
      const result = exporter.export(graph, { diagramType: 'c4Component' });

      expect(result.content).toContain('C4Component');
      expect(result.content).toContain('Component(comp1, "UserService"');
    });

    it('should include title in C4 diagrams', () => {
      const graph = createTestGraph([
        { id: 'sys1', type: 'repository', metadata: { label: 'System' } },
      ]);
      const result = exporter.export(graph, { diagramType: 'c4Context', title: 'Architecture Overview' });

      expect(result.content).toContain('title Architecture Overview');
    });

    it('should use Rel for relationships', () => {
      const graph = createTestGraph(
        [
          { id: 'a', type: 'package', metadata: { label: 'Service A' } },
          { id: 'b', type: 'package', metadata: { label: 'Service B' } },
        ],
        [{ source: 'a', target: 'b', type: 'calls', metadata: { label: 'Makes API calls' } }]
      );
      const result = exporter.export(graph, { diagramType: 'c4Context' });

      expect(result.content).toContain('Rel(a, b, "Makes API calls")');
    });
  });

  describe('export() - LOD Filtering', () => {
    it('should filter nodes by LOD level', () => {
      const graph = createTestGraph([
        { id: 'high', type: 'repository', lod: 0, metadata: { label: 'High Level' } },
        { id: 'low', type: 'variable', lod: 5, metadata: { label: 'Low Level' } },
      ]);

      // At LOD 2, only nodes with lod <= 2 should be visible
      const result = exporter.export(graph, { lodLevel: 2 });

      expect(result.content).toContain('high');
      expect(result.content).not.toContain('low[');
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

  describe('validateOptions()', () => {
    it('should return empty array for valid options', () => {
      const errors = exporter.validateOptions({
        lodLevel: 3,
        diagramType: 'flowchart',
        direction: 'LR',
      });

      expect(errors).toHaveLength(0);
    });

    it('should return error for invalid LOD level', () => {
      const errors = exporter.validateOptions({ lodLevel: 10 as any });

      expect(errors).toContain('lodLevel must be between 0 and 5');
    });

    it('should return error for invalid diagram type', () => {
      const errors = exporter.validateOptions({ diagramType: 'invalid' as any });

      expect(errors.some(e => e.includes('diagramType'))).toBe(true);
    });

    it('should return error for invalid direction', () => {
      const errors = exporter.validateOptions({ direction: 'XX' as any });

      expect(errors.some(e => e.includes('direction'))).toBe(true);
    });

    it('should return error for invalid maxSubgraphDepth', () => {
      const errors = exporter.validateOptions({ maxSubgraphDepth: -2 });

      expect(errors).toContain('maxSubgraphDepth must be >= -1');
    });
  });

  describe('calculateStats()', () => {
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
});

// =============================================================================
// Factory Function Tests
// =============================================================================

describe('createMermaidExporter()', () => {
  it('should create a MermaidExporter instance', () => {
    const exporter = createMermaidExporter();

    expect(exporter).toBeInstanceOf(MermaidExporter);
    expect(exporter.id).toBe('mermaid');
  });
});

describe('exportToMermaid()', () => {
  it('should export a graph directly', () => {
    const graph = createTestGraph([
      { id: 'file1', type: 'file', metadata: { label: 'Test File' } },
    ]);

    const result = exportToMermaid(graph);

    expect(result.content).toContain('flowchart TB');
    expect(result.content).toContain('file1');
  });

  it('should accept options', () => {
    const graph = createTestGraph([
      { id: 'class1', type: 'class', metadata: { label: 'TestClass' } },
    ]);

    const result = exportToMermaid(graph, { diagramType: 'classDiagram' });

    expect(result.content).toContain('classDiagram');
  });
});

// =============================================================================
// DEFAULT_MERMAID_OPTIONS Tests
// =============================================================================

describe('DEFAULT_MERMAID_OPTIONS', () => {
  it('should have sensible defaults', () => {
    expect(DEFAULT_MERMAID_OPTIONS.diagramType).toBe('flowchart');
    expect(DEFAULT_MERMAID_OPTIONS.direction).toBe('TB');
    expect(DEFAULT_MERMAID_OPTIONS.lodLevel).toBe(5);
    expect(DEFAULT_MERMAID_OPTIONS.useSubgraphs).toBe(true);
    expect(DEFAULT_MERMAID_OPTIONS.showEdgeLabels).toBe(true);
    expect(DEFAULT_MERMAID_OPTIONS.includeMetadata).toBe(true);
  });
});

// =============================================================================
// Integration Tests with Complex Graphs
// =============================================================================

describe('Mermaid Integration Tests', () => {
  let exporter: MermaidExporter;

  beforeEach(() => {
    exporter = new MermaidExporter();
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

    const result = exporter.export(graph, {
      diagramType: 'flowchart',
      useSubgraphs: true,
      direction: 'TB',
    });

    // Verify structure
    expect(result.content).toContain('flowchart TB');
    expect(result.content).toContain('subgraph app["Application"]');
    expect(result.content).toContain('subgraph services["Services"]');
    expect(result.content).toContain('subgraph models["Models"]');
    
    // Verify relationships
    expect(result.content).toContain('userService');
    expect(result.content).toContain('authService');
    expect(result.content).toContain('user');
    
    expect(result.stats.nodeCount).toBe(7);
    expect(result.stats.edgeCount).toBe(3);
  });

  it('should handle special characters in labels', () => {
    const graph = createTestGraph([
      { id: 'file1', type: 'file', metadata: { label: 'File <with> "special" chars' } },
    ]);

    const result = exporter.export(graph);

    // Special characters should be escaped
    expect(result.content).toContain('#lt;');
    expect(result.content).toContain('#gt;');
    expect(result.content).toContain('#quot;');
  });

  it('should handle IDs with special characters', () => {
    const graph = createTestGraph([
      { id: 'path/to/file.ts', type: 'file', metadata: { label: 'file.ts' } },
    ]);

    const result = exporter.export(graph);

    // IDs should be sanitized
    expect(result.content).toContain('path_to_file_ts');
  });

  it('should generate valid Mermaid syntax for all node types', () => {
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
    
    // Verify flowchart starts correctly
    expect(result.content).toContain('flowchart TB');
  });

  it('should generate valid Mermaid syntax for all edge types', () => {
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
});
