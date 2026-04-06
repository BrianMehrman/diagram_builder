# 3D Performance & LOD Improvement Design

**Date:** 2026-04-05
**Status:** Draft

## Problem Statement

The Basic3D canvas has two compounding issues:

1. **Loading lag** — blank canvas while layout computes on the main thread, followed by all nodes appearing at once (freeze-and-pop)
2. **LOD not map-like** — all four LOD levels render every node using `SemanticTier.Symbol`; zooming out doesn't reduce rendered objects, zooming in doesn't reveal richer detail

The system must work well across graph sizes: small (<100 nodes), medium (100–500), and large (500–2000+).

---

## Goals

- Something visible on screen immediately (no blank canvas)
- Nodes appear progressively in BFS order (entry points first)
- At LOD 1–2 (zoomed out): clusters replace individual nodes — one proxy per module group
- At LOD 3–4 (zoomed in): individual nodes with progressive edge reveal
- Clicking a cluster flies the camera in to reveal its members
- Graceful degradation when workers are unavailable
- No changes to city layout, LOD calculator, camera controller, or existing tests

---

## Architecture Overview

Two independent phases, each shippable separately.

```
Phase 1: Web Worker + Batched Streaming
  └─ Fixes: blank canvas + freeze-and-pop

Phase 2: Cluster LOD
  └─ Fixes: LOD not map-like
```

Both phases share a new `LayoutWorker` abstraction. All existing code outside `layouts/basic3d/` is untouched.

---

## Phase 1: Web Worker + Batched Streaming

### Worker Contract

**File:** `packages/ui/src/features/canvas/layouts/basic3d/workers/layoutWorker.ts`

The worker accepts a serialized graph and streams results back in BFS depth-level batches:

```typescript
// Input
{ type: 'COMPUTE_LAYOUT'; graph: SerializedGraph; config: RadialTreeConfig }

// Outputs
{ type: 'LAYOUT_BATCH'; positions: Array<{ id: string; position: Position3D }>; batchIndex: number; totalNodes: number }
{ type: 'LAYOUT_COMPLETE'; bounds: LayoutBounds; maxDepth: number }
{ type: 'LAYOUT_ERROR'; message: string }
```

Positions are emitted one message per BFS depth level — depth 0 first (entry points), then depth 1, etc. Entry points appear on screen before their dependencies.

### Graph Serialization

**File:** `packages/ui/src/features/canvas/layouts/basic3d/serializeGraph.ts`

`ParseResult` may contain class instances that fail the structured clone algorithm. A `serializeGraph(parseResult: ParseResult): SerializedGraph` utility strips it to plain objects before `postMessage`. This runs on the main thread and is O(n).

### Hook Changes (`useBasic3DLayout`)

1. On graph change: serialize graph, spawn worker, set `layoutState: 'computing'`
2. On each `LAYOUT_BATCH`: merge positions into `layoutPositions` store, update `layoutProgress`
3. On `LAYOUT_COMPLETE`: set `layoutState: 'ready'`, trigger camera auto-fit
4. On `LAYOUT_ERROR`: log warning, fall back to synchronous `buildRadialTree` on main thread

The synchronous fallback preserves today's behavior exactly — no regression for environments that block workers.

### Loading State

While `layoutState === 'computing'`, `Basic3DView` renders:
- A centered `<Text>` label: "Loading… (N nodes)" where N is the total from the first batch message
- A pulsing ring at origin

No blank canvas.

### Batched Streaming & Rendering

The worker emits one message per BFS depth level. Zustand batches React re-renders, so each depth level triggers one render pass — not one per node. For a graph with depth 8 and 500 nodes: ~8 render passes total.

### Store Additions (Phase 1)

```typescript
layoutState: 'idle' | 'computing' | 'ready' | 'error'
layoutProgress: number  // 0.0–1.0, drives loading indicator
```

---

## Phase 2: Cluster LOD

### Cluster Definition

Clusters are computed inside the same worker, alongside layout, at zero extra main-thread cost.

**Grouping strategy (priority order):**
1. `metadata.properties.module` if present
2. Parent directory of `metadata.filePath`
3. BFS depth bands (fallback for graphs with no file metadata): depth 0–1 = cluster A, depth 2–3 = cluster B, etc.

