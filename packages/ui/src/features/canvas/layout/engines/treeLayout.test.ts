import { describe, it, expect } from 'vitest'
import { TreeLayoutEngine } from './treeLayout'
import type { IVMGraph } from '../../../../shared/types'

const graph: IVMGraph = {
  nodes: [
    {
      id: 'root',
      type: 'file',
      lod: 1,
      metadata: { label: 'root.ts', path: 'root.ts', properties: { depth: 0 } },
      position: { x: 0, y: 0, z: 0 },
    },
    {
      id: 'child1',
      type: 'class',
      lod: 1,
      parentId: 'root',
      metadata: { label: 'A', path: 'A.ts', properties: { depth: 1 } },
      position: { x: 0, y: 0, z: 0 },
    },
    {
      id: 'child2',
      type: 'class',
      lod: 1,
      parentId: 'root',
      metadata: { label: 'B', path: 'B.ts', properties: { depth: 1 } },
      position: { x: 0, y: 0, z: 0 },
    },
  ],
  edges: [],
  metadata: {
    name: 'test',
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    rootPath: 'src/',
    stats: { totalNodes: 3, totalEdges: 0, nodesByType: {} as never, edgesByType: {} as never },
    languages: [],
  },
  bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
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
