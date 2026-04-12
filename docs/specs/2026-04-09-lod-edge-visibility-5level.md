# LOD Edge Visibility & 5-Level Basic3D LOD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix edge connections to appear whenever a node is selected (at any LOD) and when the camera is close to nodes (LOD 4+), and add a 5th LOD level to Basic3D that introduces a gradual transition between cluster view (LOD 1) and full container view (was LOD 2, now LOD 3).

**Architecture:** Two independent subsystems: (1) `isEdgeVisibleForLod` selection-first reorder + CitySky v2 routing fix, (2) Basic3D 5-level LOD — new `approach` threshold at 200 units shifts old LOD 2/3/4 to 3/4/5 and inserts a new LOD 2 showing only `repository`/`package` nodes. Both layouts share the same `isEdgeVisibleForLod` function; only Basic3D needs LOD 5 node-type changes.

**Tech Stack:** React, Zustand, Vitest, @testing-library/react, TypeScript, @react-three/fiber

---

## File Map

| File | Change |
|---|---|
| `packages/ui/src/features/canvas/views/wireUtils.ts` | Reorder `isEdgeVisibleForLod`: selection check before LOD gate |
| `packages/ui/src/features/canvas/views/wireUtils.test.ts` | Add `isEdgeVisibleForLod` unit tests |
| `packages/ui/src/features/canvas/hooks/lodCalculatorUtils.ts` | Add `approach: 200` threshold; `calculateLodFromDistance` returns 1-5 |
| `packages/ui/src/features/canvas/hooks/lodCalculatorUtils.test.ts` | Update all LOD number assertions for 5-level system |
| `packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.ts` | Add `TOP_CONTAINER_TYPES`; update `isNodeVisibleAtLod` for LOD 5 |
| `packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.test.ts` | Update all LOD level assertions |
| `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.tsx` | 5-branch LOD render; LOD 2-4 path calls `isEdgeVisibleForLod` |
| `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.test.tsx` | Rewrite all LOD-specific tests for new level numbers |
| `packages/ui/src/features/canvas/layouts/basic3d/useBasic3DLayout.ts` | Focal-subgraph gate: `< 5` instead of `<= 3` |
| `packages/ui/src/features/canvas/LodControls.tsx` | LOD_LEVELS 1-5 with correct labels |
| `packages/ui/src/features/canvas/layouts/city/CitySky.tsx` | v2 filter: include all edges to/from selected node |
| `packages/ui/src/features/canvas/layouts/city/useCityFiltering.ts` | Add `composes` to allowed edge types |
| `packages/ui/src/features/canvas/Canvas3D.tsx` | FlyControls: `useFrame` syncs camera position to store |

---

## Task 1: Fix `isEdgeVisibleForLod` — selection before LOD gate

**Files:**
- Modify: `packages/ui/src/features/canvas/views/wireUtils.ts`
- Test: `packages/ui/src/features/canvas/views/wireUtils.test.ts`

**Root cause:** `isEdgeVisibleForLod` returns `false` when `lodLevel < 3` before checking selection, so selecting a node at LOD 1 or 2 shows no edges. Moving the selection check first fixes both layouts.

- [ ] **Step 1: Write the failing tests**

Append to `wireUtils.test.ts` (after the existing `describe` blocks):

```ts
import {
  classifyEdgeRouting,
  calculateWireArcPeak,
  isWireVisible,
  getWireColor,
  isEdgeVisibleForLod,
  WIRE_LOD_MIN,
} from './wireUtils'
```

Add:

```ts
describe('isEdgeVisibleForLod', () => {
  const CAMERA = { x: 0, y: 0, z: 0 }
  // dist² = 25, well within EDGE_PROXIMITY_SQ (3600)
  const NEAR_POS = { x: 5, y: 0, z: 0 }
  // dist² = 40000, outside EDGE_PROXIMITY_SQ
  const FAR_POS = { x: 200, y: 0, z: 0 }

  it('LOD 1 with selection: returns false (clusters only, no individual edges)', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', 'src', 1, NEAR_POS, NEAR_POS, CAMERA)).toBe(false)
  })

  it('LOD 2 with source selected: returns true', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', 'src', 2, FAR_POS, FAR_POS, CAMERA)).toBe(true)
  })

  it('LOD 2 with target selected: returns true', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', 'tgt', 2, FAR_POS, FAR_POS, CAMERA)).toBe(true)
  })

  it('LOD 2 with unrelated node selected: returns false', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', 'other', 2, NEAR_POS, NEAR_POS, CAMERA)).toBe(false)
  })

  it('LOD 2 no selection: returns false', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', null, 2, NEAR_POS, NEAR_POS, CAMERA)).toBe(false)
  })

  it('LOD 3 with source selected: returns true', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', 'src', 3, FAR_POS, FAR_POS, CAMERA)).toBe(true)
  })

  it('LOD 3 no selection: returns false', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', null, 3, NEAR_POS, NEAR_POS, CAMERA)).toBe(false)
  })

  it('LOD 4 no selection, source near camera: returns true (proximity)', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', null, 4, NEAR_POS, FAR_POS, CAMERA)).toBe(true)
  })

  it('LOD 4 no selection, target near camera: returns true (proximity)', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', null, 4, FAR_POS, NEAR_POS, CAMERA)).toBe(true)
  })

  it('LOD 4 no selection, both nodes far: returns false', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', null, 4, FAR_POS, FAR_POS, CAMERA)).toBe(false)
  })

  it('LOD 4 with selection, nodes far: returns true (selection beats proximity)', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', 'src', 4, FAR_POS, FAR_POS, CAMERA)).toBe(true)
  })

  it('LOD 4 no selection, undefined positions: returns false', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', null, 4, undefined, undefined, CAMERA)).toBe(false)
  })

  it('LOD 5 no selection, source near camera: returns true (proximity applies at LOD 5)', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', null, 5, NEAR_POS, FAR_POS, CAMERA)).toBe(true)
  })

  it('LOD 5 with selection: returns true', () => {
    expect(isEdgeVisibleForLod('src', 'tgt', 'src', 5, FAR_POS, FAR_POS, CAMERA)).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/brianmehrman/projects/diagram_builder
npx vitest run packages/ui/src/features/canvas/views/wireUtils.test.ts
```

