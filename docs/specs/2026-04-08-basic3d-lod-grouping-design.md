# Basic3D LOD Grouping — Design Spec

## Problem

The Basic3D layout has only two visual modes: big cluster blobs (LOD 1–2) and every individual node at once (LOD 3–4). The jump between them is too abrupt — zooming in goes from "a few translucent spheres" to "hundreds of individual nodes" in one step. LOD 1 and LOD 2 are also visually identical (both render ClusterLayer).

## Solution

Introduce graduated node-type visibility across all four LOD levels. Each zoom step reveals one layer of the type hierarchy — containers, then structural definitions, then leaf implementations. Only the cluster blob view remains at LOD 1. Every subsequent level adds a distinct set of node types.

## LOD Tiers

| LOD | Camera distance | What you see |
|-----|----------------|--------------|
| 1 | > 120 | ClusterLayer blobs (unchanged) |
| 2 | 60–120 | Container nodes: `repository`, `package`, `namespace`, `module`, `directory` |
| 3 | 25–60 | + Structural nodes: `file`, `class`, `interface`, `type` — labels visible |
| 4 | < 25 | + Leaf nodes: `function`, `method`, `variable`, `enum` |

Each LOD level is a strict superset of the previous (except LOD 1 which is cluster-only).

## Node Sizes by LOD

| LOD | Node type | Shape | Size |
|-----|-----------|-------|------|
| 1 | *all* | Cluster blob (sphere proxy) | radius 5–20 (dynamic) |
| 2 | `repository` | Very large box | 2×2×2 |
| 2 | `package` | Large box | 1.5×1.5×1.5 |
| 2 | `namespace` | Torus | ring r=0.7 |
| 2 | `module` | Disc | r=1, h=0.2 |
| 2 | `directory` | Large disc | r=1.5, h=0.2 |
| 3 | *(all LOD 2)* + labels | same shapes | same sizes |
| 3 | `file` | Disc | r=1, h=0.2 |
| 3 | `class` | Box | 1×1×1 |
| 3 | `interface` | Icosahedron | r=0.7 |
| 3 | `type` | Icosahedron | r=0.7 |
| 4 | *(all LOD 3)* | same shapes | same sizes |
| 4 | `function` | Sphere | r=0.7 |
| 4 | `method` | Small sphere | r=0.5 |
| 4 | `variable` | Octahedron | r=0.7 |
| 4 | `enum` | Cylinder | r=0.5, h=1 |

## Implementation

### Approach

Render-time type filter — no store changes, no layout algorithm changes. All node positions are still computed by BFS for all nodes. The filter is applied purely in the renderer.

### Files changed (3 total, no new files)

**`basic3dShapes.ts`** — add type group sets and a helper:

```ts
export const CONTAINER_TYPES = new Set<NodeType>([
  'repository', 'package', 'namespace', 'module', 'directory',
])

export const STRUCTURAL_TYPES = new Set<NodeType>([
  ...CONTAINER_TYPES,
  'file', 'class', 'interface', 'type',
])

export function isNodeVisibleAtLod(node: IVMNode, lod: number): boolean {
  if (lod >= 4) return true
  if (lod === 3) return STRUCTURAL_TYPES.has(node.type)
  if (lod === 2) return CONTAINER_TYPES.has(node.type)
  return false // LOD 1: no individual nodes, only clusters
}
```

**`Basic3DView.tsx`** — replace the two-branch render with four branches:

- **LOD 1** → `<ClusterLayer />` (unchanged)
- **LOD 2** → nodes filtered by `isNodeVisibleAtLod(node, 2)`, edges only when both endpoints pass the filter, no labels
- **LOD 3** → nodes filtered by `isNodeVisibleAtLod(node, 3)`, same edge rule, `showLabel={true}`
- **LOD 4** → all nodes + all edges (existing behavior), `showLabel={true}`

**Edge rule at LOD 2–3:** an edge renders only if both `source` and `target` nodes pass `isNodeVisibleAtLod`. No re-stitching.

**`Basic3DNode.tsx`** — add optional `showLabel` prop (default `false`). When true, renders a `<Text>` billboard with `node.metadata.name` positioned below the shape (same pattern as `ClusterProxy`).

## Testing

- **`isNodeVisibleAtLod`** — all 5 container types visible at LOD 2+; all 4 structural types visible at LOD 3+ but not LOD 2; all 4 leaf types visible at LOD 4 only; LOD 1 returns false for all individual nodes
- **`Basic3DView` at LOD 2** — only container nodes rendered; structural and leaf nodes absent; edges to non-container endpoints absent; no labels
- **`Basic3DView` at LOD 3** — container + structural nodes rendered; leaf nodes absent; labels visible
- **`Basic3DView` at LOD 4** — all nodes rendered (existing test coverage)
- **`Basic3DNode` with `showLabel`** — label text matches `node.metadata.name`; no label when false

## Out of Scope

- Count badges on structural nodes showing hidden child counts
- Camera distance threshold tuning
- Animation/crossfade between LOD levels
- Scaling up container nodes for LOD 2 legibility (can follow if needed after seeing it)
