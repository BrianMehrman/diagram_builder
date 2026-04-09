/**
 * basic3dShapes.test.ts
 *
 * TDD tests for the basic3dShapes lookup module.
 */

import { describe, it, expect } from 'vitest'
import {
  getShapeForType,
  getColorForType,
  isAbstractNode,
  isNodeVisibleAtLod,
  type Basic3DShape,
} from './basic3dShapes'
import type { NodeType, IVMNode, NodeMetadata } from '@diagram-builder/core'

// All 13 valid NodeType values
const ALL_NODE_TYPES: NodeType[] = [
  'file',
  'directory',
  'module',
  'class',
  'interface',
  'type',
  'function',
  'method',
  'variable',
  'enum',
  'namespace',
  'package',
  'repository',
]

const VALID_SHAPES: Basic3DShape[] = [
  'disc',
  'large-disc',
  'box',
  'large-box',
  'very-large-box',
  'sphere',
  'small-sphere',
  'icosahedron',
  'octahedron',
  'cylinder',
  'torus',
]

function makeNode(type: NodeType, properties?: Record<string, unknown>): IVMNode {
  const metadata: NodeMetadata = {
    label: type,
    path: `/test/${type}`,
    ...(properties !== undefined ? { properties } : {}),
  }
  return {
    id: `test-${type}`,
    type,
    position: { x: 0, y: 0, z: 0 },
    lod: 3,
    metadata,
  }
}

describe('getShapeForType', () => {
  it('returns a defined shape for every NodeType', () => {
    for (const nodeType of ALL_NODE_TYPES) {
      const shape = getShapeForType(nodeType)
      expect(shape, `NodeType "${nodeType}" returned undefined`).toBeDefined()
      expect(VALID_SHAPES, `NodeType "${nodeType}" returned unknown shape "${shape}"`).toContain(
        shape
      )
    }
  })

  it('file → disc', () => expect(getShapeForType('file')).toBe('disc'))
  it('directory → large-disc', () => expect(getShapeForType('directory')).toBe('large-disc'))
  it('module → disc', () => expect(getShapeForType('module')).toBe('disc'))
  it('class → box', () => expect(getShapeForType('class')).toBe('box'))
  it('interface → icosahedron', () => expect(getShapeForType('interface')).toBe('icosahedron'))
  it('type → icosahedron', () => expect(getShapeForType('type')).toBe('icosahedron'))
  it('function → sphere', () => expect(getShapeForType('function')).toBe('sphere'))
  it('method → small-sphere', () => expect(getShapeForType('method')).toBe('small-sphere'))
  it('variable → octahedron', () => expect(getShapeForType('variable')).toBe('octahedron'))
  it('enum → cylinder', () => expect(getShapeForType('enum')).toBe('cylinder'))
  it('namespace → torus', () => expect(getShapeForType('namespace')).toBe('torus'))
  it('package → large-box', () => expect(getShapeForType('package')).toBe('large-box'))
  it('repository → very-large-box', () =>
    expect(getShapeForType('repository')).toBe('very-large-box'))
})

describe('getColorForType', () => {
  it('returns a defined hex color for every NodeType', () => {
    for (const nodeType of ALL_NODE_TYPES) {
      const color = getColorForType(nodeType)
      expect(color, `NodeType "${nodeType}" returned undefined`).toBeDefined()
      expect(color, `NodeType "${nodeType}" returned non-hex "${color}"`).toMatch(
        /^#[0-9A-Fa-f]{6}$/
      )
    }
  })

  it('function → blue #4A90D9', () => expect(getColorForType('function')).toBe('#4A90D9'))
  it('method → blue #4A90D9', () => expect(getColorForType('method')).toBe('#4A90D9'))
  it('class → orange #E67E22', () => expect(getColorForType('class')).toBe('#E67E22'))
  it('interface → gray #95A5A6', () => expect(getColorForType('interface')).toBe('#95A5A6'))
  it('type → gray #95A5A6', () => expect(getColorForType('type')).toBe('#95A5A6'))
  it('file → green #27AE60', () => expect(getColorForType('file')).toBe('#27AE60'))
  it('directory → green #27AE60', () => expect(getColorForType('directory')).toBe('#27AE60'))
  it('module → green #27AE60', () => expect(getColorForType('module')).toBe('#27AE60'))
  it('variable → purple #9B59B6', () => expect(getColorForType('variable')).toBe('#9B59B6'))
  it('enum → amber #F39C12', () => expect(getColorForType('enum')).toBe('#F39C12'))
  it('namespace → white #ECEFF1', () => expect(getColorForType('namespace')).toBe('#ECEFF1'))
  it('package → white #ECEFF1', () => expect(getColorForType('package')).toBe('#ECEFF1'))
  it('repository → white #ECEFF1', () => expect(getColorForType('repository')).toBe('#ECEFF1'))
})