Expected: Multiple FAILures — tests for LOD 2/3 selection return false, LOD 5 proximity returns false.

- [ ] **Step 3: Fix `isEdgeVisibleForLod` in `wireUtils.ts`**

Replace the entire `isEdgeVisibleForLod` function (lines ~55–83):

```ts
/**
 * Shared edge visibility rule used by both City and Basic3D layouts.
 *
 * - LOD 1         → never show (cluster view only)
 * - LOD 2+ with selection → show if either endpoint is the selected node
 * - LOD < 4, no selection → never show
 * - LOD 4+, no selection → show if either endpoint is within 60 units of camera
 */
export function isEdgeVisibleForLod(
  sourceId: string,
  targetId: string,
  selectedNodeId: string | null,
  lodLevel: number,
  sourcePos: { x: number; y: number; z: number } | undefined,
  targetPos: { x: number; y: number; z: number } | undefined,
  cameraPos: { x: number; y: number; z: number }
): boolean {
  // Selection override: show at any LOD ≥ 2 if either endpoint is selected
  if (
    lodLevel >= 2 &&
    selectedNodeId !== null &&
    (sourceId === selectedNodeId || targetId === selectedNodeId)
  ) {
    return true
  }

  // No selection: require LOD 4+ for proximity-based edges
  if (lodLevel < 4) return false

  if (!sourcePos || !targetPos) return false

  const srcDx = sourcePos.x - cameraPos.x
  const srcDy = sourcePos.y - cameraPos.y
  const srcDz = sourcePos.z - cameraPos.z
  if (srcDx * srcDx + srcDy * srcDy + srcDz * srcDz <= EDGE_PROXIMITY_SQ) return true

  const tgtDx = targetPos.x - cameraPos.x
  const tgtDy = targetPos.y - cameraPos.y
  const tgtDz = targetPos.z - cameraPos.z
  return tgtDx * tgtDx + tgtDy * tgtDy + tgtDz * tgtDz <= EDGE_PROXIMITY_SQ
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run packages/ui/src/features/canvas/views/wireUtils.test.ts
```

Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/features/canvas/views/wireUtils.ts \
        packages/ui/src/features/canvas/views/wireUtils.test.ts
git commit -m "fix(edges): selection shows connected edges at any LOD ≥ 2, proximity at LOD 4+"
```

---

## Task 2: Add LOD 5 to the LOD calculator

**Files:**
- Modify: `packages/ui/src/features/canvas/hooks/lodCalculatorUtils.ts`
- Test: `packages/ui/src/features/canvas/hooks/lodCalculatorUtils.test.ts`

**What changes:** Add an `approach` threshold at 200 units. The existing `street`/`neighborhood`/`district` threshold VALUES stay the same but now activate LOD 5/4/3 instead of LOD 4/3/2. A new `approach: 200` threshold activates LOD 2. LOD 1 now starts at > 200 units (was > 120).

- [ ] **Step 1: Update `lodCalculatorUtils.ts`**

Replace the entire file:

```ts
/**
 * LOD Calculator Utilities
 *
 * Pure functions that map camera distance to LOD level with
 * hysteresis to prevent flickering at threshold boundaries.
 */

/**
 * Distance thresholds for LOD transitions (in world units).
 * Camera closer than the threshold gets the higher LOD level.
 *
 * - LOD 1 (city):      distance > 200
 * - LOD 2 (approach):  120 < distance ≤ 200  — repository + package nodes
 * - LOD 3 (district):   60 < distance ≤ 120  — all container nodes
 * - LOD 4 (neighborhood): 25 < distance ≤ 60 — + structural nodes (file, class, …)
 * - LOD 5 (street):   distance ≤ 25          — all nodes + proximity edges
 */
export const LOD_THRESHOLDS = {
  /** Distance below which LOD 5 (street) activates */
  street: 25,
  /** Distance below which LOD 4 (neighborhood) activates */
  neighborhood: 60,
  /** Distance below which LOD 3 (district) activates */
  district: 120,
  /** Distance below which LOD 2 (approach) activates */
  approach: 200,
} as const

/**
 * Hysteresis buffer as a fraction of the threshold distance.
 */
export const HYSTERESIS_FACTOR = 0.08

/**
 * Calculate the LOD level from camera distance to scene center.
 *
 * @param distance - Euclidean distance from camera to origin
 * @returns LOD level 1-5
 */
export function calculateLodFromDistance(distance: number): number {
  if (distance <= LOD_THRESHOLDS.street) return 5
  if (distance <= LOD_THRESHOLDS.neighborhood) return 4
  if (distance <= LOD_THRESHOLDS.district) return 3
  if (distance <= LOD_THRESHOLDS.approach) return 2
  return 1
}

/**
 * Calculate LOD level with hysteresis to prevent threshold flickering.
 */
export function calculateLodWithHysteresis(distance: number, currentLod: number): number {
  const rawLod = calculateLodFromDistance(distance)

  if (rawLod > currentLod) return rawLod

  if (rawLod < currentLod) {
    const thresholdForCurrentLod = getThresholdForLod(currentLod)
    const buffer = thresholdForCurrentLod * HYSTERESIS_FACTOR

    if (distance > thresholdForCurrentLod + buffer) {
      return rawLod
    }
    return currentLod
  }

  return currentLod
}

/**
 * Get the distance threshold that activates a given LOD level.
 */
function getThresholdForLod(lod: number): number {
  switch (lod) {
    case 5:
      return LOD_THRESHOLDS.street
    case 4:
      return LOD_THRESHOLDS.neighborhood
    case 3:
      return LOD_THRESHOLDS.district
    case 2:
      return LOD_THRESHOLDS.approach
    default:
      return Infinity
  }
}

/**
 * Calculate euclidean distance from camera position to scene origin.
 */
