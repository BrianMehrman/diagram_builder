/**
 * IVM Builder Utilities
 *
 * Provides functions for constructing IVM graphs from parsed code data.
 * Handles position calculation, LOD assignment, and graph statistics.
 */

import {
  IVMGraph,
  IVMNode,
  IVMEdge,
  GraphInput,
  NodeInput,
  EdgeInput,
  GraphMetadata,
  GraphStats,
  BoundingBox,
  Position3D,
  NodeType,
  EdgeType,
  LODLevel,
  IVM_SCHEMA_VERSION,
  DEFAULT_LOD,
} from './types.js';

// =============================================================================
// ID Generation
// =============================================================================

/**
 * Generates a unique edge ID from source, target, and type
 */
export function generateEdgeId(source: string, target: string, type: EdgeType): string {
  return `${source}--${type}-->${target}`;
}

/**
 * Generates a unique ID with optional prefix
 */
export function generateId(prefix: string = 'node'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// LOD Assignment
// =============================================================================

/**
 * Default LOD levels for different node types
 */
const NODE_TYPE_LOD: Record<NodeType, LODLevel> = {
  repository: 0,
  package: 1,
  namespace: 1,
  directory: 2,
  module: 2,
  file: 3,
  class: 4,
  interface: 4,
  enum: 4,
  function: 4,
  type: 5,
  method: 5,
  variable: 5,
};

/**
 * Assigns LOD level based on node type
 */
export function assignLOD(nodeType: NodeType): LODLevel {
  return NODE_TYPE_LOD[nodeType] ?? DEFAULT_LOD;
}

/**
 * Assigns LOD level to an edge based on its connected nodes
 */
export function assignEdgeLOD(sourceLod: LODLevel, targetLod: LODLevel): LODLevel {
  // Edge is visible when both connected nodes are visible
  return Math.max(sourceLod, targetLod) as LODLevel;
}

// =============================================================================
// Position Calculation
// =============================================================================

/**
 * Creates a default position (origin)
 */
export function createDefaultPosition(): Position3D {
  return { x: 0, y: 0, z: 0 };
}

/**
 * Simple grid-based initial position assignment
 * Real layout will be done by the layout engine
 */
export function assignInitialPositions(nodes: IVMNode[], spacing: number = 100): void {
  const gridSize = Math.ceil(Math.sqrt(nodes.length));

  nodes.forEach((node, index) => {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;

    node.position = {
      x: col * spacing - (gridSize * spacing) / 2,
      y: 0,
      z: row * spacing - (gridSize * spacing) / 2,
    };
  });
}

/**
 * Assigns hierarchical positions based on parent-child relationships
 */
export function assignHierarchicalPositions(
  nodes: IVMNode[],
  horizontalSpacing: number = 100,
  verticalSpacing: number = 50
): void {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const rootNodes = nodes.filter((n) => !n.parentId);
  const processed = new Set<string>();

  function positionNode(node: IVMNode, x: number, y: number, z: number): void {
    if (processed.has(node.id)) return;
    processed.add(node.id);

    node.position = { x, y, z };

    // Find children
    const children = nodes.filter((n) => n.parentId === node.id);
    const childWidth = children.length * horizontalSpacing;

    children.forEach((child, index) => {
      const childX = x - childWidth / 2 + index * horizontalSpacing + horizontalSpacing / 2;
      positionNode(child, childX, y - verticalSpacing, z);
    });
  }

  // Position root nodes
  const rootWidth = rootNodes.length * horizontalSpacing * 2;
  rootNodes.forEach((root, index) => {
    const rootX = -rootWidth / 2 + index * horizontalSpacing * 2 + horizontalSpacing;
    positionNode(root, rootX, 0, 0);
  });
}

// =============================================================================
// Bounding Box Calculation
// =============================================================================

/**
 * Calculates the bounding box of all nodes
 */
export function calculateBounds(nodes: IVMNode[]): BoundingBox {
  if (nodes.length === 0) {
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 },
    };
  }

  const min: Position3D = {
    x: Number.POSITIVE_INFINITY,
    y: Number.POSITIVE_INFINITY,
    z: Number.POSITIVE_INFINITY,
  };

  const max: Position3D = {
    x: Number.NEGATIVE_INFINITY,
    y: Number.NEGATIVE_INFINITY,
    z: Number.NEGATIVE_INFINITY,
  };

  for (const node of nodes) {
    min.x = Math.min(min.x, node.position.x);
    min.y = Math.min(min.y, node.position.y);
    min.z = Math.min(min.z, node.position.z);
    max.x = Math.max(max.x, node.position.x);
    max.y = Math.max(max.y, node.position.y);
    max.z = Math.max(max.z, node.position.z);
  }

  return { min, max };
}