describe('isAbstractNode', () => {
  it('returns false when metadata.properties is undefined', () => {
    const node = makeNode('class')
    expect(isAbstractNode(node)).toBe(false)
  })

  it('returns false when properties.isAbstract is false', () => {
    const node = makeNode('class', { isAbstract: false })
    expect(isAbstractNode(node)).toBe(false)
  })

  it('returns false when properties.isAbstract is a non-boolean truthy value', () => {
    const node = makeNode('class', { isAbstract: 'true' })
    expect(isAbstractNode(node)).toBe(false)
  })

  it('returns false when properties.isAbstract is absent', () => {
    const node = makeNode('class', { someOtherProp: true })
    expect(isAbstractNode(node)).toBe(false)
  })

  it('returns true when properties.isAbstract === true', () => {
    const node = makeNode('class', { isAbstract: true })
    expect(isAbstractNode(node)).toBe(true)
  })

  it('returns true for interface with isAbstract === true', () => {
    const node = makeNode('interface', { isAbstract: true })
    expect(isAbstractNode(node)).toBe(true)
  })
})

describe('isNodeVisibleAtLod', () => {
  const CONTAINER_NODE_TYPES: NodeType[] = [
    'repository',
    'package',
    'namespace',
    'module',
    'directory',
  ]
  const STRUCTURAL_ONLY_TYPES: NodeType[] = ['file', 'class', 'interface', 'type']
  const LEAF_TYPES: NodeType[] = ['function', 'method', 'variable', 'enum']

  it('LOD 1 returns false for all individual node types', () => {
    for (const t of ALL_NODE_TYPES) {
      expect(isNodeVisibleAtLod(makeNode(t), 1), `${t} should not be visible at LOD 1`).toBe(false)
    }
  })

  it('LOD 2 returns true for all container types', () => {
    for (const t of CONTAINER_NODE_TYPES) {
      expect(isNodeVisibleAtLod(makeNode(t), 2), `${t} should be visible at LOD 2`).toBe(true)
    }
  })

  it('LOD 2 returns false for structural-only types', () => {
    for (const t of STRUCTURAL_ONLY_TYPES) {
      expect(isNodeVisibleAtLod(makeNode(t), 2), `${t} should not be visible at LOD 2`).toBe(false)
    }
  })

  it('LOD 2 returns false for leaf types', () => {
    for (const t of LEAF_TYPES) {
      expect(isNodeVisibleAtLod(makeNode(t), 2), `${t} should not be visible at LOD 2`).toBe(false)
    }
  })

  it('LOD 3 returns true for all container types', () => {
    for (const t of CONTAINER_NODE_TYPES) {
      expect(isNodeVisibleAtLod(makeNode(t), 3), `${t} should be visible at LOD 3`).toBe(true)
    }
  })

  it('LOD 3 returns true for structural-only types', () => {
    for (const t of STRUCTURAL_ONLY_TYPES) {
      expect(isNodeVisibleAtLod(makeNode(t), 3), `${t} should be visible at LOD 3`).toBe(true)
    }
  })

  it('LOD 3 returns false for leaf types', () => {
    for (const t of LEAF_TYPES) {
      expect(isNodeVisibleAtLod(makeNode(t), 3), `${t} should not be visible at LOD 3`).toBe(false)
    }
  })

  it('LOD 4 returns true for all node types', () => {
    for (const t of ALL_NODE_TYPES) {
      expect(isNodeVisibleAtLod(makeNode(t), 4), `${t} should be visible at LOD 4`).toBe(true)
    }
  })
})
