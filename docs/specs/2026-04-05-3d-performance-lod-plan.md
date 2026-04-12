# 3D Performance & LOD Improvement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate 3D loading lag (blank canvas + freeze-and-pop) and make the LOD system behave like zooming into a map (clusters at distance, individual nodes up close).

**Architecture:** Phase 1 moves `buildRadialTree` into a Web Worker so layout computation never blocks the main thread; a loading indicator shows immediately while the worker runs. Phase 2 adds a `ClusterLayer` that replaces individual node rendering at LOD 1–2 with one proxy sphere per module group, switching to `NodeLayer` (current rendering) at LOD 3–4.

**Tech Stack:** React Three Fiber, Zustand, Vite Web Workers (`new Worker(new URL(...))`), vitest (jsdom — workers are mocked in unit tests, not run natively)

---

## File Map

**Create:**
- `packages/ui/src/features/canvas/layouts/basic3d/workers/layoutWorker.ts` — worker entry; runs BFS + cluster computation, posts messages back
- `packages/ui/src/features/canvas/layouts/basic3d/serializeGraph.ts` — strips IVMGraph to structurally-clonable plain objects before `postMessage`
- `packages/ui/src/features/canvas/layouts/basic3d/clusterBuilder.ts` — pure cluster computation (module grouping, centroid, radius, dominant type)
- `packages/ui/src/features/canvas/layouts/basic3d/ClusterLayer.tsx` — R3F component rendering cluster proxies at LOD 1–2
- `packages/ui/src/features/canvas/layouts/basic3d/lodTransition.ts` — transition timing constants

**Modify:**
- `packages/ui/src/features/canvas/store.ts` — add `layoutState`, `layoutProgress`, `clusters`, `setLayoutState`, `setLayoutProgress`, `setClusters`
- `packages/ui/src/features/canvas/layouts/basic3d/useBasic3DLayout.ts` — spawn worker instead of calling `buildRadialTree` synchronously; fallback on error
- `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.tsx` — show loading state when `layoutState === 'computing'`; switch between `ClusterLayer` and `NodeLayer` based on `lodLevel`

**Test files:**
- `packages/ui/src/features/canvas/layouts/basic3d/serializeGraph.test.ts`
- `packages/ui/src/features/canvas/layouts/basic3d/clusterBuilder.test.ts`
- `packages/ui/src/features/canvas/layouts/basic3d/ClusterLayer.test.tsx`
- Extend: `packages/ui/src/features/canvas/layouts/basic3d/useBasic3DLayout.test.ts`
- Extend: `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.test.tsx`
- Extend: `packages/ui/src/features/canvas/store.test.ts`

---

## Task 1: Store additions — layoutState, layoutProgress, clusters

**Files:**
- Modify: `packages/ui/src/features/canvas/store.ts`
- Test: `packages/ui/src/features/canvas/store.test.ts`

- [ ] **Step 1: Write the failing tests**

Open `packages/ui/src/features/canvas/store.test.ts` and add at the bottom:

```typescript
describe('store — layout async state', () => {
  beforeEach(() => useCanvasStore.getState().reset())

  it('layoutState defaults to idle', () => {
    expect(useCanvasStore.getState().layoutState).toBe('idle')
  })

  it('setLayoutState updates layoutState', () => {
    useCanvasStore.getState().setLayoutState('computing')
    expect(useCanvasStore.getState().layoutState).toBe('computing')
  })

  it('layoutProgress defaults to 0', () => {
    expect(useCanvasStore.getState().layoutProgress).toBe(0)
  })

  it('setLayoutProgress updates layoutProgress', () => {
    useCanvasStore.getState().setLayoutProgress(0.5)
    expect(useCanvasStore.getState().layoutProgress).toBe(0.5)
  })

  it('clusters defaults to empty Map', () => {
    expect(useCanvasStore.getState().clusters.size).toBe(0)
  })

  it('setClusters replaces clusters', () => {
    const c = new Map([['cluster:auth', { id: 'cluster:auth', label: 'auth (3)', nodeIds: ['a','b','c'], centroid: { x: 0, y: 0, z: 0 }, radius: 10, dominantType: 'file' }]])
    useCanvasStore.getState().setClusters(c)
    expect(useCanvasStore.getState().clusters.size).toBe(1)
  })

  it('reset clears layoutState to idle and layoutProgress to 0', () => {
    useCanvasStore.getState().setLayoutState('computing')
    useCanvasStore.getState().setLayoutProgress(0.7)
    useCanvasStore.getState().reset()
    expect(useCanvasStore.getState().layoutState).toBe('idle')
    expect(useCanvasStore.getState().layoutProgress).toBe(0)
    expect(useCanvasStore.getState().clusters.size).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/store.test.ts 2>&1 | tail -20
```

Expected: `FAIL` — `layoutState`, `setLayoutState`, etc. not defined.

- [ ] **Step 3: Add LayoutState type and store state**

`ClusterData` is defined in `clusterBuilder.ts` (Task 3) to avoid circular imports. For Task 1, add only `LayoutState` and import `ClusterData` from clusterBuilder once Task 3 is done. For now, define a placeholder and update the import in Task 3.

In `packages/ui/src/features/canvas/store.ts`, add after the existing imports:

```typescript
import type { ClusterData } from './layouts/basic3d/clusterBuilder'
```

Add the type alias before `initialState`:

```typescript
/**
 * Layout computation state for async worker flow
 */
export type LayoutState = 'idle' | 'computing' | 'ready' | 'error'

// Re-export for consumers
export type { ClusterData }
```

In the `CanvasState` interface, add after `// Layout positions (computed by view renderers)`:

```typescript
  // Async layout state (worker flow)
  layoutState: LayoutState
  setLayoutState: (state: LayoutState) => void
  layoutProgress: number
  setLayoutProgress: (progress: number) => void
  clusters: Map<string, ClusterData>
  setClusters: (clusters: Map<string, ClusterData>) => void
```

In the `useCanvasStore` `create` call, add the initial values and actions after `setLayoutPositions`:

```typescript
  // Async layout state
  layoutState: 'idle' as LayoutState,
  setLayoutState: (state) => set({ layoutState: state }),
  layoutProgress: 0,
  setLayoutProgress: (progress) => set({ layoutProgress: progress }),
  clusters: new Map<string, ClusterData>(),
  setClusters: (clusters) => set({ clusters }),
```

In the `reset` action, add:

```typescript
      layoutState: 'idle' as LayoutState,
      layoutProgress: 0,
      clusters: new Map<string, ClusterData>(),
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/store.test.ts 2>&1 | tail -10
```

Expected: all store tests pass.

- [ ] **Step 5: Run CI checks**

```bash
cd /Users/brianmehrman/projects/diagram_builder
npm run type-check 2>&1 | tail -10
npm run lint 2>&1 | tail -10
npm run format:check 2>&1 | tail -5
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/brianmehrman/projects/diagram_builder
git add packages/ui/src/features/canvas/store.ts packages/ui/src/features/canvas/store.test.ts
git commit -m "feat(store): add layoutState, layoutProgress, clusters for async layout"
```

