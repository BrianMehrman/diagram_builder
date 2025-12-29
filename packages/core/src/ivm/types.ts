/**
 * Internal Visualization Model (IVM) Type Definitions
 *
 * The IVM is the single source of truth for all renderers (Three.js, PlantUML, Mermaid, GLTF).
 * It provides a renderer-agnostic representation of the code graph that can be consumed
 * by both CLI and web UI.
 */

// =============================================================================
// Position Types
// =============================================================================

/**
 * 3D position in visualization space
 */
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

/**
 * 2D position for 2D diagram exports
 */
export interface Position2D {
  x: number;
  y: number;
}

// =============================================================================
// Node Types
// =============================================================================

/**
 * Types of nodes in the visualization graph
 */
export type NodeType =
  | 'file'
  | 'directory'
  | 'module'
  | 'class'
  | 'interface'
  | 'function'
  | 'method'
  | 'variable'
  | 'type'
  | 'enum'
  | 'namespace'
  | 'package'
  | 'repository';

/**
 * Level of Detail for progressive rendering
 */
export type LODLevel = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Metadata associated with a node
 */
export interface NodeMetadata {
  /** Display label for the node */
  label: string;

  /** Full path (file path or qualified name) */
  path: string;

  /** Programming language (e.g., 'typescript', 'javascript') */
  language?: string;

  /** Lines of code */
  loc?: number;

  /** Cyclomatic complexity */
  complexity?: number;

  /** Number of dependencies (outgoing edges) */
  dependencyCount?: number;

  /** Number of dependents (incoming edges) */
  dependentCount?: number;

  /** Source code location */
  location?: {
    startLine: number;
    endLine: number;
    startColumn?: number;
    endColumn?: number;
  };

  /** Custom properties from parsing */
  properties?: Record<string, unknown>;
}

/**
 * A node in the IVM graph
 */
export interface IVMNode {
  /** Unique identifier for the node */
  id: string;

  /** Type of code element this node represents */
  type: NodeType;

  /** 3D position in visualization space */
  position: Position3D;

  /** Level of detail - determines visibility at different zoom levels */
  lod: LODLevel;

  /** Parent node ID (for hierarchical structure) */
  parentId?: string;

  /** Node metadata */
  metadata: NodeMetadata;

  /** Visual styling overrides */
  style?: NodeStyle;
}

/**
 * Visual styling for a node
 */
export interface NodeStyle {
  /** Color in hex format (e.g., '#ff0000') */
  color?: string;

  /** Size multiplier (1.0 = default) */
  size?: number;

  /** Shape type for 2D exports */
  shape?: 'circle' | 'rectangle' | 'diamond' | 'hexagon' | 'ellipse';

  /** Opacity (0.0 - 1.0) */
  opacity?: number;

  /** Whether node is highlighted */
  highlighted?: boolean;

  /** Whether node is selected */
  selected?: boolean;
}

// =============================================================================
// Edge Types
// =============================================================================

/**
 * Types of relationships between nodes
 */
export type EdgeType =
  | 'imports'
  | 'exports'
  | 'extends'
  | 'implements'
  | 'calls'
  | 'uses'
  | 'contains'
  | 'depends_on'
  | 'type_of'
  | 'returns'
  | 'parameter_of';

/**
 * Metadata associated with an edge
 */
export interface EdgeMetadata {
  /** Display label for the edge */
  label?: string;

  /** Weight/strength of the relationship (for layout algorithms) */
  weight?: number;

  /** Whether this is a circular/bidirectional dependency */
  circular?: boolean;

  /** Import path or reference string */
  reference?: string;

  /** Custom properties */
  properties?: Record<string, unknown>;
}

/**
 * An edge in the IVM graph
 */
export interface IVMEdge {
  /** Unique identifier for the edge */
  id: string;

  /** Source node ID */
  source: string;

  /** Target node ID */
  target: string;

  /** Type of relationship */
  type: EdgeType;

  /** Level of detail - determines visibility at different zoom levels */
  lod: LODLevel;

  /** Edge metadata */
  metadata: EdgeMetadata;

  /** Visual styling overrides */
  style?: EdgeStyle;
}

/**
 * Visual styling for an edge
 */
export interface EdgeStyle {
  /** Color in hex format */
  color?: string;

  /** Line width */
  width?: number;

