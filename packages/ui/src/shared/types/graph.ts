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
  type: 'file' | 'class' | 'function' | 'method' | 'variable';
  label: string;
  metadata: Record<string, unknown>;
  position?: Position3D;
  lod: number; // Changed from lodLevel to match IVM format
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