export function cameraDistanceToOrigin(x: number, y: number, z: number): number {
  return Math.sqrt(x * x + y * y + z * z)
}
```

- [ ] **Step 2: Update all tests in `lodCalculatorUtils.test.ts`**

Replace the entire test file:

```ts
import { describe, it, expect } from 'vitest'
import {
  calculateLodFromDistance,
  calculateLodWithHysteresis,
  cameraDistanceToOrigin,
  LOD_THRESHOLDS,
  HYSTERESIS_FACTOR,
} from './lodCalculatorUtils'

describe('calculateLodFromDistance', () => {
  it('returns 5 at distance 0', () => expect(calculateLodFromDistance(0)).toBe(5))
  it('returns 5 at street threshold', () =>
    expect(calculateLodFromDistance(LOD_THRESHOLDS.street)).toBe(5))
  it('returns 4 just above street threshold', () =>
    expect(calculateLodFromDistance(LOD_THRESHOLDS.street + 1)).toBe(4))
  it('returns 4 at neighborhood threshold', () =>
    expect(calculateLodFromDistance(LOD_THRESHOLDS.neighborhood)).toBe(4))
  it('returns 3 just above neighborhood threshold', () =>
    expect(calculateLodFromDistance(LOD_THRESHOLDS.neighborhood + 1)).toBe(3))
  it('returns 3 at district threshold', () =>
    expect(calculateLodFromDistance(LOD_THRESHOLDS.district)).toBe(3))
  it('returns 2 just above district threshold', () =>
    expect(calculateLodFromDistance(LOD_THRESHOLDS.district + 1)).toBe(2))
  it('returns 2 at approach threshold', () =>
    expect(calculateLodFromDistance(LOD_THRESHOLDS.approach)).toBe(2))
  it('returns 1 just above approach threshold', () =>
    expect(calculateLodFromDistance(LOD_THRESHOLDS.approach + 1)).toBe(1))
  it('returns 1 at very large distance', () => expect(calculateLodFromDistance(10000)).toBe(1))
})

describe('calculateLodWithHysteresis', () => {
  it('zooming in (lower distance): transitions immediately', () => {
    // At LOD 3 (district level), zooming into LOD 4 (neighborhood)
    expect(calculateLodWithHysteresis(LOD_THRESHOLDS.neighborhood - 1, 3)).toBe(4)
  })

  it('zooming out: stays at current LOD within hysteresis buffer', () => {
    // At LOD 4, camera just above neighborhood threshold
    const buffer = LOD_THRESHOLDS.neighborhood * HYSTERESIS_FACTOR
    const justOutside = LOD_THRESHOLDS.neighborhood + buffer * 0.5
    expect(calculateLodWithHysteresis(justOutside, 4)).toBe(4)
  })

  it('zooming out: drops LOD once past hysteresis buffer', () => {
    // At LOD 4, camera well past neighborhood threshold + buffer
    const buffer = LOD_THRESHOLDS.neighborhood * HYSTERESIS_FACTOR
    const wellOutside = LOD_THRESHOLDS.neighborhood + buffer * 2
    expect(calculateLodWithHysteresis(wellOutside, 4)).toBe(3)
  })

  it('LOD 3 → LOD 2 hysteresis: stays at 3 within buffer', () => {
    const buffer = LOD_THRESHOLDS.district * HYSTERESIS_FACTOR
    const justOutside = LOD_THRESHOLDS.district + buffer * 0.5
    expect(calculateLodWithHysteresis(justOutside, 3)).toBe(3)
  })

  it('LOD 2 → LOD 1 hysteresis: stays at 2 within buffer', () => {
    const buffer = LOD_THRESHOLDS.approach * HYSTERESIS_FACTOR
    const justOutside = LOD_THRESHOLDS.approach + buffer * 0.5
    expect(calculateLodWithHysteresis(justOutside, 2)).toBe(2)
  })

  it('same distance: no LOD change', () => {
    expect(calculateLodWithHysteresis(50, 4)).toBe(4)
  })
})

describe('cameraDistanceToOrigin', () => {
  it('returns 0 at origin', () => expect(cameraDistanceToOrigin(0, 0, 0)).toBe(0))
  it('returns correct distance for (3, 4, 0)', () =>
    expect(cameraDistanceToOrigin(3, 4, 0)).toBeCloseTo(5))
  it('returns correct distance for (1, 1, 1)', () =>
    expect(cameraDistanceToOrigin(1, 1, 1)).toBeCloseTo(Math.sqrt(3)))
})
```

- [ ] **Step 3: Run tests to confirm they pass**

```bash
npx vitest run packages/ui/src/features/canvas/hooks/lodCalculatorUtils.test.ts
```

Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/features/canvas/hooks/lodCalculatorUtils.ts \
        packages/ui/src/features/canvas/hooks/lodCalculatorUtils.test.ts
git commit -m "feat(lod): add LOD 5 level — approach threshold at 200 units, 5-level 1-5 system"
```

---

## Task 3: Update `isNodeVisibleAtLod` for 5-level LOD

**Files:**
- Modify: `packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.ts`
- Test: `packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.test.ts`

**What changes:** Add `TOP_CONTAINER_TYPES` (repository, package only) for new LOD 2. Shift existing LOD 2→3, LOD 3→4, LOD 4→5 in `isNodeVisibleAtLod`.

- [ ] **Step 1: Update the tests in `basic3dShapes.test.ts`**

Replace the `describe('isNodeVisibleAtLod', ...)` block with:

