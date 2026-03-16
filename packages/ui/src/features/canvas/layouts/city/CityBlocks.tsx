/**
 * CityBlocks Sub-Orchestrator
 *
 * Renders ground-level city elements: district grounds, highway signs,
 * cluster buildings (LOD 1), internal buildings (typed/x-ray + signs),
 * and external buildings (infrastructure landmarks + wireframe fallback).
 *
 * Supports two rendering modes:
 * - v1 (default): Flat layout — all internal nodes rendered at top level
 * - v2: Hierarchical layout — files as land blocks, classes/functions as buildings within
 *
 * Extracted from CityView as part of Epic 10, Story 10-3.
 */

import { useMemo } from 'react'
import { ExternalBuilding } from '../../views/ExternalBuilding'
import { XRayBuilding } from '../../views/XRayBuilding'
import { DistrictGround } from '../../components/DistrictGround'
import { FileBlock } from '../../components/FileBlock'
import { getBuildingConfig } from '../../components/buildingGeometry'
import { createBuildingElement } from '../../views/BuildingFactory'
import { createInfrastructureElement } from '../../views/InfrastructureFactory'
import { getDistrictColor } from '../../components/districtGroundUtils'
import { getSignType, getSignVisibility, renderSign } from '../../components/signs'
import { buildIncomingEdgeCounts, detectBaseClasses } from '../../views/inheritanceUtils'
import { useCanvasStore } from '../../store'
import { useCityLayout } from './useCityLayout'
import { useCityFiltering } from './useCityFiltering'
import { useDistrictMap } from '../../hooks/useDistrictMap'
import { computeXRayWallOpacity, shouldShowXRayDetail } from '../../xrayUtils'
import type { IVMGraph, Position3D } from '../../../../shared/types'
import type { EncodedHeightOptions } from '../../views/heightUtils'

interface CityBlocksProps {
  graph: IVMGraph
}

/** Distance threshold for showing x-ray internal detail */
const XRAY_DETAIL_DISTANCE = 30

