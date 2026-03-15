import { describe, it, expect } from 'vitest'
import type React from 'react'
import type { VisualizationRenderer, RenderContext, VisualizationStyle } from './types'
import type { IVMGraph } from '../../../shared/types'
import type { LayoutEngine, LayoutResult } from '../layout/types'

const STUB_RENDERER_TYPE = 'stub' as const
const STUB_ENGINE_TYPE = 'stub-layout' as const
const TEST_STYLE_ID = 'test-style' as const

describe('VisualizationRenderer contract', () => {
  it('can implement VisualizationRenderer with required methods', () => {
    const stubRenderer: VisualizationRenderer = {
      type: STUB_RENDERER_TYPE,
      render: (_ctx: RenderContext) => null as unknown as React.JSX.Element,
      canRender: (_layoutType: string) => true,
    }
    expect(stubRenderer.type).toBe(STUB_RENDERER_TYPE)
    expect(stubRenderer.canRender('radial-city')).toBe(true)
  })

  it('VisualizationStyle bundles a layout engine and renderer', () => {
    const stubEngine: LayoutEngine = {
      type: STUB_ENGINE_TYPE,
      layout: (_graph: Graph) =>
        ({
          positions: new Map(),
          bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
        }) as LayoutResult,
      canHandle: () => true,
    }
    const stubRenderer: VisualizationRenderer = {
      type: STUB_RENDERER_TYPE,
      render: () => null as unknown as React.JSX.Element,
      canRender: () => true,
    }
    const style: VisualizationStyle = {
      id: TEST_STYLE_ID,
      label: 'Test Style',
      layoutEngine: stubEngine,
      renderer: stubRenderer,
    }
    expect(style.id).toBe(TEST_STYLE_ID)
    expect(style.layoutEngine.type).toBe(STUB_ENGINE_TYPE)
    expect(style.renderer.type).toBe(STUB_RENDERER_TYPE)
  })
})