  /** Line style */
  lineStyle?: 'solid' | 'dashed' | 'dotted';

  /** Whether to show arrow */
  arrow?: boolean;

  /** Arrow position (0.0 - 1.0) */
  arrowPosition?: number;

  /** Opacity (0.0 - 1.0) */
  opacity?: number;

  /** Whether edge is highlighted */
  highlighted?: boolean;
}

// =============================================================================
// Graph Types
// =============================================================================

/**
 * Metadata for the entire graph
 */
export interface GraphMetadata {
  /** Name of the repository or project */
  name: string;

  /** Version of the IVM schema */
  schemaVersion: string;

  /** When the graph was generated */
  generatedAt: string;

  /** Root directory path */
  rootPath: string;

  /** Repository URL if available */
  repositoryUrl?: string;

  /** Branch name if available */
  branch?: string;

  /** Commit hash if available */
  commit?: string;

  /** Total statistics */
  stats: GraphStats;

  /** Languages detected in the codebase */
  languages: string[];

  /** Custom properties */
  properties?: Record<string, unknown>;
}

/**
 * Statistics about the graph
 */
export interface GraphStats {
  /** Total number of nodes */
  totalNodes: number;

  /** Total number of edges */
  totalEdges: number;

  /** Nodes by type */
  nodesByType: Record<NodeType, number>;

  /** Edges by type */
  edgesByType: Record<EdgeType, number>;

  /** Total lines of code */
  totalLoc?: number;

  /** Average complexity */
  avgComplexity?: number;
}

/**
 * Bounding box for the graph
 */
export interface BoundingBox {
  min: Position3D;
  max: Position3D;
}

/**
 * The complete Internal Visualization Model
 */
export interface IVMGraph {
  /** All nodes in the graph */
  nodes: IVMNode[];

  /** All edges in the graph */
  edges: IVMEdge[];

  /** Graph-level metadata */
  metadata: GraphMetadata;

  /** Computed bounding box of all node positions */
  bounds: BoundingBox;
}

// =============================================================================
// Builder Input Types
// =============================================================================

/**
 * Input for creating a new node (position and LOD will be calculated)
 */
export interface NodeInput {
  id: string;
  type: NodeType;
  parentId?: string;
  metadata: NodeMetadata;
  style?: NodeStyle;
}

/**
 * Input for creating a new edge
 */
export interface EdgeInput {
  id?: string;
  source: string;
  target: string;
  type: EdgeType;
  metadata?: EdgeMetadata;
  style?: EdgeStyle;
}

/**
 * Input for building a complete graph
 */
export interface GraphInput {
  nodes: NodeInput[];
  edges: EdgeInput[];
  metadata: Omit<GraphMetadata, 'stats' | 'schemaVersion' | 'generatedAt'>;
}

// =============================================================================
// Query/Filter Types
// =============================================================================

/**
 * Filter options for querying the graph
 */
export interface GraphFilter {
  /** Filter by node types */
  nodeTypes?: NodeType[];

  /** Filter by edge types */
  edgeTypes?: EdgeType[];

  /** Maximum LOD level to include */
  maxLod?: LODLevel;

  /** Filter by parent node ID */
  parentId?: string;

  /** Filter by path pattern (glob or regex) */
  pathPattern?: string;

  /** Filter by language */
  languages?: string[];

  /** Include only nodes within bounding box */
  bounds?: BoundingBox;
}

/**
 * Options for LOD-based filtering
 */
export interface LODOptions {
  /** Current LOD level to render */
  level: LODLevel;

  /** Whether to include all ancestors of visible nodes */
  includeAncestors?: boolean;

  /** Whether to include edges between visible nodes only */
  filterEdges?: boolean;
}

// =============================================================================
// Constants
// =============================================================================

/** Current IVM schema version */
export const IVM_SCHEMA_VERSION = '1.0.0';

/** Default LOD level for new nodes */
export const DEFAULT_LOD: LODLevel = 3;

/** LOD level descriptions */
export const LOD_DESCRIPTIONS: Record<LODLevel, string> = {
  0: 'Repository level - shows only repositories',
  1: 'Package level - shows packages/modules',
  2: 'Directory level - shows directories',
  3: 'File level - shows files',
  4: 'Class/Function level - shows major code elements',
  5: 'Full detail - shows all code elements',
};