---

## Task 2: serializeGraph.ts — graph sanitiser before postMessage

**Files:**
- Create: `packages/ui/src/features/canvas/layouts/basic3d/serializeGraph.ts`
- Create: `packages/ui/src/features/canvas/layouts/basic3d/serializeGraph.test.ts`

**Context:** `IVMGraph` nodes are plain data objects (no class instances). `serializeGraph` is a safety wrapper that ensures nothing slips through that could fail `structuredClone`. It returns the same shape — the worker receives an `IVMGraph`.

- [ ] **Step 1: Write the failing tests**

Create `packages/ui/src/features/canvas/layouts/basic3d/serializeGraph.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { serializeGraph } from './serializeGraph'
import type { IVMGraph } from '@diagram-builder/core'

function makeGraph(overrides: Partial<IVMGraph> = {}): IVMGraph {
  return {
    nodes: [],
    edges: [],
    metadata: {
      name: 'test',
      schemaVersion: '1.0.0',
      generatedAt: '2026-01-01T00:00:00Z',
      rootPath: 'src/',
      languages: [],
      stats: {
        totalNodes: 0,
        totalEdges: 0,
        nodesByType: {} as never,
        edgesByType: {} as never,
      },
    },
    bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
    ...overrides,
  }
}

describe('serializeGraph', () => {
  it('returns an object that passes structuredClone without throwing', () => {
    const graph = makeGraph()
    const serialized = serializeGraph(graph)
    expect(() => structuredClone(serialized)).not.toThrow()
  })

  it('preserves node ids', () => {
    const graph = makeGraph({
      nodes: [{
        id: 'node-1',
        type: 'file',
        position: { x: 0, y: 0, z: 0 },
        lod: 3,
        metadata: { label: 'index.ts', path: 'src/index.ts', properties: {} },
      }],
    })
    const serialized = serializeGraph(graph)
    expect(serialized.nodes[0]?.id).toBe('node-1')
  })

  it('preserves edge source and target', () => {
    const graph = makeGraph({
      edges: [{
        id: 'e1',
        source: 'node-a',
        target: 'node-b',
        type: 'imports',
        metadata: {},
        lod: 0,
      }],
    })
    const serialized = serializeGraph(graph)
    expect(serialized.edges[0]?.source).toBe('node-a')
    expect(serialized.edges[0]?.target).toBe('node-b')
  })

  it('strips non-plain-object values from metadata properties', () => {
    const graph = makeGraph({
      nodes: [{
        id: 'node-1',
        type: 'file',
        position: { x: 0, y: 0, z: 0 },
        lod: 3,
        metadata: {
          label: 'index.ts',
          path: 'src/index.ts',
          // Simulate a class instance sneaking into properties
          properties: { depth: 1, dangerousMethod: () => {} },
        },
      }],
    })
    const serialized = serializeGraph(graph)
    // Should not throw
    expect(() => structuredClone(serialized)).not.toThrow()
    // depth preserved, function stripped
    expect(serialized.nodes[0]?.metadata.properties?.['depth']).toBe(1)
    expect(serialized.nodes[0]?.metadata.properties?.['dangerousMethod']).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/layouts/basic3d/serializeGraph.test.ts 2>&1 | tail -10
```

Expected: `FAIL` — `serializeGraph` not found.

- [ ] **Step 3: Implement serializeGraph.ts**

Create `packages/ui/src/features/canvas/layouts/basic3d/serializeGraph.ts`:

```typescript
/**
 * serializeGraph.ts
 *
 * Strips an IVMGraph to structurally-clonable plain objects before postMessage.
 * IVMGraph is already plain-object data, but this guards against any class
 * instances or functions that might slip into `metadata.properties`.
 */

import type { IVMGraph, IVMNode, IVMEdge } from '@diagram-builder/core'

function sanitizeProperties(
  props: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (props === undefined) return undefined
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(props)) {
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      result[key] = value
    }
    // Drop functions, class instances, symbols — not structuredClone-safe
  }
  return result
}

function sanitizeNode(node: IVMNode): IVMNode {
  return {
    ...node,
    metadata: {
      ...node.metadata,
      properties: sanitizeProperties(node.metadata.properties),
    },
  }
}

function sanitizeEdge(edge: IVMEdge): IVMEdge {
  return { ...edge, metadata: {} }
}

export function serializeGraph(graph: IVMGraph): IVMGraph {
  return {
    ...graph,
    nodes: graph.nodes.map(sanitizeNode),
    edges: graph.edges.map(sanitizeEdge),
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/layouts/basic3d/serializeGraph.test.ts 2>&1 | tail -10
```

Expected: all 4 tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/brianmehrman/projects/diagram_builder
git add packages/ui/src/features/canvas/layouts/basic3d/serializeGraph.ts packages/ui/src/features/canvas/layouts/basic3d/serializeGraph.test.ts
git commit -m "feat(basic3d): add serializeGraph utility for worker postMessage safety"
```

---

## Task 3: clusterBuilder.ts — pure cluster computation

**Files:**
- Create: `packages/ui/src/features/canvas/layouts/basic3d/clusterBuilder.ts`
- Create: `packages/ui/src/features/canvas/layouts/basic3d/clusterBuilder.test.ts`

**Context:** Takes an `IVMGraph` and its computed `positions: Map<string, Position3D>`, groups nodes by `metadata.properties.module` → `metadata.path` parent dir → BFS depth band (fallback), then computes centroid, bounding sphere radius, and dominant type for each cluster.

**Important — avoid circular imports:** `ClusterData` is defined in `clusterBuilder.ts` (not `store.ts`). `store.ts` imports `ClusterData` from `clusterBuilder.ts`. The worker imports `ClusterData` from `clusterBuilder.ts` directly.

- [ ] **Step 1: Write the failing tests**

Create `packages/ui/src/features/canvas/layouts/basic3d/clusterBuilder.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { buildClusters } from './clusterBuilder'
import type { IVMGraph, IVMNode, Position3D } from '@diagram-builder/core'

function makeNode(
  id: string,
  opts: { path?: string; module?: string; type?: IVMNode['type']; depth?: number } = {}
): IVMNode {
  return {
    id,
    type: opts.type ?? 'file',
    position: { x: 0, y: 0, z: 0 },
    lod: 3,
    metadata: {
      label: id,
      path: opts.path ?? `src/${id}.ts`,
      properties: {
        ...(opts.module !== undefined ? { module: opts.module } : {}),
        ...(opts.depth !== undefined ? { depth: opts.depth } : {}),
      },
    },
  }
}

function makeGraph(nodes: IVMNode[]): IVMGraph {
  return {
    nodes,
    edges: [],
    metadata: {
      name: 'test',
      schemaVersion: '1.0.0',
      generatedAt: '',
      rootPath: '',
      languages: [],
      stats: { totalNodes: nodes.length, totalEdges: 0, nodesByType: {} as never, edgesByType: {} as never },
    },
    bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
  }
}

