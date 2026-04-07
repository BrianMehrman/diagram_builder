/**
 * Basic3DView — root layout component for the Basic3D layout.
 *
 * Shows a loading indicator while the worker computes layout.
 * At LOD 1–2: renders ClusterLayer (proxy spheres per module group).
 * At LOD 3–4: renders individual nodes and (LOD 4 only) edges.
 *
 * LodController drives the store's lodLevel each frame based on camera
 * distance to origin — the same thresholds used by CityView.
 */

import type { JSX } from 'react'
import { Text } from '@react-three/drei'
import { useCanvasStore } from '../../store'
import { LodController } from '../../components/LodController'
import { useBasic3DLayout } from './useBasic3DLayout'
import { Basic3DNode } from './Basic3DNode'
import { Basic3DEdge } from './Basic3DEdge'
import { ClusterLayer } from './ClusterLayer'

export function Basic3DView() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)
  const lodLevel = useCanvasStore((s) => s.lodLevel)
  const layoutState = useCanvasStore((s) => s.layoutState)

  const { positions, graph } = useBasic3DLayout()

  // ── Loading state ──────────────────────────────────────────────────────────
  if (layoutState === 'computing') {
    return (
      <group name="basic3d-loading" data-testid="basic3d-loading">
        <LodController />
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
        <LodController />
        <ClusterLayer />
      </group>
    )
  }

  // ── LOD 3–4: individual nodes ──────────────────────────────────────────────
  return (
    <group name="basic3d-view" data-testid="basic3d-view">
      <LodController />

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
          if (from !== undefined && to !== undefined) {
            acc.push(<Basic3DEdge key={edge.id} from={from} to={to} />)
          }
          return acc
        }, [])}
    </group>
  )
}
