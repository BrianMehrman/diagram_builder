# Story 9.14: LOD Calculator Hook

Status: review

## Story

**ID:** 9-14
**Key:** 9-14-lod-calculator-hook
**Title:** LOD Calculator Hook
**Epic:** Epic 9 - City Visualization Overhaul Phase 1
**Phase:** Epic 9-C: Signage System & Progressive Labels
**Priority:** HIGH - Drives progressive label visibility

**As a** developer navigating a codebase city,
**I want** the level of detail to adjust automatically as I zoom in and out,
**So that** labels appear progressively without overwhelming the view.

---

## Acceptance Criteria

- **AC-1:** Camera at far distance (city zoom) → lodLevel 1
- **AC-2:** Camera at medium distance (district zoom) → lodLevel 2
- **AC-3:** Camera at close distance (neighborhood zoom) → lodLevel 3
- **AC-4:** Camera at very close distance (street zoom) → lodLevel 4
- **AC-5:** LOD calculator executes in same render cycle as initial layout — no flash of all signs (NFR-V2)
- **AC-6:** LOD transitions are smooth without visible stuttering (NFR-P7)

---

## Tasks/Subtasks

### Task 1: Create LOD calculator hook (AC: 1-4)
- [x] Create `packages/ui/src/features/canvas/hooks/lodCalculatorUtils.ts` (pure functions)
- [x] Create `packages/ui/src/features/canvas/hooks/useLodCalculator.ts` (R3F hook)
- [x] Use `useFrame` from R3F to read camera position each frame
- [x] Calculate camera distance to scene origin (0,0,0)
- [x] Map distance to LOD level: street≤25→4, ≤60→3, ≤120→2, >120→1
- [x] Update store `lodLevel` via `setLodLevel()` only when LOD changes
- [x] Distance thresholds exported as `LOD_THRESHOLDS` constant

### Task 2: Ensure no initial flash (AC: 5)
- [x] Store defaults to lodLevel 1 (from story 9-4) — correct initial state
- [x] Hook updates on first frame via `useFrame` before sign render
- [x] `useRef` tracks current LOD to avoid unnecessary store updates

### Task 3: Smooth transitions (AC: 6)
- [x] 8% hysteresis buffer (`HYSTERESIS_FACTOR = 0.08`) prevents threshold flickering
- [x] Zooming in transitions immediately; zooming out requires passing threshold + buffer
- [x] No debounce needed — `useRef` comparison prevents redundant store writes

### Task 4: Integration point (AC: 1-4)
- [x] Created `<LodController>` component (renders null, calls hook)
- [x] Added `<LodController />` to CityView render tree

---

## Dev Notes

### Architecture & Patterns

**useFrame pattern:** R3F's `useFrame` provides access to the Three.js camera and clock each frame. The hook reads `camera.position`, calculates distance, and conditionally updates the store.

**Distance calculation:** Simple euclidean distance from camera to scene origin (0,0,0). Could be refined to use the nearest node group, but origin-based is sufficient for city zoom levels.

**Hysteresis:** Without hysteresis, the LOD level would flicker when the camera is near a threshold boundary. A 5-10% buffer prevents this (e.g., transition from LOD 1→2 at distance 100, but 2→1 at distance 110).

**Store default:** Story 9-4 already changed the lodLevel default to 1. This hook drives it up from there.

### Scope Boundaries

- **DO:** Create the LOD calculator hook
- **DO:** Implement hysteresis for smooth transitions
- **DO:** Integrate into the R3F render tree
- **DO NOT:** Modify sign components (they read lodLevel from store)
- **DO NOT:** Modify the store lodLevel type (already exists)

### References

- `packages/ui/src/features/canvas/store.ts` — `lodLevel` state and `setLodLevel` action
- `packages/ui/src/features/canvas/Canvas3D.tsx` — R3F Canvas setup
- `packages/ui/src/features/canvas/views/CityView.tsx` — potential integration point

---

## Dev Agent Record

### Implementation Plan
- Separated pure utility functions (testable without R3F) from the hook
- `lodCalculatorUtils.ts`: `calculateLodFromDistance`, `calculateLodWithHysteresis`, `cameraDistanceToOrigin`
- `useLodCalculator.ts`: R3F hook using `useFrame` + `useRef` for efficient updates
- `LodController.tsx`: Thin component wrapper for the hook, integrated into CityView

### Completion Notes
- **Thresholds:** street≤25 (LOD 4), neighborhood≤60 (LOD 3), district≤120 (LOD 2), city>120 (LOD 1)
- **Hysteresis:** 8% buffer on zoom-out transitions. LOD 2→1 requires distance > 120 + 9.6 = 129.6. Prevents flickering.
- **Performance:** `useRef` tracks current LOD to avoid store writes when unchanged. Only writes to Zustand store on actual LOD change.
- **No initial flash:** Store defaults to LOD 1. Hook runs on first `useFrame` and adjusts from there.
- 19 tests covering distance calculation, LOD mapping, hysteresis (zoom-in/out/stable).
- Zero TS errors, 1074 total tests passing, zero regressions.

## File List
- `packages/ui/src/features/canvas/hooks/lodCalculatorUtils.ts` (NEW — pure utility functions)
- `packages/ui/src/features/canvas/hooks/lodCalculatorUtils.test.ts` (NEW — 19 tests)
- `packages/ui/src/features/canvas/hooks/useLodCalculator.ts` (NEW — R3F hook)
- `packages/ui/src/features/canvas/components/LodController.tsx` (NEW — component wrapper)
- `packages/ui/src/features/canvas/views/CityView.tsx` (MODIFIED — added LodController)

---

## Change Log
- 2026-02-06: Created LOD calculator with hysteresis, integrated into CityView. 19 tests, zero TS errors, zero regressions.
