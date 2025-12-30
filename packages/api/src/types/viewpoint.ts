/**
 * Viewpoint Type Definitions
 *
 * A viewpoint captures a specific view of the graph including:
 * - Camera position and orientation
 * - Active filters
 * - Annotations
 * - Metadata
 */

/**
 * Camera position and orientation in 3D space
 */
export interface CameraState {
  /** Camera position */
  position: {
    x: number;
    y: number;
    z: number;
  };
  /** Camera target (look-at point) */
  target: {
    x: number;
    y: number;
    z: number;
  };
  /** Field of view in degrees */
  fov?: number;
  /** Zoom level */
  zoom?: number;
}

/**
 * Graph filters to control visibility
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
 * Annotation on the graph
 */
export interface Annotation {
  /** Unique annotation ID */
  id: string;
  /** Annotation type */
  type: 'note' | 'highlight' | 'arrow' | 'label';
  /** Target node or position */
  target: {
    /** Target node ID (if annotating a node) */
    nodeId?: string;
    /** 3D position (if free-floating) */
    position?: {
      x: number;
      y: number;
      z: number;
    };
  };
  /** Annotation content */
  content: string;
  /** Color in hex format */
  color?: string;
  /** Created timestamp */
  createdAt: string;
  /** Creator user ID */
  createdBy?: string;
}

/**
 * Complete viewpoint definition
 */
export interface Viewpoint {
  /** Unique viewpoint ID */
  id: string;
  /** Repository ID this viewpoint belongs to */
  repositoryId: string;
  /** Viewpoint name */
  name: string;
  /** Optional description */
  description?: string;
  /** Camera state */
  camera: CameraState;
  /** Active filters */
  filters?: GraphFilters;
  /** Annotations */
  annotations?: Annotation[];
  /** Creator user ID */
  createdBy: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Share token for URL-based sharing */
  shareToken?: string;
  /** Whether this viewpoint is publicly shared */
  isPublic?: boolean;
}

/**
 * Input for creating a new viewpoint
 */
export interface CreateViewpointInput {
  /** Repository ID */
  repositoryId: string;
  /** Viewpoint name */
  name: string;
  /** Optional description */
  description?: string;
  /** Camera state */
  camera: CameraState;
  /** Active filters */
  filters?: GraphFilters;
  /** Annotations */
  annotations?: Annotation[];
}

/**
 * Input for updating an existing viewpoint
 */
export interface UpdateViewpointInput {
  /** Viewpoint name */
  name?: string;
  /** Optional description */
  description?: string;
  /** Camera state */
  camera?: CameraState;
  /** Active filters */
  filters?: GraphFilters;
  /** Annotations */
  annotations?: Annotation[];
  /** Whether this viewpoint is publicly shared */
  isPublic?: boolean;
}
