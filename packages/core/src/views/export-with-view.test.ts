import { describe, it, expect } from 'vitest'
import { exportWithView } from './export-with-view'
import { SemanticTier } from '../ivm/semantic-tier'
import { buildGraph } from '../ivm/builder'
import type { ParseResult } from '../ivm/semantic-tier'
import type { IVMGraph } from '../ivm/types'
import type { Exporter, ExportResult, BaseExportOptions } from '../exporters/types'

// =============================================================================
// Mock Exporter
// =============================================================================

function createMockExporter(): Exporter<BaseExportOptions> {
  return {
    id: 'mock',
    name: 'Mock Exporter',
    extension: '.mock',
    mimeType: 'text/mock',

    export(graph: IVMGraph, options?: BaseExportOptions): ExportResult {
      const content = JSON.stringify({
        nodeCount: graph.nodes.length,
        edgeCount: graph.edges.length,
        title: options?.title,
      })
      return {
        content,
        mimeType: 'text/mock',
        extension: '.mock',
        stats: {
          nodeCount: graph.nodes.length,
          edgeCount: graph.edges.length,
          duration: 0,
          size: content.length,
        },
      }
    },

    validateOptions(): string[] {
      return []
    },
  }
}

// =============================================================================
// Mock ParseResult
// =============================================================================

function createMockParseResult(): ParseResult {
  const fullGraph = buildGraph({
    nodes: [
      { id: 'file:a.ts', type: 'file', metadata: { label: 'a.ts', path: 'a.ts' } },
      { id: 'file:b.ts', type: 'file', metadata: { label: 'b.ts', path: 'b.ts' } },
      { id: 'class:A', type: 'class', parentId: 'file:a.ts', metadata: { label: 'A', path: 'a.ts' } },
      { id: 'method:A.foo', type: 'method', parentId: 'class:A', metadata: { label: 'foo', path: 'a.ts' } },
    ],
    edges: [
      { source: 'file:a.ts', target: 'file:b.ts', type: 'imports' },
      { source: 'file:a.ts', target: 'class:A', type: 'contains' },
      { source: 'class:A', target: 'method:A.foo', type: 'contains' },
    ],
    metadata: { name: 'test', rootPath: '/test' },
  })

  const fileTierGraph = buildGraph({
    nodes: [
      { id: 'file:a.ts', type: 'file', metadata: { label: 'a.ts', path: 'a.ts' } },
      { id: 'file:b.ts', type: 'file', metadata: { label: 'b.ts', path: 'b.ts' } },
    ],
    edges: [
      { source: 'file:a.ts', target: 'file:b.ts', type: 'imports' },
    ],
    metadata: { name: 'test (tier 3)', rootPath: '/test' },
  })

  const symbolTierGraph = buildGraph({
    nodes: [
      { id: 'file:a.ts', type: 'file', metadata: { label: 'a.ts', path: 'a.ts' } },
      { id: 'file:b.ts', type: 'file', metadata: { label: 'b.ts', path: 'b.ts' } },
      { id: 'class:A', type: 'class', parentId: 'file:a.ts', metadata: { label: 'A', path: 'a.ts' } },
    ],
    edges: [
      { source: 'file:a.ts', target: 'file:b.ts', type: 'imports' },
      { source: 'file:a.ts', target: 'class:A', type: 'contains' },
    ],
    metadata: { name: 'test (tier 4)', rootPath: '/test' },
  })

  const tiers = {} as Record<SemanticTier, IVMGraph>
  for (const t of [0, 1, 2, 3, 4, 5] as SemanticTier[]) {
    if (t === SemanticTier.File) {
      tiers[t] = fileTierGraph
    } else if (t === SemanticTier.Symbol) {
      tiers[t] = symbolTierGraph
    } else {
      tiers[t] = fullGraph
    }
  }

  return {
    graph: fullGraph,
    hierarchy: {
      root: {
        id: 'root',
        label: 'test',
        tier: SemanticTier.Repository,
        nodeIds: [],
        children: [],
      },
      tierCount: { 0: 0, 1: 0, 2: 0, 3: 2, 4: 1, 5: 1 } as Record<SemanticTier, number>,
      edgesByTier: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [] } as Record<SemanticTier, any[]>,
    },
    tiers,
  }
}

// =============================================================================
// Tests
// =============================================================================

describe('exportWithView', () => {
  it('exports using specified tier', () => {
    const parseResult = createMockParseResult()
    const exporter = createMockExporter()

    const result = exportWithView(parseResult, exporter, {
      tier: SemanticTier.File,
    })

    // File tier has 2 nodes (file:a.ts, file:b.ts)
    expect(result.stats.nodeCount).toBe(2)
    expect(result.stats.edgeCount).toBe(1)
  })

  it('defaults to full graph when no tier or viewConfig specified', () => {
    const parseResult = createMockParseResult()
    const exporter = createMockExporter()

    const result = exportWithView(parseResult, exporter)

    // Full graph has 4 nodes
    expect(result.stats.nodeCount).toBe(4)
    expect(result.stats.edgeCount).toBe(3)
  })

  it('passes export options through', () => {
    const parseResult = createMockParseResult()
    const exporter = createMockExporter()

    const result = exportWithView(parseResult, exporter, {
      tier: SemanticTier.File,
      exportOptions: { title: 'My Diagram' },
    })

    const parsed = JSON.parse(result.content as string)
    expect(parsed.title).toBe('My Diagram')
  })

  it('uses viewConfig when provided (takes precedence over tier)', () => {
    const parseResult = createMockParseResult()
    const exporter = createMockExporter()

    const result = exportWithView(parseResult, exporter, {
      tier: SemanticTier.Detail, // should be ignored
      viewConfig: { baseTier: SemanticTier.File },
    })

    // viewConfig with baseTier File → 2 nodes
    expect(result.stats.nodeCount).toBe(2)
  })

  it('applies viewConfig constraints', () => {
    const parseResult = createMockParseResult()
    const exporter = createMockExporter()

    const result = exportWithView(parseResult, exporter, {
      viewConfig: {
        baseTier: SemanticTier.Detail,
        constraints: { maxNodes: 2 },
      },
    })

    expect(result.stats.nodeCount).toBeLessThanOrEqual(2)
  })

  it('returns correct mimeType and extension from exporter', () => {
    const parseResult = createMockParseResult()
    const exporter = createMockExporter()

    const result = exportWithView(parseResult, exporter, {
      tier: SemanticTier.File,
    })

    expect(result.mimeType).toBe('text/mock')
    expect(result.extension).toBe('.mock')
  })
})