// =============================================================================
// Statistics Calculation
// =============================================================================

/**
 * Calculates graph statistics
 */
export function calculateStats(nodes: IVMNode[], edges: IVMEdge[]): GraphStats {
  const nodesByType = {} as Record<NodeType, number>;
  const edgesByType = {} as Record<EdgeType, number>;

  let totalLoc = 0;
  let complexitySum = 0;
  let complexityCount = 0;

  for (const node of nodes) {
    nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;

    if (node.metadata.loc !== undefined) {
      totalLoc += node.metadata.loc;
    }

    if (node.metadata.complexity !== undefined) {
      complexitySum += node.metadata.complexity;
      complexityCount++;
    }
  }

  for (const edge of edges) {
    edgesByType[edge.type] = (edgesByType[edge.type] || 0) + 1;
  }

  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    nodesByType,
    edgesByType,
    totalLoc: totalLoc > 0 ? totalLoc : undefined,
    avgComplexity: complexityCount > 0 ? complexitySum / complexityCount : undefined,
  };
}

// =============================================================================
// Node Builder
// =============================================================================

/**
 * Creates an IVM node from input
 */
export function createNode(input: NodeInput): IVMNode {
  return {
    id: input.id,
    type: input.type,
    position: createDefaultPosition(),
    lod: assignLOD(input.type),
    parentId: input.parentId,
    metadata: input.metadata,
    style: input.style,
  };
}

/**
 * Creates multiple IVM nodes from inputs
 */
export function createNodes(inputs: NodeInput[]): IVMNode[] {
  return inputs.map(createNode);
}

// =============================================================================
// Edge Builder
// =============================================================================

/**
 * Creates an IVM edge from input
 */
export function createEdge(input: EdgeInput, nodeMap: Map<string, IVMNode>): IVMEdge {
  const sourceNode = nodeMap.get(input.source);
  const targetNode = nodeMap.get(input.target);

  const sourceLod = sourceNode?.lod ?? DEFAULT_LOD;
  const targetLod = targetNode?.lod ?? DEFAULT_LOD;

  const edge: IVMEdge = {
    id: input.id ?? generateEdgeId(input.source, input.target, input.type),
    source: input.source,
    target: input.target,
    type: input.type,
    lod: assignEdgeLOD(sourceLod, targetLod),
    metadata: input.metadata ?? {},
  };

  if (input.style !== undefined) {
    edge.style = input.style;
  }

  return edge;
}

/**
 * Creates multiple IVM edges from inputs
 */
export function createEdges(inputs: EdgeInput[], nodeMap: Map<string, IVMNode>): IVMEdge[] {
  return inputs.map((input) => createEdge(input, nodeMap));
}

// =============================================================================
// Graph Builder
// =============================================================================

/**
 * Options for building an IVM graph
 */
export interface BuildOptions {
  /** Whether to assign initial positions (default: true) */
  assignPositions?: boolean;

  /** Position assignment strategy */
  positionStrategy?: 'grid' | 'hierarchical';

  /** Spacing between nodes */
  spacing?: number;
}

/**
 * Builds a complete IVM graph from input data
 */
export function buildGraph(input: GraphInput, options: BuildOptions = {}): IVMGraph {
  const { assignPositions = true, positionStrategy = 'grid', spacing = 100 } = options;

  // Create nodes
  const nodes = createNodes(input.nodes);
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Update dependency counts
  for (const edgeInput of input.edges) {
    const sourceNode = nodeMap.get(edgeInput.source);
    const targetNode = nodeMap.get(edgeInput.target);

    if (sourceNode) {
      sourceNode.metadata.dependencyCount = (sourceNode.metadata.dependencyCount ?? 0) + 1;
    }
    if (targetNode) {
      targetNode.metadata.dependentCount = (targetNode.metadata.dependentCount ?? 0) + 1;
    }
  }

  // Create edges
  const edges = createEdges(input.edges, nodeMap);

  // Assign positions if requested
  if (assignPositions) {
    if (positionStrategy === 'hierarchical') {
      assignHierarchicalPositions(nodes, spacing, spacing / 2);
    } else {
      assignInitialPositions(nodes, spacing);
    }
  }

  // Calculate bounds
  const bounds = calculateBounds(nodes);

  // Calculate statistics
  const stats = calculateStats(nodes, edges);

  // Extract languages from node metadata
  const languages = [
    ...new Set(nodes.map((n) => n.metadata.language).filter((l): l is string => l !== undefined)),
  ];

  // Build complete metadata
  const metadata: GraphMetadata = {
    ...input.metadata,
    schemaVersion: IVM_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    stats,
    languages,
  };

  return {
    nodes,
    edges,
    metadata,
    bounds,
  };
}