```ts
describe('isNodeVisibleAtLod', () => {
  const TOP_CONTAINER_TYPES: NodeType[] = ['repository', 'package']
  const OTHER_CONTAINER_TYPES: NodeType[] = ['namespace', 'module', 'directory']
  const STRUCTURAL_ONLY_TYPES: NodeType[] = ['file', 'class', 'interface', 'type']
  const LEAF_TYPES: NodeType[] = ['function', 'method', 'variable', 'enum']

  it('LOD 1 returns false for all node types', () => {
    const allTypes: NodeType[] = [
      ...TOP_CONTAINER_TYPES,
      ...OTHER_CONTAINER_TYPES,
      ...STRUCTURAL_ONLY_TYPES,
      ...LEAF_TYPES,
    ]
    for (const t of allTypes) {
      expect(isNodeVisibleAtLod(makeNode(t), 1), `${t} should not be visible at LOD 1`).toBe(false)
    }
  })

  it('LOD 2 returns true for top container types (repository, package)', () => {
    for (const t of TOP_CONTAINER_TYPES) {
      expect(isNodeVisibleAtLod(makeNode(t), 2), `${t} should be visible at LOD 2`).toBe(true)
    }
  })

  it('LOD 2 returns false for other container types (namespace, module, directory)', () => {
    for (const t of OTHER_CONTAINER_TYPES) {
      expect(isNodeVisibleAtLod(makeNode(t), 2), `${t} should NOT be visible at LOD 2`).toBe(false)
    }
  })

  it('LOD 2 returns false for structural and leaf types', () => {
    for (const t of [...STRUCTURAL_ONLY_TYPES, ...LEAF_TYPES]) {
      expect(isNodeVisibleAtLod(makeNode(t), 2), `${t} should NOT be visible at LOD 2`).toBe(false)
    }
  })

  it('LOD 3 returns true for all container types', () => {
    for (const t of [...TOP_CONTAINER_TYPES, ...OTHER_CONTAINER_TYPES]) {
      expect(isNodeVisibleAtLod(makeNode(t), 3), `${t} should be visible at LOD 3`).toBe(true)
    }
  })

  it('LOD 3 returns false for structural-only and leaf types', () => {
    for (const t of [...STRUCTURAL_ONLY_TYPES, ...LEAF_TYPES]) {
      expect(isNodeVisibleAtLod(makeNode(t), 3), `${t} should NOT be visible at LOD 3`).toBe(false)
    }
  })

  it('LOD 4 returns true for all container + structural types', () => {
    for (const t of [...TOP_CONTAINER_TYPES, ...OTHER_CONTAINER_TYPES, ...STRUCTURAL_ONLY_TYPES]) {
      expect(isNodeVisibleAtLod(makeNode(t), 4), `${t} should be visible at LOD 4`).toBe(true)
    }
  })

  it('LOD 4 returns false for leaf types', () => {
    for (const t of LEAF_TYPES) {
      expect(isNodeVisibleAtLod(makeNode(t), 4), `${t} should NOT be visible at LOD 4`).toBe(false)
    }
  })

  it('LOD 5 returns true for all node types', () => {
    const allTypes: NodeType[] = [
      ...TOP_CONTAINER_TYPES,
      ...OTHER_CONTAINER_TYPES,
      ...STRUCTURAL_ONLY_TYPES,
      ...LEAF_TYPES,
    ]
    for (const t of allTypes) {
      expect(isNodeVisibleAtLod(makeNode(t), 5), `${t} should be visible at LOD 5`).toBe(true)
    }
  })
})
```

The test file uses a `makeNode` helper. If it doesn't exist, add it before the describe block:

```ts
function makeNode(type: NodeType): IVMNode {
  return {
    id: `node-${type}`,
    type,
    metadata: { label: type, path: `src/${type}.ts`, properties: {} },
    lod: 0,
    position: { x: 0, y: 0, z: 0 },
  }
}
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.test.ts
```

Expected: Multiple FAILures — LOD 2 shows all containers (not just top), LOD 4 shows all types (not just structural), LOD 5 does not exist.

- [ ] **Step 3: Update `basic3dShapes.ts`**

Replace the LOD visibility section (from `// LOD visibility` comment to end of file):

```ts
// =============================================================================
// LOD visibility
// =============================================================================

/** Repository and package — the top-level containers visible at LOD 2 (approach). */
const TOP_CONTAINER_TYPES = new Set<NodeType>(['repository', 'package'])

/** All container types — visible at LOD 3 (district). */
export const CONTAINER_TYPES = new Set<NodeType>([
  'repository',
  'package',
  'namespace',
  'module',
  'directory',
])

/** Container + structural types — visible at LOD 4 (neighborhood). */
export const STRUCTURAL_TYPES = new Set<NodeType>([
  ...CONTAINER_TYPES,
  'file',
  'class',
  'interface',
  'type',
])

/**
 * Returns true if a node should be rendered as an individual node at the given LOD level.
 *
 * LOD 1: no individual nodes (cluster layer only)
 * LOD 2: top-level containers only (repository, package)
 * LOD 3: all container nodes (+ namespace, module, directory)
 * LOD 4: container + structural nodes (+ file, class, interface, type) — labels visible
 * LOD 5: all node types
 */
export function isNodeVisibleAtLod(node: IVMNode, lod: number): boolean {
  if (lod >= 5) return true
  if (lod === 4) return STRUCTURAL_TYPES.has(node.type)
  if (lod === 3) return CONTAINER_TYPES.has(node.type)
  if (lod === 2) return TOP_CONTAINER_TYPES.has(node.type)
  return false // LOD 1: cluster layer only
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.test.ts
```

Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.ts \
        packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.test.ts
