/**
 * Semantic Tier Definitions for Tiered Views
 *
 * SemanticTier replaces raw LODLevel numbers with meaningful semantic labels.
 * GroupHierarchy and related types support aggregated views at each tier.
 */

import type { EdgeType, NodeType, IVMGraph } from './types.js'

// =============================================================================
// Semantic Tier Enum
// =============================================================================

/**
 * Semantic zoom tiers, from coarsest (Repository) to finest (Detail).
 * Numeric values match LODLevel for backward compatibility.
 */
export enum SemanticTier {
  Repository = 0,
  Package = 1,
  Module = 2,
  File = 3,
  Symbol = 4,
  Detail = 5,
}

/**
 * Human-readable descriptions for each semantic tier
 */
export const SEMANTIC_TIER_DESCRIPTIONS: Record<SemanticTier, string> = {
  [SemanticTier.Repository]: 'Repository level - shows only repositories',
  [SemanticTier.Package]: 'Package level - shows packages and namespaces',
  [SemanticTier.Module]: 'Module level - shows directories and modules',
  [SemanticTier.File]: 'File level - shows individual files',
  [SemanticTier.Symbol]: 'Symbol level - shows classes, interfaces, functions, and enums',
  [SemanticTier.Detail]: 'Detail level - shows methods, variables, and types',
}

// =============================================================================
// Node Type to Tier Mapping
// =============================================================================

/**
 * Maps each NodeType to its SemanticTier.
 * Matches the existing NODE_TYPE_LOD mapping in builder.ts.
 */
export const NODE_TYPE_TO_TIER: Record<NodeType, SemanticTier> = {
  repository: SemanticTier.Repository,
  package: SemanticTier.Package,
  namespace: SemanticTier.Package,
  directory: SemanticTier.Module,
  module: SemanticTier.Module,
  file: SemanticTier.File,
  class: SemanticTier.Symbol,
  interface: SemanticTier.Symbol,
  enum: SemanticTier.Symbol,
  function: SemanticTier.Symbol,
  type: SemanticTier.Detail,
  method: SemanticTier.Detail,
  variable: SemanticTier.Detail,
}

// =============================================================================
// Aggregatable Edge Types
// =============================================================================

/**
 * Edge types that can be meaningfully aggregated when collapsing nodes into groups.
 * Excludes structural edges (contains) and type-detail edges (type_of, returns, parameter_of).
 */
export const AGGREGATABLE_EDGE_TYPES: EdgeType[] = [
  'imports',
  'calls',
  'extends',
  'implements',
  'uses',
  'depends_on',
  'exports',
]

// =============================================================================
// Group Hierarchy Types
// =============================================================================

/**
 * A group node in the hierarchy tree. Represents a collapsed set of IVM nodes
 * at a given semantic tier.
 */
export interface GroupNode {
  /** Unique identifier for this group */
  id: string

  /** Display label */
  label: string

  /** The semantic tier this group lives at */
  tier: SemanticTier

  /** IDs of the IVM nodes contained in this group */
  nodeIds: string[]

  /** Child groups (one tier finer) */
  children: GroupNode[]
}

/**
 * An aggregated edge between two groups, summarizing the underlying
 * node-level edges by type.
 */
export interface AggregatedEdge {
  /** Source group ID */
  sourceGroupId: string

  /** Target group ID */
  targetGroupId: string

  /** Count of underlying edges broken down by EdgeType */
  breakdown: Partial<Record<EdgeType, number>>

  /** Total weight (sum of all edge counts) */
  totalWeight: number
}

/**
 * The full group hierarchy produced by the parser.
 * Provides pre-computed structure for tiered views.
 */
export interface GroupHierarchy {
  /** Root of the group tree */
  root: GroupNode

  /** Number of groups at each tier */
  tierCount: Record<SemanticTier, number>

  /** Aggregated edges between groups at each tier */
  edgesByTier: Record<SemanticTier, AggregatedEdge[]>
}

// =============================================================================
// Parse Result
// =============================================================================

/**
 * Extended parse result that includes both the IVM graph and
 * the group hierarchy with pre-computed tier views.
 */
export interface ParseResult {
  /** The full IVM graph */
  graph: IVMGraph

  /** Group hierarchy for tiered navigation */
  hierarchy: GroupHierarchy

  /** Pre-computed IVM subgraphs for each tier */
  tiers: Record<SemanticTier, IVMGraph>
}
