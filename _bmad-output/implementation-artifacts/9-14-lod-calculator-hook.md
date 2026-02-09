# Story 9.14: LOD Calculator Hook

Status: not-started

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
- [ ] Create `packages/ui/src/features/canvas/hooks/useLodCalculator.ts`
- [ ] Use `useFrame` from R3F to read camera position each frame
- [ ] Calculate camera distance to scene center (or average node position)
- [ ] Map distance to LOD level using configurable thresholds
- [ ] Update store `lodLevel` via `setLodLevel()`
- [ ] Define distance thresholds as constants (tunable)

### Task 2: Ensure no initial flash (AC: 5)
- [ ] Hook must run on first frame before signs render
- [ ] Since store defaults to lodLevel 1 (from story 9-4), initial state is correct
- [ ] Verify the hook updates lodLevel before sign visibility is evaluated

### Task 3: Smooth transitions (AC: 6)
- [ ] Add hysteresis to prevent rapid LOD switching at threshold boundaries
- [ ] Only update lodLevel when distance crosses threshold by a margin (e.g., 5% buffer)
- [ ] Debounce or throttle updates if needed

### Task 4: Integration point (AC: 1-4)
- [ ] Hook must be called from within the R3F Canvas tree (requires `useFrame`)
- [ ] Add to CityView or create a dedicated `<LodController>` component

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
_To be filled during implementation_

---

## Change Log
_To be filled during implementation_
