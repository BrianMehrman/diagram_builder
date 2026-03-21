/**
 * UndergroundLayer Component
 *
 * Renders dependency connections as underground tunnels when
 * underground mode is active. Filters graph edges to import/depends_on
 * types and renders DependencyTunnel for each, plus TunnelJunction
 * hubs at building bases.
 */

import { useMemo } from 'react'
import { useCanvasStore } from '../../store'
import { DependencyTunnel } from '../../views/DependencyTunnel'
import { TunnelJunction } from '../../views/TunnelJunction'
import { filterImportEdges } from '../../undergroundUtils'
import { countTunnelsPerNode } from '../../tunnelEnhancedUtils'
import type { DependencyType } from '../../tunnelEnhancedUtils'
import type { IVMGraph, IVMEdge, Position3D } from '../../../../shared/types'

interface UndergroundLayerProps {
  graph: IVMGraph
  positions: Map<string, Position3D>
}

/**
 * Derive dependency type from edge metadata.
 * Falls back to 'production' when metadata doesn't specify.
 */
function deriveDependencyType(edge: IVMEdge): DependencyType {
  const dt = edge.metadata?.properties?.dependencyType
  if (dt && typeof dt === 'string') {
    if (dt === 'dev' || dt === 'peer' || dt === 'type') return dt
    return 'production'
  }
  // Heuristic: depends_on edges are production, imports default to production
  return 'production'
}

export function UndergroundLayer({ graph, positions }: UndergroundLayerProps) {
  const isUndergroundMode = useCanvasStore((s) => s.isUndergroundMode)

  // Build a set of external node IDs for quick lookup
  const externalNodeIds = useMemo(() => {
    const ids = new Set<string>()
    for (const node of graph.nodes) {
      if (node.metadata.properties?.isExternal as boolean | undefined) {
        ids.add(node.id)
      }
    }
    return ids
  }, [graph.nodes])

  // Filter to dependency edges only
  const importEdges = useMemo(() => filterImportEdges(graph.edges), [graph.edges])

  // Count tunnels per node for junction sizing
  const tunnelCounts = useMemo(() => countTunnelsPerNode(importEdges), [importEdges])

  // Collect unique node IDs that have tunnels (for junction rendering)
  const junctionNodeIds = useMemo(() => {
    const ids = new Set<string>()
    for (const edge of importEdges) {
      if (positions.has(edge.source)) ids.add(edge.source)
      if (positions.has(edge.target)) ids.add(edge.target)
    }
    return ids
  }, [importEdges, positions])

  if (!isUndergroundMode) return null

  return (
    <group name="underground-layer">
      {/* Dependency tunnels */}
      {importEdges.map((edge) => {
        const sourcePos = positions.get(edge.source)
        const targetPos = positions.get(edge.target)
        if (!sourcePos || !targetPos) return null

        const importCount = (edge.metadata?.properties?.importCount as number | undefined) ?? 1
        const isExternal = externalNodeIds.has(edge.source) || externalNodeIds.has(edge.target)
        const dependencyType = deriveDependencyType(edge)

        return (
          <DependencyTunnel
            key={edge.id}
            sourcePosition={sourcePos}
            targetPosition={targetPos}
            importCount={importCount}
            isExternal={isExternal}
            dependencyType={dependencyType}
          />
        )
      })}

      {/* Tunnel junctions at building bases */}
      {Array.from(junctionNodeIds).map((nodeId) => {
        const pos = positions.get(nodeId)
        if (!pos) return null

        const count = tunnelCounts.get(nodeId) ?? 1
        const isInternal = !externalNodeIds.has(nodeId)

        return (
          <TunnelJunction
            key={`junction-${nodeId}`}
            position={pos}
            tunnelCount={count}
            isInternal={isInternal}
          />
        )
      })}
    </group>
  )
}
