/**
 * Layout Type Definitions
 *
 * Types for layout algorithms, configuration, and results.
 */

import type { Position3D, IVMNode, IVMEdge, IVMGraph, BoundingBox, LODLevel } from '../ivm/types.js';

// =============================================================================
// Layout Configuration Types
// =============================================================================

/**
 * Configuration for force-directed layout algorithm
 */
export interface ForceDirectedConfig {
  /** Repulsion strength between nodes (default: 1000) */
  repulsionStrength: number;

  /** Attraction strength for connected nodes (default: 0.1) */
  attractionStrength: number;

  /** Optimal distance between connected nodes (default: 100) */
  linkDistance: number;

  /** Damping factor to slow down movement (0-1, default: 0.9) */
  damping: number;

  /** Minimum velocity threshold for stabilization (default: 0.1) */
  minVelocity: number;

  /** Maximum iterations before stopping (default: 500) */
  maxIterations: number;

  /** Time step for physics simulation (default: 0.1) */
  timeStep: number;

  /** Center gravity strength - pulls nodes toward center (default: 0.01) */
  centerGravity: number;

  /** Whether to enable 3D layout (default: true) */
  enable3D: boolean;

  /** Barnes-Hut approximation theta (0 = exact, higher = faster but less accurate) */
  theta: number;
}

/**
 * Configuration for hierarchical layout algorithm
 */
export interface HierarchicalConfig {
  /** Direction of hierarchy */
  direction: 'TB' | 'BT' | 'LR' | 'RL';

  /** Spacing between levels */
  levelSpacing: number;

  /** Spacing between nodes on same level */
  nodeSpacing: number;

  /** Whether to align nodes to grid */
  alignToGrid: boolean;

  /** Whether to minimize edge crossings */
  minimizeCrossings: boolean;
}

/**
 * Union of all layout configurations
 */
export type LayoutConfig = ForceDirectedConfig | HierarchicalConfig;

// =============================================================================
// Layout State Types
// =============================================================================

/**
 * Velocity vector for physics simulation
 */
export interface Velocity3D {
  vx: number;
  vy: number;
  vz: number;
}

/**
 * Force vector applied to a node
 */
export interface Force3D {
  fx: number;
  fy: number;
  fz: number;
}

/**
 * Extended node with physics properties for layout simulation
 */
export interface LayoutNode {
  /** Node ID */
  id: string;

  /** Current position */
  position: Position3D;

  /** Current velocity */
  velocity: Velocity3D;

  /** Accumulated force */
  force: Force3D;

  /** Mass (affects force response, default: 1) */
  mass: number;

  /** Whether this node is fixed/pinned */
  fixed: boolean;

  /** Original IVM node reference */
  node: IVMNode;
}

/**
 * Edge for layout calculations
 */
export interface LayoutEdge {
  /** Source node ID */
  source: string;

  /** Target node ID */
  target: string;

  /** Edge weight (affects attraction strength) */
  weight: number;

  /** Original IVM edge reference */
  edge: IVMEdge;
}

/**
 * Current state of the layout simulation
 */
export interface LayoutState {
  /** All nodes in the simulation */
  nodes: Map<string, LayoutNode>;

  /** All edges in the simulation */
  edges: LayoutEdge[];

  /** Current iteration count */
  iteration: number;

  /** Total kinetic energy (sum of velocities) */
  energy: number;

  /** Whether the layout has stabilized */
  stabilized: boolean;

  /** Bounding box of current positions */
  bounds: BoundingBox;
}

// =============================================================================
// Layout Result Types
// =============================================================================

/**
 * Result of a layout operation
 */
export interface LayoutResult {
  /** Updated node positions */
  positions: Map<string, Position3D>;

  /** Number of iterations performed */
  iterations: number;

  /** Final energy level */
  energy: number;

  /** Whether layout converged */
  converged: boolean;

  /** Time taken in milliseconds */
  duration: number;

  /** Bounding box of all positions */
  bounds: BoundingBox;
}

/**
 * Progress callback for long-running layouts
 */
export type LayoutProgressCallback = (progress: LayoutProgress) => void;

/**
 * Layout progress information
 */
export interface LayoutProgress {
  /** Current iteration */
  iteration: number;

  /** Maximum iterations */
  maxIterations: number;

  /** Current energy level */
  energy: number;

  /** Percentage complete (0-100) */
  percent: number;
}

// =============================================================================
// LOD Types
// =============================================================================

/**
 * Configuration for LOD filtering
 */
export interface LODConfig {
  /** Current LOD level to display */
  currentLevel: LODLevel;

  /** Whether to include all ancestors of visible nodes */
  includeAncestors: boolean;

  /** Whether to collapse edges to ancestor nodes */
  collapseEdges: boolean;

  /** Minimum node count before enabling LOD (default: 100) */
  minNodesForLOD: number;
}

/**
 * Result of LOD filtering
 */
export interface LODFilterResult {
  /** Visible nodes at current LOD */
  visibleNodes: IVMNode[];

  /** Visible edges at current LOD */
  visibleEdges: IVMEdge[];

  /** Hidden node count */
  hiddenNodeCount: number;

  /** Hidden edge count */
  hiddenEdgeCount: number;

  /** Collapsed edge mappings (original -> collapsed) */
  collapsedEdges: Map<string, string>;
}

// =============================================================================
// Coordinate System Types
// =============================================================================

/**
 * Spherical coordinates
 */
export interface SphericalCoords {
  /** Radial distance */
  r: number;

  /** Polar angle (theta) - angle from z-axis */
  theta: number;

  /** Azimuthal angle (phi) - angle from x-axis in xy-plane */
  phi: number;
}

/**
 * Cylindrical coordinates
 */
export interface CylindricalCoords {
  /** Radial distance from z-axis */
  r: number;

  /** Azimuthal angle (theta) */
  theta: number;

  /** Height along z-axis */
  z: number;
}

// =============================================================================
// Default Configurations
// =============================================================================

/**
 * Default force-directed layout configuration
 */
export const DEFAULT_FORCE_DIRECTED_CONFIG: ForceDirectedConfig = {
  repulsionStrength: 1000,
  attractionStrength: 0.1,
  linkDistance: 100,
  damping: 0.9,
  minVelocity: 0.1,
  maxIterations: 500,
  timeStep: 0.1,
  centerGravity: 0.01,
  enable3D: true,
  theta: 0.8,
};

/**
 * Default hierarchical layout configuration
 */
export const DEFAULT_HIERARCHICAL_CONFIG: HierarchicalConfig = {
  direction: 'TB',
  levelSpacing: 100,
  nodeSpacing: 50,
  alignToGrid: true,
  minimizeCrossings: true,
};

/**
 * Default LOD configuration
 */
export const DEFAULT_LOD_CONFIG: LODConfig = {
  currentLevel: 3,
  includeAncestors: true,
  collapseEdges: true,
  minNodesForLOD: 100,
};
