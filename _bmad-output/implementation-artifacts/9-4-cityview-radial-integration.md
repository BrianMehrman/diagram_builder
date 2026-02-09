# Story 9.4: CityView Radial Integration & Camera Auto-Fit

Status: review

## Story

**ID:** 9-4
**Key:** 9-4-cityview-radial-integration
**Title:** CityView Radial Integration & Camera Auto-Fit
**Epic:** Epic 9 - City Visualization Overhaul Phase 1
**Phase:** Epic 9-A: Radial City Layout & Navigation
**Priority:** CRITICAL - Wires radial layout into the view

**As a** developer viewing a codebase,
**I want** the city view to use the radial layout by default with proper camera framing,
**So that** I see the full radial city on initial load.

---

## Acceptance Criteria

- **AC-1:** CityView explicitly instantiates `RadialCityLayoutEngine` (not via registry `autoSelect`)

- **AC-2:** Camera auto-fit accounts for circular radial bounding box so entire city is visible with padding

- **AC-3:** Store `lodLevel` defaults to 1 (city level) — LOD calculator hook drives it up based on camera distance (NFR-V2)

- **AC-4:** Density config from store is passed to the radial engine and triggers layout recalculation on change

---

## Tasks/Subtasks

### Task 1: Switch CityView to RadialCityLayoutEngine (AC: 1, 4)
- [x] Update `packages/ui/src/features/canvas/views/CityView.tsx`
- [x] Replace `new CityLayoutEngine()` with `new RadialCityLayoutEngine()`
- [x] Pass density config from store to layout engine
- [x] Ensure layout recalculates when density changes (useMemo dependency)

### Task 2: Update camera auto-fit (AC: 2)
- [x] Adjust camera positioning to frame circular bounding box (use max radius + padding)
- [x] Update `Canvas3D.tsx` or camera setup if needed for radial framing

### Task 3: Fix lodLevel default (AC: 3)
- [x] Update `packages/ui/src/features/canvas/store.ts` — change `lodLevel` default from 4 to 1
- [x] Update `reset()` function to use lodLevel: 1

---

## Dev Notes

### Architecture & Patterns

**Explicit engine selection:** CityView imports and instantiates `RadialCityLayoutEngine` directly rather than using `layoutRegistry.autoSelect()`. This avoids registry iteration order issues (Architect Review #7).

**lodLevel default change:** The current default is 4 (highest detail). Changing to 1 prevents a flash of all signs on initial render before the LOD calculator kicks in. The LOD calculator (story 9-C.3) will drive it up as the user zooms in.

**Backwards compatibility:** The existing `CityLayoutEngine` remains registered and available but is no longer the default.

### Scope Boundaries

- **DO:** Update CityView to use RadialCityLayoutEngine
- **DO:** Fix camera auto-fit for radial layout
- **DO:** Fix lodLevel default to 1
- **DO NOT:** Create the density slider UI (that's story 9-5)
- **DO NOT:** Create the LOD calculator hook (that's story 9-C.3)
- **DO NOT:** Add typed building components (that's Epic 9-B)

### References

- `packages/ui/src/features/canvas/views/CityView.tsx` — main view to modify
- `packages/ui/src/features/canvas/store.ts` — lodLevel default
- `packages/ui/src/features/canvas/Canvas3D.tsx` — camera setup

---

## Dev Agent Record

### Implementation Plan
- Replaced CityLayoutEngine with RadialCityLayoutEngine in CityView (direct import, no registry autoSelect)
- Added `layoutDensity` state to canvas store (default 1.0) — passed to engine config, triggers re-layout via useMemo
- Updated camera auto-fit to use XZ diagonal spread instead of max single-axis size, better for circular layouts
- Changed camera angle to 0.6 up / 0.5 forward (was 0.4 / 0.7) for better radial overview
- Changed lodLevel default from 4 to 1 in both initial state and reset()

### Completion Notes
- **CityView engine switch:** `new RadialCityLayoutEngine()` replaces `new CityLayoutEngine()`. Layout depends on `[graph, layoutDensity]`, so density changes trigger recalculation.
- **Store additions:** `layoutDensity: number` + `setLayoutDensity()` action. Default 1.0. Included in reset().
- **Camera auto-fit:** Uses `Math.sqrt(sizeX^2 + sizeZ^2)` as XZ spread for circular bounding box. Distance = `max(spread, sizeY) * 0.85`. Camera positioned at `(center, +0.6*dist, +0.5*dist)` for top-down angled view.
- **lodLevel:** Changed from 4 → 1 in initial state and reset(). Updated store test to match.
- **CityLayoutEngine** remains available and registered — just no longer the default CityView engine.
- 137 tests passing across 9 test files, zero regressions, zero TS errors.

## File List
- `packages/ui/src/features/canvas/views/CityView.tsx` (MODIFIED — switched to RadialCityLayoutEngine, added density from store)
- `packages/ui/src/features/canvas/Canvas3D.tsx` (MODIFIED — camera auto-fit uses XZ diagonal for circular layouts)
- `packages/ui/src/features/canvas/store.ts` (MODIFIED — lodLevel default 4→1, added layoutDensity state)
- `packages/ui/src/features/canvas/store.test.ts` (MODIFIED — updated lodLevel expectation to 1)

---

## Change Log
- 2026-02-05: Wired RadialCityLayoutEngine into CityView, updated camera auto-fit for circular layout, fixed lodLevel default to 1, added layoutDensity store state. 137 tests passing, zero regressions.