function makePositions(nodes: IVMNode[], offsets: Position3D[] = []): Map<string, Position3D> {
  return new Map(nodes.map((n, i) => [n.id, offsets[i] ?? { x: i * 10, y: 0, z: 0 }]))
}

describe('buildClusters — module grouping (priority 1)', () => {
  it('groups nodes by metadata.properties.module', () => {
    const nodes = [
      makeNode('a', { module: 'auth' }),
      makeNode('b', { module: 'auth' }),
      makeNode('c', { module: 'payments' }),
    ]
    const positions = makePositions(nodes)
    const clusters = buildClusters(makeGraph(nodes), positions)

    expect(clusters.size).toBe(2)
    const auth = clusters.get('cluster:auth')
    expect(auth).toBeDefined()
    expect(auth!.nodeIds).toHaveLength(2)
    expect(auth!.label).toBe('auth (2)')
  })
})

describe('buildClusters — directory grouping (priority 2)', () => {
  it('groups nodes by parent directory when no module property', () => {
    const nodes = [
      makeNode('index', { path: 'src/auth/index.ts' }),
      makeNode('login', { path: 'src/auth/login.ts' }),
      makeNode('cart', { path: 'src/payments/cart.ts' }),
    ]
    const positions = makePositions(nodes)
    const clusters = buildClusters(makeGraph(nodes), positions)

    expect(clusters.size).toBe(2)
    const auth = clusters.get('cluster:src/auth')
    expect(auth).toBeDefined()
    expect(auth!.nodeIds).toHaveLength(2)
    expect(auth!.label).toBe('auth (2)')
  })
})

describe('buildClusters — depth-band fallback (priority 3)', () => {
  it('groups by depth bands when no path structure', () => {
    const nodes = [
      makeNode('a', { path: 'a', depth: 0 }),
      makeNode('b', { path: 'b', depth: 1 }),
      makeNode('c', { path: 'c', depth: 3 }),
      makeNode('d', { path: 'd', depth: 4 }),
    ]
    const positions = makePositions(nodes)
    const clusters = buildClusters(makeGraph(nodes), positions)

    // depth 0–1 = band 0, depth 2–3 = band 1, depth 4–5 = band 2
    expect(clusters.size).toBe(2)
  })
})

describe('buildClusters — centroid and radius', () => {
  it('centroid is the average of member positions', () => {
    const nodes = [
      makeNode('a', { module: 'grp' }),
      makeNode('b', { module: 'grp' }),
    ]
    const positions = new Map<string, Position3D>([
      ['a', { x: 0, y: 0, z: 0 }],
      ['b', { x: 10, y: 0, z: 0 }],
    ])
    const clusters = buildClusters(makeGraph(nodes), positions)
    const grp = clusters.get('cluster:grp')!
    expect(grp.centroid.x).toBeCloseTo(5)
    expect(grp.centroid.y).toBeCloseTo(0)
    expect(grp.centroid.z).toBeCloseTo(0)
  })

  it('radius is the max distance from centroid to any member', () => {
    const nodes = [
      makeNode('a', { module: 'grp' }),
      makeNode('b', { module: 'grp' }),
    ]
    const positions = new Map<string, Position3D>([
      ['a', { x: 0, y: 0, z: 0 }],
      ['b', { x: 10, y: 0, z: 0 }],
    ])
    const clusters = buildClusters(makeGraph(nodes), positions)
    const grp = clusters.get('cluster:grp')!
    // centroid = {5,0,0}, max dist = 5
    expect(grp.radius).toBeCloseTo(5)
  })
})

describe('buildClusters — dominantType', () => {
  it('dominantType is the most common node type in the cluster', () => {
    const nodes = [
      makeNode('a', { module: 'grp', type: 'file' }),
      makeNode('b', { module: 'grp', type: 'file' }),
      makeNode('c', { module: 'grp', type: 'class' }),
    ]
    const positions = makePositions(nodes)
    const clusters = buildClusters(makeGraph(nodes), positions)
    const grp = clusters.get('cluster:grp')!
    expect(grp.dominantType).toBe('file')
  })
})

