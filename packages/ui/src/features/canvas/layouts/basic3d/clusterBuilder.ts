/**
 * clusterBuilder.ts
 *
 * Pure function that groups IVM nodes into clusters for LOD 1–2 rendering.
 *
 * Grouping strategy (priority order):
 *   1. metadata.properties.module (explicit module tag)
 *   2. Parent directory of metadata.path
 *   3. BFS depth band (depth 0–1, 2–3, 4–5, …) — fallback for flat graphs
 */

import type { IVMGraph, IVMNode, Position3D } from '@diagram-builder/core'

// ---------------------------------------------------------------------------
// ClusterData — defined here, re-exported from store.ts
// ---------------------------------------------------------------------------

export interface ClusterData {
  id: string // e.g. "cluster:src/auth"
  label: string // e.g. "auth (12)"
  nodeIds: string[]
  centroid: Position3D
  radius: number // bounding sphere radius of member positions
  dominantType: string // most common node type (drives proxy colour)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parentDir(filePath: string): string {
  const parts = filePath.replace(/\\/g, '/').split('/')
  parts.pop() // remove filename
  return parts.join('/') || '.'
}

function depth(node: IVMNode): number {
  const d = node.metadata.properties?.['depth']
  return typeof d === 'number' ? d : 0
}

function depthBand(node: IVMNode): number {
  return Math.floor(depth(node) / 2)
}

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

function groupNodes(nodes: IVMNode[]): Map<string, IVMNode[]> {
  const groups = new Map<string, IVMNode[]>()

  const hasModule = nodes.some((n) => typeof n.metadata.properties?.['module'] === 'string')
  const hasPathStructure =
    !hasModule && new Set(nodes.map((n) => parentDir(n.metadata.path))).size > 1

  for (const node of nodes) {
    let key: string

    if (hasModule) {
      const mod = node.metadata.properties?.['module']
      key = `cluster:${typeof mod === 'string' ? mod : '__unknown__'}`
    } else if (hasPathStructure) {
      key = `cluster:${parentDir(node.metadata.path)}`
    } else {
      key = `cluster:band-${depthBand(node)}`
    }

    const group = groups.get(key) ?? []
    group.push(node)
    groups.set(key, group)
  }

  return groups
}

function clusterLabel(key: string, count: number): string {
  const name =
    key
      .replace(/^cluster:/, '')
      .split('/')
      .pop() ?? key
  return `${name} (${count})`
}

function computeDominantType(nodes: IVMNode[]): string {
  const counts = new Map<string, number>()
  for (const n of nodes) {
    counts.set(n.type, (counts.get(n.type) ?? 0) + 1)
  }
  let best = 'file'
  let bestCount = 0
  for (const [type, count] of counts) {
    if (count > bestCount) {
      best = type
      bestCount = count
    }
  }
  return best
}

function computeCluster(
  key: string,
  members: IVMNode[],
  positions: Map<string, Position3D>
): ClusterData {
  const memberPositions = members
    .map((n) => positions.get(n.id))
    .filter((p): p is Position3D => p !== undefined)

  const centroid: Position3D = { x: 0, y: 0, z: 0 }
  if (memberPositions.length > 0) {
    for (const p of memberPositions) {
      centroid.x += p.x
      centroid.y += p.y
      centroid.z += p.z
    }
    centroid.x /= memberPositions.length
    centroid.y /= memberPositions.length
    centroid.z /= memberPositions.length
  }

  let radius = 0
  for (const p of memberPositions) {
    const dx = p.x - centroid.x
    const dy = p.y - centroid.y
    const dz = p.z - centroid.z
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
    if (dist > radius) radius = dist
  }

  return {
    id: key,
    label: clusterLabel(key, members.length),
    nodeIds: members.map((n) => n.id),
    centroid,
    radius,
    dominantType: computeDominantType(members),
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildClusters(
  graph: IVMGraph,
  positions: Map<string, Position3D>
): Map<string, ClusterData> {
  const groups = groupNodes(graph.nodes)
  const clusters = new Map<string, ClusterData>()
  for (const [key, members] of groups) {
    clusters.set(key, computeCluster(key, members, positions))
  }
  return clusters
}