git commit -m "feat(basic3d): update isNodeVisibleAtLod for 5-level LOD — LOD2=top containers, LOD5=all"
```

---

## Task 4: Rebuild `Basic3DView` for 5-level LOD with selection-aware edge rendering

**Files:**
- Modify: `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.tsx`
- Test: `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.test.tsx`

**What changes:** The LOD 2-4 branch now calls `isEdgeVisibleForLod` (selection-based edges). LOD 5 is the new "all nodes + proximity" branch. Labels appear at LOD 4+. LOD 2 shows only top containers.

- [ ] **Step 1: Update all LOD-specific tests in `Basic3DView.test.tsx`**

Replace the `describe('LOD-driven edge visibility', ...)` and `describe('LOD node-type filtering', ...)` blocks entirely with:

```ts
describe('LOD-driven rendering', () => {
  it('LOD 1: renders ClusterLayer, no individual nodes or edges', () => {
    setupLayout(makeEmptyGraph())
    useCanvasStore.getState().setLodLevel(1)
    useCanvasStore.setState({ layoutState: 'ready' })

    const { queryAllByTestId } = render(<Basic3DView />)
    expect(queryAllByTestId('basic3d-node')).toHaveLength(0)
    expect(queryAllByTestId('basic3d-edge')).toHaveLength(0)
    expect(queryAllByTestId('cluster-layer')).toHaveLength(1)
  })

  it('LOD 2: renders only repository and package nodes', () => {
    const nodes = [
      createNode('repo', 'repository'),
      createNode('pkg', 'package'),
      createNode('mod', 'module'),
      createNode('file-a', 'file'),
      createNode('fn-a', 'function'),
    ]
    setupLayout(makeGraph(nodes))
    useCanvasStore.getState().setLodLevel(2)
    useCanvasStore.setState({ layoutState: 'ready' })

    const { getAllByTestId } = render(<Basic3DView />)
    const rendered = getAllByTestId('basic3d-node').map((el) => el.getAttribute('data-node-id'))
    expect(rendered).toContain('repo')
    expect(rendered).toContain('pkg')
    expect(rendered).not.toContain('mod')
    expect(rendered).not.toContain('file-a')
    expect(rendered).not.toContain('fn-a')
  })

  it('LOD 2: no edges without selection', () => {
    const nodes = [createNode('repo', 'repository'), createNode('pkg', 'package')]
    const edges = [createEdge('repo', 'pkg')]
    setupLayout(makeGraph(nodes, edges))
    useCanvasStore.getState().setLodLevel(2)
    useCanvasStore.setState({ layoutState: 'ready' })

    const { queryAllByTestId } = render(<Basic3DView />)
    expect(queryAllByTestId('basic3d-edge')).toHaveLength(0)
  })

  it('LOD 2: shows edge when selected node is connected', () => {
    const nodes = [createNode('repo', 'repository'), createNode('pkg', 'package')]
    const edges = [createEdge('repo', 'pkg')]
    setupLayout(makeGraph(nodes, edges))
    useCanvasStore.getState().setLodLevel(2)
    useCanvasStore.getState().selectNode('repo')
    useCanvasStore.setState({ layoutState: 'ready' })

    const { getAllByTestId } = render(<Basic3DView />)
    expect(getAllByTestId('basic3d-edge')).toHaveLength(1)
  })

  it('LOD 3: renders all container nodes', () => {
    const nodes = [
      createNode('repo', 'repository'),
      createNode('mod', 'module'),
      createNode('dir', 'directory'),
      createNode('file-a', 'file'),
      createNode('fn-a', 'function'),
    ]
    setupLayout(makeGraph(nodes))
    useCanvasStore.getState().setLodLevel(3)
    useCanvasStore.setState({ layoutState: 'ready' })

    const { getAllByTestId } = render(<Basic3DView />)
    const rendered = getAllByTestId('basic3d-node').map((el) => el.getAttribute('data-node-id'))
    expect(rendered).toContain('repo')
    expect(rendered).toContain('mod')
    expect(rendered).toContain('dir')
    expect(rendered).not.toContain('file-a')
    expect(rendered).not.toContain('fn-a')
  })

  it('LOD 3: no edges without selection', () => {
    const nodes = [createNode('mod-a', 'module'), createNode('mod-b', 'module')]
    const edges = [createEdge('mod-a', 'mod-b')]
    setupLayout(makeGraph(nodes, edges))
    useCanvasStore.getState().setLodLevel(3)
    useCanvasStore.setState({ layoutState: 'ready' })

    const { queryAllByTestId } = render(<Basic3DView />)
    expect(queryAllByTestId('basic3d-edge')).toHaveLength(0)
  })

  it('LOD 3: shows edge when selected node is connected and both endpoints are visible', () => {
    const nodes = [createNode('mod-a', 'module'), createNode('mod-b', 'module')]
    const edges = [createEdge('mod-a', 'mod-b')]
    setupLayout(makeGraph(nodes, edges))
    useCanvasStore.getState().setLodLevel(3)
    useCanvasStore.getState().selectNode('mod-a')
    useCanvasStore.setState({ layoutState: 'ready' })

    const { getAllByTestId } = render(<Basic3DView />)
    expect(getAllByTestId('basic3d-edge')).toHaveLength(1)
  })

  it('LOD 4: renders container + structural nodes, not leaf nodes', () => {
    const nodes = [
      createNode('mod', 'module'),
      createNode('file-a', 'file'),
      createNode('cls', 'class'),
      createNode('fn-a', 'function'),
      createNode('meth', 'method'),
    ]
    setupLayout(makeGraph(nodes))
    useCanvasStore.getState().setLodLevel(4)
    useCanvasStore.setState({ layoutState: 'ready' })

    const { getAllByTestId } = render(<Basic3DView />)
    const rendered = getAllByTestId('basic3d-node').map((el) => el.getAttribute('data-node-id'))
    expect(rendered).toContain('mod')
    expect(rendered).toContain('file-a')
    expect(rendered).toContain('cls')
    expect(rendered).not.toContain('fn-a')
    expect(rendered).not.toContain('meth')
  })

  it('LOD 4: shows edge when selected node is connected', () => {
    const nodes = [createNode('file-a', 'file'), createNode('file-b', 'file')]
    const edges = [createEdge('file-a', 'file-b')]
    setupLayout(makeGraph(nodes, edges))
    useCanvasStore.getState().setLodLevel(4)
    useCanvasStore.getState().selectNode('file-a')
    useCanvasStore.setState({ layoutState: 'ready' })

    const { getAllByTestId } = render(<Basic3DView />)
    expect(getAllByTestId('basic3d-edge')).toHaveLength(1)
  })

  it('LOD 5: renders all node types', () => {
    const nodes = [
      createNode('mod', 'module'),
      createNode('file-a', 'file'),
      createNode('fn-a', 'function'),
      createNode('meth', 'method'),
    ]
    setupLayout(makeGraph(nodes))
    useCanvasStore.getState().setLodLevel(5)
    useCanvasStore.setState({ layoutState: 'ready' })

    const { getAllByTestId } = render(<Basic3DView />)
    expect(getAllByTestId('basic3d-node')).toHaveLength(4)
  })

  it('LOD 5: renders edge when both endpoints are near camera (proximity)', () => {
    // Default camera in store: { x: 0, y: 0, z: 0 }
    // Nodes at x=5 and x=10 — both within EDGE_PROXIMITY_SQ (60² = 3600)
    const nodes = [createNode('a', 'function'), createNode('b', 'function')]
    const edges = [createEdge('a', 'b')]
    const positions = new Map([
      ['a', { x: 5, y: 0, z: 0 }],
      ['b', { x: 10, y: 0, z: 0 }],
    ])
    setupLayout(makeGraph(nodes, edges), positions)
    useCanvasStore.getState().setLodLevel(5)
    useCanvasStore.setState({ layoutState: 'ready', camera: { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, zoom: 1 } })

    const { getAllByTestId } = render(<Basic3DView />)
    expect(getAllByTestId('basic3d-edge')).toHaveLength(1)
  })

  it('LOD 5: hides edge when both endpoints are far from camera and no selection', () => {
    const nodes = [createNode('a', 'function'), createNode('b', 'function')]
    const edges = [createEdge('a', 'b')]
    const positions = new Map([
      ['a', { x: 200, y: 0, z: 0 }],
      ['b', { x: 210, y: 0, z: 0 }],
    ])
    setupLayout(makeGraph(nodes, edges), positions)
    useCanvasStore.getState().setLodLevel(5)
    useCanvasStore.setState({ layoutState: 'ready', camera: { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, zoom: 1 } })

    const { queryAllByTestId } = render(<Basic3DView />)
    expect(queryAllByTestId('basic3d-edge')).toHaveLength(0)
  })

  it('passes showLabel=false at LOD 2 and 3', () => {
    const nodes = [createNode('mod', 'module')]
    setupLayout(makeGraph(nodes))
    for (const lod of [2, 3]) {
      vi.clearAllMocks()
      useCanvasStore.getState().setLodLevel(lod)
      useCanvasStore.setState({ layoutState: 'ready' })
      render(<Basic3DView />)
      const calls = mockBasic3DNode.mock.calls
      for (const [props] of calls) {
        expect(props.showLabel, `LOD ${lod} should have showLabel=false`).toBe(false)
      }
    }
  })

  it('passes showLabel=true at LOD 4 and 5', () => {
    const nodes = [createNode('file-a', 'file')]
    setupLayout(makeGraph(nodes))
    for (const lod of [4, 5]) {
      vi.clearAllMocks()
      useCanvasStore.getState().setLodLevel(lod)
      useCanvasStore.setState({ layoutState: 'ready' })
      render(<Basic3DView />)
      const calls = mockBasic3DNode.mock.calls
      if (calls.length > 0) {
        for (const [props] of calls) {
          expect(props.showLabel, `LOD ${lod} should have showLabel=true`).toBe(true)
        }
      }
    }
  })
})
```

Also update the `beforeEach` default LOD to 4 (since LOD 3 no longer shows file nodes):

```ts
beforeEach(() => {
  vi.clearAllMocks()
  useCanvasStore.getState().reset()
  useCanvasStore.setState({ layoutState: 'ready' })

  setupLayout(makeEmptyGraph())
  useCanvasStore.getState().setLodLevel(4) // was 3 — file nodes visible at LOD 4 now
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.test.tsx
```

Expected: Multiple FAILures across LOD-specific tests.

- [ ] **Step 3: Replace `Basic3DView.tsx`**

```tsx
/**
 * Basic3DView — root layout component for the Basic3D layout.
 *
 * LOD 1 (> 200 units):   ClusterLayer (proxy spheres per module group)
 * LOD 2 (120–200 units): Top containers only (repository, package), no labels
 *                        Edges visible only when source/target is selected
 * LOD 3 (60–120 units):  All container nodes (+ namespace, module, directory), no labels
 *                        Edges visible only when source/target is selected
 * LOD 4 (25–60 units):   + Structural nodes (file, class, interface, type), labels visible
 *                        Edges visible when selected or via proximity (60 unit sphere)
 * LOD 5 (≤ 25 units):    All nodes + labels
 *                        Edges visible when selected or via proximity
 */

import { useMemo, type JSX } from 'react'
import { Text } from '@react-three/drei'
import { useCanvasStore } from '../../store'
import { LodController } from '../../components/LodController'
import { useBasic3DLayout } from './useBasic3DLayout'
import { Basic3DNode } from './Basic3DNode'
import { Basic3DEdge } from './Basic3DEdge'
import { ClusterLayer } from './ClusterLayer'
import { isEdgeVisibleForLod } from '../../views/wireUtils'
import { isNodeVisibleAtLod } from './basic3dShapes'

export function Basic3DView() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)
  const lodLevel = useCanvasStore((s) => s.lodLevel)
  const layoutState = useCanvasStore((s) => s.layoutState)
  const cameraPosition = useCanvasStore((s) => s.camera.position)

  const { positions, graph } = useBasic3DLayout()

  const nodeById = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph.nodes])

  // ── Loading state ──────────────────────────────────────────────────────────
  if (layoutState === 'computing') {
    return (
      <group name="basic3d-loading">
        <LodController />
        <Text position={[0, 0, 0]} fontSize={2} color="#888888" anchorX="center" anchorY="middle">
          Loading…
        </Text>
      </group>
    )
  }

  // ── LOD 1: cluster proxies ─────────────────────────────────────────────────
  if (lodLevel <= 1) {
    return (
      <group name="basic3d-view">
        <LodController />
        <ClusterLayer />
      </group>
    )
  }

  // ── LOD 2–4: type-filtered nodes + selection-based edges ──────────────────
  if (lodLevel <= 4) {
    const showLabel = lodLevel >= 4
    const visibleNodes = graph.nodes.filter((n) => isNodeVisibleAtLod(n, lodLevel))

    const visibleEdges = graph.edges.reduce<JSX.Element[]>((acc, edge) => {
      const srcNode = nodeById.get(edge.source)
      const tgtNode = nodeById.get(edge.target)
      if (!srcNode || !tgtNode) return acc
      if (!isNodeVisibleAtLod(srcNode, lodLevel) || !isNodeVisibleAtLod(tgtNode, lodLevel)) {
        return acc
      }
      const from = positions.get(edge.source)
      const to = positions.get(edge.target)
      if (from === undefined || to === undefined) return acc
      if (
        !isEdgeVisibleForLod(edge.source, edge.target, selectedNodeId, lodLevel, from, to, cameraPosition)
      ) {
        return acc
      }
      acc.push(<Basic3DEdge key={edge.id} from={from} to={to} />)
      return acc
    }, [])

    return (
      <group name="basic3d-view">
        <LodController />
        {visibleNodes.map((node) => {
          const position = positions.get(node.id) ?? { x: 0, y: 0, z: 0 }
          return (
            <Basic3DNode
              key={node.id}
              node={node}
              position={position}
              isSelected={node.id === selectedNodeId}
              showLabel={showLabel}
            />
          )
        })}
        {visibleEdges}
      </group>
    )
  }

  // ── LOD 5: all nodes + proximity-culled edges ──────────────────────────────
  return (
    <group name="basic3d-view">
      <LodController />

      {graph.nodes.map((node) => {
        const position = positions.get(node.id) ?? { x: 0, y: 0, z: 0 }
        return (
          <Basic3DNode
            key={node.id}
            node={node}
            position={position}
            isSelected={node.id === selectedNodeId}
            showLabel={true}
          />
        )
      })}

      {graph.edges.reduce<JSX.Element[]>((acc, edge) => {
        const from = positions.get(edge.source)
        const to = positions.get(edge.target)
        if (
          from !== undefined &&
          to !== undefined &&
          isEdgeVisibleForLod(
            edge.source,
            edge.target,
            selectedNodeId,
            lodLevel,
            from,
            to,
            cameraPosition
          )
        ) {
          acc.push(<Basic3DEdge key={edge.id} from={from} to={to} />)
        }
        return acc
      }, [])}
    </group>
  )
}
```

- [ ] **Step 4: Run all Basic3D tests**

```bash
npx vitest run packages/ui/src/features/canvas/layouts/basic3d/
```

Expected: All PASS

- [ ] **Step 5: Run full test suite**

```bash
npx vitest run
```

Expected: All PASS

- [ ] **Step 6: Run CI checks**

```bash
cd /Users/brianmehrman/projects/diagram_builder
npm run type-check && npm run lint && npm run format:check
```

Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.tsx \
        packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.test.tsx
git commit -m "feat(basic3d): 5-level LOD render — selection edges at LOD 2+, proximity at LOD 4+"
```

