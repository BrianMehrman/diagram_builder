# Phase 6 — Basic3D Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a full 3D radial tree layout for the Basic3D canvas mode — nodes as typed floating shapes, edges as lines, growing outward from repo entry points in 3D space.

**Architecture:** A pure BFS tree algorithm (`radialTree.ts`) places nodes on sphere shells at increasing depth from entry points. `useBasic3DLayout` wires this to the canvas store's ViewResolver (same LOD→ViewResolver pattern as city). `Basic3DView` orchestrates `Basic3DNode` and `Basic3DEdge` components, each reading shape/color from `basic3dShapes.ts`.

**Tech Stack:** React Three Fiber, `@react-three/drei` (Line), Zustand (canvas store), Vitest, Playwright (E2E), TypeScript strict mode.

---

## File Map

**Create:**
- `packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.ts` — pure shape + color lookup tables
- `packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.test.ts` — unit tests
- `packages/ui/src/features/canvas/layouts/basic3d/radialTree.ts` — pure BFS tree algorithm
- `packages/ui/src/features/canvas/layouts/basic3d/radialTree.test.ts` — unit tests
- `packages/ui/src/features/canvas/layouts/basic3d/Basic3DEdge.tsx` — edge line component
- `packages/ui/src/features/canvas/layouts/basic3d/Basic3DEdge.test.tsx` — component tests
- `packages/ui/src/features/canvas/layouts/basic3d/Basic3DNode.tsx` — node shape component
- `packages/ui/src/features/canvas/layouts/basic3d/Basic3DNode.test.tsx` — component tests
- `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.test.tsx` — view integration tests
- `tests/e2e/basic3d-layout.spec.ts` — E2E tests

**Modify:**
- `packages/ui/src/features/canvas/store.ts` — add `nearestNodeId` + `setNearestNodeId`
- `packages/ui/src/features/canvas/store.test.ts` — test new store fields
- `packages/ui/src/features/canvas/layouts/basic3d/useBasic3DLayout.ts` — replace stub with full implementation
- `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.tsx` — replace stub with full implementation

---

## Task 1: Add `nearestNodeId` to canvas store

**Files:**
- Modify: `packages/ui/src/features/canvas/store.ts`
- Modify: `packages/ui/src/features/canvas/store.test.ts`

**Context:** The store already has `focusedNodeId` used by city-to-cell navigation — do NOT touch it. This adds a new, distinct field for Basic3D's "node nearest to camera" concept.

- [ ] **Step 1: Write the failing test**

Open `packages/ui/src/features/canvas/store.test.ts`. Find the existing store tests. Add:

```typescript
describe('nearestNodeId', () => {
  it('defaults to null', () => {
    const { nearestNodeId } = useCanvasStore.getState()
    expect(nearestNodeId).toBeNull()
  })

  it('setNearestNodeId updates the field', () => {
    useCanvasStore.getState().setNearestNodeId('node-abc')
    expect(useCanvasStore.getState().nearestNodeId).toBe('node-abc')
  })

  it('setNearestNodeId accepts null', () => {
    useCanvasStore.getState().setNearestNodeId('node-abc')
    useCanvasStore.getState().setNearestNodeId(null)
    expect(useCanvasStore.getState().nearestNodeId).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/store.test.ts
```

Expected: FAIL — `nearestNodeId` is not defined on store state.

- [ ] **Step 3: Add the field to the store**

In `packages/ui/src/features/canvas/store.ts`:

1. In the `CanvasState` interface, add after the `focusedGroupId` block (around line 206):
```typescript
/** Nearest node to camera in Basic3D mode. Distinct from focusedNodeId (used by city navigation). */
nearestNodeId: string | null
setNearestNodeId: (id: string | null) => void
```

2. In the initial state object (around line 460, near `focusedGroupId: null`), add:
```typescript
nearestNodeId: null,
```

3. In the `reset` action (around line 466 — the only reset action; there is no `resetCamera`), add:
```typescript
nearestNodeId: null,
```

4. At the end of the actions section, add:
```typescript
setNearestNodeId: (id) => set({ nearestNodeId: id }),
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/store.test.ts
```

Expected: All store tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/brianmehrman/projects/diagram_builder
git add packages/ui/src/features/canvas/store.ts packages/ui/src/features/canvas/store.test.ts
git commit -m "feat(canvas): add nearestNodeId to canvas store for Basic3D layout"
```

---

## Task 2: Create `basic3dShapes.ts` — shape and color lookup tables

**Files:**
- Create: `packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.ts`
- Create: `packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.test.ts`

**Context:** This is a pure data module — no React imports, no hooks, no JSX. All 13 valid `NodeType` values must be covered. `constant` is NOT a valid `NodeType`. Abstract classes share `type: 'class'` with `isAbstract: true` in `metadata.properties` — the wireframe variant is handled via a separate `isAbstractNode` helper.

- [ ] **Step 1: Write the failing tests**

Create `packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { getShapeForType, getColorForType, isAbstractNode } from './basic3dShapes'
import type { NodeType } from '@diagram-builder/core'

const ALL_NODE_TYPES: NodeType[] = [
  'file', 'directory', 'module', 'class', 'interface', 'function',
  'method', 'variable', 'type', 'enum', 'namespace', 'package', 'repository',
]

describe('getShapeForType', () => {
  it('returns a defined shape for every NodeType', () => {
    for (const type of ALL_NODE_TYPES) {
      expect(getShapeForType(type), `missing shape for "${type}"`).toBeDefined()
    }
  })

  it('returns disc for file', () => expect(getShapeForType('file')).toBe('disc'))
  it('returns sphere for function', () => expect(getShapeForType('function')).toBe('sphere'))
  it('returns box for class', () => expect(getShapeForType('class')).toBe('box'))
  it('returns icosahedron for interface', () => expect(getShapeForType('interface')).toBe('icosahedron'))
  it('returns octahedron for variable', () => expect(getShapeForType('variable')).toBe('octahedron'))
  it('returns cylinder for enum', () => expect(getShapeForType('enum')).toBe('cylinder'))
})

