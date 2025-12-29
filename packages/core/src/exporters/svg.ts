/**
 * SVG Exporter
 *
 * Exports IVM graphs to SVG (Scalable Vector Graphics) format.
 * Renders a 2D diagram representation directly without external dependencies.
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
// SVG-Specific Types
// =============================================================================

/**
 * SVG node shape
 */
export type SVGNodeShape = 'rect' | 'ellipse' | 'diamond' | 'hexagon' | 'cylinder' | 'folder';

/**
 * SVG export options
 */
export interface SVGExportOptions extends BaseExportOptions {
  /** Canvas width in pixels */
  width?: number;

  /** Canvas height in pixels */
  height?: number;

  /** Padding around the diagram */
  padding?: number;

  /** Default node width */
  nodeWidth?: number;

  /** Default node height */
  nodeHeight?: number;

  /** Whether to auto-fit the viewport to content */
  autoFit?: boolean;

  /** Scale factor for auto-fit */
  scale?: number;

  /** Whether to show node labels */
  showLabels?: boolean;

  /** Whether to show edge labels */
  showEdgeLabels?: boolean;

  /** Arrow size for edges */
  arrowSize?: number;

  /** Whether to use curved edges */
  curvedEdges?: boolean;
}

/**
 * Default SVG export options
 */
export const DEFAULT_SVG_OPTIONS: Required<SVGExportOptions> = {
  title: '',
  lodLevel: 5,
  includeLegend: false,
  includeMetadata: true,
  styling: DEFAULT_EXPORT_STYLING,
  width: 1200,
  height: 800,
  padding: 50,
  nodeWidth: 120,
  nodeHeight: 60,
  autoFit: true,
  scale: 1.0,
  showLabels: true,
  showEdgeLabels: false,
  arrowSize: 8,
  curvedEdges: true,
};

// =============================================================================
// Shape Mapping
// =============================================================================

/**
 * Maps IVM node types to SVG shapes
 */
const NODE_TYPE_TO_SHAPE: Record<NodeType, SVGNodeShape> = {
  repository: 'cylinder',
  package: 'folder',
  namespace: 'folder',
  directory: 'folder',
  module: 'rect',
  file: 'rect',
  class: 'rect',
  interface: 'ellipse',
  function: 'hexagon',
  method: 'hexagon',
  variable: 'diamond',
  type: 'ellipse',
  enum: 'hexagon',
};

/**
 * Edge style based on type
 */