describe('buildClusters — single node', () => {
  it('creates a cluster for a single-node module', () => {
    const nodes = [makeNode('only', { module: 'solo' })]
    const positions = makePositions(nodes)
    const clusters = buildClusters(makeGraph(nodes), positions)
    expect(clusters.size).toBe(1)
    expect(clusters.get('cluster:solo')!.nodeIds).toHaveLength(1)
    expect(clusters.get('cluster:solo')!.radius).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/layouts/basic3d/clusterBuilder.test.ts 2>&1 | tail -10
```

Expected: `FAIL` — `buildClusters` not found.

- [ ] **Step 3: Implement clusterBuilder.ts**

Create `packages/ui/src/features/canvas/layouts/basic3d/clusterBuilder.ts`:

```typescript
/**
 * clusterBuilder.ts
 *
 * Pure function that groups IVM nodes into clusters for LOD 1–2 rendering.
 * ClusterData is defined here (not in store) to avoid circular imports.
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
  id: string           // e.g. "cluster:src/auth"
  label: string        // e.g. "auth (12)"
  nodeIds: string[]
  centroid: Position3D
  radius: number       // bounding sphere radius of member positions
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

  // Check if any node has a module property
  const hasModule = nodes.some((n) => typeof n.metadata.properties?.['module'] === 'string')

  // Check if path structure is meaningful (more than one unique parent dir)
  const dirs = new Set(nodes.map((n) => parentDir(n.metadata.path)))
  const hasPathStructure = dirs.size > 1

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

// ---------------------------------------------------------------------------
// Cluster computation
// ---------------------------------------------------------------------------

function clusterLabel(key: string, count: number): string {
  // Strip "cluster:" prefix for display
  const name = key.replace(/^cluster:/, '').split('/').pop() ?? key
  return `${name} (${count})`
}

function dominantType(nodes: IVMNode[]): string {
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
    dominantType: dominantType(members),
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/layouts/basic3d/clusterBuilder.test.ts 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/brianmehrman/projects/diagram_builder
git add packages/ui/src/features/canvas/layouts/basic3d/clusterBuilder.ts packages/ui/src/features/canvas/layouts/basic3d/clusterBuilder.test.ts
git commit -m "feat(basic3d): add clusterBuilder — module/directory/depth-band grouping"
```

---

## Task 4: layoutWorker.ts — worker entry

**Files:**
- Create: `packages/ui/src/features/canvas/layouts/basic3d/workers/layoutWorker.ts`

**Context:** This file runs inside a Web Worker. It receives `COMPUTE_LAYOUT`, runs `buildRadialTree` + `buildClusters`, and posts results back. Positions (`Map`) are converted to arrays before `postMessage` (Maps aren't structurally clonable). The worker is **not unit-tested directly** (jsdom doesn't support workers); the hook (Task 5) mocks `Worker` in its tests. The worker logic itself is covered by the pure-function tests in Tasks 2 and 3.

- [ ] **Step 1: Create the worker**

Create `packages/ui/src/features/canvas/layouts/basic3d/workers/layoutWorker.ts`:

```typescript
/**
 * layoutWorker.ts
 *
 * Web Worker entry point for Basic3D layout computation.
 * Runs buildRadialTree + buildClusters off the main thread.
 *
 * Message protocol:
 *   In:  { type: 'COMPUTE_LAYOUT'; graph: IVMGraph; config: RadialTreeOptions }
 *   Out: { type: 'LAYOUT_BATCH'; positions: Array<{ id: string; position: Position3D }>; totalNodes: number }
 *        { type: 'LAYOUT_CLUSTERS'; clusters: Array<[string, ClusterData]> }
 *        { type: 'LAYOUT_COMPLETE'; bounds: RadialTreeResult['bounds']; maxDepth: number }
 *        { type: 'LAYOUT_ERROR'; message: string }
 */

import type { IVMGraph } from '@diagram-builder/core'
import { buildRadialTree } from '../radialTree'
import type { RadialTreeOptions } from '../radialTree'
import { buildClusters } from '../clusterBuilder'
import type { ClusterData } from '../clusterBuilder'
import type { Position3D } from '@diagram-builder/core'

// ---------------------------------------------------------------------------
// Worker message types (mirrored in useBasic3DLayout for type safety)
// ---------------------------------------------------------------------------

export interface ComputeLayoutMessage {
  type: 'COMPUTE_LAYOUT'
  graph: IVMGraph
  config: RadialTreeOptions
}

export interface LayoutBatchMessage {
  type: 'LAYOUT_BATCH'
  positions: Array<{ id: string; position: Position3D }>
  totalNodes: number
}

export interface LayoutClustersMessage {
  type: 'LAYOUT_CLUSTERS'
  clusters: Array<[string, ClusterData]>
}

export interface LayoutCompleteMessage {
  type: 'LAYOUT_COMPLETE'
  bounds: { min: Position3D; max: Position3D }
  maxDepth: number
}

export interface LayoutErrorMessage {
  type: 'LAYOUT_ERROR'
  message: string
}

export type WorkerOutMessage =
  | LayoutBatchMessage
  | LayoutClustersMessage
  | LayoutCompleteMessage
  | LayoutErrorMessage

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

self.onmessage = (event: MessageEvent<ComputeLayoutMessage>) => {
  const { type, graph, config } = event.data

  if (type !== 'COMPUTE_LAYOUT') return

  try {
    // 1. Run layout
    const result = buildRadialTree(graph, config)

    // 2. Convert Map → array (Maps are not structuredClone-safe)
    const positionsArray = Array.from(result.positions.entries()).map(([id, position]) => ({
      id,
      position,
    }))

    // 3. Send positions batch
    const batchMsg: LayoutBatchMessage = {
      type: 'LAYOUT_BATCH',
      positions: positionsArray,
      totalNodes: graph.nodes.length,
    }
    self.postMessage(batchMsg)

    // 4. Build and send clusters
    const clusters = buildClusters(graph, result.positions)
    const clustersMsg: LayoutClustersMessage = {
      type: 'LAYOUT_CLUSTERS',
      clusters: Array.from(clusters.entries()),
    }
    self.postMessage(clustersMsg)

    // 5. Signal completion
    const completeMsg: LayoutCompleteMessage = {
      type: 'LAYOUT_COMPLETE',
      bounds: result.bounds,
      maxDepth: result.maxDepth,
    }
    self.postMessage(completeMsg)
  } catch (err) {
    const errorMsg: LayoutErrorMessage = {
      type: 'LAYOUT_ERROR',
      message: err instanceof Error ? err.message : String(err),
    }
    self.postMessage(errorMsg)
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/brianmehrman/projects/diagram_builder
npm run type-check 2>&1 | tail -10
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/brianmehrman/projects/diagram_builder
git add packages/ui/src/features/canvas/layouts/basic3d/workers/layoutWorker.ts
git commit -m "feat(basic3d): add layoutWorker — BFS + cluster computation off main thread"
```

---

## Task 5: useBasic3DLayout.ts — worker integration

**Files:**
- Modify: `packages/ui/src/features/canvas/layouts/basic3d/useBasic3DLayout.ts`
- Extend: `packages/ui/src/features/canvas/layouts/basic3d/useBasic3DLayout.test.ts`

**Context:** Replace the synchronous `buildRadialTree` call with a Worker. On error, fall back to synchronous. The Worker is mocked in tests via `vi.mock` — jsdom doesn't run workers.

- [ ] **Step 1: Write the new failing tests**

Add to `packages/ui/src/features/canvas/layouts/basic3d/useBasic3DLayout.test.ts` after the existing `describe` blocks:

```typescript
// ---------------------------------------------------------------------------
// Worker integration tests
// ---------------------------------------------------------------------------

// Mock the Worker constructor
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  private _listeners = new Map<string, EventListenerOrEventListenerObject[]>()

  postMessage(_data: unknown) {
    // Simulate async response in next microtask
  }

  terminate() {}

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const list = this._listeners.get(type) ?? []
    list.push(listener)
    this._listeners.set(type, list)
  }

  removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    const list = this._listeners.get(type) ?? []
    this._listeners.set(type, list.filter((l) => l !== listener))
  }

  // Test helper: simulate a message from the worker
  simulateMessage(data: unknown) {
    const event = new MessageEvent('message', { data })
    if (this.onmessage) this.onmessage(event)
  }

  simulateError(message: string) {
    const event = new ErrorEvent('error', { message })
    if (this.onerror) this.onerror(event)
  }
}

let mockWorkerInstance: MockWorker | null = null
vi.stubGlobal('Worker', vi.fn(() => {
  mockWorkerInstance = new MockWorker()
  return mockWorkerInstance
}))

describe('useBasic3DLayout — worker flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useCanvasStore.getState().reset()
    mockRadialPositions.clear()
    mockMaxDepth = 0
    mockWorkerInstance = null
  })

  it('sets layoutState to computing when resolver is set', async () => {
    const resolver = makeMockResolver()
    await act(async () => {
      useCanvasStore.setState({ resolver, lodLevel: 1 })
      renderHook(() => useBasic3DLayout())
    })
    expect(useCanvasStore.getState().layoutState).toBe('computing')
  })

  it('sets layoutState to ready after LAYOUT_COMPLETE', async () => {
    const resolver = makeMockResolver()
    await act(async () => {
      useCanvasStore.setState({ resolver, lodLevel: 1 })
      renderHook(() => useBasic3DLayout())
    })

    await act(async () => {
      mockWorkerInstance?.simulateMessage({
        type: 'LAYOUT_BATCH',
        positions: [{ id: 'node-a', position: { x: 1, y: 2, z: 3 } }],
        totalNodes: 1,
      })
      mockWorkerInstance?.simulateMessage({
        type: 'LAYOUT_CLUSTERS',
        clusters: [],
      })
      mockWorkerInstance?.simulateMessage({
        type: 'LAYOUT_COMPLETE',
        bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 10, y: 10, z: 10 } },
        maxDepth: 2,
      })
    })

    expect(useCanvasStore.getState().layoutState).toBe('ready')
  })

  it('publishes positions to store after LAYOUT_BATCH', async () => {
    const resolver = makeMockResolver()
    await act(async () => {
      useCanvasStore.setState({ resolver, lodLevel: 1 })
      renderHook(() => useBasic3DLayout())
    })

    await act(async () => {
      mockWorkerInstance?.simulateMessage({
        type: 'LAYOUT_BATCH',
        positions: [{ id: 'node-x', position: { x: 5, y: 0, z: 0 } }],
        totalNodes: 1,
      })
    })

    expect(useCanvasStore.getState().layoutPositions.get('node-x')).toEqual({ x: 5, y: 0, z: 0 })
  })

  it('sets layoutState to error and falls back on LAYOUT_ERROR', async () => {
    const resolver = makeMockResolver()
    await act(async () => {
      useCanvasStore.setState({ resolver, lodLevel: 1 })
      renderHook(() => useBasic3DLayout())
    })

    await act(async () => {
      mockWorkerInstance?.simulateMessage({
        type: 'LAYOUT_ERROR',
        message: 'worker failed',
      })
    })

    // Falls back to synchronous buildRadialTree (already mocked)
    expect(useCanvasStore.getState().layoutState).toBe('ready')
  })

  it('terminates the worker on unmount', async () => {
    const resolver = makeMockResolver()
    let unmount: () => void
    await act(async () => {
      useCanvasStore.setState({ resolver, lodLevel: 1 })
      const result = renderHook(() => useBasic3DLayout())
      unmount = result.unmount
    })

    const worker = mockWorkerInstance
    const terminateSpy = vi.spyOn(worker!, 'terminate')

    act(() => unmount())

    expect(terminateSpy).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run new tests to verify they fail**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/layouts/basic3d/useBasic3DLayout.test.ts 2>&1 | grep -E "PASS|FAIL|✓|✗|×" | tail -20
```

Expected: new worker tests fail.

- [ ] **Step 3: Rewrite useBasic3DLayout.ts**

Replace the content of `packages/ui/src/features/canvas/layouts/basic3d/useBasic3DLayout.ts` with:

```typescript
/**
 * useBasic3DLayout Hook
 *
 * Wires LOD level → ViewResolver → layout computation (Web Worker) → canvas store.
 * Falls back to synchronous buildRadialTree if the worker fails.
 */

import { useMemo, useEffect, useRef } from 'react'
import { withSpan } from '../../../../lib/telemetry'
import { SemanticTier } from '@diagram-builder/core'
import type { IVMGraph } from '@diagram-builder/core'
import type { NodeType, EdgeType } from '@diagram-builder/core'
import { useCanvasStore } from '../../store'
import { buildRadialTree } from './radialTree'
import { serializeGraph } from './serializeGraph'
import type { Position3D } from '../../../../shared/types'
import type {
  ComputeLayoutMessage,
  WorkerOutMessage,
} from './workers/layoutWorker'

// ---------------------------------------------------------------------------
// Empty graph sentinel
// ---------------------------------------------------------------------------

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

const LAYOUT_CONFIG = { depthSpacing: 30, rootRadius: 5 }

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface Basic3DLayoutResult {
  positions: Map<string, Position3D>
  graph: IVMGraph
  maxDepth: number
}

// ---------------------------------------------------------------------------
// Fallback: synchronous layout (used on worker error)
// ---------------------------------------------------------------------------

function runSynchronousLayout(
  graph: IVMGraph,
  setLayoutPositions: (p: Map<string, Position3D>) => void,
  setLayoutState: (s: 'idle' | 'computing' | 'ready' | 'error') => void
) {
  const result = withSpan('ui.layout.compute', { node_count: graph.nodes.length }, () =>
    buildRadialTree(graph, LAYOUT_CONFIG)
  )
  if (result.positions.size > 0) setLayoutPositions(result.positions)
  setLayoutState('ready')
  return result
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useBasic3DLayout(): Basic3DLayoutResult {
  const resolver = useCanvasStore((s) => s.resolver)
  const lodLevel = useCanvasStore((s) => s.lodLevel)
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)
  const setLayoutPositions = useCanvasStore((s) => s.setLayoutPositions)
  const setLayoutState = useCanvasStore((s) => s.setLayoutState)
  const setLayoutProgress = useCanvasStore((s) => s.setLayoutProgress)
  const setClusters = useCanvasStore((s) => s.setClusters)
  const setNearestNodeId = useCanvasStore((s) => s.setNearestNodeId)
  const cameraPosX = useCanvasStore((s) => s.camera?.position?.x ?? 0)
  const cameraPosY = useCanvasStore((s) => s.camera?.position?.y ?? 0)
  const cameraPosZ = useCanvasStore((s) => s.camera?.position?.z ?? 0)

  // ---------------------------------------------------------------------------
  // Step 1: Derive graph from resolver + LOD
  // ---------------------------------------------------------------------------

  const graph = useMemo(() => {
    if (!resolver) return EMPTY_GRAPH
    if (lodLevel <= 3) return resolver.getTier(SemanticTier.Symbol)
    if (!selectedNodeId) return resolver.getTier(SemanticTier.Symbol)
    return resolver.getView({ baseTier: SemanticTier.Symbol, focalNodeId: selectedNodeId }).graph
  }, [resolver, lodLevel, selectedNodeId])

  // ---------------------------------------------------------------------------
  // Step 2: Track computed positions in a ref (for nearest-node computation)
  // ---------------------------------------------------------------------------

  const positionsRef = useRef<Map<string, Position3D>>(new Map())
  const maxDepthRef = useRef(0)

  // ---------------------------------------------------------------------------
  // Step 3: Spawn worker on graph change
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (graph.nodes.length === 0) {
      positionsRef.current = new Map()
      maxDepthRef.current = 0
      setLayoutState('idle')
      return
    }

    setLayoutState('computing')
    setLayoutProgress(0)

    let worker: Worker | null = null
    let cancelled = false

    try {
      worker = new Worker(new URL('./workers/layoutWorker.ts', import.meta.url), {
        type: 'module',
      })

      worker.onmessage = (event: MessageEvent<WorkerOutMessage>) => {
        if (cancelled) return
        const msg = event.data

        if (msg.type === 'LAYOUT_BATCH') {
          const positions = new Map(msg.positions.map(({ id, position }) => [id, position]))
          positionsRef.current = positions
          setLayoutPositions(positions)
          setLayoutProgress(msg.totalNodes > 0 ? 1 : 0)
        } else if (msg.type === 'LAYOUT_CLUSTERS') {
          setClusters(new Map(msg.clusters))
        } else if (msg.type === 'LAYOUT_COMPLETE') {
          maxDepthRef.current = msg.maxDepth
          setLayoutState('ready')
        } else if (msg.type === 'LAYOUT_ERROR') {
          console.warn('[useBasic3DLayout] Worker error, falling back:', msg.message)
          const result = runSynchronousLayout(graph, setLayoutPositions, setLayoutState)
          positionsRef.current = result.positions
          maxDepthRef.current = result.maxDepth
        }
      }

      worker.onerror = () => {
        if (cancelled) return
        console.warn('[useBasic3DLayout] Worker crashed, falling back')
        const result = runSynchronousLayout(graph, setLayoutPositions, setLayoutState)
        positionsRef.current = result.positions
        maxDepthRef.current = result.maxDepth
      }

      const msg: ComputeLayoutMessage = {
        type: 'COMPUTE_LAYOUT',
        graph: serializeGraph(graph),
        config: LAYOUT_CONFIG,
      }
      worker.postMessage(msg)
    } catch {
      // Worker not available (SSR, restricted environment)
      const result = runSynchronousLayout(graph, setLayoutPositions, setLayoutState)
      positionsRef.current = result.positions
      maxDepthRef.current = result.maxDepth
    }

    return () => {
      cancelled = true
      worker?.terminate()
    }
  }, [graph, setLayoutPositions, setLayoutState, setLayoutProgress, setClusters])

  // ---------------------------------------------------------------------------
  // Step 4: Debounced nearest-node computation
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const timer = setTimeout(() => {
      const positions = positionsRef.current
      if (positions.size === 0) {
        setNearestNodeId(null)
        return
      }
      const cameraPos = { x: cameraPosX, y: cameraPosY, z: cameraPosZ }
      let nearestId: string | null = null
      let nearestDist = Infinity
      for (const [nodeId, pos] of positions) {
        const dx = pos.x - cameraPos.x
        const dy = pos.y - cameraPos.y
        const dz = pos.z - cameraPos.z
        const dist = dx * dx + dy * dy + dz * dz
        if (dist < nearestDist) {
          nearestDist = dist
          nearestId = nodeId
        }
      }
      setNearestNodeId(nearestId)
    }, 200)

    return () => clearTimeout(timer)
  }, [cameraPosX, cameraPosY, cameraPosZ, setNearestNodeId])

  // Reset nearestNodeId on unmount
  useEffect(() => {
    return () => setNearestNodeId(null)
  }, [setNearestNodeId])

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    positions: positionsRef.current,
    graph,
    maxDepth: maxDepthRef.current,
  }
}
```

- [ ] **Step 4: Run all useBasic3DLayout tests**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/layouts/basic3d/useBasic3DLayout.test.ts 2>&1 | tail -15
```

