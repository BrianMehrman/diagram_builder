/**
 * Build Parse Result
 *
 * Orchestrates the full parse pipeline by combining the IVM graph
 * with hierarchy building and tier materialization.
 */

import type { IVMGraph } from '../../../core/src/ivm/types.js'
import { SemanticTier } from '../../../core/src/ivm/semantic-tier.js'
import type { ParseResult } from '../../../core/src/ivm/semantic-tier.js'
import { buildGroupHierarchy } from './hierarchy-builder.js'
import { materializeTier } from './tier-materializer.js'

/**
 * Builds a ParseResult from an IVMGraph.
 *
 * Combines the graph with a GroupHierarchy and pre-computed tier views.
 * Uses materializeTier to produce a filtered IVMGraph for each semantic tier.
 *
 * @param graph - The IVM graph to build a parse result from
 * @returns A ParseResult with graph, hierarchy, and tier views
 */
export function buildParseResult(graph: IVMGraph): ParseResult {
  const hierarchy = buildGroupHierarchy(graph)

  const tiers = {} as Record<SemanticTier, IVMGraph>
  for (const tier of Object.values(SemanticTier).filter((v) => typeof v === 'number') as SemanticTier[]) {
    tiers[tier] = materializeTier(graph, hierarchy, tier)
  }

  return { graph, hierarchy, tiers }
}
