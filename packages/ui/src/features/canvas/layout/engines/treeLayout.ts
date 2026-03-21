import type { IVMGraph, Position3D } from '../../../../shared/types'
import type { LayoutEngine, LayoutResult, LayoutConfig, BoundingBox } from '../types'

const VERTICAL_SPACING = 8
const HORIZONTAL_SPACING = 6

/**
 * Top-down tree layout engine.
 *
 * Groups nodes by depth level. Root nodes (depth 0) sit at y=0.
 * Each additional depth level drops by VERTICAL_SPACING.
 * Nodes at the same depth are spread evenly along the x axis.
 */
export class TreeLayoutEngine implements LayoutEngine {
  readonly type = 'tree'

  layout(graph: IVMGraph, _config: LayoutConfig): LayoutResult {
    const positions = new Map<string, Position3D>()

    // Group nodes by depth
    const byDepth = new Map<number, string[]>()
    for (const node of graph.nodes) {
      const d = (node.metadata.properties?.depth as number | undefined) ?? 0
      if (!byDepth.has(d)) byDepth.set(d, [])
      const ids = byDepth.get(d)
      if (ids) ids.push(node.id)
    }

    // Position each depth level
    for (const [depth, nodeIds] of byDepth.entries()) {
      const count = nodeIds.length
      const totalWidth = (count - 1) * HORIZONTAL_SPACING
      nodeIds.forEach((id, i) => {
        positions.set(id, {
          x: -totalWidth / 2 + i * HORIZONTAL_SPACING,
          y: depth === 0 ? 0 : -depth * VERTICAL_SPACING,
          z: 0,
        })
      })
    }

    // Compute bounds
    const allPositions = Array.from(positions.values())
    const xs = allPositions.map((p) => p.x)
    const ys = allPositions.map((p) => p.y)
    const bounds: BoundingBox = {
      min: { x: Math.min(...xs), y: Math.min(...ys), z: 0 },
      max: { x: Math.max(...xs), y: Math.max(...ys), z: 0 },
    }

    return { positions, bounds }
  }

  canHandle(_graph: IVMGraph): boolean {
    return true
  }
}
