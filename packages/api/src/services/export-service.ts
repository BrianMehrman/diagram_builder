/**
 * Export Service
 *
 * Handles graph export to various formats using core exporters:
 * - PlantUML (.puml)
 * - Mermaid (.md)
 * - Draw.io (.drawio)
 * - GLTF (.gltf)
 * - SVG (.svg)
 * - PNG (.png)
 */

import type { IVMGraph } from '@diagram-builder/core';
import { getFullGraph } from './graph-service';

/**
 * Graph filters for controlling visibility
 */
export interface GraphFilters {
  /** Visible node types */
  nodeTypes?: string[];
  /** Visible edge types */
  edgeTypes?: string[];
  /** Maximum LOD level to display */
  maxLod?: number;
  /** Path pattern filter (glob or regex) */
  pathPattern?: string;
  /** Language filter */
  languages?: string[];
  /** Visible node IDs */
  visibleNodes?: string[];
  /** Hidden node IDs */
  hiddenNodes?: string[];
}

/**
 * Base export request parameters
 */
export interface ExportRequest {
  /** Repository ID to export */
  repoId: string;
  /** LOD level for filtering (0-5) */
  lodLevel?: number;
  /** Graph filters to apply */
  filters?: GraphFilters;
  /** Format-specific options */
  options?: Record<string, unknown>;
}

/**
 * Export result
 */
export interface ExportResult {
  /** Generated content */
  content: string | Buffer;
  /** MIME type */
  mimeType: string;
  /** File extension */
  extension: string;
  /** Filename */
  filename: string;
  /** Export statistics */
  stats: {
    nodeCount: number;
    edgeCount: number;
    duration: number;
    size: number;
  };
}

/**
 * Apply LOD filtering to a graph
 */
function applyLODFilter(graph: IVMGraph, lodLevel: number): IVMGraph {
  if (lodLevel >= 5) {
    // No filtering needed at max LOD
    return graph;
  }

  // Filter nodes based on LOD level
  const filteredNodes = graph.nodes.filter((node) => {
    const nodeLOD = node.lod;
    return nodeLOD <= lodLevel;
  });

  const nodeIds = new Set(filteredNodes.map((n) => n.id));

  // Filter edges to only include those between visible nodes
  const filteredEdges = graph.edges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
  );

  return {
    ...graph,
    nodes: filteredNodes,
    edges: filteredEdges,
  };
}

/**
 * Apply graph filters
 */
function applyFilters(graph: IVMGraph, filters?: GraphFilters): IVMGraph {
  if (!filters) {
    return graph;
  }

  let filteredGraph = graph;

  // Filter by node types
  if (filters.nodeTypes && filters.nodeTypes.length > 0) {
    const nodeTypeSet = new Set(filters.nodeTypes);
    filteredGraph = {
      ...filteredGraph,
      nodes: filteredGraph.nodes.filter((node) => nodeTypeSet.has(node.type)),
    };
  }

  // Filter by edge types
  if (filters.edgeTypes && filters.edgeTypes.length > 0) {
    const edgeTypeSet = new Set(filters.edgeTypes);
    filteredGraph = {
      ...filteredGraph,
      edges: filteredGraph.edges.filter((edge) => edgeTypeSet.has(edge.type)),
    };
  }

  // Filter by path pattern
  if (filters.pathPattern) {
    const pattern = new RegExp(filters.pathPattern);
    filteredGraph = {
      ...filteredGraph,
      nodes: filteredGraph.nodes.filter(
        (node) => node.metadata?.path && pattern.test(node.metadata.path)
      ),
    };
  }

  // Filter by languages
  if (filters.languages && filters.languages.length > 0) {
    const langSet = new Set(filters.languages);
    filteredGraph = {
      ...filteredGraph,
      nodes: filteredGraph.nodes.filter(
        (node) => node.metadata?.language && langSet.has(node.metadata.language)
      ),
    };
  }

  // Filter by visible/hidden nodes
  if (filters.visibleNodes && filters.visibleNodes.length > 0) {
    const visibleSet = new Set(filters.visibleNodes);
    filteredGraph = {
      ...filteredGraph,
      nodes: filteredGraph.nodes.filter((node) => visibleSet.has(node.id)),
    };
  }

  if (filters.hiddenNodes && filters.hiddenNodes.length > 0) {
    const hiddenSet = new Set(filters.hiddenNodes);
    filteredGraph = {
      ...filteredGraph,
      nodes: filteredGraph.nodes.filter((node) => !hiddenSet.has(node.id)),
    };
  }

  // Update edges to only include those between remaining nodes
  const nodeIds = new Set(filteredGraph.nodes.map((n) => n.id));
  filteredGraph = {
    ...filteredGraph,
    edges: filteredGraph.edges.filter(
      (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)
    ),
  };

  return filteredGraph;
}

