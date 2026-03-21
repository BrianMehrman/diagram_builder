# Story 8-16: Implement X-Ray Mode

**Status:** review

---

## Story

**ID:** 8-16
**Key:** 8-16-implement-xray-mode
**Title:** Implement X-Ray Mode for See-Through Buildings
**Epic:** Epic 8 - City-to-Cell 3D Layout
**Phase:** Implementation - Phase 5 (Visibility Modes)
**Priority:** LOW - Enhancement for exploration

**As a** developer viewing the city,
**I want** to toggle an X-ray mode that makes building walls transparent,
**So that** I can see inside buildings without entering them.

**Description:**

Implement X-ray mode that makes all building walls transparent/wireframe while keeping internal structures (floors, rooms, organelles) visible. This lets users see the internal structure of multiple buildings simultaneously from the city view.

**Context:**

From UX 3D Layout Vision:
- X-ray = toggle to see through buildings
- Walls become wireframe or highly transparent
- Internal structure visible from outside
- Useful for comparing file structures

---

## Acceptance Criteria

- **AC-1:** Toggle X-ray mode ✅
  - Keyboard shortcut (X key) ✅
  - State in Zustand store ✅
  - Toast notification on toggle ✅

- **AC-2:** Building walls become transparent/wireframe ✅
  - Walls switch to wireframe material ✅
  - Internal floors/rooms visible ✅
  - Building outline still visible (EdgesGeometry) ✅

- **AC-3:** Internal structure visible ✅
  - Class floors shown as colored planes ✅
  - Method organelles visible as dots ✅

- **AC-4:** Smooth transition
  - Walls switch to wireframe mode (visual toggle)

- **AC-5:** Performance maintained ✅
  - Distance-based LOD for internal detail ✅
  - Only nearby buildings show detail in X-ray ✅
  - Child map only computed when X-ray mode active ✅

---

## Tasks/Subtasks

### Task 1: Create X-ray state in canvas store
- [x] isXRayMode toggle
- [x] xrayOpacity setting (0.05)
- [x] Added to reset() method

### Task 2: Create XRayBuilding component
- [x] Wireframe walls with transparent material
- [x] Edge outlines via EdgesGeometry
- [x] Floor plane indicators for classes
- [x] Method dot indicators (deterministic positions)

### Task 3: Integrate with CityView
- [x] Switch to XRayBuilding when mode active
- [x] Distance-based LOD for detail (XRAY_DETAIL_DISTANCE = 30)
- [x] Build child node map per file (only when x-ray active)

### Task 4: Add keyboard shortcut
- [x] X key toggles x-ray in useGlobalKeyboardShortcuts
- [x] Toast notification shows ON/OFF state

### Task 5: Performance optimization
- [x] Distance-based detail culling (shouldShowXRayDetail)
- [x] Child map only computed when isXRayMode = true
- [x] computeXRayWallOpacity extracted as pure function

### Task 6: Write unit tests
- [x] Test toggle state (5 tests)
- [x] Test wall opacity calculation (3 tests)
- [x] Test detail distance logic (4 tests)

---

## Files Created

- `packages/ui/src/features/canvas/xrayUtils.ts` - Pure utility functions for x-ray calculations
- `packages/ui/src/features/canvas/xray.test.ts` - 12 unit tests for x-ray state and utilities
- `packages/ui/src/features/canvas/views/XRayBuilding.tsx` - X-ray building component

## Files Modified

- `packages/ui/src/features/canvas/store.ts` - Added isXRayMode, xrayOpacity, toggleXRay
- `packages/ui/src/features/canvas/views/CityView.tsx` - Conditional XRayBuilding rendering
- `packages/ui/src/features/canvas/views/index.ts` - Added XRayBuilding export
- `packages/ui/src/shared/hooks/useGlobalKeyboardShortcuts.ts` - Added X key shortcut

---

## Dependencies

- Story 8-10 (City view renderer - base building to extend) ✅
- Story 8-4 (Parent-child relationships - for internal nodes) ✅

---

## Dev Agent Record

### Implementation Notes

**Architecture Decision:** Added x-ray state directly to the existing flat canvas store (not a separate slice) to match the project's established pattern. The store already uses a single `create<CanvasState>()` call.

**XRayBuilding component** uses raw Three.js primitives (`<mesh>`, `<boxGeometry>`, `<sphereGeometry>`) consistent with other view components. Uses `EdgesGeometry` for building outlines instead of drei's `<Edges>` to avoid extra dependencies.

**CityView integration** conditionally renders `XRayBuilding` instead of `Building` when `isXRayMode` is true. Computes a `childrenByFile` map only when x-ray mode is active (performance optimization). Camera distance is computed per-building for LOD detail control.

**Pure utility extraction:** `xrayUtils.ts` contains `computeXRayWallOpacity` and `shouldShowXRayDetail` as pure testable functions, following the same pattern used for transitions (cityToBuildingTransition.ts, buildingToCellTransition.ts).

### Test Results

- 12 new tests in `xray.test.ts` — all passing
- 275 total tests passing, 8 pre-existing failures (NodeRenderer 5, NodeDetails 1, LodControls 2)
- No TypeScript errors introduced
- No regressions

---

## Definition of Done

- [x] X key toggles x-ray mode
- [x] Buildings show wireframe walls
- [x] Internal floors visible through walls
- [x] Method dots visible in nearby buildings
- [ ] Smooth transition effect (toggle-based, not animated fade)
- [x] Performance maintained
- [x] Unit tests pass
