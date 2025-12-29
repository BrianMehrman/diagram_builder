/**
 * IVM Module Exports
 *
 * Re-exports all IVM types, builder utilities, and validation functions.
 */

// Types
export type {
  Position3D,
  Position2D,
  NodeType,
  LODLevel,
  NodeMetadata,
  IVMNode,
  NodeStyle,
  EdgeType,
  EdgeMetadata,
  IVMEdge,
  EdgeStyle,
  GraphMetadata,
  GraphStats,
  BoundingBox,
  IVMGraph,
  NodeInput,
  EdgeInput,
  GraphInput,
  GraphFilter,
  LODOptions,
} from './types.js';

// Constants
export { IVM_SCHEMA_VERSION, DEFAULT_LOD, LOD_DESCRIPTIONS } from './types.js';

// Builder utilities
export {
  generateEdgeId,
  generateId,
  assignLOD,
  assignEdgeLOD,
  createDefaultPosition,
  assignInitialPositions,
  assignHierarchicalPositions,
  calculateBounds,
  calculateStats,
  createNode,
  createNodes,
  createEdge,
  createEdges,
  buildGraph,
  addNode,
  addEdge,
  removeNode,
  removeEdge,
  updateNode,
  IVMBuilder,
  createBuilder,
} from './builder.js';

export type { BuildOptions } from './builder.js';

// Validation
export {
  isValidNodeType,
  isValidEdgeType,
  isValidLODLevel,
  isValidPosition,
  validatePosition,
  validateNodeMetadata,
  validateNode,
  validateEdge,
  validateGraphMetadata,
  validateGraph,
  assertValidGraph,
  assertValidNode,
  assertValidEdge,
} from './validator.js';

export type { ValidationError, ValidationResult } from './validator.js';