/**
 * Prepare graph for export by applying filters
 */
async function prepareGraphForExport(
  repoId: string,
  lodLevel?: number,
  filters?: GraphFilters
): Promise<IVMGraph> {
  // Get full graph from Neo4j
  const graph = await getFullGraph(repoId);

  if (!graph) {
    throw new Error(`Graph not found for repository ${repoId}`);
  }

  // Apply LOD filtering
  let filteredGraph = graph;
  if (lodLevel !== undefined && lodLevel < 5) {
    filteredGraph = applyLODFilter(filteredGraph, lodLevel);
  }

  // Apply additional filters
  if (filters) {
    filteredGraph = applyFilters(filteredGraph, filters);
  }

  return filteredGraph;
}

/**
 * Export graph as PlantUML
 */
export async function exportPlantUML(request: ExportRequest): Promise<ExportResult> {
  const startTime = Date.now();

  // Prepare graph
  const graph = await prepareGraphForExport(
    request.repoId,
    request.lodLevel,
    request.filters
  );

  // TODO: Import and use PlantUML exporter from core package
  // This requires the core package to be built successfully
  // Once core package build issues are resolved, uncomment:
  // const { exportToPlantUML } = await import('@diagram-builder/core');
  // const result = exportToPlantUML(graph, request.options);

  // Temporary placeholder until core package is built
  const result = {
    content: '@startuml\n' + `title ${graph.metadata?.name || 'Diagram'}\n` + '@enduml\n',
    mimeType: 'text/x-plantuml',
    extension: 'puml',
    stats: {
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      duration: 0,
      size: 0,
    },
  };

  const duration = Date.now() - startTime;

  return {
    content: result.content as string,
    mimeType: result.mimeType,
    extension: result.extension,
    filename: `${graph.metadata?.name || 'diagram'}.${result.extension}`,
    stats: {
      ...result.stats,
      duration,
    },
  };
}

/**
 * Export graph as Mermaid
 */
export async function exportMermaid(request: ExportRequest): Promise<ExportResult> {
  const startTime = Date.now();

  const graph = await prepareGraphForExport(
    request.repoId,
    request.lodLevel,
    request.filters
  );

  // TODO: Import and use Mermaid exporter from core package
  // const { exportToMermaid } = await import('@diagram-builder/core');
  // const result = exportToMermaid(graph, request.options);

  // Temporary placeholder
  const result = {
    content: `flowchart TD\n  Start[${graph.metadata?.name || 'Diagram'}]\n`,
    mimeType: 'text/plain',
    extension: 'md',
    stats: {
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      duration: 0,
      size: 0,
    },
  };

  const duration = Date.now() - startTime;

  return {
    content: result.content as string,
    mimeType: result.mimeType,
    extension: result.extension,
    filename: `${graph.metadata?.name || 'diagram'}.${result.extension}`,
    stats: {
      ...result.stats,
      duration,
    },
  };
}

/**
 * Export graph as Draw.io
 */
