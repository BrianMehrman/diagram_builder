# Nullable cameraPosition Optimization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow `cameraPosition` in `Basic3DView` to return `null` when `layoutState === 'computing' || lodLevel <= 1`, avoiding unnecessary re-renders during layout computation and at cluster view (LOD 1) where camera position is irrelevant.

**Architecture:** `isEdgeVisibleForLod` in `wireUtils.ts` is the only consumer of `cameraPos` that needs updating — when null, skip proximity culling (still allow selection-based edges). `Basic3DView.tsx` restores the nullable selector from Copilot's original commit.

**Tech Stack:** TypeScript, React, Zustand, Vitest

---

### Task 1: Make `isEdgeVisibleForLod` accept nullable `cameraPos` and restore nullable selector in `Basic3DView`

**Files:**
- Modify: `packages/ui/src/features/canvas/views/wireUtils.ts`
- Modify: `packages/ui/src/features/canvas/views/wireUtils.test.ts`
- Modify: `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.tsx`

**Context:**

`isEdgeVisibleForLod` signature at `wireUtils.ts:56`:
```ts
export function isEdgeVisibleForLod(
  sourceId: string,
  targetId: string,
  selectedNodeId: string | null,
  lodLevel: number,
  sourcePos: { x: number; y: number; z: number } | undefined,
  targetPos: { x: number; y: number; z: number } | undefined,
  cameraPos: { x: number; y: number; z: number }
): boolean
```

The function has two paths:
1. **Selection override** (line 66-72): `lodLevel >= 2 && selectedNodeId !== null && (source or target is selected)` → returns `true`. Does NOT use `cameraPos`.
2. **Proximity culling** (line 74+): `lodLevel < 4 → false`; otherwise computes distance from `cameraPos` to each endpoint. DOES use `cameraPos`.

When `cameraPos` is `null`, selection edges should still show (path 1 doesn't need camera). Proximity edges cannot be computed → return `false`.

- [ ] **Step 1: Write the failing test**

In `wireUtils.test.ts`, add a test for `null` cameraPos:

```ts
describe('null cameraPos', () => {
  it('returns true for selected-node edge when cameraPos is null', () => {
    const from = { x: 0, y: 0, z: 0 }
    const to = { x: 10, y: 0, z: 0 }
    expect(
      isEdgeVisibleForLod('a', 'b', 'a', 4, from, to, null)
    ).toBe(true)
  })

  it('returns false for proximity edge when cameraPos is null', () => {
    const from = { x: 0, y: 0, z: 0 }
    const to = { x: 10, y: 0, z: 0 }
    expect(
      isEdgeVisibleForLod('a', 'b', null, 4, from, to, null)
    ).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/ui && npx vitest run src/features/canvas/views/wireUtils.test.ts
```

Expected: type error or test failure — `null` not assignable to `{ x, y, z }`

- [ ] **Step 3: Update `isEdgeVisibleForLod` signature and guard**

Change `cameraPos` param type and add null guard before the proximity check:

```ts
export function isEdgeVisibleForLod(
  sourceId: string,
  targetId: string,
  selectedNodeId: string | null,
  lodLevel: number,
  sourcePos: { x: number; y: number; z: number } | undefined,
  targetPos: { x: number; y: number; z: number } | undefined,
  cameraPos: { x: number; y: number; z: number } | null,
): boolean {
  // Selection override: show at any LOD >= 2 if either endpoint is selected
  if (
    lodLevel >= 2 &&
    selectedNodeId !== null &&
    (sourceId === selectedNodeId || targetId === selectedNodeId)
  ) {
    return true
  }

  // No selection: require LOD 4+ for proximity-based edges
  if (lodLevel < 4) return false

  // Camera position required for proximity culling — skip if unavailable
  if (cameraPos === null) return false

  // ... rest of function unchanged
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd packages/ui && npx vitest run src/features/canvas/views/wireUtils.test.ts
```

Expected: PASS

- [ ] **Step 5: Restore the nullable selector in `Basic3DView.tsx`**

Find the `cameraPosition` selector (currently simple):
```ts
const cameraPosition = useCanvasStore((s) => s.camera.position)
```

Replace with the nullable version:
```ts
const cameraPosition = useCanvasStore((s) =>
  s.layoutState === 'computing' || s.lodLevel <= 1
    ? null
    : {
        x: s.camera.position.x,
        y: s.camera.position.y,
        z: s.camera.position.z,
      }
)
```

- [ ] **Step 6: Run full CI**

```bash
cd packages/ui && npx vitest run && npm run type-check && npm run lint && npx prettier --check "src/**/*.{ts,tsx}"
```

Expected: all pass

- [ ] **Step 7: Fix Prettier if needed**

```bash
cd packages/ui && npx prettier --write src/features/canvas/views/wireUtils.ts src/features/canvas/views/wireUtils.test.ts src/features/canvas/layouts/basic3d/Basic3DView.tsx
```

- [ ] **Step 8: Commit**

```bash
git add packages/ui/src/features/canvas/views/wireUtils.ts \
        packages/ui/src/features/canvas/views/wireUtils.test.ts \
        packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.tsx
git commit -m "perf(basic3d): skip cameraPosition re-renders during layout compute and at LOD 1 — null guard in isEdgeVisibleForLod"
```
