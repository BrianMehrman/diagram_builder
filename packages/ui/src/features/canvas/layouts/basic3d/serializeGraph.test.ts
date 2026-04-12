import { describe, it, expect } from 'vitest'
import { serializeGraph } from './serializeGraph'
import type { IVMGraph } from '@diagram-builder/core'

function makeGraph(overrides: Partial<IVMGraph> = {}): IVMGraph {
  return {
    nodes: [],
    edges: [],
    metadata: {
      name: 'test',
      schemaVersion: '1.0.0',
      generatedAt: '2026-01-01T00:00:00Z',
      rootPath: 'src/',
      languages: [],
      stats: {
        totalNodes: 0,
        totalEdges: 0,
        nodesByType: {} as never,
        edgesByType: {} as never,
      },
    },
    bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
    ...overrides,
  }
}

describe('serializeGraph', () => {
  it('returns an object that passes structuredClone without throwing', () => {
    const graph = makeGraph()
    const serialized = serializeGraph(graph)
    expect(() => structuredClone(serialized)).not.toThrow()
  })

  it('preserves node ids', () => {
    const graph = makeGraph({
      nodes: [
        {
          id: 'node-1',
          type: 'file',
          position: { x: 0, y: 0, z: 0 },
          lod: 3,
          metadata: { label: 'index.ts', path: 'src/index.ts', properties: {} },
        },
      ],
    })
    const serialized = serializeGraph(graph)
    expect(serialized.nodes[0]?.id).toBe('node-1')
  })

  it('preserves edge source and target', () => {
    const graph = makeGraph({
      edges: [
        {
          id: 'e1',
          source: 'node-a',
          target: 'node-b',
          type: 'imports',
          metadata: {},
          lod: 0,
        },
      ],
    })
    const serialized = serializeGraph(graph)
    expect(serialized.edges[0]?.source).toBe('node-a')
    expect(serialized.edges[0]?.target).toBe('node-b')
  })

  it('strips non-plain-object values from metadata properties', () => {
    const graph = makeGraph({
      nodes: [
        {
          id: 'node-1',
          type: 'file',
          position: { x: 0, y: 0, z: 0 },
          lod: 3,
          metadata: {
            label: 'index.ts',
            path: 'src/index.ts',
            // Simulate a class instance sneaking into properties
            properties: { depth: 1, dangerousMethod: () => {} },
          },
        },
      ],
    })
    const serialized = serializeGraph(graph)
    // Should not throw
    expect(() => structuredClone(serialized)).not.toThrow()
    // depth preserved, function stripped
    expect(serialized.nodes[0]?.metadata.properties?.['depth']).toBe(1)
    expect(serialized.nodes[0]?.metadata.properties?.['dangerousMethod']).toBeUndefined()
  })
})
