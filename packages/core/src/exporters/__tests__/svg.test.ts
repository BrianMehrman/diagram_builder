/**
 * SVG Exporter Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { IVMGraph, IVMNode, IVMEdge, NodeType, EdgeType } from '../../ivm/types.js';
import {
  SVGExporter,
  createSVGExporter,
  exportToSVG,
  SVGExportOptions,
  DEFAULT_SVG_OPTIONS,
} from '../svg.js';

// =============================================================================
// Test Fixtures
// =============================================================================

function createTestNode(
  id: string,
  type: NodeType,
  label: string,
  lod: number = 3,
  options: Partial<IVMNode> = {}
): IVMNode {
  return {
    id,
    type,
    lod,
    position: options.position ?? { x: 0, y: 0, z: 0 },
    style: options.style ?? { color: '#FFFFFF', size: 1 },
    metadata: {
      label,
      description: options.metadata?.description ?? '',
      source: options.metadata?.source ?? { file: 'test.ts', line: 1 },
    },
  };
}

function createTestEdge(
  source: string,
  target: string,
  type: EdgeType,
  options: Partial<IVMEdge> = {}
): IVMEdge {
  return {
    source,
    target,
    type,
    weight: options.weight ?? 1,
    metadata: options.metadata ?? { label: '', bidirectional: false },
    style: options.style,
  };
}

function createTestGraph(
  nodes: IVMNode[] = [],
  edges: IVMEdge[] = []
): IVMGraph {
  return {
    nodes,
    edges,
    metadata: {
      name: 'test-graph',
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      sourceInfo: {
        type: 'repository',
        path: '/test/repo',
        languages: ['typescript'],
      },
    },
    bounds: {
      min: { x: -100, y: -100, z: -100 },
      max: { x: 100, y: 100, z: 100 },
    },
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodesByType: {},
      edgesByType: {},
      maxDepth: 1,
    },
  };
}

// =============================================================================
// Exporter Instance Tests
// =============================================================================

describe('SVGExporter', () => {
  let exporter: SVGExporter;

  beforeEach(() => {
    exporter = new SVGExporter();
  });

  describe('properties', () => {
    it('should have correct id', () => {
      expect(exporter.id).toBe('svg');
    });

    it('should have correct name', () => {
      expect(exporter.name).toBe('SVG');
    });

    it('should have correct extension', () => {
      expect(exporter.extension).toBe('svg');
    });

    it('should have correct mimeType', () => {
      expect(exporter.mimeType).toBe('image/svg+xml');
    });
  });

  describe('validateOptions', () => {
    it('should return no errors for valid options', () => {
      const options: SVGExportOptions = {
        lodLevel: 3,
        width: 800,
        height: 600,
        nodeWidth: 100,
        nodeHeight: 50,
        scale: 1.5,
        arrowSize: 10,
      };
      const errors = exporter.validateOptions(options);
      expect(errors).toHaveLength(0);
    });

    it('should return no errors for undefined options', () => {
      const errors = exporter.validateOptions(undefined);
      expect(errors).toHaveLength(0);
    });

    it('should validate lodLevel range', () => {
      expect(exporter.validateOptions({ lodLevel: -1 })).toContain(
        'lodLevel must be between 0 and 5'
      );
      expect(exporter.validateOptions({ lodLevel: 6 })).toContain(
        'lodLevel must be between 0 and 5'
      );
    });

    it('should validate width minimum', () => {
      expect(exporter.validateOptions({ width: 50 })).toContain(
        'width must be at least 100'
      );
    });

    it('should validate height minimum', () => {
      expect(exporter.validateOptions({ height: 50 })).toContain(
        'height must be at least 100'
      );
    });

    it('should validate nodeWidth minimum', () => {
      expect(exporter.validateOptions({ nodeWidth: 10 })).toContain(
        'nodeWidth must be at least 20'
      );
    });

    it('should validate nodeHeight minimum', () => {
      expect(exporter.validateOptions({ nodeHeight: 10 })).toContain(
        'nodeHeight must be at least 20'
      );
    });

    it('should validate scale is positive', () => {
      expect(exporter.validateOptions({ scale: 0 })).toContain(
        'scale must be greater than 0'
      );
      expect(exporter.validateOptions({ scale: -1 })).toContain(
        'scale must be greater than 0'
      );
    });

    it('should validate arrowSize minimum', () => {
      expect(exporter.validateOptions({ arrowSize: 0 })).toContain(
        'arrowSize must be at least 1'
      );
    });

    it('should accumulate multiple errors', () => {
      const errors = exporter.validateOptions({
        lodLevel: 10,
        width: 10,
        height: 10,
      });
      expect(errors).toHaveLength(3);
    });
  });
});

// =============================================================================
// Export Function Tests
// =============================================================================

describe('SVG export', () => {
  let exporter: SVGExporter;

  beforeEach(() => {
    exporter = new SVGExporter();
  });

  describe('empty graph', () => {
    it('should export empty graph', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph);

      expect(result.content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result.content).toContain('<svg');
      expect(result.content).toContain('</svg>');
      expect(result.extension).toBe('svg');
      expect(result.mimeType).toBe('image/svg+xml');
    });

    it('should have correct stats for empty graph', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph);

      expect(result.stats.nodeCount).toBe(0);
      expect(result.stats.edgeCount).toBe(0);
      expect(result.stats.duration).toBeGreaterThanOrEqual(0);
      expect(result.stats.size).toBeGreaterThan(0);
    });
  });

  describe('single node', () => {
    it('should export graph with one class node', () => {
      const node = createTestNode('node-1', 'class', 'MyClass');
      const graph = createTestGraph([node]);
      const result = exporter.export(graph);

      expect(result.content).toContain('class="nodes"');
      expect(result.content).toContain('data-id="node-1"');
      expect(result.content).toContain('data-type="class"');
      expect(result.content).toContain('MyClass');
      expect(result.stats.nodeCount).toBe(1);
    });

    it('should export graph with interface node as ellipse', () => {
      const node = createTestNode('iface-1', 'interface', 'MyInterface');
      const graph = createTestGraph([node]);
      const result = exporter.export(graph);

      expect(result.content).toContain('ellipse');
      expect(result.content).toContain('MyInterface');
    });

    it('should export graph with function node as hexagon', () => {
      const node = createTestNode('func-1', 'function', 'myFunc');
      const graph = createTestGraph([node]);
      const result = exporter.export(graph);

      expect(result.content).toContain('polygon');
      expect(result.content).toContain('myFunc');
    });

    it('should export graph with file node as rect', () => {
      const node = createTestNode('file-1', 'file', 'index.ts');
      const graph = createTestGraph([node]);
      const result = exporter.export(graph);

      expect(result.content).toContain('rect');
      expect(result.content).toContain('index.ts');
    });

    it('should export graph with package node as folder', () => {
      const node = createTestNode('pkg-1', 'package', 'my-package');
      const graph = createTestGraph([node]);
      const result = exporter.export(graph);

      expect(result.content).toContain('path');
      expect(result.content).toContain('my-package');
    });

    it('should export graph with variable node as diamond', () => {
      const node = createTestNode('var-1', 'variable', 'myVar');
      const graph = createTestGraph([node]);
      const result = exporter.export(graph);

      expect(result.content).toContain('polygon');
      expect(result.content).toContain('myVar');
    });

    it('should export graph with repository node as cylinder', () => {
      const node = createTestNode('repo-1', 'repository', 'my-repo');
      const graph = createTestGraph([node]);
      const result = exporter.export(graph);

      expect(result.content).toContain('ellipse');
      expect(result.content).toContain('<g>');
      expect(result.content).toContain('my-repo');
    });
  });

  describe('edges', () => {
    it('should export graph with edge', () => {
      const nodes = [
        createTestNode('node-1', 'class', 'ClassA'),
        createTestNode('node-2', 'class', 'ClassB'),
      ];
      const edges = [createTestEdge('node-1', 'node-2', 'extends')];
      const graph = createTestGraph(nodes, edges);
      const result = exporter.export(graph);

      expect(result.content).toContain('class="edges"');
      expect(result.content).toContain('<path');
      expect(result.content).toContain('marker-end');
      expect(result.stats.edgeCount).toBe(1);
    });

    it('should render dashed edges for imports', () => {
      const nodes = [
        createTestNode('node-1', 'file', 'a.ts'),
        createTestNode('node-2', 'file', 'b.ts'),
      ];
      const edges = [createTestEdge('node-1', 'node-2', 'imports')];
      const graph = createTestGraph(nodes, edges);
      const result = exporter.export(graph);

      expect(result.content).toContain('stroke-dasharray');
    });

    it('should not include arrow for contains edges', () => {
      const nodes = [
        createTestNode('pkg-1', 'package', 'my-pkg'),
        createTestNode('file-1', 'file', 'index.ts'),
      ];
      const edges = [createTestEdge('pkg-1', 'file-1', 'contains')];
      const graph = createTestGraph(nodes, edges);
      const result = exporter.export(graph);

      // Contains edges should not have marker-end
      const edgePath = result.content.match(/<path d="M[^"]*"[^>]*>/);
      expect(edgePath).toBeTruthy();
      // The specific path should not have marker-end (contains edges)
      expect(result.content).not.toMatch(/<path d="M[^"]*"[^>]*marker-end="url\(#arrow-[^"]*\)"[^>]*\/>/);
    });

    it('should filter out edges with missing nodes', () => {
      const nodes = [createTestNode('node-1', 'class', 'ClassA')];
      const edges = [createTestEdge('node-1', 'missing', 'extends')];
      const graph = createTestGraph(nodes, edges);
      const result = exporter.export(graph);

      expect(result.stats.edgeCount).toBe(0);
    });
  });

  describe('options', () => {
    it('should include title when provided', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph, { title: 'My Diagram' });

      expect(result.content).toContain('<title>My Diagram</title>');
    });

    it('should include metadata comments by default', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph);

      expect(result.content).toContain('<!-- Generated from:');
      expect(result.content).toContain('<!-- Generated at:');
      expect(result.content).toContain('<!-- Nodes:');
    });

    it('should exclude metadata when includeMetadata is false', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph, { includeMetadata: false });

      expect(result.content).not.toContain('<!-- Generated from:');
    });

    it('should hide labels when showLabels is false', () => {
      const node = createTestNode('node-1', 'class', 'MyClass');
      const graph = createTestGraph([node]);
      const result = exporter.export(graph, { showLabels: false });

      expect(result.content).not.toContain('>MyClass<');
    });

    it('should include legend when includeLegend is true', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph, { includeLegend: true });

      expect(result.content).toContain('class="legend"');
      expect(result.content).toContain('>Legend<');
    });

    it('should add shadows when styling.shadows is true', () => {
      const node = createTestNode('node-1', 'class', 'MyClass');
      const graph = createTestGraph([node]);
      const result = exporter.export(graph, {
        styling: { shadows: true },
      });

      expect(result.content).toContain('filter id="shadow"');
      expect(result.content).toContain('filter="url(#shadow)"');
    });

    it('should respect custom dimensions', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph, { width: 1920, height: 1080 });

      expect(result.content).toContain('width="1920"');
      expect(result.content).toContain('height="1080"');
    });
  });

  describe('LOD filtering', () => {
    it('should filter nodes by LOD level', () => {
      const nodes = [
        createTestNode('node-1', 'package', 'pkg', 1),
        createTestNode('node-2', 'class', 'Class', 3),
        createTestNode('node-3', 'method', 'method', 5),
      ];
      const graph = createTestGraph(nodes);

      // LOD level 2 should include only package (LOD 1)
      const result = exporter.export(graph, { lodLevel: 2 });

      expect(result.stats.nodeCount).toBe(1);
      expect(result.content).toContain('pkg');
      expect(result.content).not.toContain('Class');
      expect(result.content).not.toContain('method');
    });
  });

  describe('XML escaping', () => {
    it('should escape special characters in labels', () => {
      const node = createTestNode('node-1', 'class', 'Class<T>');
      const graph = createTestGraph([node]);
      const result = exporter.export(graph);

      expect(result.content).toContain('Class&lt;T&gt;');
    });

    it('should escape ampersands in titles', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph, { title: 'A & B' });

      expect(result.content).toContain('A &amp; B');
    });
  });

  describe('label truncation', () => {
    it('should truncate long labels', () => {
      const node = createTestNode('node-1', 'class', 'VeryLongClassNameThatShouldBeTruncated');
      const graph = createTestGraph([node]);
      const result = exporter.export(graph);

      expect(result.content).toContain('VeryLongClas...');
      expect(result.content).not.toContain('VeryLongClassNameThatShouldBeTruncated');
    });
  });
});

// =============================================================================
// Factory Function Tests
// =============================================================================

describe('createSVGExporter', () => {
  it('should create an SVGExporter instance', () => {
    const exporter = createSVGExporter();
    expect(exporter).toBeInstanceOf(SVGExporter);
  });
});

describe('exportToSVG', () => {
  it('should export graph using convenience function', () => {
    const graph = createTestGraph();
    const result = exportToSVG(graph);

    expect(result.content).toContain('<?xml');
    expect(result.content).toContain('<svg');
    expect(result.mimeType).toBe('image/svg+xml');
  });

  it('should accept options', () => {
    const graph = createTestGraph();
    const result = exportToSVG(graph, { title: 'Test Title' });

    expect(result.content).toContain('<title>Test Title</title>');
  });
});

// =============================================================================
// Default Options Tests
// =============================================================================

describe('DEFAULT_SVG_OPTIONS', () => {
  it('should have sensible default width', () => {
    expect(DEFAULT_SVG_OPTIONS.width).toBeGreaterThan(0);
  });

  it('should have sensible default height', () => {
    expect(DEFAULT_SVG_OPTIONS.height).toBeGreaterThan(0);
  });

  it('should have sensible default padding', () => {
    expect(DEFAULT_SVG_OPTIONS.padding).toBeGreaterThanOrEqual(0);
  });

  it('should have showLabels enabled by default', () => {
    expect(DEFAULT_SVG_OPTIONS.showLabels).toBe(true);
  });

  it('should have autoFit enabled by default', () => {
    expect(DEFAULT_SVG_OPTIONS.autoFit).toBe(true);
  });

  it('should have LOD level 5 by default', () => {
    expect(DEFAULT_SVG_OPTIONS.lodLevel).toBe(5);
  });
});

// =============================================================================
// Position Calculation Tests
// =============================================================================

describe('node positioning', () => {
  it('should position nodes using their 3D coordinates when available', () => {
    const node = createTestNode('node-1', 'class', 'MyClass', 3, {
      position: { x: 2, y: 0, z: 1 },
    });
    const graph = createTestGraph([node]);
    const exporter = new SVGExporter();
    const result = exporter.export(graph);

    // Node should be positioned based on x/z coordinates
    // The exact position depends on the algorithm, but the SVG should be valid
    expect(result.content).toContain('data-id="node-1"');
    expect(result.stats.nodeCount).toBe(1);
  });

  it('should group nodes by LOD level for hierarchical layout', () => {
    const nodes = [
      createTestNode('pkg-1', 'package', 'Package', 1),
      createTestNode('class-1', 'class', 'ClassA', 3),
      createTestNode('class-2', 'class', 'ClassB', 3),
      createTestNode('method-1', 'method', 'methodA', 5),
    ];
    const graph = createTestGraph(nodes);
    const exporter = new SVGExporter();
    const result = exporter.export(graph);

    // All nodes should be present
    expect(result.stats.nodeCount).toBe(4);
    expect(result.content).toContain('Package');
    expect(result.content).toContain('ClassA');
    expect(result.content).toContain('ClassB');
    expect(result.content).toContain('methodA');
  });
});

// =============================================================================
// Arrow Marker Tests
// =============================================================================

describe('arrow markers', () => {
  it('should create unique arrow markers for different edge colors', () => {
    const nodes = [
      createTestNode('node-1', 'class', 'ClassA'),
      createTestNode('node-2', 'class', 'ClassB'),
      createTestNode('node-3', 'interface', 'InterfaceC'),
    ];
    const edges = [
      createTestEdge('node-1', 'node-2', 'extends'),
      createTestEdge('node-1', 'node-3', 'implements'),
    ];
    const graph = createTestGraph(nodes, edges);
    const exporter = new SVGExporter();
    const result = exporter.export(graph);

    // Should have marker definitions
    expect(result.content).toContain('<defs>');
    expect(result.content).toContain('<marker');
    expect(result.content).toContain('</defs>');
  });
});

// =============================================================================
// ViewBox Tests
// =============================================================================

describe('viewBox calculation', () => {
  it('should calculate viewBox for auto-fit', () => {
    const nodes = [
      createTestNode('node-1', 'class', 'ClassA', 3, {
        position: { x: 0, y: 0, z: 0 },
      }),
      createTestNode('node-2', 'class', 'ClassB', 3, {
        position: { x: 5, y: 0, z: 3 },
      }),
    ];
    const graph = createTestGraph(nodes);
    const exporter = new SVGExporter();
    const result = exporter.export(graph, { autoFit: true });

    expect(result.content).toContain('viewBox=');
  });

  it('should use default viewBox when autoFit is disabled', () => {
    const graph = createTestGraph();
    const exporter = new SVGExporter();
    const result = exporter.export(graph, {
      autoFit: false,
      width: 800,
      height: 600,
    });

    expect(result.content).toContain('viewBox="0 0 800 600"');
  });
});
