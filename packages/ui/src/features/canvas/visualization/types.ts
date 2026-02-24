import type React from 'react'
import type { Graph, Position3D } from '../../../shared/types'
import type { LayoutEngine, LayoutResult, HierarchicalLayoutResult } from '../layout/types'

/**
 * Visual settings passed to renderers.
 *
 * Intentionally kept separate from the Zustand store's CitySettings to avoid
 * a circular dependency between visualization/types.ts and store.ts.
 * Keep fields in sync with CitySettings manually when store evolves.
 */
export interface VisualizationSettings {
  heightEncoding: 'methodCount' | 'dependencies' | 'loc' | 'complexity' | 'churn'
  cityVersion: 'v1' | 'v2'
  transitMapMode: boolean
  undergroundVisible: boolean
  externalPipesVisible: boolean
  atmosphereOverlays: {
    cranes: boolean
    smog: boolean
    lighting: boolean
    deprecated: boolean
  }
  edgeTierVisibility: {
    crossDistrict: boolean
    inheritance: boolean
  }
  cameraTiltAssist: boolean
}

/**
 * Context passed to every VisualizationRenderer.render() call.
 */
export interface RenderContext {
  graph: Graph
  positions: Map<string, Position3D>
  layoutResult: LayoutResult | HierarchicalLayoutResult
  lodLevel: number
  visualizationSettings: VisualizationSettings
}

/**
 * Interface all visualization renderers must implement.
 * Symmetric counterpart to LayoutEngine.
 */
export interface VisualizationRenderer {
  readonly type: string
  render(ctx: RenderContext): React.JSX.Element
  canRender(layoutType: string): boolean
}

/**
 * Bundles a layout engine with its matched renderer.
 */
export interface VisualizationStyle {
  readonly id: string
  readonly label: string
  layoutEngine: LayoutEngine
  renderer: VisualizationRenderer
}
