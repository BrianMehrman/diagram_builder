// packages/ui/src/features/canvas/layouts/index.ts
import { useCanvasStore } from '../store'
import { Basic3DView } from './basic3d/Basic3DView'
import type { UILayoutEngine, ActiveLayoutResult } from './types'

import { CityView } from './city/CityView'

const cityEngine: UILayoutEngine = {
  id: 'city',
  label: 'City',
  component: CityView,
}

const basic3dEngine: UILayoutEngine = {
  id: 'basic3d',
  label: 'Basic 3D',
  component: Basic3DView,
}

export function useLayout(): ActiveLayoutResult {
  const activeLayout = useCanvasStore((s) => s.activeLayout)
  const engine = activeLayout === 'city' ? cityEngine : basic3dEngine
  return { engine }
}
