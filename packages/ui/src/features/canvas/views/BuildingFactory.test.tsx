import { describe, it, expect, vi } from 'vitest'
import { createBuildingElement, createBuildingElementAtOrigin } from './BuildingFactory'
import type { GraphNode } from '../../../shared/types'

vi.mock('../components/buildings', () => ({
  ClassBuilding: () => null,
  BaseClassBuilding: () => null,
  FunctionShop: () => null,
  InterfaceBuilding: () => null,
  AbstractBuilding: () => null,
  VariableCrate: () => null,
  EnumCrate: () => null,
  RooftopGarden: () => null,
}))
vi.mock('./Building', () => ({ Building: () => null }))

function makeNode(type: GraphNode['type'], id = 'n1'): GraphNode {
  return { id, type, label: id, lod: 1, metadata: {} }
}

const pos = { x: 0, y: 0, z: 0 }
const graph = {
  nodes: [],
  edges: [],
  metadata: { repositoryId: 'test', name: 'test', totalNodes: 0, totalEdges: 0 },
}

describe('createBuildingElement', () => {
  it('returns JSX for class node', () => {
    const el = createBuildingElement(makeNode('class'), pos, new Map(), new Map(), 1, graph)
    expect(el).not.toBeNull()
  })
  it('returns JSX for function node', () => {
    const el = createBuildingElement(makeNode('function'), pos, new Map(), new Map(), 1, graph)
    expect(el).not.toBeNull()
  })
  it('returns JSX for unknown type (fallback)', () => {
    const el = createBuildingElement(makeNode('file'), pos, new Map(), new Map(), 1, graph)
    expect(el).not.toBeNull()
  })
})

describe('createBuildingElementAtOrigin', () => {
  it('creates element at origin for class', () => {
    const el = createBuildingElementAtOrigin(makeNode('class'), new Map(), 1, graph)
    expect(el).not.toBeNull()
  })
})