const EDGE_TYPE_TO_STYLE: Record<EdgeType, { dashed: boolean; arrow: boolean }> = {
  imports: { dashed: true, arrow: true },
  exports: { dashed: true, arrow: true },
  extends: { dashed: false, arrow: true },
  implements: { dashed: true, arrow: true },
  calls: { dashed: false, arrow: true },
  uses: { dashed: false, arrow: true },
  contains: { dashed: false, arrow: false },
  depends_on: { dashed: true, arrow: true },
  type_of: { dashed: true, arrow: true },
  returns: { dashed: false, arrow: true },
  parameter_of: { dashed: true, arrow: true },
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
 * Gets the fill color for a node type
 */
function getNodeColor(type: NodeType, colors: ColorScheme): string {
  return colors.nodeColors[type] ?? '#FFFFFF';
}

/**
 * Gets the stroke color for an edge type
 */
function getEdgeColor(type: EdgeType, colors: ColorScheme): string {
  return colors.edgeColors[type] ?? '#666666';
}

/**
 * Calculates node positions for layout
 */
function calculatePositions(
  nodes: IVMNode[],
  options: Required<SVGExportOptions>
): Map<string, { x: number; y: number; width: number; height: number }> {
  const positions = new Map<string, { x: number; y: number; width: number; height: number }>();
  const { nodeWidth, nodeHeight, padding, width, height, scale } = options;

  // Group nodes by LOD level for hierarchical layout
  const nodesByLod = new Map<number, IVMNode[]>();
  for (const node of nodes) {
    const lod = node.lod;
    if (!nodesByLod.has(lod)) {
      nodesByLod.set(lod, []);
    }
    nodesByLod.get(lod)!.push(node);
  }

  // Calculate positions row by row based on LOD
  const sortedLods = [...nodesByLod.keys()].sort((a, b) => a - b);
  let y = padding;
  const spacing = 30;

  for (const lod of sortedLods) {
    const lodNodes = nodesByLod.get(lod)!;
    const rowWidth = lodNodes.length * nodeWidth + (lodNodes.length - 1) * spacing;
    let x = Math.max(padding, (width - rowWidth) / 2);

    for (const node of lodNodes) {
      // Check if node has 3D position - use x/z for 2D layout
      if (node.position && (node.position.x !== 0 || node.position.z !== 0)) {
        positions.set(node.id, {
          x: node.position.x * 50 * scale + width / 2,
          y: node.position.z * 50 * scale + height / 2,
          width: nodeWidth * (node.style?.size ?? 1),
          height: nodeHeight * (node.style?.size ?? 1),
        });
      } else {
        positions.set(node.id, {
          x,
          y,
          width: nodeWidth * (node.style?.size ?? 1),
          height: nodeHeight * (node.style?.size ?? 1),
        });
        x += nodeWidth + spacing;
      }
    }

    y += nodeHeight + spacing * 2;
  }

  return positions;
}

/**
 * Calculates bounding box of all positioned nodes
 */
function calculateBoundingBox(
  positions: Map<string, { x: number; y: number; width: number; height: number }>
): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const pos of positions.values()) {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + pos.width);
    maxY = Math.max(maxY, pos.y + pos.height);
  }

  return { minX, minY, maxX, maxY };
}

// =============================================================================
// Shape Generators
// =============================================================================

/**
 * Generates SVG for a rectangle shape
 */
function generateRect(
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke: string,
  rounded: boolean
): string {
  const rx = rounded ? 8 : 0;
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}" ` +
    `fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
}

/**
 * Generates SVG for an ellipse shape
 */
function generateEllipse(
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke: string
): string {
  const cx = x + width / 2;
  const cy = y + height / 2;
  return `<ellipse cx="${cx}" cy="${cy}" rx="${width / 2}" ry="${height / 2}" ` +
    `fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
}

/**
 * Generates SVG for a diamond shape
 */
function generateDiamond(
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke: string
): string {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const points = [
    `${cx},${y}`,
    `${x + width},${cy}`,
    `${cx},${y + height}`,
    `${x},${cy}`,
  ].join(' ');
  return `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
}

/**
 * Generates SVG for a hexagon shape
 */
function generateHexagon(
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke: string
): string {
  const inset = width * 0.2;
  const points = [
    `${x + inset},${y}`,
    `${x + width - inset},${y}`,
    `${x + width},${y + height / 2}`,
    `${x + width - inset},${y + height}`,
    `${x + inset},${y + height}`,
    `${x},${y + height / 2}`,
  ].join(' ');
  return `<polygon points="${points}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
}

/**
 * Generates SVG for a cylinder shape (database icon)
 */
function generateCylinder(
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke: string
): string {
  const ellipseHeight = height * 0.15;
  const bodyHeight = height - ellipseHeight;
  
  return `<g>
    <path d="M${x},${y + ellipseHeight / 2} 
             L${x},${y + bodyHeight} 
             Q${x},${y + bodyHeight + ellipseHeight / 2} ${x + width / 2},${y + bodyHeight + ellipseHeight / 2}
             Q${x + width},${y + bodyHeight + ellipseHeight / 2} ${x + width},${y + bodyHeight}
             L${x + width},${y + ellipseHeight / 2}" 
          fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    <ellipse cx="${x + width / 2}" cy="${y + ellipseHeight / 2}" rx="${width / 2}" ry="${ellipseHeight / 2}" 
             fill="${fill}" stroke="${stroke}" stroke-width="2"/>
  </g>`;
}

