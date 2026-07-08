# Story 13.13: Derived viewMode — Retire the Scene Swap

Status: not-started

## Story

**ID:** 13-13
**Key:** 13-13-derived-viewmode
**Title:** Derived viewMode — Retire ViewModeRenderer Scene Swap
**Epic:** Epic 13 - One World, Two Skins
**Phase:** Epic 13-D: Continuous World
**Priority:** CRITICAL - Kills the teleport; one coordinate space from here on

**As a** user,
**I want** `viewMode` computed from where my camera actually is instead of swapping scenes,
**So that** entering a building is movement, not teleportation.

**Spec Reference:** `docs/specs/2026-07-07-one-world-two-skins-design.md` — Store changes; Phase 4

---

## Acceptance Criteria

- **AC-1:** New pure function `deriveViewMode(cameraPos, layout): 'city' | 'building' | 'cell'` — 'building' when the camera is inside a structure's envelope (footprint × height bounds), 'cell' when inside the interior threshold, 'city' otherwise; unit tested with boundary cases
- **AC-2:** `ViewModeRenderer` no longer switches scenes: the skin world renders unconditionally; `BuildingView`/`CellView` standalone scenes are deleted along with `selectViewProps`
- **AC-3:** Store `viewMode` becomes derived state (updated by a `useDerivedViewMode` hook on camera movement, throttled to LOD-update cadence); `setViewMode` as a mode-switch API is removed — navigation actions (search fly-to, minimap jump) move the CAMERA instead
- **AC-4:** HUD, breadcrumbs, and control hints consume derived `viewMode` and continue to work (Mode stat in HUD shows city/building/cell correctly as the camera moves)
- **AC-5:** Existing navigation features verified end-to-end: search fly-to a method → camera flies INTO the building, viewMode reads 'building'/'cell'; Home key returns to city overview
- **AC-6:** E2E regression: the Epic 8 membrane/transition tests that asserted scene swaps are rewritten as camera-movement assertions
- **AC-7:** All four CI checks pass

---

## Tasks/Subtasks

### Task 1: deriveViewMode (AC: 1)
- [ ] Pure function + boundary tests (on envelope surface, just inside, just outside, between buildings)

### Task 2: Remove scene swap (AC: 2, 3)
- [ ] Delete BuildingView/CellView render branches; render skin world always
- [ ] Replace `setViewMode` call sites (grep `setViewMode\|navigateToBuilding\|navigateToCell` and reroute each to camera flight)

### Task 3: Consumers + E2E (AC: 4, 5, 6)
- [ ] HUD/breadcrumb wiring; rewrite affected E2E tests

### Task 4: Verify (AC: 7)
- [ ] All four CI checks

---

## Dev Notes

- This story deletes user-visible code paths (standalone Building/Cell views). The interiors that replace them arrive in 13-14 — sequence within one sprint so users aren't left with hollow buildings for long. If a gap is unavoidable, X-ray mode covers interior visibility in the interim.
- `focusedNodeId` semantics: keep the field (camera-flight targets still need it) but it no longer drives which scene exists.

## Dependencies
- 13-12 (skins complete and toggleable in the one world)