---

## Task 5: Update `useBasic3DLayout` focal-subgraph gate

**Files:**
- Modify: `packages/ui/src/features/canvas/layouts/basic3d/useBasic3DLayout.ts`

**What changes:** Focal subgraph was triggered at LOD 4 (old numbering). In the 5-level system it should only activate at LOD 5 (finest zoom), to avoid triggering a re-layout when a node is selected at structural/container LOD levels.

- [ ] **Step 1: Update the graph memo in `useBasic3DLayout.ts`**

Find the `graph` useMemo (around line 92). Change:

```ts
// BEFORE
if (lodLevel <= 3) return resolver.getTier(SemanticTier.Symbol)
```

To:

```ts
// AFTER
if (lodLevel < 5) return resolver.getTier(SemanticTier.Symbol)
```

The full memo becomes:

```ts
const graph = useMemo(() => {
  if (!resolver) return EMPTY_GRAPH
  if (lodLevel < 5) return resolver.getTier(SemanticTier.Symbol)
  if (!selectedNodeId) return resolver.getTier(SemanticTier.Symbol)
  return resolver.getView({ baseTier: SemanticTier.Symbol, focalNodeId: selectedNodeId }).graph
}, [resolver, lodLevel, selectedNodeId])
```

- [ ] **Step 2: Run tests**

