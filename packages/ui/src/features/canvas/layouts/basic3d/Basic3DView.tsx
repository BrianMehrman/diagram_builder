/**
 * Basic3DView — root layout component for the Basic3D layout.
 *
 * Shows a loading indicator while the worker computes layout.
 * At LOD 1–2: renders ClusterLayer (proxy spheres per module group).
 * At LOD 3–4: renders individual nodes and (LOD 4) edges.
 */

import type { JSX } from 'react'
import { Text } from '@react-three/drei'
import { useCanvasStore } from '../../store'
import { useBasic3DLayout } from './useBasic3DLayout'
import { Basic3DNode } from './Basic3DNode'
import { Basic3DEdge } from './Basic3DEdge'
import { ClusterLayer } from './ClusterLayer'

/**
 * Maximum distance from origin for an edge endpoint to be rendered at LOD 4.
 * Matches the radial tree depth-2 shell (~65 units) with a small margin.
 * Filters out edges to deep/distant nodes that clutter the view when zoomed in.
 */
const EDGE_NODE_MAX_DIST_FROM_ORIGIN = 80

export function Basic3DView() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)
  const lodLevel = useCanvasStore((s) => s.lodLevel)
  const layoutState = useCanvasStore((s) => s.layoutState)

  const { positions, graph } = useBasic3DLayout()

  // ── Loading state ──────────────────────────────────────────────────────────
  if (layoutState === 'computing') {
    return (
      <group name="basic3d-loading" data-testid="basic3d-loading">
        <Text position={[0, 0, 0]} fontSize={2} color="#888888" anchorX="center" anchorY="middle">
          Loading…
        </Text>
      </group>
    )
  }

  // ── LOD 1–2: cluster proxies ───────────────────────────────────────────────
  if (lodLevel <= 2) {
    return (
      <group name="basic3d-view" data-testid="basic3d-view">
        <ClusterLayer />
      </group>
    )
  }

  // ── LOD 3–4: individual nodes ──────────────────────────────────────────────
  return (
    <group name="basic3d-view" data-testid="basic3d-view">
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

      {lodLevel >= 4 &&
        graph.edges.reduce<JSX.Element[]>((acc, edge) => {
          const from = positions.get(edge.source)
          const to = positions.get(edge.target)
          if (from === undefined || to === undefined) return acc

          // Only show edges where both endpoints are near the scene origin.
          // At LOD 4 the camera is <25 units from origin; filtering by origin
          // distance keeps edges local to what the camera can actually see.
          const fromDist = Math.sqrt(from.x * from.x + from.y * from.y + from.z * from.z)
          const toDist = Math.sqrt(to.x * to.x + to.y * to.y + to.z * to.z)
          if (
            fromDist > EDGE_NODE_MAX_DIST_FROM_ORIGIN ||
            toDist > EDGE_NODE_MAX_DIST_FROM_ORIGIN
          ) {
            return acc
          }

          acc.push(<Basic3DEdge key={edge.id} from={from} to={to} />)
          return acc
        }, [])}
    </group>
  )
}