/**
 * Generates SVG for a folder shape
 */
function generateFolder(
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke: string
): string {
  const tabWidth = width * 0.3;
  const tabHeight = height * 0.15;
  
  return `<g>
    <path d="M${x},${y + tabHeight} 
             L${x},${y + height} 
             L${x + width},${y + height}
             L${x + width},${y + tabHeight}
             L${x + tabWidth + 10},${y + tabHeight}
             L${x + tabWidth},${y}
             L${x},${y}
             Z" 
          fill="${fill}" stroke="${stroke}" stroke-width="2"/>
  </g>`;
}

/**
 * Generates the shape SVG for a node
 */
function generateNodeShape(
  shape: SVGNodeShape,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke: string,
  rounded: boolean
): string {
  switch (shape) {
    case 'rect':
      return generateRect(x, y, width, height, fill, stroke, rounded);
    case 'ellipse':
      return generateEllipse(x, y, width, height, fill, stroke);
    case 'diamond':
      return generateDiamond(x, y, width, height, fill, stroke);
    case 'hexagon':
      return generateHexagon(x, y, width, height, fill, stroke);
    case 'cylinder':
      return generateCylinder(x, y, width, height, fill, stroke);
    case 'folder':
      return generateFolder(x, y, width, height, fill, stroke);
    default:
      return generateRect(x, y, width, height, fill, stroke, rounded);
  }
}

// =============================================================================
// Edge Generators
// =============================================================================

/**
 * Generates an arrow marker definition
 */
function generateArrowMarker(id: string, color: string, size: number): string {
  return `<marker id="${id}" viewBox="0 0 10 10" refX="10" refY="5" 
    markerWidth="${size}" markerHeight="${size}" orient="auto-start-reverse">
    <path d="M 0 0 L 10 5 L 0 10 z" fill="${color}"/>
  </marker>`;
}

/**
 * Generates an edge path between two nodes
 */
function generateEdgePath(
  sourcePos: { x: number; y: number; width: number; height: number },
  targetPos: { x: number; y: number; width: number; height: number },
  curved: boolean
): string {
  // Calculate connection points (center of each node)
  const sx = sourcePos.x + sourcePos.width / 2;
  const sy = sourcePos.y + sourcePos.height / 2;
  const tx = targetPos.x + targetPos.width / 2;
  const ty = targetPos.y + targetPos.height / 2;

  // Calculate direction
  const dx = tx - sx;
  const dy = ty - sy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 1) return '';

  // Offset from center to edge of node
  const sourceOffset = Math.min(sourcePos.width, sourcePos.height) / 2;
  const targetOffset = Math.min(targetPos.width, targetPos.height) / 2;

  const startX = sx + (dx / dist) * sourceOffset;
  const startY = sy + (dy / dist) * sourceOffset;
  const endX = tx - (dx / dist) * targetOffset;
  const endY = ty - (dy / dist) * targetOffset;

  if (curved && Math.abs(dx) > 50 && Math.abs(dy) > 50) {
    // Quadratic bezier curve
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const ctrlX = midX + (dy / dist) * 30;
    const ctrlY = midY - (dx / dist) * 30;
    return `M${startX},${startY} Q${ctrlX},${ctrlY} ${endX},${endY}`;
  }

  // Straight line
  return `M${startX},${startY} L${endX},${endY}`;
}

// =============================================================================
// SVG Document Generation
// =============================================================================

/**
 * Generates the complete SVG document
 */
