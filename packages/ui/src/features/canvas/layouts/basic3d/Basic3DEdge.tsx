/**
 * Basic3DEdge Component
 *
 * Renders a line between two 3D positions representing a dependency edge
 * in the Basic3D layout.
 */

import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import type { Position3D } from '@diagram-builder/core'

export interface Basic3DEdgeProps {
  from: Position3D
  to: Position3D
}

const EDGE_COLOR = '#888888'

export function Basic3DEdge({ from, to }: Basic3DEdgeProps) {
  const points = useMemo(
    () => [
      [from.x, from.y, from.z] as [number, number, number],
      [to.x, to.y, to.z] as [number, number, number],
    ],
    [from, to]
  )

  return <Line points={points} color={EDGE_COLOR} lineWidth={1} transparent opacity={0.4} />
}
