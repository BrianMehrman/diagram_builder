/**
 * Draw.io Exporter
 *
 * Exports IVM graphs to Draw.io XML format (mxGraph).
 * Produces .drawio files that can be opened in diagrams.net or the Draw.io app.
 */

import type { IVMGraph, IVMNode, IVMEdge, NodeType, EdgeType, LODLevel } from '../ivm/types.js';
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
// Draw.io-Specific Types
// =============================================================================

/**
 * Draw.io shape style
 */
export type DrawioShape =
  | 'rectangle'
  | 'ellipse'
  | 'rhombus'
  | 'hexagon'
  | 'parallelogram'
  | 'cylinder'
  | 'actor'
  | 'folder'
  | 'document'
  | 'process'
  | 'cloud';

/**
 * Draw.io export options
 */
export interface DrawioExportOptions extends BaseExportOptions {
  /** Page width in pixels */
  pageWidth?: number;

  /** Page height in pixels */
  pageHeight?: number;

  /** Default node width */
  nodeWidth?: number;

  /** Default node height */
  nodeHeight?: number;

  /** Spacing between nodes (for auto-layout) */
  nodeSpacing?: number;

  /** Whether to use hierarchical layout */
  hierarchicalLayout?: boolean;

  /** Whether to include grid in export */
  showGrid?: boolean;

  /** Grid size in pixels */
  gridSize?: number;

  /** Whether to compress the XML output */
  compressed?: boolean;

  /** Whether to include connection points on shapes */
  showConnectionPoints?: boolean;
}

/**
 * Default Draw.io export options
 */
export const DEFAULT_DRAWIO_OPTIONS: Required<DrawioExportOptions> = {
  title: '',
  lodLevel: 5,
  includeLegend: false,
  includeMetadata: true,
  styling: DEFAULT_EXPORT_STYLING,
  pageWidth: 1200,
  pageHeight: 900,
  nodeWidth: 120,
  nodeHeight: 60,
  nodeSpacing: 50,
  hierarchicalLayout: true,
  showGrid: true,
  gridSize: 10,
  compressed: false,
  showConnectionPoints: true,
};

// =============================================================================
// Shape Mapping
// =============================================================================

/**
 * Maps IVM node types to Draw.io shapes
 */
const NODE_TYPE_TO_SHAPE: Record<NodeType, DrawioShape> = {
  repository: 'cloud',
  package: 'folder',
  namespace: 'folder',
  directory: 'folder',
  module: 'process',
  file: 'document',
  class: 'rectangle',
  interface: 'ellipse',
  function: 'process',
  method: 'process',
  variable: 'parallelogram',
  type: 'ellipse',
  enum: 'hexagon',
};

/**
 * Maps Draw.io shapes to mxGraph style strings
 */
const SHAPE_TO_STYLE: Record<DrawioShape, string> = {
  rectangle: 'rounded=1;whiteSpace=wrap;html=1;',
  ellipse: 'ellipse;whiteSpace=wrap;html=1;',
  rhombus: 'rhombus;whiteSpace=wrap;html=1;',
  hexagon: 'shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;',
  parallelogram: 'shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fixedSize=1;',
  cylinder: 'shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;',
  actor: 'shape=umlActor;verticalLabelPosition=bottom;verticalAlign=top;html=1;outlineConnect=0;',
  folder: 'shape=folder;fontStyle=1;spacingTop=10;tabWidth=40;tabHeight=14;tabPosition=left;html=1;whiteSpace=wrap;',
  document: 'shape=document;whiteSpace=wrap;html=1;boundedLbl=1;',
  process: 'rounded=0;whiteSpace=wrap;html=1;',
  cloud: 'ellipse;shape=cloud;whiteSpace=wrap;html=1;',
};

/**
 * Maps edge types to Draw.io arrow styles
 */
