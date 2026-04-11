/**
 * CitySky Sub-Orchestrator
 *
 * Renders sky-level city elements: dependency edges between buildings.
 *
 * v1 mode: flat CityEdge lines (original behaviour).
 * v2 mode: OverheadWire arcs (rooftop-anchored, calls=solid, composes=dashed)
 *          with GroundShadow projections. Gated by edgeTierVisibility.crossDistrict.
 *
 * Extracted from CityView as part of Epic 10, Story 10-3.
 * Updated in Story 10-17 to wire SkyEdge + GroundShadow.
 * Updated in Story 11-11 to replace SkyEdge with OverheadWire for v2.
 */

import { Html } from '@react-three/drei'
import { CityEdge } from './CityEdge'
import { OverheadWire } from '../../components/OverheadWire'
import { GroundShadow } from '../../components/GroundShadow'
import { useCityLayout } from './useCityLayout'
import { useCityFiltering } from './useCityFiltering'
import { useCanvasStore } from '../../store'
import { classifyEdgeRouting } from '../../views/wireUtils'
import { getContainmentHeight, getBuildingHeight, KIOSK_HEIGHT } from '../../views/heightUtils'
import type { IVMGraph, IVMNode } from '../../../../shared/types'

/** Compute rooftop Y for a node so OverheadWire arcs start/end at the correct height. */
function getNodeRooftopY(node: IVMNode | undefined): number {
  if (!node) return 0
  if (
    node.type === 'class' ||
    (node.metadata.properties?.isAbstract as boolean | undefined) ||
    node.type === 'interface'
  ) {
    return getContainmentHeight((node.metadata.properties?.methodCount as number | undefined) ?? 0)
  }
  if (node.type === 'function') {
    return KIOSK_HEIGHT
  }
  return getBuildingHeight(node.metadata.properties?.depth as number | undefined)
}

interface CitySkyProps {
  graph: IVMGraph
}

export function CitySky({ graph }: CitySkyProps) {
  const { positions } = useCityLayout()
  const { visibleEdges, nodeMap } = useCityFiltering(graph, positions)
  const cityVersion = useCanvasStore((s) => s.citySettings.cityVersion)
  const edgeTierVisibility = useCanvasStore((s) => s.citySettings.edgeTierVisibility)
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)

  const isV2 = cityVersion === 'v2'

  // In v2 mode: CitySky renders only overhead edges (method calls, composition),
  // gated by the crossDistrict tier toggle.
  // Structural edges (imports, inherits, depends_on) route underground via CityUnderground.
  const edgesToRender = isV2
    ? visibleEdges.filter((e) => {
        // Always include edges connected to the selected node, regardless of routing
        if (
          selectedNodeId !== null &&
          (e.source === selectedNodeId || e.target === selectedNodeId)
        ) {
          return true
        }
        return classifyEdgeRouting(e.type) === 'overhead' && edgeTierVisibility.crossDistrict
      })
    : visibleEdges

  return (
    <>
      {/* Dependency edges between buildings */}
      {edgesToRender.map((edge) => {
        const srcPos = positions.get(edge.source)
        const tgtPos = positions.get(edge.target)
        if (!srcPos || !tgtPos) return null

        if (isV2) {
          const srcNode = nodeMap.get(edge.source)
          const tgtNode = nodeMap.get(edge.target)
          return (
            <group key={edge.id}>
              <OverheadWire
                sourcePosition={srcPos}
                targetPosition={tgtPos}
                sourceHeight={getNodeRooftopY(srcNode)}
                targetHeight={getNodeRooftopY(tgtNode)}
                edgeType={edge.type}
              />
              <GroundShadow edge={edge} sourcePosition={srcPos} targetPosition={tgtPos} />
              {(edge.source === selectedNodeId || edge.target === selectedNodeId) &&
                selectedNodeId && (
                  <Html
                    position={[
                      (srcPos.x + tgtPos.x) / 2,
                      Math.max(getNodeRooftopY(srcNode), getNodeRooftopY(tgtNode)) + 2,
                      (srcPos.z + tgtPos.z) / 2,
                    ]}
                    center
                    style={{ pointerEvents: 'none' }}
                  >
                    <div
                      style={{
                        background: 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {edge.type}
                    </div>
                  </Html>
                )}
            </group>
          )
        }

        const srcNode = nodeMap.get(edge.source)
        const tgtNode = nodeMap.get(edge.target)
        return (
          <CityEdge
            key={edge.id}
            edge={edge}
            sourcePosition={srcPos}
            targetPosition={tgtPos}
            sourceDepth={srcNode?.metadata.properties?.depth as number | undefined}
            targetDepth={tgtNode?.metadata.properties?.depth as number | undefined}
          />
        )
      })}
    </>
  )
}
