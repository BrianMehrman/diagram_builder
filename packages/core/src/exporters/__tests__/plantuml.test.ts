/**
 * PlantUML Exporter Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PlantUMLExporter,
  createPlantUMLExporter,
  exportToPlantUML,
  DEFAULT_PLANTUML_OPTIONS,
} from '../plantuml.js';
import type { PlantUMLExportOptions } from '../plantuml.js';
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
// PlantUMLExporter Tests
// =============================================================================

describe('PlantUMLExporter', () => {
  let exporter: PlantUMLExporter;

  beforeEach(() => {
    exporter = new PlantUMLExporter();
  });

  describe('constructor and properties', () => {
    it('should have correct id', () => {
      expect(exporter.id).toBe('plantuml');
    });

    it('should have correct name', () => {
      expect(exporter.name).toBe('PlantUML');
    });

    it('should have correct extension', () => {
      expect(exporter.extension).toBe('puml');
    });

    it('should have correct mimeType', () => {
      expect(exporter.mimeType).toBe('text/x-plantuml');
    });
  });

  describe('export()', () => {
    it('should export an empty graph', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph);

      expect(result.content).toContain('@startuml');
      expect(result.content).toContain('@enduml');
      expect(result.mimeType).toBe('text/x-plantuml');
      expect(result.extension).toBe('puml');
      expect(result.stats.nodeCount).toBe(0);
      expect(result.stats.edgeCount).toBe(0);
    });

    it('should export a graph with nodes', () => {
      const graph = createTestGraph([
        { id: 'file1', type: 'file', metadata: { label: 'File 1' } },
        { id: 'class1', type: 'class', metadata: { label: 'MyClass' } },
      ]);
      const result = exporter.export(graph);

      expect(result.content).toContain('file "File 1" as file1');
      expect(result.content).toContain('class "MyClass" as class1');
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

      expect(result.content).toContain('class1 --|> class2');
      expect(result.stats.edgeCount).toBe(1);
    });

    it('should include title when provided', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph, { title: 'My Diagram' });

      expect(result.content).toContain('title My Diagram');
    });

    it('should include metadata comments by default', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph);

      expect(result.content).toContain("' Generated from: test-graph");
      expect(result.content).toContain("' Schema version:");
    });

    it('should exclude metadata when includeMetadata is false', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph, { includeMetadata: false });

      expect(result.content).not.toContain("' Generated from:");
    });

    it('should include skinparam by default', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph);

      expect(result.content).toContain('skinparam {');
    });

    it('should exclude skinparam when useSkinparam is false', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph, { useSkinparam: false });

      expect(result.content).not.toContain('skinparam {');
    });

    it('should set direction correctly', () => {
      const graph = createTestGraph();

      const topToBottom = exporter.export(graph, { direction: 'top to bottom' });
      expect(topToBottom.content).toContain('top to bottom direction');

      const leftToRight = exporter.export(graph, { direction: 'left to right' });
      expect(leftToRight.content).toContain('left to right direction');
    });

    it('should include legend when requested', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph, { includeLegend: true });

      expect(result.content).toContain('legend right');
      expect(result.content).toContain('endlegend');
    });

    it('should calculate stats correctly', () => {
      const graph = createTestGraph(
        [
          { id: 'n1', type: 'file' },
          { id: 'n2', type: 'class' },
          { id: 'n3', type: 'function' },
        ],
        [
          { id: 'e1', source: 'n1', target: 'n2', type: 'contains' },
          { id: 'e2', source: 'n2', target: 'n3', type: 'contains' },
        ]
      );
      const result = exporter.export(graph);

      expect(result.stats.nodeCount).toBe(3);
      expect(result.stats.edgeCount).toBe(2);
      expect(result.stats.duration).toBeGreaterThanOrEqual(0);
      expect(result.stats.size).toBeGreaterThan(0);
    });
  });

  describe('node type mapping', () => {
    it.each([
      ['file', 'file'],
      ['class', 'class'],
      ['interface', 'interface'],
      ['function', 'rectangle'],
      ['package', 'package'],
      ['namespace', 'package'],
      ['directory', 'folder'],
      ['module', 'package'],
      ['method', 'rectangle'],
      ['variable', 'storage'],
      ['type', 'interface'],
      ['enum', 'enum'],
      ['repository', 'cloud'],
    ] as const)('should map %s to %s', (nodeType, plantUmlType) => {
      const graph = createTestGraph([{ id: 'node1', type: nodeType, metadata: { label: 'Test' } }]);
      const result = exporter.export(graph, { showStereotypes: false });

      expect(result.content).toContain(`${plantUmlType} "Test" as node1`);
    });
  });

  describe('edge type mapping', () => {
    it.each([
      ['imports', '..>'],
      ['exports', '<..'],
      ['extends', '--|>'],
      ['implements', '..|>'],
      ['calls', '-->'],
      ['uses', '..>'],
      ['contains', '--*'],
      ['depends_on', '..>'],
      ['type_of', '..|>'],
      ['returns', '-->'],
      ['parameter_of', '..>'],
    ] as const)('should map %s to %s', (edgeType, arrow) => {
      const graph = createTestGraph(
        [
          { id: 'n1', type: 'class' },
          { id: 'n2', type: 'class' },
        ],
        [{ source: 'n1', target: 'n2', type: edgeType }]
      );
      const result = exporter.export(graph, { showLabels: false });

      expect(result.content).toContain(`n1 ${arrow} n2`);
    });
  });

  describe('stereotypes', () => {
    it('should include stereotypes by default', () => {
      const graph = createTestGraph([{ id: 'n1', type: 'class', metadata: { label: 'MyClass' } }]);
      const result = exporter.export(graph);

      expect(result.content).toContain('<<class>>');
    });

    it('should exclude stereotypes when showStereotypes is false', () => {
      const graph = createTestGraph([{ id: 'n1', type: 'class', metadata: { label: 'MyClass' } }]);
      const result = exporter.export(graph, { showStereotypes: false });

      expect(result.content).not.toContain('<<class>>');
    });
  });

  describe('labels', () => {
    it('should include edge labels by default', () => {
      const graph = createTestGraph(
        [
          { id: 'n1', type: 'class' },
          { id: 'n2', type: 'class' },
        ],
        [{ source: 'n1', target: 'n2', type: 'extends' }]
      );
      const result = exporter.export(graph);

      expect(result.content).toContain(': extends');
    });

    it('should exclude edge labels when showLabels is false', () => {
      const graph = createTestGraph(
        [
          { id: 'n1', type: 'class' },
          { id: 'n2', type: 'class' },
        ],
        [{ source: 'n1', target: 'n2', type: 'extends' }]
      );
      const result = exporter.export(graph, { showLabels: false });

      expect(result.content).not.toContain(': extends');
    });

    it('should use custom edge label when provided', () => {
      const graph = createTestGraph(
        [
          { id: 'n1', type: 'class' },
          { id: 'n2', type: 'class' },
        ],
        [{ source: 'n1', target: 'n2', type: 'extends', metadata: { label: 'custom label' } }]
      );
      const result = exporter.export(graph);

      expect(result.content).toContain(': custom label');
    });
  });

  describe('grouping', () => {
    it('should group nodes by parent by default', () => {
      const graph = createTestGraph([
        { id: 'pkg', type: 'package', metadata: { label: 'MyPackage' } },
        { id: 'class1', type: 'class', parentId: 'pkg', metadata: { label: 'Class1' } },
      ]);
      const result = exporter.export(graph);

      expect(result.content).toContain('package "MyPackage" as pkg {');
      expect(result.content).toContain('}');
    });

    it('should not group when groupByParent is false', () => {
      const graph = createTestGraph([
        { id: 'pkg', type: 'package', metadata: { label: 'MyPackage' } },
        { id: 'class1', type: 'class', parentId: 'pkg', metadata: { label: 'Class1' } },
      ]);
      const result = exporter.export(graph, { groupByParent: false });

      expect(result.content).not.toContain('package "MyPackage" as pkg {');
    });

    it('should respect maxGroupDepth', () => {
      const graph = createTestGraph([
        { id: 'pkg1', type: 'package', metadata: { label: 'Level1' } },
        { id: 'pkg2', type: 'package', parentId: 'pkg1', metadata: { label: 'Level2' } },
        { id: 'class1', type: 'class', parentId: 'pkg2', metadata: { label: 'Class1' } },
      ]);

      // With depth 1, only first level should be nested
      const result = exporter.export(graph, { maxGroupDepth: 1 });

      expect(result.content).toContain('package "Level1" as pkg1 {');
      // pkg2 should be rendered as a simple node, not a container
    });
  });

  describe('LOD filtering', () => {
    it('should filter by LOD level', () => {
      const graph = createTestGraph([
        { id: 'n1', type: 'package', lod: 1, metadata: { label: 'Package' } },
        { id: 'n2', type: 'class', lod: 3, parentId: 'n1', metadata: { label: 'Class' } },
        { id: 'n3', type: 'method', lod: 5, parentId: 'n2', metadata: { label: 'Method' } },
      ]);

      // LOD level 2 should show only package (lod 1), not class (lod 3) or method (lod 5)
      const result = exporter.export(graph, { lodLevel: 2 });

      expect(result.stats.nodeCount).toBe(1);
      expect(result.content).toContain('Package');
      expect(result.content).not.toContain('Class');
      expect(result.content).not.toContain('Method');
    });

    it('should include all nodes at LOD level 5', () => {
      const graph = createTestGraph([
        { id: 'n1', type: 'package', lod: 1 },
        { id: 'n2', type: 'class', lod: 3 },
        { id: 'n3', type: 'method', lod: 5 },
      ]);

      const result = exporter.export(graph, { lodLevel: 5 });
      expect(result.stats.nodeCount).toBe(3);
    });
  });

  describe('ID sanitization', () => {
    it('should sanitize special characters in node IDs', () => {
      const graph = createTestGraph([
        { id: 'my-class.ts', type: 'file', metadata: { label: 'my-class.ts' } },
      ]);
      const result = exporter.export(graph);

      expect(result.content).toContain('as my_class_ts');
      expect(result.content).not.toContain('as my-class.ts');
    });

    it('should sanitize special characters in edge references', () => {
      const graph = createTestGraph(
        [
          { id: 'file@1', type: 'file', metadata: { label: 'File 1' } },
          { id: 'file@2', type: 'file', metadata: { label: 'File 2' } },
        ],
        [{ source: 'file@1', target: 'file@2', type: 'imports' }]
      );
      const result = exporter.export(graph);

      expect(result.content).toContain('file_1');
      expect(result.content).toContain('file_2');
    });
  });

  describe('label escaping', () => {
    it('should escape quotes in labels', () => {
      const graph = createTestGraph([
        { id: 'n1', type: 'class', metadata: { label: 'Class "Test"' } },
      ]);
      const result = exporter.export(graph);

      expect(result.content).toContain('Class \\"Test\\"');
    });
  });

  describe('validateOptions()', () => {
    it('should return empty array for valid options', () => {
      const errors = exporter.validateOptions({
        lodLevel: 3,
        maxGroupDepth: 2,
        diagramType: 'component',
      });

      expect(errors).toEqual([]);
    });

    it('should return error for invalid lodLevel', () => {
      expect(exporter.validateOptions({ lodLevel: -1 })).toContain(
        'lodLevel must be between 0 and 5'
      );
      expect(exporter.validateOptions({ lodLevel: 6 })).toContain(
        'lodLevel must be between 0 and 5'
      );
    });

    it('should return error for invalid maxGroupDepth', () => {
      expect(exporter.validateOptions({ maxGroupDepth: -2 })).toContain(
        'maxGroupDepth must be -1 or greater'
      );
    });

    it('should return error for invalid diagramType', () => {
      const errors = exporter.validateOptions({
        diagramType: 'invalid' as unknown as PlantUMLExportOptions['diagramType'],
      });
      expect(errors[0]).toContain('diagramType must be one of');
    });

    it('should allow -1 for unlimited maxGroupDepth', () => {
      const errors = exporter.validateOptions({ maxGroupDepth: -1 });
      expect(errors).toEqual([]);
    });
  });
});

// =============================================================================
// Factory Function Tests
// =============================================================================

describe('createPlantUMLExporter()', () => {
  it('should create a PlantUMLExporter instance', () => {
    const exporter = createPlantUMLExporter();

    expect(exporter).toBeInstanceOf(PlantUMLExporter);
    expect(exporter.id).toBe('plantuml');
  });
});

// =============================================================================
// Convenience Function Tests
// =============================================================================

describe('exportToPlantUML()', () => {
  it('should export graph to PlantUML', () => {
    const graph = createTestGraph([
      { id: 'n1', type: 'class', metadata: { label: 'MyClass' } },
    ]);
    const result = exportToPlantUML(graph);

    expect(result.content).toContain('@startuml');
    expect(result.content).toContain('MyClass');
    expect(result.content).toContain('@enduml');
  });

  it('should accept options', () => {
    const graph = createTestGraph();
    const result = exportToPlantUML(graph, { title: 'Test Title' });

    expect(result.content).toContain('title Test Title');
  });
});

// =============================================================================
// Default Options Tests
// =============================================================================

describe('DEFAULT_PLANTUML_OPTIONS', () => {
  it('should have expected defaults', () => {
    expect(DEFAULT_PLANTUML_OPTIONS.title).toBe('');
    expect(DEFAULT_PLANTUML_OPTIONS.lodLevel).toBe(5);
    expect(DEFAULT_PLANTUML_OPTIONS.includeLegend).toBe(false);
    expect(DEFAULT_PLANTUML_OPTIONS.includeMetadata).toBe(true);
    expect(DEFAULT_PLANTUML_OPTIONS.diagramType).toBe('component');
    expect(DEFAULT_PLANTUML_OPTIONS.useSkinparam).toBe(true);
    expect(DEFAULT_PLANTUML_OPTIONS.direction).toBe('top to bottom');
    expect(DEFAULT_PLANTUML_OPTIONS.groupByParent).toBe(true);
    expect(DEFAULT_PLANTUML_OPTIONS.maxGroupDepth).toBe(3);
    expect(DEFAULT_PLANTUML_OPTIONS.showStereotypes).toBe(true);
    expect(DEFAULT_PLANTUML_OPTIONS.showLabels).toBe(true);
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('PlantUML Integration', () => {
  it('should generate valid PlantUML for a typical project structure', () => {
    const graph = createTestGraph(
      [
        { id: 'src', type: 'directory', metadata: { label: 'src' } },
        { id: 'models', type: 'directory', parentId: 'src', metadata: { label: 'models' } },
        {
          id: 'user-ts',
          type: 'file',
          parentId: 'models',
          metadata: { label: 'user.ts', filePath: 'src/models/user.ts' },
        },
        {
          id: 'User',
          type: 'class',
          parentId: 'user-ts',
          metadata: { label: 'User' },
        },
        {
          id: 'IUser',
          type: 'interface',
          parentId: 'user-ts',
          metadata: { label: 'IUser' },
        },
      ],
      [{ id: 'e1', source: 'User', target: 'IUser', type: 'implements' }]
    );

    const result = exportToPlantUML(graph, {
      title: 'User Module',
      includeLegend: true,
    });

    // Should have valid structure
    expect(result.content).toContain('@startuml');
    expect(result.content).toContain('title User Module');
    expect(result.content).toContain('package "src" as src {');
    expect(result.content).toContain('User ..|> IUser');
    expect(result.content).toContain('legend right');
    expect(result.content).toContain('@enduml');

    // Stats should be correct
    expect(result.stats.nodeCount).toBe(5);
    expect(result.stats.edgeCount).toBe(1);
  });

  it('should handle orphan edges gracefully', () => {
    const graph = createTestGraph(
      [{ id: 'n1', type: 'class', metadata: { label: 'Class1' } }],
      [{ source: 'n1', target: 'nonexistent', type: 'extends' }]
    );

    const orphanExporter = new PlantUMLExporter();
    const result = orphanExporter.export(graph);

    // Should not contain edge to nonexistent node
    expect(result.content).not.toContain('nonexistent');
    expect(result.stats.edgeCount).toBe(0);
  });
});
