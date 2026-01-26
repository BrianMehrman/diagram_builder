/**
 * Mermaid Exporter
 *
 * Exports IVM graphs to Mermaid diagram format.
 * Supports flowcharts, class diagrams, and C4 diagrams.
 */

import type { IVMGraph, IVMNode, NodeType, EdgeType } from '../ivm/types.js';
import type {
  Exporter,
  BaseExportOptions,
  ExportResult,
  ColorScheme,
} from './types.js';
import { DEFAULT_COLOR_SCHEME, DEFAULT_EXPORT_STYLING } from './types.js';
import { filterGraphByLOD } from '../layout/lod.js';

// =============================================================================
// Mermaid-Specific Types
// =============================================================================

/**
 * Mermaid diagram type
 */
export type MermaidDiagramType = 'flowchart' | 'classDiagram' | 'c4Context' | 'c4Container' | 'c4Component';

/**
 * Flowchart direction
 */
export type FlowchartDirection = 'TB' | 'TD' | 'BT' | 'RL' | 'LR';

/**
 * Mermaid export options
 */
export interface MermaidExportOptions extends BaseExportOptions {
  /** Type of Mermaid diagram to generate */
  diagramType?: MermaidDiagramType;

  /** Direction for flowchart diagrams */
  direction?: FlowchartDirection;

  /** Whether to use subgraphs for grouping */
  useSubgraphs?: boolean;

  /** Maximum nesting depth for subgraphs (-1 for unlimited) */
  maxSubgraphDepth?: number;

  /** Whether to show edge labels */
  showEdgeLabels?: boolean;

  /** Theme name */
  theme?: 'default' | 'dark' | 'forest' | 'neutral';

  /** Whether to include node descriptions in tooltips */
  includeTooltips?: boolean;
}

/**
 * Default Mermaid export options
 */
export const DEFAULT_MERMAID_OPTIONS: Required<MermaidExportOptions> = {
  title: '',
  lodLevel: 5,
  includeLegend: false,
  includeMetadata: true,
  styling: DEFAULT_EXPORT_STYLING,
  diagramType: 'flowchart',
  direction: 'TB',
  useSubgraphs: true,
  maxSubgraphDepth: 3,
  showEdgeLabels: true,
  theme: 'default',
  includeTooltips: false,
};

// =============================================================================
// Node Type Mapping - Flowchart
// =============================================================================

/**
 * Maps IVM node types to Mermaid flowchart shapes
 * Shapes: [] rectangle, () rounded, {} diamond, (()) circle, [[]] subroutine, [{}] database
 */
const NODE_TYPE_TO_FLOWCHART_SHAPE: Record<NodeType, { start: string; end: string }> = {
  repository: { start: '[(', end: ')]' },   // cylindrical (database-like)
  package: { start: '[[', end: ']]' },      // subroutine
  namespace: { start: '[[', end: ']]' },    // subroutine
  directory: { start: '[/', end: '/]' },    // parallelogram
  module: { start: '[[', end: ']]' },       // subroutine
  file: { start: '[', end: ']' },           // rectangle
  class: { start: '{{', end: '}}' },        // hexagon
  interface: { start: '(', end: ')' },      // rounded
  function: { start: '([', end: '])' },     // stadium
  method: { start: '([', end: '])' },       // stadium
  variable: { start: '>', end: ']' },       // asymmetric
  type: { start: '(', end: ')' },           // rounded
  enum: { start: '{{', end: '}}' },         // hexagon
};

// =============================================================================
// Edge Type Mapping - Flowchart
// =============================================================================

/**
 * Maps IVM edge types to Mermaid flowchart arrow styles
 */
