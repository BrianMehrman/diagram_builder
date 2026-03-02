import { describe, it, expect } from 'vitest'
import { treeRenderer } from './TreeRenderer'

describe('TreeRenderer', () => {
  it('has type tree', () => {
    expect(treeRenderer.type).toBe('tree')
  })

  it('canRender tree layout', () => {
    expect(treeRenderer.canRender('tree')).toBe(true)
  })

  it('cannot render radial-city layout', () => {
    expect(treeRenderer.canRender('radial-city')).toBe(false)
  })
})
