/**
 * Basic3DView — root layout component for the Basic3D layout.
 *
 * Shows a loading indicator while the worker computes layout.
 *
 * LOD 1:   ClusterLayer (proxy spheres per module group)
 * LOD 2:   Container nodes only (repository, package, namespace, module, directory)
 *           + edges between container-typed endpoints
 * LOD 3:   Container + structural nodes (+ file, class, interface, type) with labels
 *           + edges between structural-typed endpoints
 * LOD 4:   All nodes + edges (proximity-based edge culling via isEdgeVisibleForLod)
 */

import { useMemo, type JSX } from 'react'
import { Text } from '@react-three/drei'
import { useCanvasStore } from '../../store'
import { LodController } from '../../components/LodController'
import { useBasic3DLayout } from './useBasic3DLayout'
import { Basic3DNode } from './Basic3DNode'
import { Basic3DEdge } from './Basic3DEdge'
import { ClusterLayer } from './ClusterLayer'
import { isEdgeVisibleForLod } from '../../views/wireUtils'
import { isNodeVisibleAtLod } from './basic3dShapes'

export function Basic3DView() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)
  const lodLevel = useCanvasStore((s) => s.lodLevel)
  const layoutState = useCanvasStore((s) => s.layoutState)
  const cameraPosition = useCanvasStore((s) => s.camera.position)

  const { positions, graph } = useBasic3DLayout()

  const nodeById = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph.nodes])

  // ── Loading state ──────────────────────────────────────────────────────────
  if (layoutState === 'computing') {
    return (
      <group name="basic3d-loading">
        <LodController />
        <Text position={[0, 0, 0]} fontSize={2} color="#888888" anchorX="center" anchorY="middle">
          Loading…
        </Text>
      </group>
    )
  }

  // ── LOD 1: cluster proxies ─────────────────────────────────────────────────
  if (lodLevel <= 1) {
    return (
      <group name="basic3d-view">
        <LodController />
        <ClusterLayer />
      </group>
    )
  }

  // ── LOD 2–3: type-filtered nodes + edges ──────────────────────────────────
  if (lodLevel <= 3) {
    const showLabel = lodLevel >= 3
    const visibleNodes = graph.nodes.filter((n) => isNodeVisibleAtLod(n, lodLevel))

    const visibleEdges = graph.edges.reduce<JSX.Element[]>((acc, edge) => {
      const srcNode = nodeById.get(edge.source)
      const tgtNode = nodeById.get(edge.target)
      if (!srcNode || !tgtNode) return acc
      if (!isNodeVisibleAtLod(srcNode, lodLevel) || !isNodeVisibleAtLod(tgtNode, lodLevel)) {
        return acc
      }
      const from = positions.get(edge.source)
      const to = positions.get(edge.target)
      if (from === undefined || to === undefined) return acc
      acc.push(<Basic3DEdge key={edge.id} from={from} to={to} />)
      return acc
    }, [])

    return (
      <group name="basic3d-view">
        <LodController />
        {visibleNodes.map((node) => {
          const position = positions.get(node.id) ?? { x: 0, y: 0, z: 0 }
          return (
            <Basic3DNode
              key={node.id}
              node={node}
              position={position}
              isSelected={node.id === selectedNodeId}
              showLabel={showLabel}
            />
          )
        })}
        {visibleEdges}
      </group>
    )
  }

  // ── LOD 4: all nodes + proximity-culled edges ──────────────────────────────
  return (
    <group name="basic3d-view">
      <LodController />

      {graph.nodes.map((node) => {
        const position = positions.get(node.id) ?? { x: 0, y: 0, z: 0 }
        return (
          <Basic3DNode
            key={node.id}
            node={node}
            position={position}
            isSelected={node.id === selectedNodeId}
            showLabel={true}
          />
        )
      })}

      {graph.edges.reduce<JSX.Element[]>((acc, edge) => {
        const from = positions.get(edge.source)
        const to = positions.get(edge.target)
        if (
          from !== undefined &&
          to !== undefined &&
          isEdgeVisibleForLod(
            edge.source,
            edge.target,
            selectedNodeId,
            lodLevel,
            from,
            to,
            cameraPosition
          )
        ) {
          acc.push(<Basic3DEdge key={edge.id} from={from} to={to} />)
        }
        return acc
      }, [])}
    </group>
  )
}