// =============================================================================
// Graph Manipulation
// =============================================================================

/**
 * Adds a node to an existing graph
 */
export function addNode(graph: IVMGraph, input: NodeInput): IVMGraph {
  const node = createNode(input);
  const nodes = [...graph.nodes, node];
  const bounds = calculateBounds(nodes);
  const stats = calculateStats(nodes, graph.edges);

  return {
    ...graph,
    nodes,
    bounds,
    metadata: {
      ...graph.metadata,
      stats,
    },
  };
}

/**
 * Adds an edge to an existing graph
 */
export function addEdge(graph: IVMGraph, input: EdgeInput): IVMGraph {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const edge = createEdge(input, nodeMap);
  const edges = [...graph.edges, edge];
  const stats = calculateStats(graph.nodes, edges);

  return {
    ...graph,
    edges,
    metadata: {
      ...graph.metadata,
      stats,
    },
  };
}

/**
 * Removes a node and its connected edges from the graph
 */
export function removeNode(graph: IVMGraph, nodeId: string): IVMGraph {
  const nodes = graph.nodes.filter((n) => n.id !== nodeId);
  const edges = graph.edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
  const bounds = calculateBounds(nodes);
  const stats = calculateStats(nodes, edges);

  return {
    ...graph,
    nodes,
    edges,
    bounds,
    metadata: {
      ...graph.metadata,
      stats,
    },
  };
}

/**
 * Removes an edge from the graph
 */
export function removeEdge(graph: IVMGraph, edgeId: string): IVMGraph {
  const edges = graph.edges.filter((e) => e.id !== edgeId);
  const stats = calculateStats(graph.nodes, edges);

  return {
    ...graph,
    edges,
    metadata: {
      ...graph.metadata,
      stats,
    },
  };
}

/**
 * Updates a node's properties
 */
export function updateNode(
  graph: IVMGraph,
  nodeId: string,
  updates: Partial<Omit<IVMNode, 'id'>>
): IVMGraph {
  const nodes = graph.nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n));
  const bounds = calculateBounds(nodes);
  const stats = calculateStats(nodes, graph.edges);

  return {
    ...graph,
    nodes,
    bounds,
    metadata: {
      ...graph.metadata,
      stats,
    },
  };
}

// =============================================================================
// Fluent Builder Class
// =============================================================================

/**
 * Fluent builder for constructing IVM graphs
 */
export class IVMBuilder {
  private nodes: NodeInput[] = [];
  private edges: EdgeInput[] = [];
  private graphMetadata: Omit<GraphMetadata, 'stats' | 'schemaVersion' | 'generatedAt'>;

  constructor(name: string, rootPath: string) {
    this.graphMetadata = {
      name,
      rootPath,
      languages: [],
    };
  }

  /**
   * Sets repository information
   */
  withRepository(url: string, branch?: string, commit?: string): this {
    this.graphMetadata.repositoryUrl = url;
    if (branch !== undefined) {
      this.graphMetadata.branch = branch;
    }
    if (commit !== undefined) {
      this.graphMetadata.commit = commit;
    }
    return this;
  }

  /**
   * Adds custom properties to graph metadata
   */
  withProperties(properties: Record<string, unknown>): this {
    this.graphMetadata.properties = {
      ...this.graphMetadata.properties,
      ...properties,
    };
    return this;
  }

  /**
   * Adds a node to the graph
   */
  addNode(input: NodeInput): this {
    this.nodes.push(input);
    return this;
  }

  /**
   * Adds multiple nodes to the graph
   */
  addNodes(inputs: NodeInput[]): this {
    this.nodes.push(...inputs);
    return this;
  }

  /**
   * Adds an edge to the graph
   */
  addEdge(input: EdgeInput): this {
    this.edges.push(input);
    return this;
  }

  /**
   * Adds multiple edges to the graph
   */
  addEdges(inputs: EdgeInput[]): this {
    this.edges.push(...inputs);
    return this;
  }

  /**
   * Builds the final IVM graph
   */
  build(options?: BuildOptions): IVMGraph {
    return buildGraph(
      {
        nodes: this.nodes,
        edges: this.edges,
        metadata: this.graphMetadata,
      },
      options
    );
  }
}

/**
 * Creates a new IVM builder
 */
export function createBuilder(name: string, rootPath: string): IVMBuilder {
  return new IVMBuilder(name, rootPath);
}
