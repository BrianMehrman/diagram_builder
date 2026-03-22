/**
 * radialTree.ts
 *
 * Pure function that computes 3D positions for nodes using a radial BFS tree layout.
 * Entry points are placed on a Fibonacci sphere shell; children are placed on
 * progressively larger shells, distributed within their parent's solid-angle sector.
 */

import type { IVMGraph, Position3D } from '@diagram-builder/core'

// =============================================================================
// Public types
// =============================================================================

export interface RadialTreeOptions {
  /** Distance between depth shells (e.g., 30) */
  depthSpacing: number
  /** Radius of the root sphere shell (e.g., 5) */
  rootRadius: number
}

export interface RadialTreeResult {
  positions: Map<string, Position3D>
  bounds: { min: Position3D; max: Position3D }
  maxDepth: number
}

// =============================================================================
// Helpers
// =============================================================================

const TWO_PI = 2 * Math.PI
const GOLDEN = (1 + Math.sqrt(5)) / 2

/**
 * Distribute `n` points evenly on a sphere of `radius` using Fibonacci sampling.
 * Returns an array of Position3D in index order.
 */
function fibonacciSphere(n: number, radius: number): Position3D[] {
  if (n === 0) return []
  if (n === 1) {
    return [{ x: radius, y: 0, z: 0 }]
  }
  const pts: Position3D[] = []
  for (let i = 0; i < n; i++) {
    const theta = TWO_PI * (i / GOLDEN)
    const phi = Math.acos(1 - (2 * (i + 0.5)) / n)
    pts.push({
      x: radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.cos(phi),
      z: radius * Math.sin(phi) * Math.sin(theta),
    })
  }
  return pts
}

/**
 * Convert a Cartesian position to spherical (r, theta, phi).
 */
function toSpherical(p: Position3D): { r: number; theta: number; phi: number } {
  const r = Math.sqrt(p.x ** 2 + p.y ** 2 + p.z ** 2)
  if (r < 1e-9) return { r: 0, theta: 0, phi: 0 }
  return {
    r,
    theta: Math.atan2(p.z, p.x),
    phi: Math.acos(Math.max(-1, Math.min(1, p.y / r))),
  }
}

/**
 * Convert spherical to Cartesian.
 */
function fromSpherical(r: number, theta: number, phi: number): Position3D {
  return {
    x: r * Math.sin(phi) * Math.cos(theta),
    y: r * Math.cos(phi),
    z: r * Math.sin(phi) * Math.sin(theta),
  }
}

/**
 * Place `count` children within a solid-angle sector centred on `parentPos`.
 * The sector half-angle is `sectorHalfAngle`. Children are distributed using
 * Fibonacci-like subdivision within that sector.
 */
function placeChildrenInSector(
  count: number,
  radius: number,
  parentPos: Position3D,
  sectorHalfAngle: number
): Position3D[] {
  if (count === 0) return []

  const { theta: cTheta, phi: cPhi } = toSpherical(parentPos)

  if (count === 1) {
    return [fromSpherical(radius, cTheta, cPhi)]
  }

  // Distribute children using Fibonacci subdivision within the sector
  const pts: Position3D[] = []
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1) // 0..1
    // Spread phi within [cPhi - half, cPhi + half], clamped to [0, PI]
    const phi = Math.max(
      0,
      Math.min(Math.PI, cPhi + (t - 0.5) * 2 * sectorHalfAngle)
    )
    // Spread theta using golden-ratio steps
    const theta = cTheta + (i / GOLDEN) * sectorHalfAngle * 2
    pts.push(fromSpherical(radius, theta, phi))
  }
  return pts
}

// =============================================================================
// Main export
// =============================================================================

