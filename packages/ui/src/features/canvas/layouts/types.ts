// packages/ui/src/features/canvas/layouts/types.ts
import type React from 'react'

/** A UI layout theme — selects which visual presentation to render. */
export interface UILayoutEngine {
  id: 'city' | 'basic3d'
  label: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: React.ComponentType<any>
}

/** Return type of the useLayout hook — the currently active UI engine. */
export interface ActiveLayoutResult {
  engine: UILayoutEngine
}
