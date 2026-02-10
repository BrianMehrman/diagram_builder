/**
 * Graph Types
 *
 * Types for graph nodes, edges, and visualization data
 */

/**
 * 3D position
 */
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

/**
 * Graph node
 */
export interface GraphNode {
  id: string;
  type: 'file' | 'class' | 'function' | 'method' | 'variable' | 'interface' | 'enum' | 'abstract_class';
  label: string;
  metadata: Record<string, unknown>;
  position?: Position3D;
  lod: number; // Changed from lodLevel to match IVM format

  // City-to-cell layout fields (Epic 8)
  depth?: number; // Abstraction depth from entry point (0 = entry, higher = deeper)
  isExternal?: boolean; // True for external library imports
  parentId?: string; // ID of the containing node (file → class → method)

  // Shape metadata fields (Epic 9-B)
  /** Number of methods in this class/interface */
  methodCount?: number;
  /** True for abstract classes */
  isAbstract?: boolean;
  /** True if this node contains nested type definitions */
  hasNestedTypes?: boolean;

  // Sign metadata fields (Epic 9-C)
  /** Access visibility level for sign type selection */
  visibility?: 'public' | 'protected' | 'private' | 'static';
  /** True if this symbol is deprecated — renders construction sign */
  isDeprecated?: boolean;
  /** True if this symbol is exported — renders marquee sign */
  isExported?: boolean;
}

/**
 * Graph edge
 */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'contains' | 'depends_on' | 'calls' | 'inherits' | 'imports';
  metadata: Record<string, unknown>;
}

/**
 * Graph data
 */
export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    repositoryId: string;
    name: string;
    totalNodes: number;
    totalEdges: number;
  };
}

/**
 * Viewpoint data
 */
export interface Viewpoint {
  id: string;
  name: string;
  description?: string;
  cameraPosition: Position3D;
  cameraTarget: Position3D;
  filters?: {
    lod?: number; // Changed from lodLevel to match IVM format
    nodeTypes?: string[];
    edgeTypes?: string[];
  };
  annotations?: Array<{
    nodeId: string;
    text: string;
  }>;
  createdAt: string;
  updatedAt: string;
  shareToken?: string;
}
