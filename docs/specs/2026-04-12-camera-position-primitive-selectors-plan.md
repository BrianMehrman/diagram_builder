# Plan: Fix Whole-Object camera.position Selectors

**Date:** 2026-04-12  
**Branch:** fix/camera-position-primitive-selectors  
**Related:** `feature/3d-performance-lod` fix in `Basic3DView.tsx` (merged 2026-04-11)

---

## Problem

Three files use `useCanvasStore((s) => s.camera.position)` — a Zustand selector that returns a whole `{ x, y, z }` object. Zustand compares selector results by reference (`===`). Since `s.camera.position` always constructs a new object even when x/y/z are unchanged, the selector triggers a re-render every time. This is the same infinite re-render bug fixed in `Basic3DView.tsx` during the `3d-performance-lod` work.

---

## Architecture Findings

### Group A — `s.camera.position` whole-object selectors (this PR)

All three create a new object reference every render:

| File | Line | Usage |
|------|------|-------|
| `packages/ui/src/features/canvas/layouts/city/CitySky.tsx` | 53 | Passed to `isEdgeVisibleForLod()` (accepts `\| null`) |
| `packages/ui/src/features/canvas/layouts/city/CityBlocks.tsx` | 44 | Used in x-ray distance calculations (inline math) |
| `packages/ui/src/features/canvas/layouts/city/useCityLayout.ts` | 114 | Used in `useEffect` dep array for centroid computation |

### Group B — `state.camera` whole-object selectors (out of scope)

Six additional files subscribe to the full `CameraState` object, causing re-renders on any camera mutation (position, target, or zoom). These are a separate, lower-severity issue — not infinite loops, but unnecessary re-renders during camera flight. Out of scope for this PR.

Files: `Canvas3D.tsx`, `HUD.tsx`, `ViewpointCreator.tsx`, `MiniMap.tsx`, `useCamera.ts`, `useWebSocket.ts`

### Group C — Already safe

- `useLodCalculator.ts` — reads via `getState()` inside `useFrame` (not a subscription)
- `Canvas3D.tsx:104` — reads via `getState()` inside `useFrame`
- `Basic3DView.tsx:30-32` — already fixed with primitive selectors

---

## Fix Pattern

Established in `Basic3DView.tsx`. Subscribe to each coordinate as a primitive, assemble the object in component scope:

```ts
// Before (re-render loop risk)
const cameraPosition = useCanvasStore((s) => s.camera.position)

// After (stable references, no loop)
const cameraPosX = useCanvasStore((s) => s.camera.position.x)
const cameraPosY = useCanvasStore((s) => s.camera.position.y)
const cameraPosZ = useCanvasStore((s) => s.camera.position.z)
const cameraPosition = { x: cameraPosX, y: cameraPosY, z: cameraPosZ }
```

The assembled object is reconstructed each render but only when a primitive value actually changes — so downstream `useEffect` deps and function calls receive stable-valued objects.

**Note for `useCityLayout.ts`:** The `cameraPosition` object is used in a `useEffect` dep array. After the fix, assemble the object inside the `useEffect` body from the three primitives (passed into the effect scope), removing `cameraPosition` from the dep array and adding `cameraPosX`, `cameraPosY`, `cameraPosZ` instead.

---

## Test Coverage Assessment

### Existing coverage (acts as regression net)

- **`CityView.test.tsx`** — 23 tests covering edge rendering, LOD filtering, building rendering, district grounds, hover/selection. CitySky and CityBlocks are rendered as real components (not mocked), so edge rendering tests at LOD 4 go through `isEdgeVisibleForLod` in CitySky. These tests pass before and must pass after.
- **`useCityLayout.test.ts`** — includes a `focusedGroupId centroid computation` test that sets `camera.position` via `setState` and asserts `focusedGroupId` is updated after debounce. This directly covers the `useCityLayout` camera dependency.

### No dedicated test files

`CitySky.tsx` and `CityBlocks.tsx` have no dedicated test files. The `CityView.test.tsx` integration suite is the effective coverage.

### New tests required

Since this is a pure selector refactor (same values, different subscription mechanism), no new behavioural test is needed — the existing suite proves correctness. However, to satisfy "tests that prove it works":

- **Task 1 (CitySky):** Add a test to `CityView.test.tsx` asserting edges render correctly at LOD 4 with a non-zero camera position set in the store. This verifies camera values flow through correctly after the selector change.
- **Task 2 (CityBlocks):** Add a test asserting x-ray mode activates correctly when the camera is within `XRAY_DETAIL_DISTANCE` of a node. This requires reading `CityBlocks.tsx` lines 116–118 to understand the threshold (`XRAY_DETAIL_DISTANCE = 30`).
- **Task 3 (useCityLayout):** The existing centroid test already covers this. Verify it still passes — no new test needed.

---

## Implementation Tasks

### Task 1 — Fix `CitySky.tsx` + test

**File:** `packages/ui/src/features/canvas/layouts/city/CitySky.tsx`

**Change:**
- Replace line 53 with three primitive selectors
- Assemble `cameraPosition` from primitives in component scope (same location)

**Test (add to `CityView.test.tsx`):**
```
it('renders edges when camera is at a non-default position', ...)
  - setCamera({ position: { x: 5, y: 10, z: 5 } }) in store
  - setLodLevel(4)
  - render CityView with edges that have positions
  - assert city-edge elements are rendered
```

CI check: `npm test --workspace=packages/ui`

---

### Task 2 — Fix `CityBlocks.tsx` + test

**File:** `packages/ui/src/features/canvas/layouts/city/CityBlocks.tsx`

**Change:**
- Replace line 44 with three primitive selectors
- Assemble `cameraPosition` from primitives in component scope

**Test (add to `CityView.test.tsx`):**
```
it('enables x-ray detail when camera is within XRAY_DETAIL_DISTANCE', ...)
  - set isXRayMode: true in store
  - setCamera with position close to a node (distance < 30)
  - assert XRayBuilding renders for that node
```

CI check: `npm test --workspace=packages/ui`

---

### Task 3 — Fix `useCityLayout.ts` + verify existing test

**File:** `packages/ui/src/features/canvas/layouts/city/useCityLayout.ts`

**Change:**
- Replace line 114 whole-object selector with three primitive selectors
- In the `useEffect` (currently depends on `cameraPosition`), remove `cameraPosition` from the dep array and add `cameraPosX`, `cameraPosY`, `cameraPosZ`
- Assemble `{ x: cameraPosX, y: cameraPosY, z: cameraPosZ }` inside the effect body where it's used (lines 141–143)

**Verify:** Run `useCityLayout.test.ts` — the existing centroid test at line 487 must still pass.

CI check: `npm test --workspace=packages/ui`

---

### Task 4 — Full CI checklist

Run all four checks before pushing:
1. `npm run type-check`
2. `npm run lint`
3. `npm run format:check`
4. `npm test`

---

## Definition of Done

- [ ] `CitySky.tsx` uses three primitive selectors for camera position
- [ ] `CityBlocks.tsx` uses three primitive selectors for camera position
- [ ] `useCityLayout.ts` uses three primitive selectors; `useEffect` dep array updated
- [ ] New tests for CitySky and CityBlocks camera path pass
- [ ] All existing tests still pass (1915+ tests)
- [ ] `type-check`, `lint`, `format:check` all clean
- [ ] No `s.camera.position` whole-object selectors remain in city layout files
