import { describe, it, expect } from 'vitest'
import { TreeLayoutEngine } from './treeLayout'
import type { Graph } from '../../../../shared/types'

const graph: Graph = {
  nodes: [
    { id: 'root', type: 'file', label: 'root.ts', depth: 0, lod: 1, metadata: {} },
    { id: 'child1', type: 'class', label: 'A', depth: 1, parentId: 'root', lod: 1, metadata: {} },
    { id: 'child2', type: 'class', label: 'B', depth: 1, parentId: 'root', lod: 1, metadata: {} },
  ],
  edges: [],
  metadata: {
    repositoryId: 'test-repo',
    name: 'test',
    totalNodes: 3,
    totalEdges: 0,
  },
}

describe('TreeLayoutEngine', () => {
  const engine = new TreeLayoutEngine()

  it('has type "tree"', () => {
    expect(engine.type).toBe('tree')
  })

  it('canHandle any graph', () => {
    expect(engine.canHandle(graph)).toBe(true)
  })

  it('positions all nodes', () => {
    const result = engine.layout(graph, {})
    expect(result.positions.size).toBe(3)
  })

  it('places root at y=0', () => {
    const result = engine.layout(graph, {})
    expect(result.positions.get('root')?.y).toBe(0)
  })

  it('places children below root (negative y for downward tree)', () => {
    const result = engine.layout(graph, {})
    const child = result.positions.get('child1')
    expect(child).toBeDefined()
    expect(child!.y).toBeLessThan(0)
  })

  it('spreads siblings on the x axis', () => {
    const result = engine.layout(graph, {})
    const c1 = result.positions.get('child1')!
    const c2 = result.positions.get('child2')!
    expect(c1.x).not.toBe(c2.x)
  })
})