function generateSVG(
  nodes: IVMNode[],
  edges: IVMEdge[],
  options: Required<SVGExportOptions>,
  colors: ColorScheme,
  styling: ExportStyling,
  graphName: string
): string {
  const { width, height, padding, showLabels, showEdgeLabels, arrowSize, curvedEdges, autoFit } = options;
  const rounded = styling.rounded ?? true;
  const fontSize = styling.fontSize ?? 12;
  const fontFamily = styling.fontFamily ?? 'Arial, sans-serif';

  // Calculate node positions
  const positions = calculatePositions(nodes, options);

  // Calculate viewBox for auto-fit
  let viewBox = `0 0 ${width} ${height}`;
  if (autoFit && positions.size > 0) {
    const bounds = calculateBoundingBox(positions);
    const contentWidth = bounds.maxX - bounds.minX + padding * 2;
    const contentHeight = bounds.maxY - bounds.minY + padding * 2;
    viewBox = `${bounds.minX - padding} ${bounds.minY - padding} ${contentWidth} ${contentHeight}`;
  }

  const lines: string[] = [];

  // SVG header
  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">`);

  // Title and metadata
  if (options.title) {
    lines.push(`  <title>${escapeXml(options.title)}</title>`);
  }
  if (options.includeMetadata) {
    lines.push(`  <!-- Generated from: ${escapeXml(graphName)} -->`);
    lines.push(`  <!-- Generated at: ${new Date().toISOString()} -->`);
    lines.push(`  <!-- Nodes: ${nodes.length}, Edges: ${edges.length} -->`);
  }

  // Defs section for markers and filters
  lines.push('  <defs>');
  
  // Generate arrow markers for each edge color
  const edgeColors = new Set<string>();
  for (const edge of edges) {
    const color = getEdgeColor(edge.type, colors);
    edgeColors.add(color);
  }
  for (const color of edgeColors) {
    const markerId = `arrow-${color.replace('#', '')}`;
    lines.push(`    ${generateArrowMarker(markerId, color, arrowSize)}`);
  }

  // Drop shadow filter
  if (styling.shadows) {
    lines.push(`    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
    </filter>`);
  }

  lines.push('  </defs>');

  // Background
  lines.push(`  <rect width="100%" height="100%" fill="${colors.background ?? '#FFFFFF'}"/>`);

  // Edges layer (drawn first, behind nodes)
  lines.push('  <g class="edges">');
  for (const edge of edges) {
    const sourcePos = positions.get(edge.source);
    const targetPos = positions.get(edge.target);

    if (!sourcePos || !targetPos) continue;

    const edgeStyle = EDGE_TYPE_TO_STYLE[edge.type];
    const color = getEdgeColor(edge.type, colors);
    const markerId = `arrow-${color.replace('#', '')}`;
    const path = generateEdgePath(sourcePos, targetPos, curvedEdges);

    if (!path) continue;

    const strokeDasharray = edgeStyle.dashed ? 'stroke-dasharray="5,5"' : '';
    const markerEnd = edgeStyle.arrow ? `marker-end="url(#${markerId})"` : '';

    lines.push(`    <path d="${path}" fill="none" stroke="${color}" stroke-width="${styling.lineWidth ?? 1}" ${strokeDasharray} ${markerEnd}/>`);

    // Edge label
    if (showEdgeLabels && edge.metadata.label) {
      const midX = (sourcePos.x + sourcePos.width / 2 + targetPos.x + targetPos.width / 2) / 2;
      const midY = (sourcePos.y + sourcePos.height / 2 + targetPos.y + targetPos.height / 2) / 2;
      lines.push(`    <text x="${midX}" y="${midY}" text-anchor="middle" font-size="${fontSize - 2}" font-family="${fontFamily}" fill="${colors.text ?? '#333333'}">${escapeXml(edge.metadata.label)}</text>`);
    }
  }
  lines.push('  </g>');

  // Nodes layer
  lines.push('  <g class="nodes">');
  for (const node of nodes) {
    const pos = positions.get(node.id);
    if (!pos) continue;

    const shape = NODE_TYPE_TO_SHAPE[node.type];
    const fill = node.style?.color ?? getNodeColor(node.type, colors);
    const stroke = colors.border ?? '#CCCCCC';
    const filter = styling.shadows ? 'filter="url(#shadow)"' : '';

    lines.push(`    <g class="node" data-id="${escapeXml(node.id)}" data-type="${node.type}" ${filter}>`);
    lines.push(`      ${generateNodeShape(shape, pos.x, pos.y, pos.width, pos.height, fill, stroke, rounded)}`);

    // Node label
    if (showLabels) {
      const textX = pos.x + pos.width / 2;
      const textY = pos.y + pos.height / 2 + fontSize / 3;
      const label = node.metadata.label.length > 15 
        ? node.metadata.label.substring(0, 12) + '...' 
        : node.metadata.label;
      lines.push(`      <text x="${textX}" y="${textY}" text-anchor="middle" font-size="${fontSize}" font-family="${fontFamily}" fill="${colors.text ?? '#333333'}">${escapeXml(label)}</text>`);
    }

    lines.push('    </g>');
  }
  lines.push('  </g>');

  // Legend
  if (options.includeLegend) {
    lines.push('  <g class="legend" transform="translate(10, 10)">');
    lines.push(`    <text x="0" y="15" font-size="${fontSize}" font-weight="bold" font-family="${fontFamily}">Legend</text>`);
    
    let legendY = 30;
    const nodeTypes: NodeType[] = ['class', 'interface', 'function', 'file'];
    for (const type of nodeTypes) {
      const color = getNodeColor(type, colors);
      lines.push(`    <rect x="0" y="${legendY}" width="12" height="12" fill="${color}" stroke="${colors.border ?? '#CCCCCC'}"/>`);
      lines.push(`    <text x="18" y="${legendY + 10}" font-size="${fontSize - 2}" font-family="${fontFamily}">${type}</text>`);
      legendY += 18;
    }
    
    lines.push('  </g>');
  }

  lines.push('</svg>');

  return lines.join('\n');
}

