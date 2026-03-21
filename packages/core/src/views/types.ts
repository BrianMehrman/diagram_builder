import type { IVMGraph, EdgeType, NodeType } from '../ivm/types.js'
import type { SemanticTier } from '../ivm/semantic-tier.js'

export interface ViewResolver {
  getTier(tier: SemanticTier): IVMGraph
  getView(config: ViewConfig): ViewResult
}

export interface ViewConfig {
  baseTier: SemanticTier
  focalNodeId?: string
  falloffHops?: number
  expand?: string[]
  collapse?: string[]
  constraints?: ViewConstraints
}

export interface ViewConstraints {
  maxNodes?: number
  maxEdges?: number
  allowedEdgeTypes?: EdgeType[]
  allowedNodeTypes?: NodeType[]
}

export interface ViewResult {
  graph: IVMGraph
  pruningReport?: PruningReport
}

export interface PruningReport {
  edgesDropped: number
  edgesDroppedByType: Partial<Record<EdgeType, number>>
  groupsCollapsed: string[]
  constraintsSatisfied: boolean
}
