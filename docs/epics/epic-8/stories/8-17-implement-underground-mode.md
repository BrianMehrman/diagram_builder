# Story 8-17: Implement Underground Mode

**Status:** review

---

## Story

**ID:** 8-17
**Key:** 8-17-implement-underground-mode
**Title:** Implement Underground Dependency Visualization Mode
**Epic:** Epic 8 - City-to-Cell 3D Layout
**Phase:** Implementation - Phase 5 (Visibility Modes)
**Priority:** LOW - Enhancement for dependency exploration

**As a** developer exploring dependencies,
**I want** to toggle an underground view showing dependency connections as subway tunnels,
**So that** I can visualize how files and packages depend on each other.

**Description:**

Implement the underground mode that reveals dependency connections as tunnel-like structures below the ground plane. External library connections appear as subway tunnels connecting buildings to their dependency buildings.

**Context:**

From UX 3D Layout Vision:
- Dependencies = underground subway system
- Tunnels connect buildings
- Tunnel thickness = import frequency
- Not navigable yet (future feature)
- Toggle mode to make visible

---

## Acceptance Criteria

- **AC-1:** Toggle underground mode ✅
  - Keyboard shortcut (U key) ✅
  - State in Zustand store ✅
  - Toast notification on toggle ✅

- **AC-2:** Ground plane becomes transparent ✅
  - Ground fades via overlay plane ✅
  - Buildings remain visible above ✅
  - Below-ground space revealed ✅

- **AC-3:** Dependency tunnels rendered ✅
  - Curved tubes below ground plane (CatmullRomCurve3) ✅
  - Connect from building base to building base ✅
  - Follow smooth path underground ✅

- **AC-4:** Tunnel properties ✅
  - Thickness based on import count (min 0.12, max 0.5) ✅
  - Color based on dependency type (indigo for external, blue for internal) ✅
  - Subtle glow via emissive material ✅

- **AC-5:** External library connections highlighted ✅
  - Tunnels to external library buildings use distinct indigo color ✅
  - Internal connections use blue ✅

---

## Tasks/Subtasks

### Task 1: Create underground state in canvas store
- [x] isUndergroundMode toggle
- [x] toggleUnderground action
- [x] Added to reset() method

### Task 2: Create UndergroundLayer component
- [x] Filter import/depends_on edges
- [x] Render DependencyTunnel per edge
- [x] Only visible in underground mode
- [x] External node detection via isExternal flag

### Task 3: Create DependencyTunnel component
- [x] CatmullRomCurve3 underground path (5 control points)
- [x] TubeGeometry along curve
- [x] Radius from import count (0.12 to 0.5)
- [x] Color for internal (blue) vs external (indigo)

### Task 4: Ground plane transparency
- [x] GroundPlane accepts opacity prop
- [x] Overlay plane fades ground in underground mode
- [x] Buildings stay visible (only ground affected)

### Task 5: Keyboard shortcut
- [x] U key toggles underground mode
- [x] Toast notification shows ON/OFF state

### Task 6: Write unit tests
- [x] Test toggle state (4 tests)
- [x] Test ground opacity (2 tests)
- [x] Test tunnel radius calculation (4 tests)
- [x] Test tunnel path generation (5 tests)
- [x] Test edge filtering (5 tests)

---

## Files Created

- `packages/ui/src/features/canvas/undergroundUtils.ts` — Pure utility functions for underground mode calculations
- `packages/ui/src/features/canvas/underground.test.ts` — 20 unit tests for underground mode
- `packages/ui/src/features/canvas/views/UndergroundLayer.tsx` — Underground layer component (renders tunnels)
- `packages/ui/src/features/canvas/views/DependencyTunnel.tsx` — Single dependency tunnel component

## Files Modified

- `packages/ui/src/features/canvas/store.ts` — Added isUndergroundMode, toggleUnderground
- `packages/ui/src/features/canvas/views/CityView.tsx` — Added UndergroundLayer and ground opacity
- `packages/ui/src/features/canvas/views/GroundPlane.tsx` — Added opacity prop with overlay plane
- `packages/ui/src/features/canvas/views/index.ts` — Added UndergroundLayer, DependencyTunnel exports
- `packages/ui/src/shared/hooks/useGlobalKeyboardShortcuts.ts` — Added U key shortcut

---

## Dependencies

- Story 8-3 (External library detection - external_import edges) ✅
- Story 8-10 (City view - ground plane and building positions) ✅

---

## Dev Agent Record

### Implementation Notes

**Architecture Decision:** Added underground state directly to the existing flat canvas store (not a separate slice) to match the established pattern. Only two fields needed: `isUndergroundMode: boolean` and `toggleUnderground` action.

**Underground utilities** follow the same pure-function extraction pattern as `xrayUtils.ts`: `computeGroundOpacity`, `computeTunnelRadius`, `generateTunnelPoints`, and `filterImportEdges` are all pure testable functions.

**DependencyTunnel** uses raw Three.js `CatmullRomCurve3` with `<tubeGeometry>` instead of drei's `<Tube>` to avoid potential API differences. The curve has 5 control points: source base → source underground → midpoint (deepest) → target underground → target base.

**Ground transparency** is handled via an overlay `<planeGeometry>` mesh rather than modifying the drei `Grid` component's opacity (which doesn't have a direct opacity prop). The overlay is a dark plane that covers the grid when underground mode is active.

**Edge filtering** uses `imports` and `depends_on` edge types from the `GraphEdge.type` union. The story's technical approach mentioned `external_import` but this type doesn't exist in the `GraphEdge` type definition — external connections are detected by checking if either endpoint node has `isExternal: true`.

### Completion Notes

All 6 tasks completed. 20 new tests passing (295 total), 8 pre-existing failures unchanged. No TypeScript errors introduced. No regressions.

### Change Log

- 2026-02-03: Implemented underground dependency visualization mode (Story 8-17)

---

## Definition of Done

- [x] U key toggles underground mode
- [x] Ground becomes transparent
- [x] Dependency tunnels render below ground
- [x] Thickness reflects import count
- [x] Internal vs external color distinction
- [x] Smooth toggle transition
- [x] Unit tests pass