```bash
npx vitest run packages/ui/src/features/canvas/layouts/basic3d/useBasic3DLayout.test.ts
```

Expected: All PASS (focal subgraph tests should still pass at LOD 5)

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/features/canvas/layouts/basic3d/useBasic3DLayout.ts
git commit -m "fix(basic3d): only use focal subgraph at LOD 5 — avoids re-layout on selection at LOD 2-4"
```

---

## Task 6: Update `LodControls` for LOD 5

**Files:**
- Modify: `packages/ui/src/features/canvas/LodControls.tsx`

- [ ] **Step 1: Update `LodControls.tsx`**

Replace the `LOD_LEVELS` array and fix the label lookup:

```tsx
const LOD_LEVELS = [
  { value: 1, label: 'City (clusters)' },
  { value: 2, label: 'Region (top containers)' },
  { value: 3, label: 'District (all containers)' },
  { value: 4, label: 'Block (structural nodes)' },
  { value: 5, label: 'Street (all nodes)' },
]
```

Also replace the label at the bottom of the component (currently `LOD_LEVELS[lodLevel]?.label`):

```tsx
<p className="text-gray-500 text-xs">
  {LOD_LEVELS.find((l) => l.value === lodLevel)?.label ?? ''}
</p>
```

The grid is already `grid-cols-5`, which accommodates 5 buttons. No layout change needed.

- [ ] **Step 2: Run LodControls tests**

```bash
npx vitest run packages/ui/src/features/canvas/LodControls.test.tsx
```

Expected: All PASS (update any tests that check LOD_LEVELS length or label text)

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/features/canvas/LodControls.tsx
git commit -m "feat(ui): update LodControls to show 5 LOD levels with correct labels"
```

---

## Task 7: Fix CitySky v2 — show all edge types when node is selected

