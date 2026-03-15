import { describe, it, expect, beforeEach } from 'vitest'
import type React from 'react'
import { RendererRegistry, VisualizationStyleRegistry } from './registry'
import type { VisualizationRenderer, RenderContext, VisualizationStyle } from './types'
import type { LayoutEngine, LayoutResult } from '../layout/types'
import type { IVMGraph } from '../../../shared/types'

function makeRenderer(type: string, handles: string[]): VisualizationRenderer {
  return {
    type,
    render: (_ctx: RenderContext) => null as unknown as React.JSX.Element,
    canRender: (lt: string) => handles.includes(lt),
  }
}

function makeEngine(type: string): LayoutEngine {
  return {
    type,
    layout: (_g: Graph) =>
      ({
        positions: new Map(),
        bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
      }) as LayoutResult,
    canHandle: () => true,
  }
}

describe('RendererRegistry', () => {
  let registry: RendererRegistry
  beforeEach(() => {
    registry = new RendererRegistry()
  })

  it('registers and retrieves a renderer by type', () => {
    const r = makeRenderer('city', ['radial-city'])
    registry.register(r)
    expect(registry.get('city')).toBe(r)
  })

  it('returns undefined for unregistered type', () => {
    expect(registry.get('unknown')).toBeUndefined()
  })

  it('autoSelect picks first renderer that canRender the layout type', () => {
    registry.register(makeRenderer('tree', ['tree']))
    registry.register(makeRenderer('city', ['radial-city']))
    expect(registry.autoSelect('radial-city')?.type).toBe('city')
  })

  it('autoSelect returns undefined when none match', () => {
    registry.register(makeRenderer('city', ['radial-city']))
    expect(registry.autoSelect('tree')).toBeUndefined()
  })

  it('unregister removes the renderer', () => {
    registry.register(makeRenderer('city', ['radial-city']))
    registry.unregister('city')
    expect(registry.get('city')).toBeUndefined()
  })

  it('size reflects registered count', () => {
    expect(registry.size).toBe(0)
    registry.register(makeRenderer('city', []))
    expect(registry.size).toBe(1)
  })

  it('has returns true for registered type', () => {
    registry.register(makeRenderer('city', []))
    expect(registry.has('city')).toBe(true)
    expect(registry.has('tree')).toBe(false)
  })

  it('getAll returns all registered renderers', () => {
    registry.register(makeRenderer('a', []))
    registry.register(makeRenderer('b', []))
    expect(registry.getAll()).toHaveLength(2)
  })

  it('register overwrites existing renderer with same type', () => {
    const r1 = makeRenderer('city', ['radial-city'])
    const r2 = makeRenderer('city', ['radial-city', 'v2'])
    registry.register(r1)
    registry.register(r2)
    expect(registry.get('city')).toBe(r2)
    expect(registry.size).toBe(1)
  })
})

describe('VisualizationStyleRegistry', () => {
  let registry: VisualizationStyleRegistry
  beforeEach(() => {
    registry = new VisualizationStyleRegistry()
  })

  it('registers and retrieves a style by id', () => {
    const style: VisualizationStyle = {
      id: 'city',
      label: 'City View',
      layoutEngine: makeEngine('radial-city'),
      renderer: makeRenderer('city', ['radial-city']),
    }
    registry.register(style)
    expect(registry.get('city')).toBe(style)
  })

  it('getAll returns all registered styles', () => {
    registry.register({
      id: 'a',
      label: 'A',
      layoutEngine: makeEngine('a'),
      renderer: makeRenderer('a', []),
    })
    registry.register({
      id: 'b',
      label: 'B',
      layoutEngine: makeEngine('b'),
      renderer: makeRenderer('b', []),
    })
    expect(registry.getAll()).toHaveLength(2)
  })

  it('unregister removes a style', () => {
    registry.register({
      id: 'city',
      label: 'City',
      layoutEngine: makeEngine('r'),
      renderer: makeRenderer('r', []),
    })
    registry.unregister('city')
    expect(registry.get('city')).toBeUndefined()
  })

  it('has returns correct boolean', () => {
    expect(registry.has('city')).toBe(false)
    registry.register({
      id: 'city',
      label: 'City',
      layoutEngine: makeEngine('r'),
      renderer: makeRenderer('r', []),
    })
    expect(registry.has('city')).toBe(true)
  })
})

describe('Singleton exports', () => {
  it('rendererRegistry is a RendererRegistry instance', async () => {
    const { rendererRegistry } = await import('./registry')
    expect(rendererRegistry).toBeInstanceOf(RendererRegistry)
  })

  it('visualizationStyleRegistry is a VisualizationStyleRegistry instance', async () => {
    const { visualizationStyleRegistry } = await import('./registry')
    expect(visualizationStyleRegistry).toBeInstanceOf(VisualizationStyleRegistry)
  })
})
