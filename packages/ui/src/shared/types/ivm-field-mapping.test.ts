import { describe, it, expect } from 'vitest'
import type { IVMNode } from '@diagram-builder/core'
import { SemanticTier } from '@diagram-builder/core'

describe('IVMNode field mapping', () => {
  const node: IVMNode = {
    id: 'test',
    type: 'class',
    position: { x: 0, y: 0, z: 0 },
    lod: SemanticTier.Symbol,
    metadata: {
      label: 'MyClass',
      path: 'src/my-class.ts',
      properties: {
        isExternal: false,
        depth: 2,
        methodCount: 5,
        isAbstract: true,
        hasNestedTypes: false,
        visibility: 'public',
        isDeprecated: false,
        isExported: true,
      },
    },
  }

  it('label is at metadata.label', () => { expect(node.metadata.label).toBe('MyClass') })
  it('isExternal is at metadata.properties.isExternal', () => { expect(node.metadata.properties?.isExternal).toBe(false) })
  it('methodCount is at metadata.properties.methodCount', () => { expect(node.metadata.properties?.methodCount).toBe(5) })
  it('isAbstract is at metadata.properties.isAbstract', () => { expect(node.metadata.properties?.isAbstract).toBe(true) })
  it('visibility is at metadata.properties.visibility', () => { expect(node.metadata.properties?.visibility).toBe('public') })
})
