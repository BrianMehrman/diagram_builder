import { describe, it, expect } from 'vitest'
import { createViewResolver } from './view-resolver'
import { SemanticTier } from '../ivm/semantic-tier'
import { buildGraph } from '../ivm/builder'
import type { ParseResult, AggregatedEdge } from '../ivm/semantic-tier'
import type { IVMGraph } from '../ivm/types'

function createMockParseResult(): ParseResult {
  const fullGraph = buildGraph({
    nodes: [
      { id: 'file:a.ts', type: 'file', metadata: { label: 'a.ts', path: 'a.ts' } },
      { id: 'file:b.ts', type: 'file', metadata: { label: 'b.ts', path: 'b.ts' } },
      { id: 'class:A', type: 'class', parentId: 'file:a.ts', metadata: { label: 'A', path: 'a.ts' } },
    ],
    edges: [
      { source: 'file:a.ts', target: 'file:b.ts', type: 'imports' },
      { source: 'file:a.ts', target: 'class:A', type: 'contains' },
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

  const tiers = {} as Record<SemanticTier, IVMGraph>
  for (const t of [0, 1, 2, 3, 4, 5] as SemanticTier[]) {
    tiers[t] = t === SemanticTier.File ? fileTierGraph : fullGraph
  }

  return {
    graph: fullGraph,
    hierarchy: {
      root: {
        id: 'root',
        label: 'test',
        tier: SemanticTier.Repository,
        nodeIds: [],
        children: [
          {
            id: 'group:package',
            label: 'package',
            tier: SemanticTier.Package,
            nodeIds: [],
            children: [
              {
                id: 'group:module',
                label: 'module',
                tier: SemanticTier.Module,
                nodeIds: [],
                children: [
                  {
                    id: 'group:file:a.ts',
                    label: 'a.ts',
                    tier: SemanticTier.File,
                    nodeIds: ['file:a.ts'],
                    children: [
                      {
                        id: 'group:class:A',
                        label: 'A',
                        tier: SemanticTier.Symbol,
                        nodeIds: ['class:A'],
                        children: [],
                      },
                    ],
                  },
                  {
                    id: 'group:file:b.ts',
                    label: 'b.ts',
                    tier: SemanticTier.File,
                    nodeIds: ['file:b.ts'],
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
      tierCount: { 0: 0, 1: 0, 2: 0, 3: 2, 4: 1, 5: 0 } as Record<SemanticTier, number>,
      edgesByTier: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [] } as Record<SemanticTier, AggregatedEdge[]>,
    },
    tiers,
  }
}

describe('createViewResolver', () => {
  it('getTier returns the pre-computed tier graph', () => {
    const result = createMockParseResult()
    const resolver = createViewResolver(result)
    const fileView = resolver.getTier(SemanticTier.File)
    expect(fileView.nodes.length).toBe(2)
  })

  it('getView with baseTier returns same as getTier when no constraints', () => {
    const result = createMockParseResult()
    const resolver = createViewResolver(result)
    const view = resolver.getView({ baseTier: SemanticTier.File })
    expect(view.graph.nodes.length).toBe(2)
    expect(view.pruningReport).toBeUndefined()
  })

  it('getView with maxEdges constraint prunes and reports', () => {
    const result = createMockParseResult()
    const resolver = createViewResolver(result)
    const view = resolver.getView({
      baseTier: SemanticTier.Detail,
      constraints: { maxEdges: 1 },
    })
    expect(view.graph.edges.length).toBeLessThanOrEqual(1)
    expect(view.pruningReport).toBeDefined()
    expect(view.pruningReport!.constraintsSatisfied).toBe(true)
  })

  it('getView with allowedEdgeTypes filters edges', () => {
    const result = createMockParseResult()
    const resolver = createViewResolver(result)
    const view = resolver.getView({
      baseTier: SemanticTier.Detail,
      constraints: { allowedEdgeTypes: ['imports'] },
    })
    for (const edge of view.graph.edges) {
      expect(edge.type).toBe('imports')
    }
  })

  it('getView with allowedNodeTypes filters nodes and their edges', () => {
    const result = createMockParseResult()
    const resolver = createViewResolver(result)
    const view = resolver.getView({
      baseTier: SemanticTier.Detail,
      constraints: { allowedNodeTypes: ['file'] },
    })
    for (const node of view.graph.nodes) {
      expect(node.type).toBe('file')
    }
    // The 'contains' edge (file -> class) should be gone since class nodes are filtered
    for (const edge of view.graph.edges) {
      expect(edge.type).not.toBe('contains')
    }
  })

  it('getView with maxNodes constraint prunes least-connected nodes', () => {
    const result = createMockParseResult()
    const resolver = createViewResolver(result)
    const view = resolver.getView({
      baseTier: SemanticTier.Detail,
      constraints: { maxNodes: 2 },
    })
    expect(view.graph.nodes.length).toBeLessThanOrEqual(2)
    expect(view.pruningReport).toBeDefined()
    expect(view.pruningReport!.constraintsSatisfied).toBe(true)
  })

  it('caches repeated getView calls', () => {
    const result = createMockParseResult()
    const resolver = createViewResolver(result)
    const config = { baseTier: SemanticTier.File }
    const view1 = resolver.getView(config)
    const view2 = resolver.getView(config)
    expect(view1).toBe(view2) // same reference
  })

  it('does not prune when constraints are already satisfied', () => {
    const result = createMockParseResult()
    const resolver = createViewResolver(result)
    const view = resolver.getView({
      baseTier: SemanticTier.File,
      constraints: { maxEdges: 100, maxNodes: 100 },
    })
    expect(view.pruningReport).toBeUndefined()
  })

  it('getView with focalNodeId applies focal pruning', () => {
    const result = createMockParseResult()
    const resolver = createViewResolver(result)

    const view = resolver.getView({
      baseTier: SemanticTier.Detail,
      focalNodeId: 'file:a.ts',
      falloffHops: 1,
      constraints: { maxEdges: 10 },
    })

    // Should keep focal node and 1-hop neighbors
    const nodeIds = view.graph.nodes.map((n) => n.id)
    expect(nodeIds).toContain('file:a.ts')
    expect(view.pruningReport).toBeDefined()
  })

  it('pruningReport tracks dropped edges by type', () => {
    const result = createMockParseResult()
    const resolver = createViewResolver(result)
    const view = resolver.getView({
      baseTier: SemanticTier.Detail,
      constraints: { maxEdges: 1 },
    })
    expect(view.pruningReport).toBeDefined()
    expect(view.pruningReport!.edgesDropped).toBe(1)
    const droppedTypes = Object.values(view.pruningReport!.edgesDroppedByType)
    const totalDropped = droppedTypes.reduce((sum, n) => sum + (n ?? 0), 0)
    expect(totalDropped).toBe(1)
  })

  it('expand shows children of expanded group', () => {
    const result = createMockParseResult()
    const resolver = createViewResolver(result)

    // File tier has only file:a.ts and file:b.ts (no class:A)
    const baseView = resolver.getView({ baseTier: SemanticTier.File })
    const baseNodeIds = baseView.graph.nodes.map((n) => n.id)
    expect(baseNodeIds).not.toContain('class:A')

    // Expanding group:file:a.ts should add class:A (its Symbol child)
    const expandedView = resolver.getView({
      baseTier: SemanticTier.File,
      expand: ['group:file:a.ts'],
    })
    const expandedNodeIds = expandedView.graph.nodes.map((n) => n.id)
    expect(expandedNodeIds).toContain('file:a.ts')
    expect(expandedNodeIds).toContain('file:b.ts')
    expect(expandedNodeIds).toContain('class:A')
    // The contains edge between file:a.ts and class:A should also appear
    const containsEdge = expandedView.graph.edges.find(
      (e) => e.source === 'file:a.ts' && e.target === 'class:A' && e.type === 'contains'
    )
    expect(containsEdge).toBeDefined()
  })

  it('collapse hides children of collapsed group', () => {
    const result = createMockParseResult()
    const resolver = createViewResolver(result)

    // Detail/Symbol tier has all 3 nodes including class:A
    const baseView = resolver.getView({ baseTier: SemanticTier.Detail })
    const baseNodeIds = baseView.graph.nodes.map((n) => n.id)
    expect(baseNodeIds).toContain('class:A')

    // Collapsing group:file:a.ts should remove class:A (child node)
    // but keep file:a.ts (representative node in group's nodeIds)
    const collapsedView = resolver.getView({
      baseTier: SemanticTier.Detail,
      collapse: ['group:file:a.ts'],
    })
    const collapsedNodeIds = collapsedView.graph.nodes.map((n) => n.id)
    expect(collapsedNodeIds).toContain('file:a.ts')
    expect(collapsedNodeIds).toContain('file:b.ts')
    expect(collapsedNodeIds).not.toContain('class:A')
    // The contains edge should be gone since class:A is removed
    const containsEdge = collapsedView.graph.edges.find(
      (e) => e.type === 'contains'
    )
    expect(containsEdge).toBeUndefined()
  })
})