export function buildRadialTree(
  graph: IVMGraph,
  options: RadialTreeOptions
): RadialTreeResult {
  const { depthSpacing, rootRadius } = options
  const positions = new Map<string, Position3D>()

  if (graph.nodes.length === 0) {
    return {
      positions,
      bounds: {
        min: { x: 0, y: 0, z: 0 },
        max: { x: 0, y: 0, z: 0 },
      },
      maxDepth: 0,
    }
  }

  // ------------------------------------------------------------------
  // Step 1: Identify entry points
  // ------------------------------------------------------------------

  // Nodes with metadata.properties.depth === 0
  const depthZeroNodes = graph.nodes.filter(
    (n) => n.metadata.properties?.['depth'] === 0
  )

  let entryNodeIds: string[]
  if (depthZeroNodes.length > 0) {
    entryNodeIds = depthZeroNodes.map((n) => n.id)
  } else {
    // Fall back: nodes with no incoming edges
    const hasIncoming = new Set<string>()
    for (const edge of graph.edges) {
      hasIncoming.add(edge.target)
    }
    const noIncoming = graph.nodes.filter((n) => !hasIncoming.has(n.id))
    if (noIncoming.length > 0) {
      entryNodeIds = noIncoming.map((n) => n.id)
    } else {
      // Fully cyclic — use first node
      entryNodeIds = [graph.nodes[0]!.id]
    }
  }

  // ------------------------------------------------------------------
  // Step 2: Place entry nodes on root sphere using Fibonacci sampling
  // ------------------------------------------------------------------

  const rootPositions = fibonacciSphere(entryNodeIds.length, rootRadius)
  for (let i = 0; i < entryNodeIds.length; i++) {
    positions.set(entryNodeIds[i]!, rootPositions[i]!)
  }

  // ------------------------------------------------------------------
  // Step 3: BFS outward
  // ------------------------------------------------------------------

  // Build adjacency: source → [targets]
  const adjacency = new Map<string, string[]>()
  for (const node of graph.nodes) {
    adjacency.set(node.id, [])
  }
  for (const edge of graph.edges) {
    const list = adjacency.get(edge.source)
    if (list !== undefined) list.push(edge.target)
  }

  // BFS state
  const visited = new Set<string>(entryNodeIds)
  const bfsDepth = new Map<string, number>()
  for (const id of entryNodeIds) bfsDepth.set(id, 0)

  // Queue: [nodeId]
  let queue: string[] = [...entryNodeIds]
  let maxDepth = 0

  // Track extra parent positions for nodes visited AFTER initial placement
  // (second-wave shared dependencies — placed at centroid after BFS completes)
  const extraParentAccum = new Map<string, Position3D[]>()

  while (queue.length > 0) {
    const nextQueue: string[] = []

    // Collect all (childId → [parentIds]) for this BFS level in one pass.
    // A child appearing under multiple parents in the same wave = shared dependency.
    const childToParentIds = new Map<string, string[]>()
    for (const nodeId of queue) {
      const children = adjacency.get(nodeId) ?? []
      for (const childId of children) {
        if (!visited.has(childId)) {
          const parents = childToParentIds.get(childId) ?? []
          parents.push(nodeId)
          childToParentIds.set(childId, parents)
        } else {
          // Node was placed in a prior BFS wave — accumulate extra parent pos
          const parentPos = positions.get(nodeId)
          if (parentPos !== undefined) {
            const accum = extraParentAccum.get(childId) ?? []
            accum.push(parentPos)
            extraParentAccum.set(childId, accum)
          }
        }
      }
    }

    // Mark all newly discovered children as visited atomically
    for (const childId of childToParentIds.keys()) {
      visited.add(childId)
    }

    // Sector sizing: based on total unique children at this level
    const totalChildrenAtLevel = childToParentIds.size

    const baseHalfAngle =
      totalChildrenAtLevel > 0
        ? Math.sqrt((2 * Math.PI) / totalChildrenAtLevel)
        : Math.PI / 4

    // Group single-parent children by their parent so siblings are spread across
    // the parent's sector rather than all placed at the same angular position.
    const singleParentGroups = new Map<string, string[]>() // parentId → [childId...]
    const multiParentChildren: [string, string[]][] = [] // [childId, parentIds][]

    for (const [childId, parentIds] of childToParentIds) {
      const parentDepth = bfsDepth.get(parentIds[0]!) ?? 0
      const childDepth = parentDepth + 1
      if (childDepth > maxDepth) maxDepth = childDepth
      bfsDepth.set(childId, childDepth)
      nextQueue.push(childId)

      if (parentIds.length === 1) {
        const pid = parentIds[0]!
        const group = singleParentGroups.get(pid) ?? []
        group.push(childId)
        singleParentGroups.set(pid, group)
      } else {
        multiParentChildren.push([childId, parentIds])
      }
    }

    // Place single-parent siblings as a group so each gets its own position
    for (const [parentId, siblingIds] of singleParentGroups) {
      const parentPos = positions.get(parentId)!
      const parentDepth = bfsDepth.get(parentId) ?? 0
      const childDepth = parentDepth + 1
      const childRadius = rootRadius + childDepth * depthSpacing

      const fraction = siblingIds.length / Math.max(totalChildrenAtLevel, 1)
      const sectorHalfAngle = Math.max(baseHalfAngle, fraction * Math.PI)

      const placed = placeChildrenInSector(
        siblingIds.length,
        childRadius,
        parentPos,
        sectorHalfAngle
      )
      for (let i = 0; i < siblingIds.length; i++) {
        positions.set(siblingIds[i]!, placed[i]!)
      }
    }

    // Place multi-parent children at centroid of their parents
    for (const [childId, parentIds] of multiParentChildren) {
      const parentDepth = bfsDepth.get(parentIds[0]!) ?? 0
      const childDepth = parentDepth + 1
      const childRadius = rootRadius + childDepth * depthSpacing
      void childRadius // radius computed for consistency; centroid handles placement

      const parentPositions = parentIds.map((pid) => positions.get(pid)!)
      const centroid: Position3D = { x: 0, y: 0, z: 0 }
      for (const p of parentPositions) {
        centroid.x += p.x
        centroid.y += p.y
        centroid.z += p.z
      }
      centroid.x /= parentPositions.length
      centroid.y /= parentPositions.length
      centroid.z /= parentPositions.length
      positions.set(childId, centroid)
    }

    queue = nextQueue
  }

  // Handle any nodes not reached by BFS (isolated nodes or unreachable cycles)
  for (const node of graph.nodes) {
    if (!positions.has(node.id)) {
      positions.set(node.id, { x: rootRadius, y: 0, z: 0 })
    }
  }

  // ------------------------------------------------------------------
  // Step 4: Centroid update for nodes reached again from a LATER BFS wave
  // ------------------------------------------------------------------

  for (const [nodeId, extraParents] of extraParentAccum) {
    const currentPos = positions.get(nodeId)
    if (currentPos === undefined || extraParents.length === 0) continue

    // Centroid of the node's current position plus all extra parent positions
    const allPositions = [currentPos, ...extraParents]
    const centroid: Position3D = { x: 0, y: 0, z: 0 }
    for (const p of allPositions) {
      centroid.x += p.x
      centroid.y += p.y
      centroid.z += p.z
    }
    centroid.x /= allPositions.length
    centroid.y /= allPositions.length
    centroid.z /= allPositions.length

    // Check for collision with any other node
    let collides = false
    for (const [otherId, otherPos] of positions) {
      if (otherId === nodeId) continue
      const dist = Math.sqrt(
        (centroid.x - otherPos.x) ** 2 +
          (centroid.y - otherPos.y) ** 2 +
          (centroid.z - otherPos.z) ** 2
      )
      if (dist < 0.001) {
        collides = true
        break
      }
    }

    if (collides) {
      // Deterministic jitter based on node id
      let seed = 0
      for (let c = 0; c < nodeId.length; c++) {
        seed = (seed * 31 + nodeId.charCodeAt(c)) >>> 0
      }
      const jitter = (n: number) => ((n % 1000) / 1000 - 0.5) * depthSpacing * 0.1
      centroid.x += jitter(seed)
      centroid.y += jitter(seed * 17 + 3)
      centroid.z += jitter(seed * 31 + 7)
    }

    positions.set(nodeId, centroid)
  }

  // ------------------------------------------------------------------
  // Step 5: Compute bounds
  // ------------------------------------------------------------------

  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity

  for (const pos of positions.values()) {
    if (pos.x < minX) minX = pos.x
    if (pos.y < minY) minY = pos.y
    if (pos.z < minZ) minZ = pos.z
    if (pos.x > maxX) maxX = pos.x
    if (pos.y > maxY) maxY = pos.y
    if (pos.z > maxZ) maxZ = pos.z
  }

  return {
    positions,
    bounds: {
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, y: maxY, z: maxZ },
    },
    maxDepth,
  }
}