Expected: all tests pass (existing + new worker tests).

- [ ] **Step 5: Run full test suite**

```bash
cd /Users/brianmehrman/projects/diagram_builder
npm test 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 6: Run CI checks**

```bash
cd /Users/brianmehrman/projects/diagram_builder
npm run type-check 2>&1 | tail -5 && npm run lint 2>&1 | tail -5 && npm run format:check 2>&1 | tail -5
```

- [ ] **Step 7: Commit**

```bash
cd /Users/brianmehrman/projects/diagram_builder
git add packages/ui/src/features/canvas/layouts/basic3d/useBasic3DLayout.ts packages/ui/src/features/canvas/layouts/basic3d/useBasic3DLayout.test.ts
git commit -m "feat(basic3d): move layout computation to Web Worker with sync fallback"
```

---

## Task 6: Basic3DView.tsx — loading state

**Files:**
- Modify: `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.tsx`
- Extend: `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.test.tsx`

**Context:** While `layoutState === 'computing'`, show a loading indicator instead of an empty scene. This eliminates the blank canvas.

- [ ] **Step 1: Write failing tests**

Add to `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.test.tsx`, inside the `describe('Basic3DView')` block:

```typescript
  describe('loading state', () => {
    it('renders loading text when layoutState is computing', () => {
      setupLayout(makeEmptyGraph())
      useCanvasStore.setState({ layoutState: 'computing' })

      const { getByText } = render(<Basic3DView />)
      expect(getByText(/loading/i)).toBeDefined()
    })

    it('does not render loading text when layoutState is ready', () => {
      setupLayout(makeEmptyGraph())
      useCanvasStore.setState({ layoutState: 'ready' })

      const { queryByText } = render(<Basic3DView />)
      expect(queryByText(/loading/i)).toBeNull()
    })
  })
