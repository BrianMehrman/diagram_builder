import React from 'react'
import { CityView } from '../../../views/CityView'
import type { VisualizationRenderer, RenderContext } from '../../types'

/**
 * CityRenderer implements VisualizationRenderer for the radial city layout.
 *
 * It delegates to the existing CityView component, which internally
 * composes CityBlocks, CitySky, and CityAtmosphere.
 */
const cityRenderer: VisualizationRenderer = {
  type: 'radial-city',

  render(ctx: RenderContext): React.JSX.Element {
    return <CityView graph={ctx.graph} />
  },

  canRender(layoutType: string): boolean {
    return layoutType === 'radial-city'
  },
}

export { cityRenderer }
