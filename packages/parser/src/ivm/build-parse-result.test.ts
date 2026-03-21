import { describe, it, expect, beforeAll } from 'vitest'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import { SemanticTier } from '../../../core/src/ivm/semantic-tier.js'
import type { IVMGraph } from '../../../core/src/ivm/types.js'
import { loadRepository } from '../repository/repository-loader'
import { buildDependencyGraph } from '../graph/graph-builder'
import { convertToIVM } from './ivm-converter'
import { buildParseResult } from './build-parse-result'

// Fixture path — navigate up from packages/parser/src/ivm/ to repo root
const MEDIUM_TS_REPO = resolve(__dirname, '../../../../tests/fixtures/repositories/medium-ts-repo')

describe('buildParseResult', () => {
  let ivmGraph: IVMGraph

  // Run the full pipeline once for all tests
  beforeAll(async () => {
    const repoContext = await loadRepository(MEDIUM_TS_REPO, {
      extensions: ['.ts'],
    })

    const fileInputs = repoContext.files.map((filePath) => ({
      filePath,
      content: readFileSync(filePath, 'utf-8'),
    }))

    const depGraph = buildDependencyGraph(fileInputs)

    ivmGraph = convertToIVM(depGraph, repoContext, {
      name: 'medium-ts-repo',
    })
  })

  it('produces graph, hierarchy, and tiers', () => {
    const result = buildParseResult(ivmGraph)

    // graph is the same object passed in
    expect(result.graph).toBe(ivmGraph)

    // hierarchy is defined with root at Repository tier
    expect(result.hierarchy).toBeDefined()
    expect(result.hierarchy.root).toBeDefined()
    expect(result.hierarchy.root.tier).toBe(SemanticTier.Repository)

    // tiers has all 6 entries (Repository through Detail)
    const tierKeys = Object.keys(result.tiers).map(Number)
    expect(tierKeys).toHaveLength(6)
    for (const tier of [
      SemanticTier.Repository,
      SemanticTier.Package,
      SemanticTier.Module,
      SemanticTier.File,
      SemanticTier.Symbol,
      SemanticTier.Detail,
    ]) {
      expect(result.tiers[tier]).toBeDefined()
    }
  })

  it('tier Detail equals the full graph', () => {
    const result = buildParseResult(ivmGraph)

    expect(result.tiers[SemanticTier.Detail].nodes.length).toBe(ivmGraph.nodes.length)
    expect(result.tiers[SemanticTier.Detail].edges.length).toBe(ivmGraph.edges.length)
  })

  it('each tier has fewer or equal nodes than Detail', () => {
    const result = buildParseResult(ivmGraph)

    const detailCount = result.tiers[SemanticTier.Detail].nodes.length

    for (const tier of [
      SemanticTier.Repository,
      SemanticTier.Package,
      SemanticTier.Module,
      SemanticTier.File,
      SemanticTier.Symbol,
    ]) {
      expect(result.tiers[tier].nodes.length).toBeLessThanOrEqual(detailCount)
    }
  })

  it('higher tiers have strictly fewer nodes than Detail', () => {
    const result = buildParseResult(ivmGraph)

    const detailNodes = result.tiers[SemanticTier.Detail].nodes.length
    const fileNodes = result.tiers[SemanticTier.File].nodes.length

    expect(fileNodes).toBeLessThan(detailNodes)
  })
})