const EDGE_TYPE_TO_FLOWCHART_ARROW: Record<EdgeType, string> = {
  imports: '-.->',      // dotted with arrow
  exports: '<-.-',      // dotted with reverse arrow
  extends: '-->',       // solid with arrow (inheritance)
  implements: '-.->',   // dotted with arrow (implementation)
  calls: '==>',         // thick with arrow
  uses: '-->',          // solid with arrow
  contains: '---',      // solid no arrow (composition)
  depends_on: '-.->',   // dotted with arrow
  type_of: '-.->',      // dotted with arrow
  returns: '-->',       // solid with arrow
  parameter_of: '-.->',  // dotted with arrow
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
  parameter_of: 'param',
};

// =============================================================================
// Class Diagram Mapping
// =============================================================================

/**
 * Maps IVM edge types to Mermaid class diagram relationships
 */
const EDGE_TYPE_TO_CLASS_RELATION: Record<EdgeType, string> = {
  imports: '..>',       // dependency
  exports: '<..',       // reverse dependency
  extends: '<|--',      // inheritance
  implements: '<|..',   // implementation
  calls: '-->',         // association
  uses: '..>',          // dependency
  contains: '*--',      // composition
  depends_on: '..>',    // dependency
  type_of: '<|..',      // realization
  returns: '-->',       // association
  parameter_of: '..>',  // dependency
};

// =============================================================================
// C4 Diagram Mapping
// =============================================================================

/**
 * Maps IVM node types to C4 element types
 */
