/**
 * useCityLayout Hook
 *
 * Runs the RadialCityLayoutEngine on the provided graph and returns
 * layout positions, district arc metadata, and ground plane dimensions.
 *
 * Extracted from CityView to enable sharing across sub-orchestrators.
 */

import { useMemo, useEffect, useRef } from 'react'
import { withSpan } from '../../../../lib/telemetry'
import { RadialCityLayoutEngine } from '../../layout/engines/radialCityLayout'
import { flattenHierarchicalLayout } from '../../layout/hierarchicalUtils'
import { useCanvasStore } from '../../store'
import { SemanticTier } from '@diagram-builder/core'
import type { GroupNode, NodeType, EdgeType } from '@diagram-builder/core'
import type { IVMGraph, Position3D } from '../../../../shared/types'
import type { DistrictArcMetadata } from '../../layout/engines/radialCityLayout'
import type { BoundingBox, DistrictLayout, ExternalZoneLayout } from '../../layout/types'

const EMPTY_GRAPH: IVMGraph = {
  nodes: [],
  edges: [],
  metadata: {
    name: '',
    schemaVersion: '1.0.0',
    generatedAt: '',
    rootPath: '',
    languages: [],
    stats: {
      totalNodes: 0,
      totalEdges: 0,
      nodesByType: {} as Record<NodeType, number>,
      edgesByType: {} as Record<EdgeType, number>,
    },
  },
  bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
}

export interface CityLayoutResult {
  /** Computed position for each node by ID (flattened from hierarchical result) */
  positions: Map<string, Position3D>
  /** District arc metadata from the radial layout */
  districtArcs: DistrictArcMetadata[]
  /** Bounding box enclosing all positioned nodes */
  bounds: BoundingBox
  /** Ground plane width derived from bounds */
  groundWidth: number
  /** Ground plane depth derived from bounds */
  groundDepth: number
  /** Hierarchical district layouts with blocks and children */
  districts: DistrictLayout[]
  /** External infrastructure zone layouts */
  externalZones: ExternalZoneLayout[]
}

/**
 * Computes the radial city layout for a graph.
 *
 * Memoized on `[graph, layoutDensity]`. Publishes positions to the
 * canvas store so camera flight can use them.
 *
 * Uses flattenHierarchicalLayout() to produce a flat position map from
 * the two-phase hierarchical result.
 */
export function useCityLayout(): CityLayoutResult & { graph: IVMGraph } {
  const resolver = useCanvasStore((s) => s.resolver)
  const layoutDensity = useCanvasStore((s) => s.layoutDensity)
  const setLayoutPositions = useCanvasStore((s) => s.setLayoutPositions)
  const lodLevel = useCanvasStore((s) => s.lodLevel)
  const focusedGroupId = useCanvasStore((s) => s.focusedGroupId)
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)

  const graph = useMemo(() => {
    if (!resolver) return EMPTY_GRAPH

    // All LOD levels use the Symbol tier (file + class/function nodes) so that
    // 3D buildings are always visible in V2 mode. FileBlock ground planes render
    // for the file nodes; class/function nodes render as buildings inside them.
    //
    // Visual LOD differentiation comes from rendering detail (signs, labels, edge
    // visibility), not from switching to coarser tier graphs. The File and Module
    // tiers only produce flat FileBlock ground planes in V2 mode with no buildings,
    // making LOD 1/2/3 appear empty.
    if (lodLevel <= 2) return resolver.getTier(SemanticTier.Symbol)
    if (lodLevel === 3) {
      if (!focusedGroupId) return resolver.getTier(SemanticTier.Symbol)
      return resolver.getView({ baseTier: SemanticTier.Symbol, expand: [focusedGroupId] }).graph
    }
    // lodLevel === 4
    if (!selectedNodeId) return resolver.getTier(SemanticTier.Symbol)
    return resolver.getView({ baseTier: SemanticTier.Symbol, focalNodeId: selectedNodeId }).graph
  }, [resolver, lodLevel, focusedGroupId, selectedNodeId])

  const layout = useMemo(
    () =>
      withSpan('ui.layout.compute', { node_count: graph.nodes.length }, () => {
        const engine = new RadialCityLayoutEngine()
        const result = engine.layout(graph, { density: layoutDensity })
        const flatPositions = flattenHierarchicalLayout(result)
        return { ...result, flatPositions }
      }),
    [graph, layoutDensity]
  )

  // Publish flattened layout positions to store so camera flight can use them
  useEffect(() => {
    setLayoutPositions(layout.flatPositions)
  }, [layout.flatPositions, setLayoutPositions])

  // Centroid computation: determine closest module group to camera and set focusedGroupId
  const setFocusedGroupId = useCanvasStore((s) => s.setFocusedGroupId)
  const parseResult = useCanvasStore((s) => s.parseResult)
  const cameraPosition = useCanvasStore((s) => s.camera.position)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!parseResult || !layout.flatPositions.size) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      function getModuleGroups(root: GroupNode): GroupNode[] {
        if (root.tier === SemanticTier.Module) return [root]
        return root.children.flatMap(getModuleGroups)
      }

      const moduleGroups = getModuleGroups(parseResult.hierarchy.root)
      let closestId: string | null = null
      let closestDist = Infinity

      for (const group of moduleGroups) {
        const groupPositions = group.nodeIds
          .map((id) => layout.flatPositions.get(id))
          .filter(Boolean) as { x: number; y: number; z: number }[]
        if (!groupPositions.length) continue

        const cx = groupPositions.reduce((s, p) => s + p.x, 0) / groupPositions.length
        const cy = groupPositions.reduce((s, p) => s + p.y, 0) / groupPositions.length
        const cz = groupPositions.reduce((s, p) => s + p.z, 0) / groupPositions.length

        const dx = cameraPosition.x - cx
        const dy = cameraPosition.y - cy
        const dz = cameraPosition.z - cz
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

        if (dist < closestDist) {
          closestDist = dist
          closestId = group.id
        }
      }

      setFocusedGroupId(closestId)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [layout.flatPositions, parseResult, cameraPosition, setFocusedGroupId])

  const groundWidth = layout.bounds.max.x - layout.bounds.min.x
  const groundDepth = layout.bounds.max.z - layout.bounds.min.z
  const districtArcs = (layout.metadata?.districtArcs ?? []) as DistrictArcMetadata[]

  return {
    positions: layout.flatPositions,
    districtArcs,
    bounds: layout.bounds,
    groundWidth,
    groundDepth,
    districts: layout.districts,
    externalZones: layout.externalZones,
    graph,
  }
}