export function CityBlocks({ graph }: CityBlocksProps) {
  const isXRayMode = useCanvasStore((s) => s.isXRayMode)
  const xrayOpacity = useCanvasStore((s) => s.xrayOpacity)
  const cameraPosition = useCanvasStore((s) => s.camera.position)
  const lodLevel = useCanvasStore((s) => s.lodLevel)
  const cityVersion = useCanvasStore((s) => s.citySettings.cityVersion)
  const heightEncoding = useCanvasStore((s) => s.citySettings.heightEncoding)

  const { positions, districtArcs, districts } = useCityLayout()
  const { internalNodes, externalNodes, childrenByFile, methodsByClass, nodeMap } =
    useCityFiltering(graph, positions)
  const { nestedTypeMap } = useDistrictMap(graph.nodes)

  const incomingEdgeCounts = useMemo(() => buildIncomingEdgeCounts(graph.edges), [graph.edges])
  const baseClassIds = useMemo(() => detectBaseClasses(graph.edges), [graph.edges])

  const isV2 = cityVersion === 'v2'

  return (
    <>
      {/* District ground planes (radial layout) — shared by v1 and v2 */}
      {districtArcs.map((arc, index) => (
        <DistrictGround
          key={`${arc.id}-${arc.ringDepth}`}
          arcStart={arc.arcStart}
          arcEnd={arc.arcEnd}
          innerRadius={arc.innerRadius}
          outerRadius={arc.outerRadius}
          color={getDistrictColor(arc.id, index)}
          label={arc.id}
        />
      ))}

      {/* District highway signs (LOD-controlled) — shared by v1 and v2 */}
      {districtArcs.map((arc) => {
        const midAngle = (arc.arcStart + arc.arcEnd) / 2
        const signRadius = arc.outerRadius + 1
        const districtLabel = (arc.id ?? '').split('/').pop() || arc.id || 'district'
        return renderSign({
          key: `district-sign-${arc.id}-${arc.ringDepth}`,
          signType: 'highway',
          text: districtLabel,
          position: {
            x: Math.cos(midAngle) * signRadius,
            y: 1.5,
            z: Math.sin(midAngle) * signRadius,
          },
          visible: getSignVisibility('highway', lodLevel),
        })
      })}

      {/* ===== V2: Hierarchical rendering — files as land, buildings within ===== */}
      {isV2 &&
        districts.map((district, districtIndex) => {
          const districtColor = getDistrictColor(district.id, districtIndex)

          return (
            <group key={`v2-district-${district.id}`}>
              {district.blocks.map((block) => (
                <group key={`block-${block.fileId}`}>
                  {/* File block ground plane */}
                  <FileBlock block={block} districtColor={districtColor} lodLevel={lodLevel} />

                  {/* Child buildings within the file block */}
                  {block.children.map((child) => {
                    const node = nodeMap.get(child.nodeId)
                    if (!node) return null

                    const worldPos: Position3D = {
                      x: block.position.x + child.localPosition.x,
                      y: block.position.y + child.localPosition.y,
                      z: block.position.z + child.localPosition.z,
                    }

                    if (isXRayMode) {
                      const dx = cameraPosition.x - worldPos.x
                      const dy = cameraPosition.y - worldPos.y
                      const dz = cameraPosition.z - worldPos.z
                      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
                      const wallOpacity = computeXRayWallOpacity(true, xrayOpacity)
                      const showDetail = shouldShowXRayDetail(true, dist, XRAY_DETAIL_DISTANCE)

                      return (
                        <XRayBuilding
                          key={node.id}
                          node={node}
                          position={worldPos}
                          children={childrenByFile.get(node.id) ?? []}
                          xrayOpacity={wallOpacity}
                          showDetail={showDetail}
                        />
                      )
                    }

                    const nodeEncoding: EncodedHeightOptions = {
                      encoding: heightEncoding,
                      incomingEdgeCount: incomingEdgeCounts.get(node.id) ?? 0,
                    }
                    const signType = getSignType(node)
                    const signVisible = getSignVisibility(signType, lodLevel)
                    const config = getBuildingConfig(node, nodeEncoding)
                    const signLabel = (node.metadata.label ?? node.id).split('/').pop() ?? node.id

                    return (
                      <group key={node.id}>
                        {createBuildingElement(
                          node,
                          worldPos,
                          nestedTypeMap,
                          methodsByClass,
                          lodLevel,
                          graph,
                          nodeEncoding,
                          baseClassIds
                        )}
                        {renderSign({
                          key: `sign-${node.id}`,
                          signType,
                          text: signLabel,
                          position: {
                            x: worldPos.x,
                            y: worldPos.y + config.geometry.height + 1.5,
                            z: worldPos.z,
                          },
                          visible: signVisible,
                        })}
                      </group>
                    )
                  })}
                </group>
              ))}
            </group>
          )
        })}

      {/* ===== V1: Flat rendering path (original) ===== */}
      {!isV2 && (
        <>
          {/* Cluster buildings (LOD 1 only) — temporarily disabled */}
          {/* {clusters.map((cluster) => (
            <ClusterBuilding
              key={`cluster-${cluster.districtId}`}
              position={cluster.center}
              nodeCount={cluster.nodeCount}
              districtName={cluster.districtId}
              size={cluster.size}
            />
          ))} */}

          {/* Internal buildings with signs — file nodes are land in v2; skip them in v1 */}
          {internalNodes
            .filter((n) => n.type !== 'file')
            .map((node) => {
              const pos = positions.get(node.id)
              if (!pos) return null

              if (isXRayMode) {
                const dx = cameraPosition.x - pos.x
                const dy = cameraPosition.y - pos.y
                const dz = cameraPosition.z - pos.z
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
                const wallOpacity = computeXRayWallOpacity(true, xrayOpacity)
                const showDetail = shouldShowXRayDetail(true, dist, XRAY_DETAIL_DISTANCE)

                return (
                  <XRayBuilding
                    key={node.id}
                    node={node}
                    position={pos}
                    children={childrenByFile.get(node.id) ?? []}
                    xrayOpacity={wallOpacity}
                    showDetail={showDetail}
                  />
                )
              }

              const nodeEncoding: EncodedHeightOptions = {
                encoding: heightEncoding,
                incomingEdgeCount: incomingEdgeCounts.get(node.id) ?? 0,
              }
              const signType = getSignType(node)
              const signVisible = getSignVisibility(signType, lodLevel)
              const config = getBuildingConfig(node, nodeEncoding)
              const signLabel = (node.metadata.label ?? node.id).split('/').pop() ?? node.id

              return (
                <group key={node.id}>
                  {createBuildingElement(
                    node,
                    pos,
                    nestedTypeMap,
                    methodsByClass,
                    lodLevel,
                    graph,
                    nodeEncoding,
                    baseClassIds
                  )}
                  {renderSign({
                    key: `sign-${node.id}`,
                    signType,
                    text: signLabel,
                    position: {
                      x: pos.x,
                      y: pos.y + config.geometry.height + 1.5,
                      z: pos.z,
                    },
                    visible: signVisible,
                  })}
                </group>
              )
            })}
        </>
      )}

      {/* External library buildings — infrastructure landmarks or wireframe fallback (shared) */}
      {externalNodes.map((node) => {
        const pos = positions.get(node.id)
        if (!pos) return null

        const landmark = createInfrastructureElement(node, pos)
        if (landmark) return landmark

        return <ExternalBuilding key={node.id} node={node} position={pos} />
      })}
    </>
  )
}
