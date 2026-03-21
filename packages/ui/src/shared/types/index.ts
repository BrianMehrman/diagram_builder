/**
 * Shared Types
 *
 * Central export for all shared types
 */

export * from './api'
export * from './workspace'
export * from './collaboration'

// Re-export IVM types from core for UI consumers
export type {
  IVMNode,
  IVMEdge,
  IVMGraph,
  Position3D,
  NodeType,
  NodeMetadata,
} from '@diagram-builder/core'
