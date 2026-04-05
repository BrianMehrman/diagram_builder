/**
 * Core operation timing metadata tests
 */

import { describe, it, expect } from 'vitest'
import { exportToMermaid } from '../mermaid.js'
import { exportToSVG } from '../svg.js'
import { exportToDrawio } from '../drawio.js'
import { layoutGraph } from '../../layout/forceDirected.js'
import type { IVMGraph, IVMNode, NodeType, EdgeType } from '../../ivm/types.js'

function minimalGraph(): IVMGraph {
  const node: IVMNode = {
    id: 'n1',
    type: 'file' as NodeType,
    lod: 3,
    position: { x: 0, y: 0, z: 0 },
    style: { color: '#FFFFFF', size: 1 },
    metadata: { label: 'Node 1', description: '', source: { file: 'test.ts', line: 1 } },
  }
  return {
    nodes: [node],
    edges: [],
    metadata: {
      name: 'test-graph',
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      sourceInfo: { type: 'repository', path: '/tmp', languages: ['typescript'] },
    },
    bounds: {
      min: { x: -1, y: -1, z: -1 },
      max: { x: 1, y: 1, z: 1 },
    },
    stats: {
      totalNodes: 1,
      totalEdges: 0,
      nodesByType: {} as Record<NodeType, number>,
      edgesByType: {} as Record<EdgeType, number>,
      maxDepth: 1,
    },
  }
}

describe('exportToMermaid timing', () => {
  it('returns { result, durationMs } with non-negative durationMs', () => {
    const { result, durationMs } = exportToMermaid(minimalGraph())
    expect(result).toBeDefined()
    expect(result.content).toBeTruthy()
    expect(typeof durationMs).toBe('number')
    expect(durationMs).toBeGreaterThanOrEqual(0)
  })
})

describe('exportToSVG timing', () => {
  it('returns { result, durationMs } with non-negative durationMs', () => {
    const { result, durationMs } = exportToSVG(minimalGraph())
    expect(result).toBeDefined()
    expect(result.content).toBeTruthy()
    expect(typeof durationMs).toBe('number')
    expect(durationMs).toBeGreaterThanOrEqual(0)
  })
})

describe('exportToDrawio timing', () => {
  it('returns { result, durationMs } with non-negative durationMs', () => {
    const { result, durationMs } = exportToDrawio(minimalGraph())
    expect(result).toBeDefined()
    expect(result.content).toBeTruthy()
    expect(typeof durationMs).toBe('number')
    expect(durationMs).toBeGreaterThanOrEqual(0)
  })
})

describe('layoutGraph timing', () => {
  it('returns durationMs in addition to graph and result', () => {
    const { graph, result, durationMs } = layoutGraph(minimalGraph())
    expect(graph).toBeDefined()
    expect(result).toBeDefined()
    expect(typeof durationMs).toBe('number')
    expect(durationMs).toBeGreaterThanOrEqual(0)
  })
})