const NODE_TYPE_TO_C4: Record<NodeType, string> = {
  repository: 'System_Ext',
  package: 'Container',
  namespace: 'Container',
  directory: 'Container',
  module: 'Container',
  file: 'Component',
  class: 'Component',
  interface: 'Component',
  function: 'Component',
  method: 'Component',
  variable: 'Component',
  type: 'Component',
  enum: 'Component',
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Sanitizes a string for use as a Mermaid identifier
 */
function sanitizeId(id: string): string {
  // Mermaid IDs can contain alphanumeric and underscores
  return id.replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 * Escapes a string for use in Mermaid labels
 */
function escapeLabel(label: string): string {
  // Escape special characters
  return label
    .replace(/"/g, '#quot;')
    .replace(/</g, '#lt;')
    .replace(/>/g, '#gt;')
    .replace(/\n/g, '<br/>');
}

/**
 * Formats a color for Mermaid
 */
function formatColor(color: string): string {
  return color.startsWith('#') ? color : `#${color}`;
}

/**
 * Gets color for a node type
 */
function getNodeColor(type: NodeType, colors: ColorScheme): string {
  return colors.nodeColors[type] ?? '#FFFFFF';
}

/**
 * Gets color for an edge type
 */
// @ts-expect-error - Reserved for future use
function _getEdgeColor(type: EdgeType, colors: ColorScheme): string {
  return colors.edgeColors[type] ?? '#666666';
}

// =============================================================================
// Flowchart Generator
// =============================================================================

/**
 * Generates a Mermaid flowchart from an IVM graph
 */
function generateFlowchart(
  graph: IVMGraph,
  options: Required<MermaidExportOptions>
): string[] {
  const lines: string[] = [];
  const { direction, useSubgraphs, maxSubgraphDepth, showEdgeLabels, styling } = options;
  const colors = styling.colors ?? DEFAULT_COLOR_SCHEME;

  // Diagram declaration
  lines.push(`flowchart ${direction}`);

  // Group nodes by parent for subgraphs
  const nodesByParent = new Map<string | undefined, IVMNode[]>();
  for (const node of graph.nodes) {
    const parentId = node.parentId;
    if (!nodesByParent.has(parentId)) {
      nodesByParent.set(parentId, []);
    }
    nodesByParent.get(parentId)!.push(node);
  }

  // Track rendered node IDs
  const renderedNodes = new Set<string>();

  /**
   * Renders nodes recursively with subgraphs
   */
  function renderNodes(parentId: string | undefined, depth: number, indent: string): void {
    const children = nodesByParent.get(parentId) ?? [];
    
    for (const node of children) {
      const nodeId = sanitizeId(node.id);
      const label = escapeLabel(node.metadata.label);
      const shape = NODE_TYPE_TO_FLOWCHART_SHAPE[node.type];
      
      // Check if this node has children and should be a subgraph
      const hasChildren = nodesByParent.has(node.id);
      const canNest = maxSubgraphDepth < 0 || depth < maxSubgraphDepth;
      
      if (useSubgraphs && hasChildren && canNest) {
        lines.push(`${indent}subgraph ${nodeId}["${label}"]`);
        renderNodes(node.id, depth + 1, indent + '    ');
        lines.push(`${indent}end`);
      } else {
        lines.push(`${indent}${nodeId}${shape.start}"${label}"${shape.end}`);
      }
      
      renderedNodes.add(nodeId);
    }
  }

  // Render all nodes starting from roots
  if (useSubgraphs) {
    renderNodes(undefined, 0, '    ');
    
    // Render any orphaned nodes (nodes whose parents weren't rendered)
    for (const node of graph.nodes) {
      const nodeId = sanitizeId(node.id);
      if (!renderedNodes.has(nodeId)) {
        const label = escapeLabel(node.metadata.label);
        const shape = NODE_TYPE_TO_FLOWCHART_SHAPE[node.type];
        lines.push(`    ${nodeId}${shape.start}"${label}"${shape.end}`);
        renderedNodes.add(nodeId);
      }
    }
  } else {
    // Flat rendering without subgraphs
    for (const node of graph.nodes) {
      const nodeId = sanitizeId(node.id);
      const label = escapeLabel(node.metadata.label);
      const shape = NODE_TYPE_TO_FLOWCHART_SHAPE[node.type];
      lines.push(`    ${nodeId}${shape.start}"${label}"${shape.end}`);
    }
  }

  // Add edges
  lines.push('');
  for (const edge of graph.edges) {
    const sourceId = sanitizeId(edge.source);
    const targetId = sanitizeId(edge.target);
    const arrow = EDGE_TYPE_TO_FLOWCHART_ARROW[edge.type];
    
    if (showEdgeLabels && edge.metadata.label) {
      const label = escapeLabel(edge.metadata.label);
      lines.push(`    ${sourceId} ${arrow}|"${label}"| ${targetId}`);
    } else if (showEdgeLabels) {
      const label = EDGE_TYPE_LABELS[edge.type];
      lines.push(`    ${sourceId} ${arrow}|${label}| ${targetId}`);
    } else {
      lines.push(`    ${sourceId} ${arrow} ${targetId}`);
    }
  }

  // Add styling
  lines.push('');
  for (const node of graph.nodes) {
    const nodeId = sanitizeId(node.id);
    const color = getNodeColor(node.type, colors);
    lines.push(`    style ${nodeId} fill:${formatColor(color)},stroke:${formatColor(colors.border ?? '#CCCCCC')}`);
  }

  return lines;
}

// =============================================================================
// Class Diagram Generator
// =============================================================================

/**
 * Generates a Mermaid class diagram from an IVM graph
 */
function generateClassDiagram(
  graph: IVMGraph,
  _options: Required<MermaidExportOptions>
): string[] {
  const lines: string[] = [];

  // Diagram declaration
  lines.push('classDiagram');

  // Group nodes by type
  const classes = graph.nodes.filter(n => n.type === 'class');
  const interfaces = graph.nodes.filter(n => n.type === 'interface');
  const enums = graph.nodes.filter(n => n.type === 'enum');
  const otherNodes = graph.nodes.filter(n => !['class', 'interface', 'enum'].includes(n.type));

  // Render classes
  for (const node of classes) {
    const nodeId = sanitizeId(node.id);
    const label = escapeLabel(node.metadata.label);
    lines.push(`    class ${nodeId}["${label}"] {`);
    
    // Add properties from metadata if available
    if (node.metadata.properties?.methods) {
      const methods = node.metadata.properties.methods as string[];
      for (const method of methods) {
        lines.push(`        +${method}()`);
      }
    }
    if (node.metadata.properties?.properties) {
      const props = node.metadata.properties.properties as string[];
      for (const prop of props) {
        lines.push(`        +${prop}`);
      }
    }
    
    lines.push('    }');
  }

  // Render interfaces
  for (const node of interfaces) {
    const nodeId = sanitizeId(node.id);
    const label = escapeLabel(node.metadata.label);
    lines.push(`    class ${nodeId}["${label}"] {`);
    lines.push(`        <<interface>>`);
    lines.push('    }');
  }

  // Render enums
  for (const node of enums) {
    const nodeId = sanitizeId(node.id);
    const label = escapeLabel(node.metadata.label);
    lines.push(`    class ${nodeId}["${label}"] {`);
    lines.push(`        <<enumeration>>`);
    
    if (node.metadata.properties?.values) {
      const values = node.metadata.properties.values as string[];
      for (const value of values) {
        lines.push(`        ${value}`);
      }
    }
    
    lines.push('    }');
  }

  // Render other nodes as simple classes
  for (const node of otherNodes) {
    const nodeId = sanitizeId(node.id);
    const label = escapeLabel(node.metadata.label);
    lines.push(`    class ${nodeId}["${label}"]`);
  }

  // Add relationships
  lines.push('');
  for (const edge of graph.edges) {
    const sourceId = sanitizeId(edge.source);
    const targetId = sanitizeId(edge.target);
    const relation = EDGE_TYPE_TO_CLASS_RELATION[edge.type];
    
    if (edge.metadata.label) {
      const label = escapeLabel(edge.metadata.label);
      lines.push(`    ${sourceId} ${relation} ${targetId} : ${label}`);
    } else {
      lines.push(`    ${sourceId} ${relation} ${targetId}`);
    }
  }

  return lines;
}

// =============================================================================
// C4 Diagram Generator
// =============================================================================

/**
 * Generates a Mermaid C4 diagram from an IVM graph
 */
function generateC4Diagram(
  graph: IVMGraph,
  options: Required<MermaidExportOptions>
): string[] {
  const lines: string[] = [];
  const { diagramType, styling } = options;
  // @ts-expect-error - Reserved for future use
  const _colors = styling.colors ?? DEFAULT_COLOR_SCHEME;

  // Diagram declaration based on C4 level
  switch (diagramType) {
    case 'c4Context':
      lines.push('C4Context');
      break;
    case 'c4Container':
      lines.push('C4Container');
      break;
    case 'c4Component':
      lines.push('C4Component');
      break;
    default:
      lines.push('C4Context');
  }

  // Title
  if (options.title) {
    lines.push(`    title ${options.title}`);
  }

  // Render nodes as C4 elements
  for (const node of graph.nodes) {
    const nodeId = sanitizeId(node.id);
    const label = escapeLabel(node.metadata.label);
    const description = (node.metadata.properties?.['description'] as string) ?? '';
    // @ts-expect-error - Reserved for future use
    const _c4Type = NODE_TYPE_TO_C4[node.type];

    switch (diagramType) {
      case 'c4Context':
        if (node.type === 'repository') {
          lines.push(`    System_Ext(${nodeId}, "${label}", "${description}")`);
        } else {
          lines.push(`    System(${nodeId}, "${label}", "${description}")`);
        }
        break;
      case 'c4Container':
        lines.push(`    Container(${nodeId}, "${label}", "", "${description}")`);
        break;
      case 'c4Component':
        lines.push(`    Component(${nodeId}, "${label}", "", "${description}")`);
        break;
    }
  }

  // Add relationships
  lines.push('');
  for (const edge of graph.edges) {
    const sourceId = sanitizeId(edge.source);
    const targetId = sanitizeId(edge.target);
    const label = edge.metadata.label ?? EDGE_TYPE_LABELS[edge.type];
    
    lines.push(`    Rel(${sourceId}, ${targetId}, "${label}")`);
  }

  return lines;
}

// =============================================================================
// MermaidExporter Class
// =============================================================================

/**
 * Mermaid diagram exporter
 */
export class MermaidExporter implements Exporter<MermaidExportOptions> {
  readonly id = 'mermaid';
  readonly name = 'Mermaid';
  readonly extension = 'mmd';
  readonly mimeType = 'text/x-mermaid';

  /**
   * Exports an IVM graph to Mermaid format
   */
  export(graph: IVMGraph, options?: MermaidExportOptions): ExportResult {
    const startTime = Date.now();
    const opts = { ...DEFAULT_MERMAID_OPTIONS, ...options };

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

    // Create filtered graph for generators
    const filteredGraph: IVMGraph = {
      ...graph,
      nodes,
      edges: validEdges,
    };

    // Generate diagram based on type
    const lines: string[] = [];

    // Add metadata comments
    if (opts.includeMetadata) {
      lines.push(`%% Generated from: ${graph.metadata.name}`);
      lines.push(`%% Schema version: ${graph.metadata.schemaVersion}`);
      lines.push(`%% Generated at: ${new Date().toISOString()}`);
      lines.push(`%% LOD Level: ${opts.lodLevel}`);
      lines.push('');
    }

    // Generate diagram content based on type
    let diagramLines: string[];
    switch (opts.diagramType) {
      case 'classDiagram':
        diagramLines = generateClassDiagram(filteredGraph, opts);
        break;
      case 'c4Context':
      case 'c4Container':
      case 'c4Component':
        diagramLines = generateC4Diagram(filteredGraph, opts);
        break;
      case 'flowchart':
      default:
        diagramLines = generateFlowchart(filteredGraph, opts);
        break;
    }

    lines.push(...diagramLines);

    // Add legend if requested
    if (opts.includeLegend) {
      lines.push('');
      lines.push('%% Legend:');
      lines.push('%% Shapes indicate node types');
      lines.push('%% Arrow styles indicate relationship types');
    }

    const content = lines.join('\n');
    const duration = Date.now() - startTime;

    return {
      content,
      mimeType: this.mimeType,
      extension: this.extension,
      stats: {
        nodeCount: filteredGraph.nodes.length,
        edgeCount: filteredGraph.edges.length,
        duration,
        size: Buffer.byteLength(content, 'utf-8'),
      },
    };
  }

  /**
   * Validates export options
   */
  validateOptions(options?: MermaidExportOptions): string[] {
    const errors: string[] = [];

    if (options) {
      if (options.lodLevel !== undefined && (options.lodLevel < 0 || options.lodLevel > 5)) {
        errors.push('lodLevel must be between 0 and 5');
      }

      if (options.diagramType !== undefined) {
        const validTypes: MermaidDiagramType[] = ['flowchart', 'classDiagram', 'c4Context', 'c4Container', 'c4Component'];
        if (!validTypes.includes(options.diagramType)) {
          errors.push(`diagramType must be one of: ${validTypes.join(', ')}`);
        }
      }

      if (options.direction !== undefined) {
        const validDirections: FlowchartDirection[] = ['TB', 'TD', 'BT', 'RL', 'LR'];
        if (!validDirections.includes(options.direction)) {
          errors.push(`direction must be one of: ${validDirections.join(', ')}`);
        }
      }

      if (options.maxSubgraphDepth !== undefined && options.maxSubgraphDepth < -1) {
        errors.push('maxSubgraphDepth must be >= -1');
      }
    }

    return errors;
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Creates a new MermaidExporter instance
 */
export function createMermaidExporter(): MermaidExporter {
  return new MermaidExporter();
}

/**
 * Convenience function to export a graph to Mermaid format
 */
export function exportToMermaid(graph: IVMGraph, options?: MermaidExportOptions): ExportResult {
  const exporter = new MermaidExporter();
  return exporter.export(graph, options);
}