export async function exportDrawio(request: ExportRequest): Promise<ExportResult> {
  const startTime = Date.now();

  const graph = await prepareGraphForExport(
    request.repoId,
    request.lodLevel,
    request.filters
  );

  // TODO: Import and use Draw.io exporter from core package
  // const { exportToDrawio } = await import('@diagram-builder/core');
  // const result = exportToDrawio(graph, request.options);

  // Temporary placeholder
  const result = {
    content: `<mxfile><diagram name="${graph.metadata?.name || 'Diagram'}"></diagram></mxfile>`,
    mimeType: 'application/xml',
    extension: 'drawio',
    stats: {
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      duration: 0,
      size: 0,
    },
  };

  const duration = Date.now() - startTime;

  return {
    content: result.content as string,
    mimeType: result.mimeType,
    extension: result.extension,
    filename: `${graph.metadata?.name || 'diagram'}.${result.extension}`,
    stats: {
      ...result.stats,
      duration,
    },
  };
}

/**
 * Export graph as GLTF
 */
export async function exportGLTF(request: ExportRequest): Promise<ExportResult> {
  const startTime = Date.now();

  const graph = await prepareGraphForExport(
    request.repoId,
    request.lodLevel,
    request.filters
  );

  // TODO: Import and use GLTF exporter from core package
  // const { exportToGLTF } = await import('@diagram-builder/core');
  // const result = exportToGLTF(graph, request.options);

  // Temporary placeholder
  const result = {
    content: JSON.stringify({ asset: { version: '2.0' }, scenes: [], nodes: [], meshes: [] }),
    mimeType: 'model/gltf+json',
    extension: 'gltf',
    stats: {
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      duration: 0,
      size: 0,
    },
  };

  const duration = Date.now() - startTime;

  return {
    content: result.content as string,
    mimeType: result.mimeType,
    extension: result.extension,
    filename: `${graph.metadata?.name || 'diagram'}.${result.extension}`,
    stats: {
      ...result.stats,
      duration,
    },
  };
}

/**
 * Image export request (PNG or SVG)
 */
export interface ImageExportRequest extends ExportRequest {
  /** Image format: png or svg */
  format: 'png' | 'svg';
}

/**
 * Export graph as PNG or SVG
 */
export async function exportImage(request: ImageExportRequest): Promise<ExportResult> {
  const startTime = Date.now();

  const graph = await prepareGraphForExport(
    request.repoId,
    request.lodLevel,
    request.filters
  );

  if (request.format === 'svg') {
    // TODO: Import and use SVG exporter from core package
    // const { exportToSVG } = await import('@diagram-builder/core');
    // const result = exportToSVG(graph, request.options);

    // Temporary placeholder
    const result = {
      content: `<svg xmlns="http://www.w3.org/2000/svg"><text>${graph.metadata?.name || 'Diagram'}</text></svg>`,
      mimeType: 'image/svg+xml',
      extension: 'svg',
      stats: {
        nodeCount: graph.nodes.length,
        edgeCount: graph.edges.length,
        duration: 0,
        size: 0,
      },
    };

    const duration = Date.now() - startTime;

    return {
      content: result.content as string,
      mimeType: result.mimeType,
      extension: result.extension,
      filename: `${graph.metadata?.name || 'diagram'}.${result.extension}`,
      stats: {
        ...result.stats,
        duration,
      },
    };
  } else {
    // TODO: Import and use PNG exporter from core package
    // const { exportToPNG } = await import('@diagram-builder/core');
    // const result = exportToPNG(graph, request.options);

    // Temporary placeholder (empty PNG)
    const result = {
      content: Buffer.from([]),
      mimeType: 'image/png',
      extension: 'png',
      stats: {
        nodeCount: graph.nodes.length,
        edgeCount: graph.edges.length,
        duration: 0,
        size: 0,
      },
    };

    const duration = Date.now() - startTime;

    return {
      content: result.content as Buffer,
      mimeType: result.mimeType,
      extension: result.extension,
      filename: `${graph.metadata?.name || 'diagram'}.${result.extension}`,
      stats: {
        ...result.stats,
        duration,
      },
    };
  }
}