const EDGE_TYPE_TO_STYLE: Record<EdgeType, { startArrow: string; endArrow: string; dashed: boolean }> = {
  imports: { startArrow: 'none', endArrow: 'open', dashed: true },
  exports: { startArrow: 'open', endArrow: 'none', dashed: true },
  extends: { startArrow: 'none', endArrow: 'block', dashed: false },
  implements: { startArrow: 'none', endArrow: 'block', dashed: true },
  calls: { startArrow: 'none', endArrow: 'classic', dashed: false },
  uses: { startArrow: 'none', endArrow: 'open', dashed: false },
  contains: { startArrow: 'none', endArrow: 'diamond', dashed: false },
  depends_on: { startArrow: 'none', endArrow: 'open', dashed: true },
  type_of: { startArrow: 'none', endArrow: 'block', dashed: true },
  returns: { startArrow: 'none', endArrow: 'classic', dashed: false },
  parameter_of: { startArrow: 'none', endArrow: 'open', dashed: true },
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Escapes XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates a unique cell ID
 */
function generateCellId(prefix: string, index: number): string {
  return `${prefix}-${index}`;
}

/**
 * Converts hex color to Draw.io format (without #)
 */
function formatColor(color: string): string {
  return color.startsWith('#') ? color : `#${color}`;
}

/**
 * Gets the fill color for a node type
 */
function getNodeColor(type: NodeType, colors: ColorScheme): string {
  return formatColor(colors.nodeColors[type] ?? '#FFFFFF');
}

/**
 * Gets the stroke color for an edge type
 */
function getEdgeColor(type: EdgeType, colors: ColorScheme): string {
  return formatColor(colors.edgeColors[type] ?? '#666666');
}

/**
 * Builds the style string for a node
 */
function buildNodeStyle(
  node: IVMNode,
  colors: ColorScheme,
  styling: ExportStyling
): string {
  const shape = NODE_TYPE_TO_SHAPE[node.type];
  const baseStyle = SHAPE_TO_STYLE[shape];
  const fillColor = node.style?.color ? formatColor(node.style.color) : getNodeColor(node.type, colors);
  const strokeColor = formatColor(colors.border ?? '#000000');
  const fontColor = formatColor(colors.text ?? '#000000');
  const fontSize = styling.fontSize ?? 12;
  const opacity = node.style?.opacity !== undefined ? Math.round(node.style.opacity * 100) : 100;

  const styleParts = [
    baseStyle,
    `fillColor=${fillColor};`,
    `strokeColor=${strokeColor};`,
    `fontColor=${fontColor};`,
    `fontSize=${fontSize};`,
    `opacity=${opacity};`,
  ];

  if (node.style?.highlighted) {
    styleParts.push('strokeWidth=3;');
  }

  if (styling.shadows) {
    styleParts.push('shadow=1;');
  }

  return styleParts.join('');
}

/**
 * Builds the style string for an edge
 */
function buildEdgeStyle(
  edge: IVMEdge,
  colors: ColorScheme,
  styling: ExportStyling
): string {
  const { startArrow, endArrow, dashed } = EDGE_TYPE_TO_STYLE[edge.type];
  const strokeColor = edge.style?.color ? formatColor(edge.style.color) : getEdgeColor(edge.type, colors);
  const lineWidth = edge.style?.width ?? styling.lineWidth ?? 1;

  const styleParts = [
    'edgeStyle=orthogonalEdgeStyle;',
    'rounded=1;',
    'orthogonalLoop=1;',
    'jettySize=auto;',
    'html=1;',
    `strokeColor=${strokeColor};`,
    `strokeWidth=${lineWidth};`,
    `startArrow=${startArrow};`,
    `endArrow=${endArrow};`,
    'startFill=0;',
    'endFill=1;',
  ];

  if (dashed) {
    styleParts.push('dashed=1;');
  }

  return styleParts.join('');
}

/**
 * Calculates node positions using a simple hierarchical layout
 */
function calculatePositions(
  nodes: IVMNode[],
  options: Required<DrawioExportOptions>
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const { nodeWidth, nodeHeight, nodeSpacing, pageWidth } = options;

  // Group nodes by LOD level for hierarchical layout
  const nodesByLod = new Map<number, IVMNode[]>();
  for (const node of nodes) {
    const lod = node.lod;
    if (!nodesByLod.has(lod)) {
      nodesByLod.set(lod, []);
    }
    nodesByLod.get(lod)!.push(node);
  }

  // Calculate positions row by row
  const sortedLods = [...nodesByLod.keys()].sort((a, b) => a - b);
  let y = nodeSpacing;

  for (const lod of sortedLods) {
    const lodNodes = nodesByLod.get(lod)!;
    const totalWidth = lodNodes.length * nodeWidth + (lodNodes.length - 1) * nodeSpacing;
    let x = Math.max(nodeSpacing, (pageWidth - totalWidth) / 2);

    for (const node of lodNodes) {
      // If node has a 3D position, use x/y from it (scaled)
      if (node.position && (node.position.x !== 0 || node.position.y !== 0)) {
        positions.set(node.id, {
          x: Math.max(nodeSpacing, node.position.x * 100 + pageWidth / 2),
          y: Math.max(nodeSpacing, node.position.y * 100 + 200),
        });
      } else {
        positions.set(node.id, { x, y });
        x += nodeWidth + nodeSpacing;
      }
    }

    y += nodeHeight + nodeSpacing * 2;
  }

  return positions;
}

// =============================================================================
// XML Generators
// =============================================================================

/**
 * Generates the mxGraphModel XML
 */
function generateMxGraphModel(
  nodes: IVMNode[],
  edges: IVMEdge[],
  options: Required<DrawioExportOptions>,
  colors: ColorScheme,
  styling: ExportStyling
): string {
  const { pageWidth, pageHeight, nodeWidth, nodeHeight, gridSize, showGrid } = options;
  const positions = calculatePositions(nodes, options);

  // Build node cells
  const nodeCells: string[] = [];
  const nodeIdMap = new Map<string, string>();

  nodes.forEach((node, index) => {
    const cellId = generateCellId('node', index + 2); // Start at 2, 0 and 1 are reserved
    nodeIdMap.set(node.id, cellId);

    const pos = positions.get(node.id) ?? { x: 50, y: 50 + index * 80 };
    const style = buildNodeStyle(node, colors, styling);
    const label = escapeXml(node.metadata.label);

    nodeCells.push(
      `      <mxCell id="${cellId}" value="${label}" style="${style}" vertex="1" parent="1">` +
      `\n        <mxGeometry x="${pos.x}" y="${pos.y}" width="${nodeWidth}" height="${nodeHeight}" as="geometry" />` +
      `\n      </mxCell>`
    );
  });

  // Build edge cells
  const edgeCells: string[] = [];
  edges.forEach((edge, index) => {
    const cellId = generateCellId('edge', index + 2 + nodes.length);
    const sourceId = nodeIdMap.get(edge.source);
    const targetId = nodeIdMap.get(edge.target);

    if (!sourceId || !targetId) {
      return; // Skip edges with missing nodes
    }

    const style = buildEdgeStyle(edge, colors, styling);
    const label = edge.metadata.label ? escapeXml(edge.metadata.label) : '';

    edgeCells.push(
      `      <mxCell id="${cellId}" value="${label}" style="${style}" edge="1" parent="1" source="${sourceId}" target="${targetId}">` +
      `\n        <mxGeometry relative="1" as="geometry" />` +
      `\n      </mxCell>`
    );
  });

  // Build the complete mxGraphModel
  const gridAttr = showGrid ? `grid="1" gridSize="${gridSize}"` : 'grid="0"';

  return `<mxGraphModel dx="0" dy="0" ${gridAttr} guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="${pageWidth}" pageHeight="${pageHeight}">
  <root>
    <mxCell id="0" />
    <mxCell id="1" parent="0" />
${nodeCells.join('\n')}
${edgeCells.join('\n')}
  </root>
</mxGraphModel>`;
}

/**
 * Generates the complete Draw.io XML document
 */
function generateDrawioXml(
  graph: IVMGraph,
  nodes: IVMNode[],
  edges: IVMEdge[],
  options: Required<DrawioExportOptions>,
  colors: ColorScheme,
  styling: ExportStyling
): string {
  const mxGraphModel = generateMxGraphModel(nodes, edges, options, colors, styling);
  const title = options.title || graph.metadata.name || 'Diagram';

  // Generate metadata comment if requested
  let metadataComment = '';
  if (options.includeMetadata) {
    metadataComment = `<!-- Generated from: ${escapeXml(graph.metadata.name)} -->
<!-- Schema version: ${escapeXml(graph.metadata.schemaVersion)} -->
<!-- Generated at: ${new Date().toISOString()} -->
<!-- Nodes: ${nodes.length}, Edges: ${edges.length} -->
`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
${metadataComment}<mxfile host="diagram-builder" modified="${new Date().toISOString()}" agent="diagram-builder" version="1.0.0" type="device">
  <diagram id="diagram-1" name="${escapeXml(title)}">
    ${mxGraphModel}
  </diagram>
</mxfile>`;
}

// =============================================================================
// DrawioExporter Class
// =============================================================================

/**
 * Draw.io diagram exporter
 */
export class DrawioExporter implements Exporter<DrawioExportOptions> {
  readonly id = 'drawio';
  readonly name = 'Draw.io';
  readonly extension = 'drawio';
  readonly mimeType = 'application/vnd.jgraph.mxfile';

  /**
   * Exports an IVM graph to Draw.io format
   */
  export(graph: IVMGraph, options?: DrawioExportOptions): ExportResult {
    const startTime = Date.now();
    const opts = { ...DEFAULT_DRAWIO_OPTIONS, ...options };
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

    // Generate the Draw.io XML
    const content = generateDrawioXml(graph, nodes, validEdges, opts, colors, styling);
    const duration = Date.now() - startTime;

    return {
      content,
      mimeType: this.mimeType,
      extension: this.extension,
      stats: {
        nodeCount: nodes.length,
        edgeCount: validEdges.length,
        duration,
        size: Buffer.byteLength(content, 'utf-8'),
      },
    };
  }

  /**
   * Validates export options
   */
  validateOptions(options?: DrawioExportOptions): string[] {
    const errors: string[] = [];

    if (options) {
      if (options.lodLevel !== undefined && (options.lodLevel < 0 || options.lodLevel > 5)) {
        errors.push('lodLevel must be between 0 and 5');
      }

      if (options.pageWidth !== undefined && options.pageWidth < 100) {
        errors.push('pageWidth must be at least 100');
      }

      if (options.pageHeight !== undefined && options.pageHeight < 100) {
        errors.push('pageHeight must be at least 100');
      }

      if (options.nodeWidth !== undefined && options.nodeWidth < 20) {
        errors.push('nodeWidth must be at least 20');
      }

      if (options.nodeHeight !== undefined && options.nodeHeight < 20) {
        errors.push('nodeHeight must be at least 20');
      }

      if (options.gridSize !== undefined && options.gridSize < 1) {
        errors.push('gridSize must be at least 1');
      }
    }

    return errors;
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Creates a new DrawioExporter instance
 */
export function createDrawioExporter(): DrawioExporter {
  return new DrawioExporter();
}

/**
 * Convenience function to export a graph to Draw.io format
 */
export function exportToDrawio(graph: IVMGraph, options?: DrawioExportOptions): ExportResult {
  const exporter = new DrawioExporter();
  return exporter.export(graph, options);
}