```

- [ ] **Step 2: Run to verify fail**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/layouts/basic3d/Basic3DView.test.tsx 2>&1 | grep -E "FAIL|loading" | head -10
```

Expected: `FAIL` — loading text not rendered.

- [ ] **Step 3: Update Basic3DView.tsx**

Replace the content of `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.tsx`:

```typescript
/**
 * Basic3DView — root layout component for the Basic3D layout.
 *
 * Shows a loading indicator while the worker computes layout.
 * At LOD 1–2: renders ClusterLayer (proxy spheres per module group).
 * At LOD 3–4: renders individual nodes and (LOD 4) edges.
 */

import type { JSX } from 'react'
import { Text } from '@react-three/drei'
import { useCanvasStore } from '../../store'
import { useBasic3DLayout } from './useBasic3DLayout'
import { Basic3DNode } from './Basic3DNode'
import { Basic3DEdge } from './Basic3DEdge'
import { ClusterLayer } from './ClusterLayer'

export function Basic3DView() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)
  const lodLevel = useCanvasStore((s) => s.lodLevel)
  const layoutState = useCanvasStore((s) => s.layoutState)

  const { positions, graph } = useBasic3DLayout()

  // ── Loading state ──────────────────────────────────────────────────────────
  if (layoutState === 'computing') {
    return (
      <group name="basic3d-loading" data-testid="basic3d-loading">
        <Text
          position={[0, 0, 0]}
          fontSize={2}
          color="#888888"
          anchorX="center"
          anchorY="middle"
        >
          Loading…
        </Text>
      </group>
    )
  }

  // ── LOD 1–2: cluster proxies ───────────────────────────────────────────────
  if (lodLevel <= 2) {
    return (
      <group name="basic3d-view" data-testid="basic3d-view">
        <ClusterLayer />
      </group>
    )
  }

  // ── LOD 3–4: individual nodes ──────────────────────────────────────────────
  return (
    <group name="basic3d-view" data-testid="basic3d-view">
      {graph.nodes.map((node) => {
        const position = positions.get(node.id) ?? { x: 0, y: 0, z: 0 }
        return (
          <Basic3DNode
            key={node.id}
            node={node}
            position={position}
            isSelected={node.id === selectedNodeId}
          />
        )
      })}

      {lodLevel >= 4 &&
        graph.edges.reduce<JSX.Element[]>((acc, edge) => {
          const from = positions.get(edge.source)
          const to = positions.get(edge.target)
          if (from !== undefined && to !== undefined) {
            acc.push(<Basic3DEdge key={edge.id} from={from} to={to} />)
          }
          return acc
        }, [])}
    </group>
  )
}
```

