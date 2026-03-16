import React from 'react'
import { CityView } from '../../../layouts/city/CityView'
import type { VisualizationRenderer, RenderContext } from '../../types'

/**
 * CityRenderer implements VisualizationRenderer for the radial city layout.
 *
 * It delegates to the existing CityView component, which internally
 * composes CityBlocks, CitySky, and CityAtmosphere.
 */
const cityRenderer: VisualizationRenderer = {
  type: 'radial-city',

  render(_ctx: RenderContext): React.JSX.Element {
    return <CityView />
  },

  canRender(layoutType: string): boolean {
    return layoutType === 'radial-city'
  },
}

export { cityRenderer }
