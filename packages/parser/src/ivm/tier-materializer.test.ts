import { describe, it, expect } from 'vitest'
import { buildGraph } from '../../../core/src/ivm/builder.js'
import { SemanticTier } from '../../../core/src/ivm/semantic-tier.js'
import type { GraphInput, IVMGraph } from '../../../core/src/ivm/types.js'
import { buildGroupHierarchy } from './hierarchy-builder.js'
import { materializeTier } from './tier-materializer.js'

// =============================================================================
// Helper: Build a multi-file test graph
// =============================================================================

/**
 * Creates a graph with:
 * - 2 files: src/a.ts, src/b.ts
 * - 2 classes: A (in a.ts), B (in b.ts)
 * - 2 methods: A.foo (in A), B.bar (in B)
 * - contains edges: file→class, class→method
 * - imports edge: file:a→file:b
 * - calls edges: class:A→class:B, method:A.foo→method:B.bar
 */
function buildTestGraph(): IVMGraph {
  const input: GraphInput = {
    nodes: [
      { id: 'file:src/a.ts', type: 'file', metadata: { label: 'a.ts', path: 'src/a.ts' } },
      { id: 'file:src/b.ts', type: 'file', metadata: { label: 'b.ts', path: 'src/b.ts' } },
      { id: 'class:A', type: 'class', parentId: 'file:src/a.ts', metadata: { label: 'A', path: 'src/a.ts#A' } },
      { id: 'class:B', type: 'class', parentId: 'file:src/b.ts', metadata: { label: 'B', path: 'src/b.ts#B' } },
      { id: 'method:A.foo', type: 'method', parentId: 'class:A', metadata: { label: 'foo', path: 'src/a.ts#A.foo' } },
      { id: 'method:B.bar', type: 'method', parentId: 'class:B', metadata: { label: 'bar', path: 'src/b.ts#B.bar' } },
    ],
    edges: [
      { source: 'file:src/a.ts', target: 'class:A', type: 'contains' },
      { source: 'file:src/b.ts', target: 'class:B', type: 'contains' },
      { source: 'class:A', target: 'method:A.foo', type: 'contains' },
      { source: 'class:B', target: 'method:B.bar', type: 'contains' },
      { source: 'file:src/a.ts', target: 'file:src/b.ts', type: 'imports' },
      { source: 'class:A', target: 'class:B', type: 'calls' },
      { source: 'method:A.foo', target: 'method:B.bar', type: 'calls' },
    ],
    metadata: { name: 'test-project', rootPath: '/test', languages: ['typescript'] },
  }

  return buildGraph(input)
}

describe('materializeTier', () => {
  it('Detail tier returns all nodes and edges (same count as full graph)', () => {
    const graph = buildTestGraph()
    const hierarchy = buildGroupHierarchy(graph)
    const result = materializeTier(graph, hierarchy, SemanticTier.Detail)

    expect(result.nodes.length).toBe(graph.nodes.length)
    expect(result.edges.length).toBe(graph.edges.length)
    // Should be the same object reference for Detail tier
    expect(result).toBe(graph)
  })

  it('File tier collapses classes and methods — only file nodes remain', () => {
    const graph = buildTestGraph()
    const hierarchy = buildGroupHierarchy(graph)
    const result = materializeTier(graph, hierarchy, SemanticTier.File)

    // Only file nodes should be visible (no class or method nodes)
    const nodeIds = result.nodes.map((n) => n.id)
    expect(nodeIds).toContain('file:src/a.ts')
    expect(nodeIds).toContain('file:src/b.ts')

    // No class or method nodes
    const hasClass = result.nodes.some((n) => n.type === 'class')
    const hasMethod = result.nodes.some((n) => n.type === 'method')
    expect(hasClass).toBe(false)
    expect(hasMethod).toBe(false)
  })

  it('File tier merges cross-file edges with aggregated metadata', () => {
    const graph = buildTestGraph()
    const hierarchy = buildGroupHierarchy(graph)
    const result = materializeTier(graph, hierarchy, SemanticTier.File)

    // There should be aggregated edges between the two files
    expect(result.edges.length).toBeGreaterThan(0)

    // Find an edge between the two file nodes
    const crossFileEdge = result.edges.find(
      (e) => e.source === 'file:src/a.ts' && e.target === 'file:src/b.ts'
    )
    expect(crossFileEdge).toBeDefined()

    // Check aggregated metadata
    expect(crossFileEdge!.metadata.properties).toBeDefined()
    expect(crossFileEdge!.metadata.properties!.totalWeight).toBeGreaterThan(0)
    expect(crossFileEdge!.metadata.properties!.breakdown).toBeDefined()
    expect(crossFileEdge!.metadata.properties!.aggregated).toBe(true)
  })

  it('Module tier collapses files into directory groups', () => {
    const graph = buildTestGraph()
    const hierarchy = buildGroupHierarchy(graph)
    const result = materializeTier(graph, hierarchy, SemanticTier.Module)

    // At Module tier, individual file nodes should not be present
    // unless they also serve as module-level groups.
    // Since our test files are all in src/, and there's no explicit
    // directory/module node, everything collapses upward.
    // The hierarchy builder creates groups per-node; files at tier 3
    // are below Module tier (2), so they get collapsed.

    // No file, class, or method nodes should appear
    const hasFile = result.nodes.some((n) => n.type === 'file')
    const hasClass = result.nodes.some((n) => n.type === 'class')
    const hasMethod = result.nodes.some((n) => n.type === 'method')
    expect(hasFile).toBe(false)
    expect(hasClass).toBe(false)
    expect(hasMethod).toBe(false)

    // The result should have fewer nodes than the full graph
    expect(result.nodes.length).toBeLessThan(graph.nodes.length)
  })

  it('produces a valid IVMGraph with metadata and bounds', () => {
    const graph = buildTestGraph()
    const hierarchy = buildGroupHierarchy(graph)
    const result = materializeTier(graph, hierarchy, SemanticTier.File)

    // Has required IVMGraph properties
    expect(result.metadata).toBeDefined()
    expect(result.metadata.name).toBe('test-project')
    expect(result.metadata.schemaVersion).toBeDefined()
    expect(result.metadata.stats).toBeDefined()
    expect(result.metadata.stats.totalNodes).toBe(result.nodes.length)
    expect(result.metadata.stats.totalEdges).toBe(result.edges.length)

    // Has bounds
    expect(result.bounds).toBeDefined()
    expect(result.bounds.min).toBeDefined()
    expect(result.bounds.max).toBeDefined()

    // Materialized tier info in metadata properties
    expect(result.metadata.properties).toBeDefined()
    expect(result.metadata.properties!.materializedTier).toBe(SemanticTier.File)
  })
})