Note: this also changes the edge visibility rule — edges now show only at LOD 4 (previously LOD >= 2). This aligns with the design (LOD 3 = nodes no edges, LOD 4 = nodes + edges).

- [ ] **Step 4: Update edge visibility tests in Basic3DView.test.tsx**

The existing `LOD-driven edge visibility` tests need updating for the new LOD split. Find and update the describe block:

```typescript
  describe('LOD-driven edge visibility', () => {
    it('renders no edges at LOD 1 (cluster layer shown)', () => {
      // LOD 1 renders ClusterLayer, not nodes/edges
      setupLayout(makeEmptyGraph())
      useCanvasStore.getState().setLodLevel(1)
      useCanvasStore.setState({ layoutState: 'ready' })

      const { queryAllByTestId } = render(<Basic3DView />)
      expect(queryAllByTestId('basic3d-edge')).toHaveLength(0)
      expect(queryAllByTestId('basic3d-node')).toHaveLength(0)
    })

    it('renders no edges at LOD 3 (nodes visible, edges not)', () => {
      const nodes = [createNode('a'), createNode('b')]
      const edges = [createEdge('a', 'b')]
      setupLayout(makeGraph(nodes, edges))
      useCanvasStore.getState().setLodLevel(3)
      useCanvasStore.setState({ layoutState: 'ready' })

      const { queryAllByTestId } = render(<Basic3DView />)
      expect(queryAllByTestId('basic3d-node')).toHaveLength(2)
      expect(queryAllByTestId('basic3d-edge')).toHaveLength(0)
    })

    it('renders edges at LOD 4', () => {
      const nodes = [createNode('a'), createNode('b')]
      const edges = [createEdge('a', 'b')]
      setupLayout(makeGraph(nodes, edges))
      useCanvasStore.getState().setLodLevel(4)
      useCanvasStore.setState({ layoutState: 'ready' })

      const { getAllByTestId } = render(<Basic3DView />)
      expect(getAllByTestId('basic3d-edge')).toHaveLength(1)
    })

    it('does not render edges when source position is missing', () => {
      const nodes = [createNode('a'), createNode('b')]
      const edges = [createEdge('a', 'b')]
      const positions = new Map([['a', { x: 0, y: 0, z: 0 }]])
      setupLayout(makeGraph(nodes, edges), positions)
      useCanvasStore.getState().setLodLevel(4)
      useCanvasStore.setState({ layoutState: 'ready' })

      const { queryAllByTestId } = render(<Basic3DView />)
      expect(queryAllByTestId('basic3d-edge')).toHaveLength(0)
    })

    it('does not render edges when target position is missing', () => {
      const nodes = [createNode('a'), createNode('b')]
      const edges = [createEdge('a', 'b')]
      const positions = new Map([['b', { x: 5, y: 0, z: 0 }]])
      setupLayout(makeGraph(nodes, edges), positions)
      useCanvasStore.getState().setLodLevel(4)
      useCanvasStore.setState({ layoutState: 'ready' })

      const { queryAllByTestId } = render(<Basic3DView />)
      expect(queryAllByTestId('basic3d-edge')).toHaveLength(0)
    })
  })
```

Also add `useCanvasStore.setState({ layoutState: 'ready' })` to the `beforeEach` in `Basic3DView.test.tsx`:

```typescript
beforeEach(() => {
  vi.clearAllMocks()
  useCanvasStore.getState().reset()
  useCanvasStore.setState({ layoutState: 'ready' }) // tests assume layout is done

  // Default: empty graph, LOD 3 (individual nodes shown by default in tests)
  setupLayout(makeEmptyGraph())
  useCanvasStore.getState().setLodLevel(3)
})
```

Also add `ClusterLayer` to the mocks section at the top:

```typescript
vi.mock('./ClusterLayer', () => ({
  ClusterLayer: () => <div data-testid="cluster-layer" />,
}))
```

Update the `node rendering` and `isSelected` tests to set `layoutState: 'ready'` and `lodLevel: 3` if not already done via `beforeEach`.

- [ ] **Step 5: Run Basic3DView tests**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/layouts/basic3d/Basic3DView.test.tsx 2>&1 | tail -15
```

Expected: all tests pass.

- [ ] **Step 6: Run full test suite + CI checks**

```bash
cd /Users/brianmehrman/projects/diagram_builder
npm test 2>&1 | tail -10
npm run type-check 2>&1 | tail -5 && npm run lint 2>&1 | tail -5 && npm run format:check 2>&1 | tail -5
```

- [ ] **Step 7: Commit**

```bash
cd /Users/brianmehrman/projects/diagram_builder
git add packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.tsx packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.test.tsx
git commit -m "feat(basic3d): add loading state and LOD 1-2/3-4 split to Basic3DView"
```

---

## Task 7: lodTransition.ts + ClusterLayer.tsx

**Files:**
- Create: `packages/ui/src/features/canvas/layouts/basic3d/lodTransition.ts`
- Create: `packages/ui/src/features/canvas/layouts/basic3d/ClusterLayer.tsx`
- Create: `packages/ui/src/features/canvas/layouts/basic3d/ClusterLayer.test.tsx`

### Sub-task 7a: lodTransition.ts

- [ ] **Step 1: Create constants file**

Create `packages/ui/src/features/canvas/layouts/basic3d/lodTransition.ts`:

```typescript
/**
 * LOD transition timing constants for Basic3D.
 */

/** Duration of the cluster ↔ node layer crossfade in milliseconds */
export const LOD_TRANSITION_MS = 300

