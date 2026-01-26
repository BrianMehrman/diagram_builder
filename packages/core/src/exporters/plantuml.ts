/**
 * PlantUML Exporter
 *
 * Exports IVM graphs to PlantUML diagram format.
 * Supports component diagrams with packages, classes, and relationships.
 */

import type { IVMGraph, IVMNode, IVMEdge, NodeType, EdgeType } from '../ivm/types.js';
import type {
  Exporter,
  BaseExportOptions,
  ExportResult,
  ExportStyling,
  ColorScheme,
} from './types.js';
import { DEFAULT_COLOR_SCHEME, DEFAULT_EXPORT_STYLING } from './types.js';
import { filterGraphByLOD } from '../layout/lod.js';

// =============================================================================
// PlantUML-Specific Types
// =============================================================================

/**
 * PlantUML diagram type
 */
export type PlantUMLDiagramType = 'component' | 'class' | 'package';

/**
 * PlantUML export options
 */
export interface PlantUMLExportOptions extends BaseExportOptions {
  /** Type of PlantUML diagram to generate */
  diagramType?: PlantUMLDiagramType;

  /** Whether to use skinparam for styling */
  useSkinparam?: boolean;

  /** Direction of the diagram */
  direction?: 'top to bottom' | 'left to right';

  /** Whether to group nodes by parent */
  groupByParent?: boolean;

  /** Maximum nesting depth for groups (-1 for unlimited) */
  maxGroupDepth?: number;

  /** Whether to show stereotypes */
  showStereotypes?: boolean;

  /** Whether to include node labels */
  showLabels?: boolean;
}

/**
 * Default PlantUML export options
 */
export const DEFAULT_PLANTUML_OPTIONS: Required<PlantUMLExportOptions> = {
  title: '',
  lodLevel: 5,
  includeLegend: false,
  includeMetadata: true,
  styling: DEFAULT_EXPORT_STYLING,
  diagramType: 'component',
  useSkinparam: true,
  direction: 'top to bottom',
  groupByParent: true,
  maxGroupDepth: 3,
  showStereotypes: true,
  showLabels: true,
};

// =============================================================================
// Node Type Mapping
// =============================================================================

/**
 * Maps IVM node types to PlantUML component types
 */
const NODE_TYPE_TO_PLANTUML: Record<NodeType, string> = {
  repository: 'cloud',
  package: 'package',
  namespace: 'package',
  directory: 'folder',
  module: 'package',
  file: 'file',
  class: 'class',
  interface: 'interface',
  function: 'rectangle',
  method: 'rectangle',
  variable: 'storage',
  type: 'interface',
  enum: 'enum',
};

/**
 * Maps IVM node types to PlantUML stereotypes
 */
const NODE_TYPE_STEREOTYPES: Record<NodeType, string> = {
  repository: 'repository',
  package: 'package',
  namespace: 'namespace',
  directory: 'directory',
  module: 'module',
  file: 'file',
  class: 'class',
  interface: 'interface',
  function: 'function',
  method: 'method',
  variable: 'variable',
  type: 'type',
  enum: 'enum',
};

// =============================================================================
// Edge Type Mapping
// =============================================================================

/**
 * Maps IVM edge types to PlantUML arrow styles
 */
const EDGE_TYPE_TO_PLANTUML: Record<EdgeType, string> = {
  imports: '..>',
  exports: '<..',
  extends: '--|>',
  implements: '..|>',
  calls: '-->',
  uses: '..>',
  contains: '--*',
  depends_on: '..>',
  type_of: '..|>',
  returns: '-->',
  parameter_of: '..>',
};

/**
 * Maps edge types to labels
 */
