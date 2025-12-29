/**
 * Layout Module Exports
 *
 * Re-exports all layout types, algorithms, and utilities.
 */

// Types
export type {
  ForceDirectedConfig,
  HierarchicalConfig,
  LayoutConfig,
  Velocity3D,
  Force3D,
  LayoutNode,
  LayoutEdge,
  LayoutState,
  LayoutResult,
  LayoutProgressCallback,
  LayoutProgress,
  LODConfig,
  LODFilterResult,
  SphericalCoords,
  CylindricalCoords,
} from './types.js';

// Default configurations
export {
  DEFAULT_FORCE_DIRECTED_CONFIG,
  DEFAULT_HIERARCHICAL_CONFIG,
  DEFAULT_LOD_CONFIG,
} from './types.js';

// Force-directed layout
export {
  initializeLayoutState,
  layoutIteration,
  forceDirectedLayout,
  applyLayoutToGraph,
  layoutGraph,
} from './forceDirected.js';

// Coordinate utilities
export {
  // Vector operations
  zero,
  vec3,
  add,
  subtract,
  scale,
  divide,
  negate,
  dot,
  cross,
  magnitude,
  magnitudeSquared,
  normalize,
  distance,
  distanceSquared,
  lerp,
  clamp,
  isInsideBounds,
  // Coordinate conversions
  cartesianToSpherical,
  sphericalToCartesian,
  cartesianToCylindrical,
  cylindricalToCartesian,
  // Bounding box operations
  emptyBounds,
  boundsFromPoint,
  expandBounds,
  mergeBounds,
  boundsCenter,
  boundsSize,
  boundsDiagonal,
  boundsIntersect,
  padBounds,
  // Angle utilities
  degToRad,
  radToDeg,
  angleBetween,
  // Random generation
  randomInBounds,
  randomInSphere,
  randomOnSphere,
} from './coordinates.js';

// LOD system
export {
  isNodeVisibleAtLOD,
  isEdgeVisibleAtLOD,
  getRecommendedLOD,
  buildAncestorMap,
  getAncestors,
  findVisibleAncestor,
  filterNodesByLOD,
  filterEdgesByLOD,
  filterGraphByLOD,
  createLODGraph,
  getNewlyVisibleNodes,
  getNewlyHiddenNodes,
  getNodeCountsByLOD,
  getCumulativeNodeCounts,
} from './lod.js';
