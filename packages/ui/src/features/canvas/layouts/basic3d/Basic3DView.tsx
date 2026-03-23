/**
 * Basic3DView — root layout component for the Basic3D layout.
 *
 * Renders one Basic3DNode per node and (at LOD >= 2) one Basic3DEdge per
 * edge in the current LOD graph. Reads selectedNodeId and lodLevel from the
 * canvas store and delegates layout computation to useBasic3DLayout.
 */

import type { JSX } from 'react'
import { useCanvasStore } from '../../store'
import { useBasic3DLayout } from './useBasic3DLayout'
import { Basic3DNode } from './Basic3DNode'
import { Basic3DEdge } from './Basic3DEdge'

export function Basic3DView() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)
  const lodLevel = useCanvasStore((s) => s.lodLevel)

  const { positions, graph } = useBasic3DLayout()

  return (
    <group name="basic3d-view" data-testid="basic3d-view">
      {/* Render one node per graph node */}
      {graph.nodes.map((node) => {
        const position = positions.get(node.id) ?? { x: 0, y: 0, z: 0 }
        return (
          <Basic3DNode
            key={node.id}
            node={node}
            position={position}
            isSelected={node.id === selectedNodeId}
          />
        )
      })}

      {/* Render edges only at LOD >= 2. Use reduce to avoid null returns in
          the R3F scene graph — the fiber reconciler's removeChild cannot
          handle null children. */}
      {lodLevel >= 2 &&
        graph.edges.reduce<JSX.Element[]>((acc, edge) => {
          const from = positions.get(edge.source)
          const to = positions.get(edge.target)
          if (from !== undefined && to !== undefined) {
            acc.push(<Basic3DEdge key={edge.id} from={from} to={to} />)
          }
          return acc
        }, [])}
    </group>
  )
}