**Cluster data shape:**
```typescript
interface ClusterData {
  id: string          // e.g. "cluster:src/auth"
  label: string       // "auth (12)"
  nodeIds: string[]
  centroid: Position3D
  radius: number      // bounding sphere radius of member positions
  dominantType: string // most common node type (drives proxy color)
}
```

### LOD Rendering Split

| LOD Level | Distance | Renders |
|-----------|----------|---------|
| 1 | > 120 | `ClusterLayer` only |
| 2 | 60–120 | `ClusterLayer` only |
| 3 | 25–60 | `NodeLayer` (no edges) |
| 4 | < 25 | `NodeLayer` + edges |

`Basic3DView` reads `lodLevel` from the store and renders either `<ClusterLayer>` or `<NodeLayer>` — never both simultaneously.

### Cluster Proxy Geometry

Each cluster in `ClusterLayer` renders:
- A translucent sphere at `centroid`, scaled to `radius` (opacity 0.25, color derived from `dominantType`)
- A `<Text>` label at centroid: cluster name + node count
- At LOD 2 only: member positions as a `Points` geometry (one draw call for all dots in the cluster)

### LOD Transition

When LOD crosses the 2→3 boundary (with existing hysteresis), `ClusterLayer` fades out (opacity lerped to 0 over 300ms via `useFrame`) while `NodeLayer` fades in. No new animation library. The lerp factor and duration are constants in a new `lodTransition.ts` config file.

### Click Behavior

Clicking a cluster proxy at LOD 1–2 triggers a fly-to: the camera navigates to the cluster's centroid at a zoom level that crosses into LOD 3, revealing individual nodes. This reuses the existing `pendingFlyToNodeId` flight mechanism, extended to also accept a `Position3D` target directly (`pendingFlyToPosition`).

### Store Additions (Phase 2)

```typescript
clusters: Map<string, ClusterData>        // populated by worker alongside positions
pendingFlyToPosition: Position3D | null   // extend existing flight mechanism
```

---

## New Files

```
packages/ui/src/features/canvas/layouts/basic3d/
  ├─ workers/
  │   └─ layoutWorker.ts       Worker entry point
  ├─ serializeGraph.ts         ParseResult → plain objects
  ├─ clusterBuilder.ts         Pure cluster computation (runs inside worker)
  ├─ ClusterLayer.tsx          Proxy sphere rendering
  └─ lodTransition.ts          Transition timing constants
```

**Modified (additions only):** `Basic3DView.tsx` (LOD switch between ClusterLayer/NodeLayer), `useBasic3DLayout.ts` (worker integration), `store.ts` (new state fields).

**Unchanged:** `Basic3DNode.tsx`, `Basic3DEdge.tsx`, `radialTree.ts`, all city layout files, `useLodCalculator.ts`.

---

## Error Handling

| Failure | Behavior |
|---------|----------|
| Worker unavailable | Synchronous fallback, no clusters, all nodes at all LOD levels |
| Serialization failure | Caught before `postMessage`, immediate synchronous fallback |
| Cluster computation failure | Skip clusters, render all nodes at all LOD levels |
| Worker takes >5s | Show "Taking longer than expected…" in loading state |

---

## Testing

| Area | Approach |
|------|----------|
| `serializeGraph` | Unit: round-trip fidelity, class instances stripped |
| `clusterBuilder` | Unit: correct centroid, radius, depth-band fallback |
| `layoutWorker` | Integration: vitest worker harness, verify batch ordering and `LAYOUT_COMPLETE` |
| `useBasic3DLayout` | Extend existing hook tests with mock worker responses |
| `ClusterLayer` | R3F render tests: correct proxy count at LOD 1/2, absent at LOD 3/4 |
| LOD transition | Add opacity lerp tests to existing `useLodCalculator` test suite |
| Fallback path | Simulate worker failure, assert synchronous path runs and scene renders |

No new test infrastructure required — vitest supports workers natively.

---

## Out of Scope

- City layout changes
- `InstancedMesh` optimization (future phase — Phase 1/2 already handles 2000+ nodes via culling through cluster LOD)
- LOD changes to the city view
- Geometry complexity switching (low-poly ↔ high-poly meshes) — visual distinction achieved through cluster vs individual rendering