// =============================================================================
// SVGExporter Class
// =============================================================================

/**
 * SVG diagram exporter
 */
export class SVGExporter implements Exporter<SVGExportOptions> {
  readonly id = 'svg';
  readonly name = 'SVG';
  readonly extension = 'svg';
  readonly mimeType = 'image/svg+xml';

  /**
   * Exports an IVM graph to SVG format
   */
  export(graph: IVMGraph, options?: SVGExportOptions): ExportResult {
    const startTime = Date.now();
    const opts = { ...DEFAULT_SVG_OPTIONS, ...options };
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

    // Generate SVG
    const content = generateSVG(
      nodes,
      validEdges,
      opts,
      colors,
      styling,
      opts.title || graph.metadata.name
    );

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
  validateOptions(options?: SVGExportOptions): string[] {
    const errors: string[] = [];

    if (options) {
      if (options.lodLevel !== undefined && (options.lodLevel < 0 || options.lodLevel > 5)) {
        errors.push('lodLevel must be between 0 and 5');
      }

      if (options.width !== undefined && options.width < 100) {
        errors.push('width must be at least 100');
      }

      if (options.height !== undefined && options.height < 100) {
        errors.push('height must be at least 100');
      }

      if (options.nodeWidth !== undefined && options.nodeWidth < 20) {
        errors.push('nodeWidth must be at least 20');
      }

      if (options.nodeHeight !== undefined && options.nodeHeight < 20) {
        errors.push('nodeHeight must be at least 20');
      }

      if (options.scale !== undefined && options.scale <= 0) {
        errors.push('scale must be greater than 0');
      }

      if (options.arrowSize !== undefined && options.arrowSize < 1) {
        errors.push('arrowSize must be at least 1');
      }
    }

    return errors;
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Creates a new SVGExporter instance
 */
export function createSVGExporter(): SVGExporter {
  return new SVGExporter();
}

/**
 * Convenience function to export a graph to SVG format
 */
export function exportToSVG(graph: IVMGraph, options?: SVGExportOptions): ExportResult {
  const exporter = new SVGExporter();
  return exporter.export(graph, options);
}