/** Lerp factor per frame for opacity transitions (~60fps target) */
export const LOD_TRANSITION_LERP = 0.08
```

### Sub-task 7b: ClusterLayer.tsx

- [ ] **Step 2: Write failing tests for ClusterLayer**

Create `packages/ui/src/features/canvas/layouts/basic3d/ClusterLayer.test.tsx`:

```typescript
/**
 * ClusterLayer Test Suite
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { ClusterLayer } from './ClusterLayer'
import { useCanvasStore } from '../../store'
import type { ClusterData } from './clusterBuilder'

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({ camera: { position: { x: 0, y: 5, z: 10 } } })),
}))

vi.mock('@react-three/drei', () => ({
  Text: (props: Record<string, unknown>) => <div data-testid="cluster-label" {...props} />,
  Billboard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Sphere: (props: Record<string, unknown>) => <div data-testid="cluster-sphere" {...props} />,
}))

function makeCluster(id: string, nodeCount: number): ClusterData {
  return {
    id,
    label: `${id.replace('cluster:', '')} (${nodeCount})`,
    nodeIds: Array.from({ length: nodeCount }, (_, i) => `${id}-node-${i}`),
    centroid: { x: 0, y: 0, z: 0 },
    radius: 10,
    dominantType: 'file',
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  useCanvasStore.getState().reset()
})

describe('ClusterLayer', () => {
  it('renders nothing when clusters map is empty', () => {
    useCanvasStore.setState({ clusters: new Map() })
    const { queryAllByTestId } = render(<ClusterLayer />)
    expect(queryAllByTestId('cluster-sphere')).toHaveLength(0)
  })

  it('renders one sphere per cluster', () => {
    const clusters = new Map([
      ['cluster:auth', makeCluster('cluster:auth', 5)],
      ['cluster:payments', makeCluster('cluster:payments', 3)],
    ])
    useCanvasStore.setState({ clusters })

    const { getAllByTestId } = render(<ClusterLayer />)
    expect(getAllByTestId('cluster-sphere')).toHaveLength(2)
  })

  it('renders one label per cluster', () => {
    const clusters = new Map([
      ['cluster:auth', makeCluster('cluster:auth', 5)],
    ])
    useCanvasStore.setState({ clusters })

    const { getAllByTestId } = render(<ClusterLayer />)
    expect(getAllByTestId('cluster-label')).toHaveLength(1)
  })
})
```

- [ ] **Step 3: Run to verify fail**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/layouts/basic3d/ClusterLayer.test.tsx 2>&1 | tail -10
```

Expected: `FAIL` — `ClusterLayer` not found.

- [ ] **Step 4: Implement ClusterLayer.tsx**

Create `packages/ui/src/features/canvas/layouts/basic3d/ClusterLayer.tsx`:

```typescript
/**
 * ClusterLayer.tsx
 *
 * Renders cluster proxies at LOD 1–2. Each cluster is a translucent sphere
 * at the group centroid with a text label showing the cluster name and count.
 *
 * Clicking a cluster flies the camera to its centroid.
 */

import { useRef } from 'react'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { useCanvasStore } from '../../store'
import type { ClusterData } from './clusterBuilder'

// Colour per dominant node type — mirrors basic3dShapes.ts palette
const TYPE_COLORS: Record<string, string> = {
  file: '#27AE60',
  directory: '#27AE60',
  class: '#E67E22',
  interface: '#95A5A6',
  type: '#95A5A6',
  function: '#4A90D9',
  method: '#4A90D9',
  variable: '#9B59B6',
  enum: '#F39C12',
  namespace: '#ECEFF1',
  package: '#ECEFF1',
  repository: '#ECEFF1',
}

function clusterColor(dominantType: string): string {
  return TYPE_COLORS[dominantType] ?? '#4A90D9'
}

interface ClusterProxyProps {
  cluster: ClusterData
}

function ClusterProxy({ cluster }: ClusterProxyProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const setCameraPosition = useCanvasStore((s) => s.setCameraPosition)
  const setCameraTarget = useCanvasStore((s) => s.setCameraTarget)
  const color = clusterColor(cluster.dominantType)
  const radius = Math.max(cluster.radius, 5) // minimum visible size
  const { centroid } = cluster

  function handleClick() {
    // Fly to cluster: position camera 50 units above centroid (puts us in LOD 3 range)
    setCameraTarget(centroid)
    setCameraPosition({
      x: centroid.x,
      y: centroid.y + 50,
      z: centroid.z + 50,
    })
  }

  return (
    <group position={[centroid.x, centroid.y, centroid.z]}>
      {/* Translucent bounding sphere */}
      <mesh ref={meshRef} onClick={handleClick} data-testid="cluster-sphere">
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </mesh>

      {/* Label */}
      <Billboard>
        <Text
          position={[0, radius + 2, 0]}
          fontSize={3}
          color="#FFFFFF"
          anchorX="center"
          anchorY="bottom"
          data-testid="cluster-label"
        >
          {cluster.label}
        </Text>
      </Billboard>
    </group>
  )
}

export function ClusterLayer() {
  const clusters = useCanvasStore((s) => s.clusters)

  return (
    <group name="cluster-layer" data-testid="cluster-layer">
      {Array.from(clusters.values()).map((cluster) => (
        <ClusterProxy key={cluster.id} cluster={cluster} />
      ))}
    </group>
  )
}
```

- [ ] **Step 5: Run ClusterLayer tests**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/layouts/basic3d/ClusterLayer.test.tsx 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 6: Run full test suite + CI checks**

```bash
cd /Users/brianmehrman/projects/diagram_builder
npm test 2>&1 | tail -10
npm run type-check 2>&1 | tail -5 && npm run lint 2>&1 | tail -5 && npm run format:check 2>&1 | tail -5
```

Expected: all pass.

- [ ] **Step 7: Commit**

```bash
cd /Users/brianmehrman/projects/diagram_builder
git add \
  packages/ui/src/features/canvas/layouts/basic3d/lodTransition.ts \
  packages/ui/src/features/canvas/layouts/basic3d/ClusterLayer.tsx \
  packages/ui/src/features/canvas/layouts/basic3d/ClusterLayer.test.tsx
git commit -m "feat(basic3d): add ClusterLayer for LOD 1-2 proxy rendering with click fly-to"
```

---

## Task 8: Smoke test in dev + final CI gate

- [ ] **Step 1: Start dev server and manually verify**

```bash
cd /Users/brianmehrman/projects/diagram_builder
./scripts/init.sh
```

Open `http://localhost:8742/canvas` and switch to Basic3D layout. Verify:
- [ ] No blank canvas on load — loading indicator appears immediately
- [ ] Nodes appear after a short pause (worker completes)
- [ ] Zooming out past LOD 2 threshold shows cluster spheres, not individual nodes
- [ ] Clicking a cluster sphere flies the camera in and reveals individual nodes (LOD 3)
- [ ] Zooming in past LOD 3 shows individual nodes

- [ ] **Step 2: Run the full CI checklist**

```bash
cd /Users/brianmehrman/projects/diagram_builder
npm run type-check
npm run lint
npm run format:check
npm test
```

Expected: all four pass with zero errors.

- [ ] **Step 3: Final commit**

```bash
cd /Users/brianmehrman/projects/diagram_builder
git status
git add -p  # review any remaining changes
git commit -m "chore: final CI pass for 3D performance and LOD improvements"
```

---

## Self-Review Checklist

Ran against the spec:

| Spec requirement | Task |
|---|---|
| No blank canvas (loading indicator) | Task 6 |
| Worker computes BFS off main thread | Task 4 + 5 |
| Sync fallback on worker failure | Task 5 |
| `layoutState` / `layoutProgress` in store | Task 1 |
| `serializeGraph` safety wrapper | Task 2 |
| Cluster grouping (module → dir → depth band) | Task 3 |
| Cluster centroid, radius, dominantType | Task 3 |
| Worker sends clusters alongside positions | Task 4 |
| LOD 1–2: ClusterLayer | Task 6 + 7 |
| LOD 3–4: individual nodes | Task 6 |
| LOD 4: edges visible | Task 6 |
| Cluster proxy sphere + label | Task 7 |
| Cluster click flies camera in | Task 7 |
| `lodTransition.ts` constants | Task 7 |
| City layout unchanged | All tasks — only `layouts/basic3d/` modified |
