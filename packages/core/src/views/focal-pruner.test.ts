import { describe, it, expect } from 'vitest'
import { applyFocalPruning } from './focal-pruner'
import { buildGraph } from '../ivm/builder'
import type { IVMGraph } from '../ivm/types'

function createStarGraph(): IVMGraph {
  return buildGraph({
    nodes: [
      { id: 'center', type: 'file', metadata: { label: 'center', path: 'center.ts' } },
      { id: 'hop1-a', type: 'file', metadata: { label: 'hop1-a', path: 'hop1-a.ts' } },
      { id: 'hop1-b', type: 'file', metadata: { label: 'hop1-b', path: 'hop1-b.ts' } },
      { id: 'hop2-a', type: 'file', metadata: { label: 'hop2-a', path: 'hop2-a.ts' } },
      { id: 'hop2-b', type: 'file', metadata: { label: 'hop2-b', path: 'hop2-b.ts' } },
      { id: 'hop3-a', type: 'file', metadata: { label: 'hop3-a', path: 'hop3-a.ts' } },
    ],
    edges: [
      { source: 'center', target: 'hop1-a', type: 'imports' },
      { source: 'center', target: 'hop1-b', type: 'imports' },
      { source: 'hop1-a', target: 'hop2-a', type: 'imports' },
      { source: 'hop1-b', target: 'hop2-b', type: 'imports' },
      { source: 'hop2-a', target: 'hop3-a', type: 'imports' },
    ],
    metadata: { name: 'test', rootPath: '/test' },
  })
}

describe('applyFocalPruning', () => {
  it('keeps focal node and all nodes within falloffHops', () => {
    const graph = createStarGraph()
    const result = applyFocalPruning(graph, 'center', 2, { maxEdges: 100 })

    const nodeIds = result.graph.nodes.map((n) => n.id)
    expect(nodeIds).toContain('center')
    expect(nodeIds).toContain('hop1-a')
    expect(nodeIds).toContain('hop1-b')
    expect(nodeIds).toContain('hop2-a')
    expect(nodeIds).toContain('hop2-b')
    // hop3-a is 3 hops away, should be excluded
    expect(nodeIds).not.toContain('hop3-a')
  })

  it('drops nodes beyond falloffHops', () => {
    const graph = createStarGraph()
    const result = applyFocalPruning(graph, 'center', 1, { maxEdges: 100 })

    const nodeIds = result.graph.nodes.map((n) => n.id)
    expect(nodeIds).toContain('center')
    expect(nodeIds).toContain('hop1-a')
    expect(nodeIds).toContain('hop1-b')
    expect(nodeIds).not.toContain('hop2-a')
    expect(nodeIds).not.toContain('hop2-b')
    expect(nodeIds).not.toContain('hop3-a')
  })

  it('progressively shrinks radius when over edge budget', () => {
    const graph = createStarGraph()
    const result = applyFocalPruning(graph, 'center', 3, { maxEdges: 2 })

    expect(result.graph.edges.length).toBeLessThanOrEqual(2)
    const nodeIds = result.graph.nodes.map((n) => n.id)
    expect(nodeIds).toContain('center')
  })

  it('returns pruning report with correct counts', () => {
    const graph = createStarGraph()
    const result = applyFocalPruning(graph, 'center', 1, { maxEdges: 100 })

    expect(result.report).toBeDefined()
    // 3 edges are dropped (hop1-a->hop2-a, hop1-b->hop2-b, hop2-a->hop3-a)
    expect(result.report.edgesDropped).toBe(3)
    expect(result.report.constraintsSatisfied).toBe(true)
  })

  it('reports constraintsSatisfied correctly', () => {
    const graph = createStarGraph()
    const result = applyFocalPruning(graph, 'center', 1, { maxEdges: 2 })

    expect(result.report.constraintsSatisfied).toBe(true)
    expect(result.graph.edges.length).toBeLessThanOrEqual(2)
  })

  it('keeps all nodes when falloffHops covers entire graph', () => {
    const graph = createStarGraph()
    const result = applyFocalPruning(graph, 'center', 10, { maxEdges: 100 })

    expect(result.graph.nodes.length).toBe(graph.nodes.length)
    expect(result.graph.edges.length).toBe(graph.edges.length)
    expect(result.report.edgesDropped).toBe(0)
  })

  it('updates graph metadata stats after pruning', () => {
    const graph = createStarGraph()
    const result = applyFocalPruning(graph, 'center', 1, { maxEdges: 100 })

    expect(result.graph.metadata.stats.totalNodes).toBe(result.graph.nodes.length)
    expect(result.graph.metadata.stats.totalEdges).toBe(result.graph.edges.length)
  })

  it('handles focal node with no neighbors', () => {
    const graph = buildGraph({
      nodes: [
        { id: 'isolated', type: 'file', metadata: { label: 'isolated', path: 'isolated.ts' } },
        { id: 'other', type: 'file', metadata: { label: 'other', path: 'other.ts' } },
      ],
      edges: [],
      metadata: { name: 'test', rootPath: '/test' },
    })

    const result = applyFocalPruning(graph, 'isolated', 2, { maxEdges: 100 })

    expect(result.graph.nodes.length).toBe(1)
    expect(result.graph.nodes[0].id).toBe('isolated')
    expect(result.graph.edges.length).toBe(0)
  })
})