describe('getColorForType', () => {
  it('returns a hex color string for every NodeType', () => {
    for (const type of ALL_NODE_TYPES) {
      const color = getColorForType(type)
      expect(color, `missing color for "${type}"`).toBeDefined()
      expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })
})

describe('isAbstractNode', () => {
  it('returns true when isAbstract is true in metadata properties', () => {
    const node = {
      type: 'class',
      metadata: { properties: { isAbstract: true } },
    } as any
    expect(isAbstractNode(node)).toBe(true)
  })

  it('returns false for a normal class', () => {
    const node = {
      type: 'class',
      metadata: { properties: { isAbstract: false } },
    } as any
    expect(isAbstractNode(node)).toBe(false)
  })

  it('returns false when metadata.properties is absent', () => {
    const node = { type: 'class', metadata: {} } as any
    expect(isAbstractNode(node)).toBe(false)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/layouts/basic3d/basic3dShapes.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `basic3dShapes.ts`**

Create `packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.ts`:

```typescript
import type { NodeType } from '@diagram-builder/core'
import type { IVMNode } from '../../../../shared/types'

export type Basic3DShape =
  | 'disc'
  | 'box'
  | 'sphere'
  | 'icosahedron'
  | 'octahedron'
  | 'cylinder'
  | 'ring'
  | 'largeBox'

const SHAPE_MAP: Record<NodeType, Basic3DShape> = {
  file: 'disc',
  directory: 'disc',      // larger radius applied in Basic3DNode
  module: 'disc',
  class: 'box',
  interface: 'icosahedron',
  function: 'sphere',
  method: 'sphere',       // smaller scale applied in Basic3DNode
  variable: 'octahedron',
  type: 'icosahedron',
  enum: 'cylinder',
  namespace: 'ring',
  package: 'largeBox',
  repository: 'largeBox', // larger scale applied in Basic3DNode
}

const COLOR_MAP: Record<NodeType, string> = {
  file: '#27AE60',
  directory: '#27AE60',
  module: '#27AE60',
  class: '#E67E22',
  interface: '#95A5A6',
  function: '#4A90D9',
  method: '#4A90D9',
  variable: '#9B59B6',
  type: '#95A5A6',
  enum: '#F39C12',
  namespace: '#ECEFF1',
  package: '#ECEFF1',
  repository: '#ECEFF1',
}

export function getShapeForType(type: NodeType): Basic3DShape {
  return SHAPE_MAP[type]
}

export function getColorForType(type: NodeType): string {
  return COLOR_MAP[type]
}

export function isAbstractNode(node: Pick<IVMNode, 'metadata'>): boolean {
  return node.metadata?.properties?.isAbstract === true
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/layouts/basic3d/basic3dShapes.test.ts
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/brianmehrman/projects/diagram_builder
git add packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.ts \
        packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.test.ts
git commit -m "feat(basic3d): add shape and color lookup tables"
```

---

## Task 3: Create `radialTree.ts` — pure BFS tree algorithm

**Files:**
- Create: `packages/ui/src/features/canvas/layouts/basic3d/radialTree.ts`
- Create: `packages/ui/src/features/canvas/layouts/basic3d/radialTree.test.ts`

**Context:** This is the core layout engine. It is a pure function — no React, no hooks, no store reads. It must be deterministic: same input always produces the same output. Entry points are nodes with no incoming edges (or `depth === 0` in `metadata.properties`). Shared deps (multiple parents) are placed at the centroid of parent positions, with a small jitter if the centroid collides with an existing node.

- [ ] **Step 1: Write the failing tests**

Create `packages/ui/src/features/canvas/layouts/basic3d/radialTree.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { buildRadialTree } from './radialTree'
import type { IVMGraph } from '@diagram-builder/core'

function makeGraph(overrides: Partial<IVMGraph> = {}): IVMGraph {
  return {
    nodes: [],
    edges: [],
    metadata: {
      name: 'test',
      schemaVersion: '1.0.0',
      generatedAt: '',
      rootPath: '',
      languages: [],
      stats: { totalNodes: 0, totalEdges: 0, nodesByType: {} as any, edgesByType: {} as any },
    },
    bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
    ...overrides,
  }
}

describe('buildRadialTree', () => {
  it('returns empty positions for empty graph', () => {
    const result = buildRadialTree(makeGraph(), { rootRadius: 10, depthSpacing: 15 })
    expect(result.positions.size).toBe(0)
    expect(result.maxDepth).toBe(0)
  })

  it('places a single entry point at the origin shell', () => {
    const graph = makeGraph({
      nodes: [
        { id: 'root', type: 'file', metadata: { label: 'root', properties: { depth: 0 } } } as any,
      ],
    })
    const result = buildRadialTree(graph, { rootRadius: 10, depthSpacing: 15 })
    const pos = result.positions.get('root')!
    expect(pos).toBeDefined()
    // distance from origin should be approximately rootRadius
    const dist = Math.sqrt(pos.x ** 2 + pos.y ** 2 + pos.z ** 2)
    expect(dist).toBeCloseTo(10, 0)
  })

  it('places child nodes further from origin than root', () => {
    const graph = makeGraph({
      nodes: [
        { id: 'root', type: 'file', metadata: { label: 'root', properties: { depth: 0 } } } as any,
        { id: 'child', type: 'function', metadata: { label: 'child', properties: {} } } as any,
      ],
      edges: [{ id: 'e1', source: 'root', target: 'child', type: 'contains' } as any],
    })
    const result = buildRadialTree(graph, { rootRadius: 10, depthSpacing: 15 })
    const rootDist = Math.sqrt(
      result.positions.get('root')!.x ** 2 +
      result.positions.get('root')!.y ** 2 +
      result.positions.get('root')!.z ** 2
    )
    const childDist = Math.sqrt(
      result.positions.get('child')!.x ** 2 +
      result.positions.get('child')!.y ** 2 +
      result.positions.get('child')!.z ** 2
    )
    expect(childDist).toBeGreaterThan(rootDist)
  })

  it('is deterministic — same input produces same output', () => {
    const graph = makeGraph({
      nodes: [
        { id: 'a', type: 'file', metadata: { label: 'a', properties: { depth: 0 } } } as any,
        { id: 'b', type: 'file', metadata: { label: 'b', properties: { depth: 0 } } } as any,
        { id: 'c', type: 'function', metadata: { label: 'c', properties: {} } } as any,
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'c', type: 'contains' } as any,
        { id: 'e2', source: 'b', target: 'c', type: 'contains' } as any,
      ],
    })
    const r1 = buildRadialTree(graph, { rootRadius: 10, depthSpacing: 15 })
    const r2 = buildRadialTree(graph, { rootRadius: 10, depthSpacing: 15 })
    for (const [id, pos] of r1.positions) {
      expect(r2.positions.get(id)).toEqual(pos)
    }
  })

  it('places shared dep (two parents) at centroid of parent positions', () => {
    const graph = makeGraph({
      nodes: [
        { id: 'a', type: 'file', metadata: { label: 'a', properties: { depth: 0 } } } as any,
        { id: 'b', type: 'file', metadata: { label: 'b', properties: { depth: 0 } } } as any,
        { id: 'shared', type: 'function', metadata: { label: 'shared', properties: {} } } as any,
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'shared', type: 'contains' } as any,
        { id: 'e2', source: 'b', target: 'shared', type: 'contains' } as any,
      ],
    })
    const result = buildRadialTree(graph, { rootRadius: 10, depthSpacing: 15 })
    const posA = result.positions.get('a')!
    const posB = result.positions.get('b')!
    const posShared = result.positions.get('shared')!
    // centroid check — shared should be close to midpoint of A and B (plus possible jitter ≤ 1.5)
    const cx = (posA.x + posB.x) / 2
    const cy = (posA.y + posB.y) / 2
    const cz = (posA.z + posB.z) / 2
    const jitterBudget = 15 * 0.1 * Math.sqrt(3) + 0.01 // max jitter magnitude
    const deviation = Math.sqrt(
      (posShared.x - cx) ** 2 + (posShared.y - cy) ** 2 + (posShared.z - cz) ** 2
    )
    expect(deviation).toBeLessThanOrEqual(jitterBudget)
  })

  it('maxDepth reflects the deepest branch', () => {
    const graph = makeGraph({
      nodes: [
        { id: 'r', type: 'file', metadata: { label: 'r', properties: { depth: 0 } } } as any,
        { id: 'c1', type: 'function', metadata: { label: 'c1', properties: {} } } as any,
        { id: 'c2', type: 'method', metadata: { label: 'c2', properties: {} } } as any,
      ],
      edges: [
        { id: 'e1', source: 'r', target: 'c1', type: 'contains' } as any,
        { id: 'e2', source: 'c1', target: 'c2', type: 'contains' } as any,
      ],
    })
    const result = buildRadialTree(graph, { rootRadius: 10, depthSpacing: 15 })
    expect(result.maxDepth).toBe(2)
  })

  it('uses no-incoming-edges fallback when depth property is absent', () => {
    // No metadata.properties.depth set — entry point must be detected by absence of incoming edges
    const graph = makeGraph({
      nodes: [
        { id: 'entry', type: 'file', metadata: { label: 'entry', properties: {} } } as any,
        { id: 'child', type: 'function', metadata: { label: 'child', properties: {} } } as any,
      ],
      edges: [{ id: 'e1', source: 'entry', target: 'child', type: 'contains' } as any],
    })
    const result = buildRadialTree(graph, { rootRadius: 10, depthSpacing: 15 })
    // entry has no incoming edges → should be at depth 0 (on the root shell)
    const entryDist = Math.sqrt(
      result.positions.get('entry')!.x ** 2 +
      result.positions.get('entry')!.y ** 2 +
      result.positions.get('entry')!.z ** 2
    )
    expect(entryDist).toBeCloseTo(10, 0)
    // child should be further from origin
    const childDist = Math.sqrt(
      result.positions.get('child')!.x ** 2 +
      result.positions.get('child')!.y ** 2 +
      result.positions.get('child')!.z ** 2
    )
    expect(childDist).toBeGreaterThan(entryDist)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/layouts/basic3d/radialTree.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `radialTree.ts`**

Create `packages/ui/src/features/canvas/layouts/basic3d/radialTree.ts`:

```typescript
import type { IVMGraph } from '@diagram-builder/core'
import type { Position3D } from '../../../../shared/types'
import type { BoundingBox } from '../../layout/types'

export interface RadialTreeResult {
  positions: Map<string, Position3D>
  bounds: BoundingBox
  maxDepth: number
}

interface RadialTreeOptions {
  rootRadius: number
  depthSpacing: number
}

/**
 * Fibonacci sphere sampling — evenly distributes n points on a unit sphere.
 * Deterministic for same n.
 */
function fibonacciSphere(n: number): Array<{ x: number; y: number; z: number }> {
  const points: Array<{ x: number; y: number; z: number }> = []
  const goldenRatio = (1 + Math.sqrt(5)) / 2
  for (let i = 0; i < n; i++) {
    const theta = Math.acos(1 - (2 * (i + 0.5)) / n)
    const phi = (2 * Math.PI * i) / goldenRatio
    points.push({
      x: Math.sin(theta) * Math.cos(phi),
      y: Math.cos(theta),
      z: Math.sin(theta) * Math.sin(phi),
    })
  }
  return points
}

/**
 * Pure BFS radial tree layout.
 *
 * Entry points (nodes with depth===0 or no incoming edges) are placed on a
 * sphere shell at rootRadius. Each subsequent depth level is placed on a
 * shell at rootRadius + depth * depthSpacing. Children are distributed
 * within their parent's solid angle sector. Shared deps (multiple parents)
 * are placed at the centroid of parent positions.
 */
export function buildRadialTree(
  graph: IVMGraph,
  options: RadialTreeOptions
): RadialTreeResult {
  const { rootRadius, depthSpacing } = options
  const positions = new Map<string, Position3D>()

  if (graph.nodes.length === 0) {
    return {
      positions,
      bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
      maxDepth: 0,
    }
  }

  // Build adjacency: parent → children, child → parents
  const children = new Map<string, string[]>()
  const parents = new Map<string, string[]>()
  for (const node of graph.nodes) {
    children.set(node.id, [])
    parents.set(node.id, [])
  }
  for (const edge of graph.edges) {
    children.get(edge.source)?.push(edge.target)
    parents.get(edge.target)?.push(edge.source)
  }

  // Identify entry points: depth===0 or no incoming edges
  const nodeIds = new Set(graph.nodes.map((n) => n.id))
  const entryPoints = graph.nodes.filter((n) => {
    const depth = n.metadata?.properties?.depth
    if (typeof depth === 'number') return depth === 0
    return (parents.get(n.id)?.length ?? 0) === 0
  })

  // BFS from entry points
  const depthMap = new Map<string, number>()
  const queue: string[] = []

  // Place entry points on root sphere shell
  const rootDirs = fibonacciSphere(Math.max(entryPoints.length, 1))
  entryPoints.forEach((node, i) => {
    const dir = rootDirs[i % rootDirs.length]
    positions.set(node.id, {
      x: dir.x * rootRadius,
      y: dir.y * rootRadius,
      z: dir.z * rootRadius,
    })
    depthMap.set(node.id, 0)
    queue.push(node.id)
  })

  // BFS
  let maxDepth = 0
  const visited = new Set<string>(entryPoints.map((n) => n.id))

  while (queue.length > 0) {
    const current = queue.shift()!
    const currentDepth = depthMap.get(current) ?? 0
    const currentPos = positions.get(current)!
    const childIds = (children.get(current) ?? []).filter((id) => nodeIds.has(id))

    // Filter to unvisited children (may be visited later by another parent — handled below)
    const unvisitedChildren = childIds.filter((id) => !visited.has(id))

    if (unvisitedChildren.length === 0) continue

    const nextRadius = rootRadius + (currentDepth + 1) * depthSpacing

    // Compute parent direction vector (unit vector from origin to current node)
    const mag = Math.sqrt(currentPos.x ** 2 + currentPos.y ** 2 + currentPos.z ** 2) || 1
    const parentDir = { x: currentPos.x / mag, y: currentPos.y / mag, z: currentPos.z / mag }

    // Distribute children in a cone around the parent direction
    const childDirs = fibonacciSphere(Math.max(unvisitedChildren.length, 1))

    unvisitedChildren.forEach((childId, idx) => {
      // Rotate fibonacci dir toward parent direction (simple lerp + normalize)
      const rawDir = childDirs[idx % childDirs.length]
      const blended = {
        x: rawDir.x * 0.4 + parentDir.x * 0.6,
        y: rawDir.y * 0.4 + parentDir.y * 0.6,
        z: rawDir.z * 0.4 + parentDir.z * 0.6,
      }
      const blendMag = Math.sqrt(blended.x ** 2 + blended.y ** 2 + blended.z ** 2) || 1
      const childPos: Position3D = {
        x: (blended.x / blendMag) * nextRadius,
        y: (blended.y / blendMag) * nextRadius,
        z: (blended.z / blendMag) * nextRadius,
      }
      positions.set(childId, childPos)
      depthMap.set(childId, currentDepth + 1)
      maxDepth = Math.max(maxDepth, currentDepth + 1)
      visited.add(childId)
      queue.push(childId)
    })
  }

  // Handle shared deps (multiple parents, already visited from first parent):
  // Recompute position as centroid of all parent positions
  for (const node of graph.nodes) {
    const nodeParents = (parents.get(node.id) ?? []).filter((id) => positions.has(id))
    if (nodeParents.length <= 1) continue
    if (!positions.has(node.id)) continue

    const cx = nodeParents.reduce((s, id) => s + positions.get(id)!.x, 0) / nodeParents.length
    const cy = nodeParents.reduce((s, id) => s + positions.get(id)!.y, 0) / nodeParents.length
    const cz = nodeParents.reduce((s, id) => s + positions.get(id)!.z, 0) / nodeParents.length

    // Apply small jitter if centroid coincides with an existing node
    let pos: Position3D = { x: cx, y: cy, z: cz }
    const jitterMag = depthSpacing * 0.1
    for (const [otherId, otherPos] of positions) {
      if (otherId === node.id) continue
      const d = Math.sqrt((pos.x - otherPos.x) ** 2 + (pos.y - otherPos.y) ** 2 + (pos.z - otherPos.z) ** 2)
      if (d < 0.01) {
        pos = { x: pos.x + jitterMag, y: pos.y, z: pos.z }
        break
      }
    }
    positions.set(node.id, pos)
  }

  // Compute bounds
  let minX = Infinity, minY = Infinity, minZ = Infinity
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
  for (const pos of positions.values()) {
    minX = Math.min(minX, pos.x); maxX = Math.max(maxX, pos.x)
    minY = Math.min(minY, pos.y); maxY = Math.max(maxY, pos.y)
    minZ = Math.min(minZ, pos.z); maxZ = Math.max(maxZ, pos.z)
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/layouts/basic3d/radialTree.test.ts
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/brianmehrman/projects/diagram_builder
git add packages/ui/src/features/canvas/layouts/basic3d/radialTree.ts \
        packages/ui/src/features/canvas/layouts/basic3d/radialTree.test.ts
git commit -m "feat(basic3d): implement radial BFS tree layout algorithm"
```

---

## Task 4: Implement `useBasic3DLayout.ts`

**Files:**
- Modify: `packages/ui/src/features/canvas/layouts/basic3d/useBasic3DLayout.ts`
- Create: `packages/ui/src/features/canvas/layouts/basic3d/useBasic3DLayout.test.ts`

**Context:** Replaces the stub. Follows the exact same pattern as `useCityLayout.ts`:
- Reads `resolver`, `lodLevel`, `selectedNodeId` from store
- All LOD 1–3 call `resolver.getTier(SemanticTier.Symbol)`, LOD 4 calls `getView({ focalNodeId })`
- Publishes positions to store via `setLayoutPositions` in a `useEffect`
- Computes `nearestNodeId` (closest node to camera) in a debounced `useEffect`, writes to `setNearestNodeId`

- [ ] **Step 1: Write the failing tests**

Create `packages/ui/src/features/canvas/layouts/basic3d/useBasic3DLayout.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBasic3DLayout } from './useBasic3DLayout'
import { useCanvasStore } from '../../store'
import { SemanticTier } from '@diagram-builder/core'
import type { IVMGraph, ParseResult, ViewResolver } from '@diagram-builder/core'

// Mock buildRadialTree so tests don't depend on its internals
vi.mock('./radialTree', () => ({
  buildRadialTree: vi.fn(() => ({
    positions: new Map([['node-1', { x: 1, y: 2, z: 3 }]]),
    bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 10, y: 10, z: 10 } },
    maxDepth: 1,
  })),
}))

const emptyGraph: IVMGraph = {
  nodes: [],
  edges: [],
  metadata: { name: '', schemaVersion: '1.0.0', generatedAt: '', rootPath: '', languages: [], stats: { totalNodes: 0, totalEdges: 0, nodesByType: {} as any, edgesByType: {} as any } },
  bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
}

const mockGraph: IVMGraph = { ...emptyGraph, nodes: [{ id: 'node-1' } as any] }

const mockResolver = {
  getTier: vi.fn().mockReturnValue(mockGraph),
  getView: vi.fn().mockReturnValue({ graph: mockGraph }),
} as unknown as ViewResolver

beforeEach(() => {
  vi.clearAllMocks()
  useCanvasStore.getState().reset?.()
  useCanvasStore.setState({ resolver: null, lodLevel: 1, selectedNodeId: null })
})

describe('useBasic3DLayout', () => {
  it('returns empty positions when resolver is null', () => {
    const { result } = renderHook(() => useBasic3DLayout())
    expect(result.current.positions.size).toBe(0)
    expect(result.current.graph.nodes).toHaveLength(0)
  })

  it('calls getTier(Symbol) for lodLevel 1', () => {
    useCanvasStore.setState({ resolver: mockResolver, lodLevel: 1 })
    renderHook(() => useBasic3DLayout())
    expect(mockResolver.getTier).toHaveBeenCalledWith(SemanticTier.Symbol)
  })

  it('calls getTier(Symbol) for lodLevel 2', () => {
    useCanvasStore.setState({ resolver: mockResolver, lodLevel: 2 })
    renderHook(() => useBasic3DLayout())
    expect(mockResolver.getTier).toHaveBeenCalledWith(SemanticTier.Symbol)
  })

  it('calls getTier(Symbol) for lodLevel 3', () => {
    useCanvasStore.setState({ resolver: mockResolver, lodLevel: 3 })
    renderHook(() => useBasic3DLayout())
    expect(mockResolver.getTier).toHaveBeenCalledWith(SemanticTier.Symbol)
  })

  it('calls getView with focalNodeId for lodLevel 4 when selectedNodeId is set', () => {
    useCanvasStore.setState({ resolver: mockResolver, lodLevel: 4, selectedNodeId: 'node-1' })
    renderHook(() => useBasic3DLayout())
    expect(mockResolver.getView).toHaveBeenCalledWith({
      baseTier: SemanticTier.Symbol,
      focalNodeId: 'node-1',
    })
  })

  it('falls back to getTier(Symbol) for lodLevel 4 when selectedNodeId is null', () => {
    useCanvasStore.setState({ resolver: mockResolver, lodLevel: 4, selectedNodeId: null })
    renderHook(() => useBasic3DLayout())
    expect(mockResolver.getTier).toHaveBeenCalledWith(SemanticTier.Symbol)
    expect(mockResolver.getView).not.toHaveBeenCalled()
  })

  it('publishes positions to the store via setLayoutPositions', async () => {
    useCanvasStore.setState({ resolver: mockResolver, lodLevel: 1 })
    const { rerender } = renderHook(() => useBasic3DLayout())
    // setLayoutPositions runs inside useEffect — flush it with act()
    await act(async () => { rerender() })
    const { layoutPositions } = useCanvasStore.getState()
    expect(layoutPositions.get('node-1')).toEqual({ x: 1, y: 2, z: 3 })
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/layouts/basic3d/useBasic3DLayout.test.ts
```

Expected: FAIL — hook returns stub values.

- [ ] **Step 3: Implement `useBasic3DLayout.ts`**

Replace the contents of `packages/ui/src/features/canvas/layouts/basic3d/useBasic3DLayout.ts`:

```typescript
import { useMemo, useEffect, useRef } from 'react'
import { SemanticTier } from '@diagram-builder/core'
import { useCanvasStore } from '../../store'
import { buildRadialTree } from './radialTree'
import type { IVMGraph, Position3D, NodeType, EdgeType } from '@diagram-builder/core'
import type { BoundingBox } from '../../layout/types'

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

export interface Basic3DLayoutResult {
  positions: Map<string, Position3D>
  bounds: BoundingBox
  maxDepth: number
  graph: IVMGraph
}

const ROOT_RADIUS = 30
const DEPTH_SPACING = 20

export function useBasic3DLayout(): Basic3DLayoutResult {
  const resolver = useCanvasStore((s) => s.resolver)
  const lodLevel = useCanvasStore((s) => s.lodLevel)
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)
  const setLayoutPositions = useCanvasStore((s) => s.setLayoutPositions)
  const setNearestNodeId = useCanvasStore((s) => s.setNearestNodeId)
  const cameraPosition = useCanvasStore((s) => s.camera.position)

  // LOD → ViewResolver mapping (all levels use Symbol tier)
  const graph = useMemo(() => {
    if (!resolver) return EMPTY_GRAPH
    if (lodLevel === 4 && selectedNodeId) {
      return resolver.getView({ baseTier: SemanticTier.Symbol, focalNodeId: selectedNodeId }).graph
    }
    return resolver.getTier(SemanticTier.Symbol)
  }, [resolver, lodLevel, selectedNodeId])

  // Run BFS tree layout
  const layout = useMemo(
    () => buildRadialTree(graph, { rootRadius: ROOT_RADIUS, depthSpacing: DEPTH_SPACING }),
    [graph]
  )

  // Publish positions to store for camera flight
  useEffect(() => {
    setLayoutPositions(layout.positions)
  }, [layout.positions, setLayoutPositions])

  // Compute nearest node to camera (debounced) for future LOD use
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!layout.positions.size) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      let closestId: string | null = null
      let closestDist = Infinity
      for (const [id, pos] of layout.positions) {
        const dx = cameraPosition.x - pos.x
        const dy = cameraPosition.y - pos.y
        const dz = cameraPosition.z - pos.z
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < closestDist) { closestDist = dist; closestId = id }
      }
      setNearestNodeId(closestId)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [layout.positions, cameraPosition, setNearestNodeId])

  return { ...layout, graph }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/layouts/basic3d/useBasic3DLayout.test.ts
```

Expected: All tests pass.

- [ ] **Step 5: Run all canvas tests to check for regressions**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/
```

Expected: All existing tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/brianmehrman/projects/diagram_builder
git add packages/ui/src/features/canvas/layouts/basic3d/useBasic3DLayout.ts \
        packages/ui/src/features/canvas/layouts/basic3d/useBasic3DLayout.test.ts
git commit -m "feat(basic3d): implement useBasic3DLayout with LOD wiring and BFS positions"
```

---

## Task 5: Create `Basic3DEdge.tsx`

**Files:**
- Create: `packages/ui/src/features/canvas/layouts/basic3d/Basic3DEdge.tsx`
- Create: `packages/ui/src/features/canvas/layouts/basic3d/Basic3DEdge.test.tsx`

**Context:** Renders a `<Line>` from `@react-three/drei` between two 3D positions at fixed opacity 0.4. No interaction. Follow the pattern from `CityEdge.tsx`.

- [ ] **Step 1: Write the failing test**

Create `packages/ui/src/features/canvas/layouts/basic3d/Basic3DEdge.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Basic3DEdge } from './Basic3DEdge'

// Mock drei Line (same pattern as CityView.test.tsx)
vi.mock('@react-three/drei', () => ({
  Line: ({ points, ...props }: any) => (
    <div data-testid="drei-line" data-opacity={props.lineWidth} data-points={JSON.stringify(points)} />
  ),
}))

describe('Basic3DEdge', () => {
  it('renders a Line element', () => {
    const { getByTestId } = render(
      <Basic3DEdge from={{ x: 0, y: 0, z: 0 }} to={{ x: 10, y: 5, z: 3 }} />
    )
    expect(getByTestId('drei-line')).toBeDefined()
  })

  it('passes from and to positions as points', () => {
    const { getByTestId } = render(
      <Basic3DEdge from={{ x: 1, y: 2, z: 3 }} to={{ x: 4, y: 5, z: 6 }} />
    )
    const el = getByTestId('drei-line')
    const points = JSON.parse(el.getAttribute('data-points') || '[]')
    // points should contain both positions
    expect(points).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/layouts/basic3d/Basic3DEdge.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `Basic3DEdge.tsx`**

Create `packages/ui/src/features/canvas/layouts/basic3d/Basic3DEdge.tsx`:

```typescript
import { Line } from '@react-three/drei'
import type { Position3D } from '../../../../shared/types'

interface Basic3DEdgeProps {
  from: Position3D
  to: Position3D
}

export function Basic3DEdge({ from, to }: Basic3DEdgeProps) {
  const points: [number, number, number][] = [
    [from.x, from.y, from.z],
    [to.x, to.y, to.z],
  ]
  return (
    <Line
      points={points}
      color="#ffffff"
      lineWidth={1}
      transparent
      opacity={0.4}
    />
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/layouts/basic3d/Basic3DEdge.test.tsx
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/brianmehrman/projects/diagram_builder
git add packages/ui/src/features/canvas/layouts/basic3d/Basic3DEdge.tsx \
        packages/ui/src/features/canvas/layouts/basic3d/Basic3DEdge.test.tsx
git commit -m "feat(basic3d): add Basic3DEdge component"
```

---

## Task 6: Create `Basic3DNode.tsx`

**Files:**
- Create: `packages/ui/src/features/canvas/layouts/basic3d/Basic3DNode.tsx`
- Create: `packages/ui/src/features/canvas/layouts/basic3d/Basic3DNode.test.tsx`

**Context:** Renders the correct Three.js geometry per `NodeType` using `getShapeForType`. Uses `isAbstractNode` to apply wireframe to abstract classes. On click: calls `selectNode`. On hover: calls existing tooltip system (use `canvasStore.setHoveredNode` if it exists, or check the existing pattern in city buildings).

- [ ] **Step 1: Check the existing hover/tooltip pattern**

```bash
grep -n "setHoveredNode\|hoveredNode\|onPointerOver\|onPointerOut" \
  /Users/brianmehrman/projects/diagram_builder/packages/ui/src/features/canvas/store.ts | head -10
grep -rn "onPointerOver\|setHoveredNode" \
  /Users/brianmehrman/projects/diagram_builder/packages/ui/src/features/canvas/components/buildings/ \
  --include="*.tsx" | head -5
```

Note the exact method name — use the same pattern.

- [ ] **Step 2: Write the failing tests**

Create `packages/ui/src/features/canvas/layouts/basic3d/Basic3DNode.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { Basic3DNode } from './Basic3DNode'
import { useCanvasStore } from '../../store'
import type { IVMNode } from '@diagram-builder/core'

// Minimal R3F mock
vi.mock('@react-three/fiber', () => ({
  useThree: () => ({ camera: { position: { x: 0, y: 0, z: 0 } } }),
}))

function makeNode(type: IVMNode['type'], isAbstract = false): IVMNode {
  return {
    id: 'test-node',
    type,
    position: { x: 0, y: 0, z: 0 },
    lod: 1,
    parentId: null,
    metadata: { label: 'TestNode', properties: { isAbstract } },
  } as unknown as IVMNode
}

describe('Basic3DNode', () => {
  beforeEach(() => {
    useCanvasStore.setState({ selectedNodeId: null })
  })

  it('renders without crashing for every NodeType', () => {
    const types: IVMNode['type'][] = [
      'file', 'directory', 'module', 'class', 'interface', 'function',
      'method', 'variable', 'type', 'enum', 'namespace', 'package', 'repository',
    ]
    for (const type of types) {
      expect(() =>
        render(
          <Basic3DNode
            node={makeNode(type)}
            position={{ x: 0, y: 0, z: 0 }}
            isSelected={false}
          />
        )
      ).not.toThrow()
    }
  })

  it('calls selectNode on click', () => {
    const selectNode = vi.spyOn(useCanvasStore.getState(), 'selectNode')
    const { container } = render(
      <Basic3DNode
        node={makeNode('function')}
        position={{ x: 0, y: 0, z: 0 }}
        isSelected={false}
      />
    )
    fireEvent.click(container.firstChild!)
    expect(selectNode).toHaveBeenCalledWith('test-node')
  })

  it('applies emissive highlight when isSelected is true', () => {
    // Render selected and unselected — both should render without error.
    // The emissive color difference is verified by snapshot or by checking
    // the meshStandardMaterial props via a custom R3F renderer if available.
    // At minimum: verify the component renders with isSelected=true without throwing.
    expect(() =>
      render(
        <Basic3DNode
          node={makeNode('function')}
          position={{ x: 0, y: 0, z: 0 }}
          isSelected={true}
        />
      )
    ).not.toThrow()
  })
})
```

- [ ] **Step 3: Run to verify it fails**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/layouts/basic3d/Basic3DNode.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement `Basic3DNode.tsx`**

Create `packages/ui/src/features/canvas/layouts/basic3d/Basic3DNode.tsx`:

```typescript
import { useCallback } from 'react'
import { useCanvasStore } from '../../store'
import { getShapeForType, getColorForType, isAbstractNode } from './basic3dShapes'
import type { IVMNode, Position3D } from '../../../../shared/types'

interface Basic3DNodeProps {
  node: IVMNode
  position: Position3D
  isSelected: boolean
}

/** Maps Basic3DShape to Three.js geometry JSX */
function ShapeGeometry({ shape }: { shape: ReturnType<typeof getShapeForType> }) {
  switch (shape) {
    case 'sphere':     return <sphereGeometry args={[0.8, 12, 12]} />
    case 'box':        return <boxGeometry args={[1.2, 1.2, 1.2]} />
    case 'disc':       return <cylinderGeometry args={[1.2, 1.2, 0.2, 16]} />
    case 'icosahedron':return <icosahedronGeometry args={[0.9, 0]} />
    case 'octahedron': return <octahedronGeometry args={[0.9, 0]} />
    case 'cylinder':   return <cylinderGeometry args={[0.6, 0.6, 1.4, 12]} />
    case 'ring':       return <torusGeometry args={[0.9, 0.25, 8, 16]} />
    case 'largeBox':   return <boxGeometry args={[1.8, 1.8, 1.8]} />
  }
}

export function Basic3DNode({ node, position, isSelected }: Basic3DNodeProps) {
  const selectNode = useCanvasStore((s) => s.selectNode)
  const setHoveredNode = useCanvasStore((s) => s.setHoveredNode)

  const shape = getShapeForType(node.type)
  const color = getColorForType(node.type)
  const wireframe = isAbstractNode(node)

  const handleClick = useCallback(
    (e: any) => { e.stopPropagation(); selectNode(node.id) },
    [node.id, selectNode]
  )
  const handlePointerOver = useCallback(
    () => setHoveredNode?.(node.id),
    [node.id, setHoveredNode]
  )
  const handlePointerOut = useCallback(
    () => setHoveredNode?.(null),
    [setHoveredNode]
  )

  return (
    <mesh
      position={[position.x, position.y, position.z]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <ShapeGeometry shape={shape} />
      <meshStandardMaterial
        color={color}
        wireframe={wireframe}
        emissive={isSelected ? color : '#000000'}
        emissiveIntensity={isSelected ? 0.4 : 0}
        transparent
        opacity={0.9}
      />
    </mesh>
  )
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/layouts/basic3d/Basic3DNode.test.tsx
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/brianmehrman/projects/diagram_builder
git add packages/ui/src/features/canvas/layouts/basic3d/Basic3DNode.tsx \
        packages/ui/src/features/canvas/layouts/basic3d/Basic3DNode.test.tsx
git commit -m "feat(basic3d): add Basic3DNode component with shape/color/selection"
```

---

## Task 7: Implement `Basic3DView.tsx` and integration tests

**Files:**
- Modify: `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.tsx`
- Create: `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.test.tsx`

**Context:** Replaces the empty stub. Calls `useBasic3DLayout()`, iterates nodes/edges from the returned graph, renders `Basic3DNode` and `Basic3DEdge` for each.

- [ ] **Step 1: Write the failing integration tests**

Create `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { Basic3DView } from './Basic3DView'
import { useCanvasStore } from '../../store'
import type { IVMGraph } from '@diagram-builder/core'

// Mock child components to keep test simple
vi.mock('./Basic3DNode', () => ({
  Basic3DNode: ({ node }: any) => <div data-testid={`node-${node.id}`} />,
}))
vi.mock('./Basic3DEdge', () => ({
  Basic3DEdge: ({ from, to }: any) => <div data-testid="edge" />,
}))
vi.mock('./useBasic3DLayout', () => ({
  useBasic3DLayout: vi.fn(),
}))

import { useBasic3DLayout } from './useBasic3DLayout'

const twoNodeGraph: IVMGraph = {
  nodes: [
    { id: 'n1', type: 'file', metadata: { label: 'n1', properties: {} } } as any,
    { id: 'n2', type: 'function', metadata: { label: 'n2', properties: {} } } as any,
  ],
  edges: [{ id: 'e1', source: 'n1', target: 'n2', type: 'contains' } as any],
  metadata: { name: '', schemaVersion: '1.0.0', generatedAt: '', rootPath: '', languages: [], stats: { totalNodes: 2, totalEdges: 1, nodesByType: {} as any, edgesByType: {} as any } },
  bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 10, y: 10, z: 10 } },
}

describe('Basic3DView', () => {
  beforeEach(() => {
    vi.mocked(useBasic3DLayout).mockReturnValue({
      graph: twoNodeGraph,
      positions: new Map([
        ['n1', { x: 0, y: 0, z: 0 }],
        ['n2', { x: 5, y: 5, z: 5 }],
      ]),
      bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 10, y: 10, z: 10 } },
      maxDepth: 1,
    })
    useCanvasStore.setState({ selectedNodeId: null })
  })

  it('renders a Basic3DNode for each node', () => {
    const { getByTestId } = render(<Basic3DView />)
    expect(getByTestId('node-n1')).toBeDefined()
    expect(getByTestId('node-n2')).toBeDefined()
  })

  it('renders a Basic3DEdge for each edge', () => {
    const { getAllByTestId } = render(<Basic3DView />)
    expect(getAllByTestId('edge')).toHaveLength(1)
  })

  it('renders nothing when positions map is empty', () => {
    vi.mocked(useBasic3DLayout).mockReturnValue({
      graph: { ...twoNodeGraph, nodes: [], edges: [] },
      positions: new Map(),
      bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
      maxDepth: 0,
    })
    const { queryAllByTestId } = render(<Basic3DView />)
    expect(queryAllByTestId(/^node-/)).toHaveLength(0)
    expect(queryAllByTestId('edge')).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/layouts/basic3d/Basic3DView.test.tsx
```

Expected: FAIL — view renders empty group stub.

- [ ] **Step 3: Implement `Basic3DView.tsx`**

Replace `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.tsx`:

```typescript
import { useCanvasStore } from '../../store'
import { useBasic3DLayout } from './useBasic3DLayout'
import { Basic3DNode } from './Basic3DNode'
import { Basic3DEdge } from './Basic3DEdge'

export function Basic3DView() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)
  const { graph, positions } = useBasic3DLayout()

  return (
    <group name="basic3d-view">
      {graph.nodes.map((node) => {
        const position = positions.get(node.id)
        if (!position) return null
        return (
          <Basic3DNode
            key={node.id}
            node={node}
            position={position}
            isSelected={node.id === selectedNodeId}
          />
        )
      })}
      {graph.edges.map((edge) => {
        const from = positions.get(edge.source)
        const to = positions.get(edge.target)
        if (!from || !to) return null
        return <Basic3DEdge key={edge.id} from={from} to={to} />
      })}
    </group>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run src/features/canvas/layouts/basic3d/Basic3DView.test.tsx
```

Expected: All tests pass.

- [ ] **Step 5: Run full test suite**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui
npx vitest run
```

Expected: All 1833+ tests pass (no regressions).

- [ ] **Step 6: Type-check**

```bash
cd /Users/brianmehrman/projects/diagram_builder
npm run type-check
```

Expected: Zero errors.

- [ ] **Step 7: Lint**

```bash
cd /Users/brianmehrman/projects/diagram_builder
npm run lint
```

Expected: Zero errors.

- [ ] **Step 8: Commit**

```bash
cd /Users/brianmehrman/projects/diagram_builder
git add packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.tsx \
        packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.test.tsx
git commit -m "feat(basic3d): implement Basic3DView with node and edge rendering"
```

---

## Task 8: E2E tests

**Files:**
- Create: `tests/e2e/basic3d-layout.spec.ts`

**Context:** Follow the patterns in `tests/e2e/canvas-visualization.spec.ts`. Use `tests/support/fixtures` and `tests/support/factories`.

**Important — Three.js is canvas-rendered, not DOM:** `<group>` and `<mesh>` elements in React Three Fiber do NOT produce DOM nodes that Playwright can query with `locator('[data-testid="..."]')`. All E2E assertions must target DOM elements only. The strategy is:
1. **Layout switching** — test via a DOM button (`data-testid="layout-switcher-basic3d"`) and a DOM indicator element that reflects the active layout (e.g., `data-testid="active-layout"` with `data-value="basic3d"` on a wrapper `<div>`).
2. **Node interaction** — node details panel opening and tooltip are DOM elements (they're HTML overlays, not Three.js), so click/hover tests work if we trigger them via the existing canvas interaction system. However, clicking a Three.js node requires knowing canvas pixel coordinates, which is layout-dependent and fragile. Scope node click/hover E2E tests to verifying the DOM panel opens when `selectNode` is called via a test helper that writes to the store directly, not via canvas click.
3. **Multi-root render** — verify via a DOM counter element or `data-node-count` attribute on a wrapper div.

Before writing any E2E test, check Step 1 for what DOM indicators already exist.

- [ ] **Step 1: Check existing E2E patterns for canvas scene identification**

```bash
grep -n "city\|canvas\|3d\|scene" /Users/brianmehrman/projects/diagram_builder/tests/e2e/canvas-visualization.spec.ts | head -20
grep -n "data-testid\|getByTestId\|locator" /Users/brianmehrman/projects/diagram_builder/tests/e2e/canvas-visualization.spec.ts | head -10
```

Use what you find to identify nodes/layout in the E2E test below.

- [ ] **Step 2: Check if a layout switcher UI exists**

```bash
grep -rn "activeLayout\|setActiveLayout\|layout.*switch\|LayoutSwitcher" \
  /Users/brianmehrman/projects/diagram_builder/packages/ui/src --include="*.tsx" | head -10
```

If no switcher UI exists yet, add a minimal `data-testid="layout-switcher"` button to whatever component calls `setActiveLayout` — or, if none exists, add a simple switcher button to `WorkspacePage` as part of this task.

- [ ] **Step 3: Add DOM indicator elements for layout state**

Three.js renders to a `<canvas>` — Playwright cannot query `<group>` or `<mesh>` elements via DOM selectors. All E2E assertions must target HTML DOM elements.

Add the following to the existing layout switcher component (or create one in `WorkspacePage` if none exists):

```tsx
// In the layout switcher UI component:
<div data-testid="active-layout" data-value={activeLayout} />
<button data-testid="layout-switcher-city" onClick={() => setActiveLayout('city')}>City</button>
<button data-testid="layout-switcher-basic3d" onClick={() => setActiveLayout('basic3d')}>Basic 3D</button>
```

For the node details and tooltip tests, these are DOM overlay panels (HTML elements rendered over the canvas) — check that they have appropriate `data-testid` attributes:

```bash
grep -rn "node-details\|NodeDetails\|data-testid" \
  /Users/brianmehrman/projects/diagram_builder/packages/ui/src/features/canvas/components/ \
  --include="*.tsx" | grep -i "detail\|tooltip\|hud" | head -10
```

Add any missing `data-testid` attributes to those panels.

- [ ] **Step 4: Write the E2E tests**

Create `tests/e2e/basic3d-layout.spec.ts`:

```typescript
/**
 * Basic3D Layout E2E Tests
 *
 * NOTE: Three.js renders to <canvas> — only DOM overlay elements are queryable.
 * Layout switching is verified via the `data-value` attribute on the active-layout indicator.
 * Node details and tooltips are HTML overlays and can be queried normally.
 */
import { test, expect } from '../support/fixtures'

test.describe('Basic3D Layout @P1', () => {
  test.beforeEach(async ({ page, mockGraph }) => {
    await mockGraph({
      metadata: { totalNodes: 10, totalEdges: 8, repositoryId: 'test-repo' },
    })
  })

  test('switching to basic3d updates the active layout indicator', async ({ page, testWorkspace }) => {
    await page.goto(`/workspace/${testWorkspace.id}`)
    await page.waitForSelector('[data-testid="workspace-header"]')

    await page.click('[data-testid="layout-switcher-basic3d"]')

    await expect(page.locator('[data-testid="active-layout"]')).toHaveAttribute('data-value', 'basic3d')
  })

  test('switching back to city restores city layout', async ({ page, testWorkspace }) => {
    await page.goto(`/workspace/${testWorkspace.id}`)
    await page.waitForSelector('[data-testid="workspace-header"]')

    await page.click('[data-testid="layout-switcher-basic3d"]')
    await page.click('[data-testid="layout-switcher-city"]')

    await expect(page.locator('[data-testid="active-layout"]')).toHaveAttribute('data-value', 'city')
  })

  test('selecting a node in basic3d mode opens the node details panel', async ({ page, testWorkspace }) => {
    await page.goto(`/workspace/${testWorkspace.id}`)
    await page.waitForSelector('[data-testid="workspace-header"]')
    await page.click('[data-testid="layout-switcher-basic3d"]')

    // Trigger node selection via the store exposed on window (avoids canvas click coordinate brittleness)
    await page.evaluate(() => {
      const store = (window as any).__canvasStore
      if (store) store.getState().selectNode('node-1')
    })

    await expect(page.locator('[data-testid="node-details-panel"]')).toBeVisible()
  })

  test('hovering a node sets hoveredNodeId and shows tooltip overlay', async ({ page, testWorkspace }) => {
    await page.goto(`/workspace/${testWorkspace.id}`)
    await page.waitForSelector('[data-testid="workspace-header"]')
    await page.click('[data-testid="layout-switcher-basic3d"]')

    // Set hovered node via store
    await page.evaluate(() => {
      const store = (window as any).__canvasStore
      if (store) store.getState().setHoveredNode('node-1')
    })

    await expect(page.locator('[data-testid="node-tooltip"]')).toBeVisible()
  })

  test('loads with multiple entry-point nodes in the graph', async ({ page, testWorkspace, mockGraph }) => {
    await mockGraph({
      nodes: [
        { id: 'entry-a', type: 'file', metadata: { label: 'entry-a', properties: { depth: 0 } } },
        { id: 'entry-b', type: 'file', metadata: { label: 'entry-b', properties: { depth: 0 } } },
        { id: 'child', type: 'function', metadata: { label: 'child', properties: { depth: 1 } } },
      ],
      edges: [{ id: 'e1', source: 'entry-a', target: 'child', type: 'contains' }],
      metadata: { totalNodes: 3, totalEdges: 1, repositoryId: 'test-repo' },
    })
    await page.goto(`/workspace/${testWorkspace.id}`)
    await page.click('[data-testid="layout-switcher-basic3d"]')

    // Verify graph loaded with expected node count via the HUD or a DOM counter
    await expect(page.locator('[data-testid="workspace-header"]')).toBeVisible()
    // Verify active layout switched successfully
    await expect(page.locator('[data-testid="active-layout"]')).toHaveAttribute('data-value', 'basic3d')
  })
})
```

**Note on `window.__canvasStore`:** The store must be exposed on `window` in development mode for E2E tests to call store actions directly. Check if this already exists:

```bash
grep -rn "__canvasStore\|window.*store" \
  /Users/brianmehrman/projects/diagram_builder/packages/ui/src --include="*.ts" --include="*.tsx" | head -5
```

If not, add it in `store.ts` under a dev-mode guard:

```typescript
if (import.meta.env.DEV) {
  (window as any).__canvasStore = useCanvasStore
}
```

- [ ] **Step 5: Run E2E tests**

Ensure the dev server is running first:

```bash
cd /Users/brianmehrman/projects/diagram_builder && ./scripts/init.sh
```

Then in another terminal:

```bash
cd /Users/brianmehrman/projects/diagram_builder
npx playwright test tests/e2e/basic3d-layout.spec.ts
```

Expected: All 5 tests pass. Fix any DOM testid gaps before committing.

- [ ] **Step 6: Run full unit test suite and type-check one final time**

```bash
cd /Users/brianmehrman/projects/diagram_builder/packages/ui && npx vitest run
cd /Users/brianmehrman/projects/diagram_builder && npm run type-check && npm run lint
```

Expected: All clear.

- [ ] **Step 7: Commit**

```bash
cd /Users/brianmehrman/projects/diagram_builder
git add tests/e2e/basic3d-layout.spec.ts \
        packages/ui/src/features/canvas/store.ts \
        packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.tsx \
        packages/ui/src/features/canvas/layouts/basic3d/Basic3DNode.tsx
git commit -m "feat(basic3d): add E2E tests with DOM-based layout indicator strategy"
```

---

## Done

All tasks complete when:
- `npx vitest run` passes in `packages/ui` with zero failures
- `npm run type-check` produces zero errors
- `npm run lint` produces zero errors
- `npx playwright test tests/e2e/basic3d-layout.spec.ts` passes all 5 tests
- Switching to Basic3D in the browser renders floating nodes as typed shapes connected by edges, growing outward from entry points