const EDGE_TYPE_LABELS: Record<EdgeType, string> = {
  imports: 'imports',
  exports: 'exports',
  extends: 'extends',
  implements: 'implements',
  calls: 'calls',
  uses: 'uses',
  contains: 'contains',
  depends_on: 'depends on',
  type_of: 'type of',
  returns: 'returns',
  parameter_of: 'parameter',
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Sanitizes a string for use as a PlantUML identifier
 */
function sanitizeId(id: string): string {
  // Replace invalid characters with underscores
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Escapes a string for use in PlantUML labels
 */
function escapeLabel(label: string): string {
  return label.replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

/**
 * Converts a hex color to PlantUML format
 */
function formatColor(color: string): string {
  // PlantUML uses #RRGGBB format
  return color.startsWith('#') ? color : `#${color}`;
}

/**
 * Generates skinparam styling
 */
function generateSkinparam(styling: ExportStyling, colors: ColorScheme): string[] {
  const lines: string[] = [];

  lines.push('skinparam {');
  lines.push(`  BackgroundColor ${formatColor(colors.background ?? '#FFFFFF')}`);
  lines.push(`  defaultFontName ${styling.fontFamily ?? 'Arial'}`);
  lines.push(`  defaultFontSize ${styling.fontSize ?? 12}`);

  if (styling.shadows) {
    lines.push('  Shadowing true');
  } else {
    lines.push('  Shadowing false');
  }

  if (styling.rounded) {
    lines.push('  RoundCorner 10');
  }

  lines.push('}');
  lines.push('');

  // Component-specific styling
  lines.push('skinparam component {');
  lines.push(`  BorderColor ${formatColor(colors.border ?? '#CCCCCC')}`);
  lines.push(`  FontColor ${formatColor(colors.text ?? '#333333')}`);
  lines.push('}');
  lines.push('');

  // Package-specific styling
  lines.push('skinparam package {');
  lines.push(`  BorderColor ${formatColor(colors.border ?? '#CCCCCC')}`);
  lines.push(`  FontColor ${formatColor(colors.text ?? '#333333')}`);
  lines.push('}');
  lines.push('');

  return lines;
}

/**
 * Generates a PlantUML node declaration
 */
function generateNode(
  node: IVMNode,
  options: Required<PlantUMLExportOptions>,
  colors: ColorScheme
): string {
  const plantUmlType = NODE_TYPE_TO_PLANTUML[node.type];
  const stereotype = NODE_TYPE_STEREOTYPES[node.type];
  const id = sanitizeId(node.id);
  const label = escapeLabel(node.metadata.label);
  const color = colors.nodeColors[node.type];

  let line = `${plantUmlType} "${label}" as ${id}`;

  if (options.showStereotypes && stereotype) {
    line += ` <<${stereotype}>>`;
  }

  if (color) {
    line += ` ${formatColor(color)}`;
  }

  return line;
}

/**
 * Generates a PlantUML edge declaration
 */
function generateEdge(
  edge: IVMEdge,
  options: Required<PlantUMLExportOptions>,
  _colors: ColorScheme
): string {
  const sourceId = sanitizeId(edge.source);
  const targetId = sanitizeId(edge.target);
  const arrow = EDGE_TYPE_TO_PLANTUML[edge.type];
  const label = edge.metadata.label ?? EDGE_TYPE_LABELS[edge.type];

  let line = `${sourceId} ${arrow} ${targetId}`;

  if (options.showLabels && label) {
    line += ` : ${escapeLabel(label)}`;
  }

  return line;
}

/**
 * Groups nodes by their parent for nested packages
 */
function groupNodesByParent(nodes: IVMNode[]): Map<string | undefined, IVMNode[]> {
  const groups = new Map<string | undefined, IVMNode[]>();

  for (const node of nodes) {
    const parentId = node.parentId;
    const group = groups.get(parentId) ?? [];
    group.push(node);
    groups.set(parentId, group);
  }

  return groups;
}

/**
 * Generates nested package structure
 */
function generateNestedStructure(
  nodes: IVMNode[],
  edges: IVMEdge[],
  options: Required<PlantUMLExportOptions>,
  colors: ColorScheme
): string[] {
  const lines: string[] = [];
  const groups = groupNodesByParent(nodes);
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const rendered = new Set<string>();

  // Recursive function to render node and its children
  function renderNode(node: IVMNode, depth: number): void {
    if (rendered.has(node.id)) return;
    rendered.add(node.id);

    const indent = '  '.repeat(depth);
    const children = groups.get(node.id) ?? [];
    const hasChildren = children.length > 0;

    // Container types that can have children
    const containerTypes: NodeType[] = ['repository', 'package', 'namespace', 'directory', 'module', 'file'];
    const isContainer = containerTypes.includes(node.type) && hasChildren;

    if (isContainer && (options.maxGroupDepth < 0 || depth < options.maxGroupDepth)) {
      // Render as a package/container
      const label = escapeLabel(node.metadata.label);
      lines.push(`${indent}package "${label}" as ${sanitizeId(node.id)} {`);

      // Render children
      for (const child of children) {
        renderNode(child, depth + 1);
      }

      lines.push(`${indent}}`);
    } else {
      // Render as a simple node
      lines.push(`${indent}${generateNode(node, options, colors)}`);

      // Still render children if container but at max depth
      if (hasChildren) {
        for (const child of children) {
          renderNode(child, depth);
        }
      }
    }
  }

  // Start with root nodes (no parent)
  const rootNodes = groups.get(undefined) ?? [];
  for (const node of rootNodes) {
    renderNode(node, 0);
  }

  // Render any nodes that weren't reached (orphans)
  for (const node of nodes) {
    if (!rendered.has(node.id)) {
      lines.push(generateNode(node, options, colors));
    }
  }

  lines.push('');

  // Render edges
  for (const edge of edges) {
    // Only render edges where both nodes exist
    if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
      lines.push(generateEdge(edge, options, colors));
    }
  }

  return lines;
}

/**
 * Generates flat structure (no nesting)
 */
function generateFlatStructure(
  nodes: IVMNode[],
  edges: IVMEdge[],
  options: Required<PlantUMLExportOptions>,
  colors: ColorScheme
): string[] {
  const lines: string[] = [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Render all nodes
  for (const node of nodes) {
    lines.push(generateNode(node, options, colors));
  }

  lines.push('');

  // Render all edges
  for (const edge of edges) {
    if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
      lines.push(generateEdge(edge, options, colors));
    }
  }

  return lines;
}

/**
 * Generates a legend for the diagram
 */
function generateLegend(colors: ColorScheme): string[] {
  const lines: string[] = [];

  lines.push('legend right');
  lines.push('  |= Type |= Color |');

  const types: NodeType[] = ['file', 'class', 'interface', 'function', 'package'];
  for (const type of types) {
    const color = colors.nodeColors[type];
    if (color) {
      lines.push(`  | ${type} | <${formatColor(color)}> |`);
    }
  }

  lines.push('endlegend');
  lines.push('');

  return lines;
}

// =============================================================================
// PlantUML Exporter Implementation
// =============================================================================

/**
 * PlantUML Exporter class
 */
export class PlantUMLExporter implements Exporter<PlantUMLExportOptions> {
  readonly id = 'plantuml';
  readonly name = 'PlantUML';
  readonly extension = 'puml';
  readonly mimeType = 'text/x-plantuml';

  /**
   * Exports an IVM graph to PlantUML format
   */
  export(graph: IVMGraph, options?: PlantUMLExportOptions): ExportResult {
    const startTime = performance.now();
    const opts = { ...DEFAULT_PLANTUML_OPTIONS, ...options };
    const styling = { ...DEFAULT_EXPORT_STYLING, ...opts.styling };
    const colors = { ...DEFAULT_COLOR_SCHEME, ...styling.colors };

    // Apply LOD filtering if needed
    let nodes = graph.nodes;
    let edges = graph.edges;

    if (opts.lodLevel !== undefined && opts.lodLevel < 5) {
      const filtered = filterGraphByLOD(graph, {
        currentLevel: opts.lodLevel,
        includeAncestors: true,
        collapseEdges: true,
        minNodesForLOD: 0,
      });
      nodes = filtered.visibleNodes;
      edges = filtered.visibleEdges;
    }

    // Filter edges to only include those where both source and target exist
    const nodeIds = new Set(nodes.map((n) => n.id));
    const validEdges = edges.filter(
      (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );

    // Build PlantUML content
    const lines: string[] = [];

    // Start diagram
    lines.push('@startuml');
    lines.push('');

    // Add title if provided
    if (opts.title) {
      lines.push(`title ${opts.title}`);
      lines.push('');
    }

    // Add metadata comment
    if (opts.includeMetadata) {
      lines.push(`' Generated from: ${graph.metadata.name}`);
      lines.push(`' Generated at: ${new Date().toISOString()}`);
      lines.push(`' Schema version: ${graph.metadata.schemaVersion}`);
      lines.push(`' Nodes: ${nodes.length}, Edges: ${edges.length}`);
      lines.push('');
    }

    // Add skinparam styling
    if (opts.useSkinparam) {
      lines.push(...generateSkinparam(styling, colors));
    }

    // Set direction
    lines.push(`${opts.direction} direction`);
    lines.push('');

    // Generate diagram content
    if (opts.groupByParent) {
      lines.push(...generateNestedStructure(nodes, validEdges, opts, colors));
    } else {
      lines.push(...generateFlatStructure(nodes, validEdges, opts, colors));
    }

    // Add legend if requested
    if (opts.includeLegend) {
      lines.push('');
      lines.push(...generateLegend(colors));
    }

    // End diagram
    lines.push('');
    lines.push('@enduml');

    const content = lines.join('\n');
    const endTime = performance.now();

    return {
      content,
      mimeType: this.mimeType,
      extension: this.extension,
      stats: {
        nodeCount: nodes.length,
        edgeCount: validEdges.length,
        duration: endTime - startTime,
        size: Buffer.byteLength(content, 'utf-8'),
      },
    };
  }

  /**
   * Validates export options
   */
  validateOptions(options?: PlantUMLExportOptions): string[] {
    const errors: string[] = [];

    if (options?.lodLevel !== undefined) {
      if (options.lodLevel < 0 || options.lodLevel > 5) {
        errors.push('lodLevel must be between 0 and 5');
      }
    }

    if (options?.maxGroupDepth !== undefined) {
      if (options.maxGroupDepth < -1) {
        errors.push('maxGroupDepth must be -1 or greater');
      }
    }

    if (options?.diagramType) {
      const validTypes: PlantUMLDiagramType[] = ['component', 'class', 'package'];
      if (!validTypes.includes(options.diagramType)) {
        errors.push(`diagramType must be one of: ${validTypes.join(', ')}`);
      }
    }

    return errors;
  }
}

/**
 * Creates a new PlantUML exporter instance
 */
export function createPlantUMLExporter(): PlantUMLExporter {
  return new PlantUMLExporter();
}

/**
 * Convenience function to export a graph to PlantUML
 */
export function exportToPlantUML(
  graph: IVMGraph,
  options?: PlantUMLExportOptions
): ExportResult {
  const exporter = new PlantUMLExporter();
  return exporter.export(graph, options);
}