**Files:**
- Modify: `packages/ui/src/features/canvas/layouts/city/CitySky.tsx`
- Modify: `packages/ui/src/features/canvas/layouts/city/useCityFiltering.ts`

**Root cause:** In v2 mode, CitySky only renders overhead (`calls`) edges. Selecting a node with only `imports`/`depends_on` edges produces no visible connections. `composes` is also referenced in wireUtils but excluded from `useCityFiltering`.

- [ ] **Step 1: Add `composes` to `useCityFiltering.ts`**

Find the allowed-type guard in the `visibleEdges` useMemo (around line 173):

```ts
// BEFORE
if (
  e.type !== 'imports' &&
  e.type !== 'depends_on' &&
  e.type !== 'calls' &&
  e.type !== 'extends'
) {
  return false
}
```

Replace with:

```ts
// AFTER
if (
  e.type !== 'imports' &&
  e.type !== 'depends_on' &&
  e.type !== 'calls' &&
  e.type !== 'extends' &&
  e.type !== 'composes'
) {
  return false
}
```

- [ ] **Step 2: Update CitySky v2 edge routing filter in `CitySky.tsx`**

Find the `edgesToRender` computation (around line 60). Replace:

```tsx
// BEFORE
const edgesToRender = (
  isV2
    ? visibleEdges.filter(
        (e) => classifyEdgeRouting(e.type) === 'overhead' && edgeTierVisibility.crossDistrict
      )
    : visibleEdges
).filter((e) =>
  isEdgeVisibleForLod(...)
)
```

With:

```tsx
// AFTER
const edgesToRender = (
  isV2
    ? visibleEdges.filter((e) => {
        // Always include edges connected to the selected node, regardless of routing
        if (
          selectedNodeId !== null &&
          (e.source === selectedNodeId || e.target === selectedNodeId)
        ) {
          return true
        }
        return classifyEdgeRouting(e.type) === 'overhead' && edgeTierVisibility.crossDistrict
      })
    : visibleEdges
).filter((e) =>
  isEdgeVisibleForLod(
    e.source,
    e.target,
    selectedNodeId,
    lodLevel,
    positions.get(e.source),
    positions.get(e.target),
    cameraPosition
  )
)
```

- [ ] **Step 3: Run City-related tests**

```bash
npx vitest run packages/ui/src/features/canvas/layouts/city/
```

Expected: All PASS

- [ ] **Step 4: Run full test suite and CI checks**

```bash
npx vitest run
npm run type-check && npm run lint && npm run format:check
```

Expected: All PASS, no errors

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/features/canvas/layouts/city/CitySky.tsx \
        packages/ui/src/features/canvas/layouts/city/useCityFiltering.ts
git commit -m "fix(city): show all selected-node edge types in v2 mode; add composes to allowed types"
```

---

## Task 8: Fix FlyControls camera position sync

**Files:**
- Modify: `packages/ui/src/features/canvas/Canvas3D.tsx`

**Root cause:** `OrbitControls` calls `setCameraPosition` on its `onChange` event, but `FlyControls` has no `onChange` prop. While in fly mode, `store.camera.position` is stale, breaking proximity edge culling in `isEdgeVisibleForLod`.

- [ ] **Step 1: Add `useFrame` import and sync in `CameraController` in `Canvas3D.tsx`**

Add `useFrame` to the import:

```tsx
// BEFORE
import { Canvas } from '@react-three/fiber'

// AFTER
import { Canvas, useFrame } from '@react-three/fiber'
```

Add the following inside `CameraController`, after the existing `React.useEffect` block and before the `return`:

```tsx
// Sync FlyControls camera position to store each frame.
// OrbitControls uses onChange for this; FlyControls has no equivalent event.
// Only update when position has meaningfully changed to avoid unnecessary re-renders.
useFrame(({ camera: threeCamera }) => {
  if (controlMode !== 'fly') return
  const current = useCanvasStore.getState().camera.position
  const x = threeCamera.position.x
  const y = threeCamera.position.y
  const z = threeCamera.position.z
  if (
    Math.abs(x - current.x) > 0.01 ||
    Math.abs(y - current.y) > 0.01 ||
    Math.abs(z - current.z) > 0.01
  ) {
    setCameraPosition({ x, y, z })
  }
})
```

- [ ] **Step 2: Run Canvas3D tests**

```bash
npx vitest run packages/ui/src/features/canvas/Canvas3D.test.tsx
```

Expected: All PASS (the mock already stubs `useFrame`)

- [ ] **Step 3: Run full test suite and CI checks**

```bash
npx vitest run
npm run type-check && npm run lint && npm run format:check
```

Expected: All PASS

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/features/canvas/Canvas3D.tsx
git commit -m "fix(camera): sync FlyControls camera position to store each frame for proximity culling"
```

---

## Self-Review

**Spec coverage:**

| Requirement | Covered by |
|---|---|
| Edges show when selecting at any LOD | Task 1 (`isEdgeVisibleForLod`) + Task 4 (Basic3DView LOD 2-4 path) |
| Proximity edges when close to nodes | Task 1 (unchanged proximity logic, now works at LOD 4-5) |
| Basic3D LOD 1 and 2 split into separate levels | Tasks 2, 3, 4 (5-level system: LOD 2 = top containers) |
| City v2 selection shows all edge types | Task 7 (CitySky routing bypass) |
| FlyControls proximity culling fix | Task 8 |
| `composes` edge type in City v2 | Task 7 (useCityFiltering) |

**Dependency order check:**

- Task 1 must land before Tasks 4 and 7 (both call `isEdgeVisibleForLod`)
- Task 2 must land before Tasks 3, 4, 5, 6 (LOD numbers shift)
- Task 3 must land before Task 4 (`isNodeVisibleAtLod` signature used in Basic3DView)
- Tasks 7 and 8 are independent of Tasks 2-6

**Placeholder scan:** None found — all steps include complete code.

**Type consistency:** `isEdgeVisibleForLod` signature unchanged. `isNodeVisibleAtLod` signature unchanged (node, lod → boolean). `LOD_THRESHOLDS` adds `approach` key, no removals.
