/**
 * Basic3DView — root layout component for the Basic3D layout.
 *
 * LOD 1 (> 200 units):   ClusterLayer (proxy spheres per module group)
 * LOD 2 (120–200 units): Top containers only (repository, package), no labels
 *                        Edges visible only when source/target is selected
 * LOD 3 (60–120 units):  All container nodes (+ namespace, module, directory), no labels
 *                        Edges visible only when source/target is selected
 * LOD 4 (25–60 units):   + class, interface, type nodes (file visible from LOD 2), labels visible
 *                        Edges visible when selected or via proximity (60 unit sphere)
 * LOD 5 (≤ 25 units):    All nodes + labels
 *                        Edges visible when selected or via proximity
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
  const cameraPosX = useCanvasStore((s) => s.camera.position.x)
  const cameraPosY = useCanvasStore((s) => s.camera.position.y)
  const cameraPosZ = useCanvasStore((s) => s.camera.position.z)
  const cameraPosition =
    layoutState === 'computing' || lodLevel <= 1
      ? null
      : { x: cameraPosX, y: cameraPosY, z: cameraPosZ }

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

  // ── LOD 2–4: type-filtered nodes + selection-based edges ──────────────────
  if (lodLevel <= 4) {
    const showLabel = lodLevel >= 4
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
      if (
        !isEdgeVisibleForLod(
          edge.source,
          edge.target,
          selectedNodeId,
          lodLevel,
          from,
          to,
          cameraPosition
        )
      ) {
        return acc
      }
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

  // ── LOD 5: all nodes + proximity-culled edges ──────────────────────────────
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
