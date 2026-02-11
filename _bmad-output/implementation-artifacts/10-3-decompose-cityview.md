# Story 10.3: Decompose CityView into Sub-Orchestrators

Status: not-started

## Story

**ID:** 10-3
**Key:** 10-3-decompose-cityview
**Title:** Decompose CityView into Sub-Orchestrators
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-A: Structural Refactoring (Phase 0)
**Priority:** CRITICAL - Core structural change enabling all subsequent phases

**As a** developer building the new city metaphor,
**I want** CityView split into CityBlocks, CitySky, and CityAtmosphere sub-orchestrators,
**So that** each rendering concern is isolated and can be independently developed in Phases 1-3.

---

## Acceptance Criteria

- **AC-1:** `CityBlocks.tsx` renders all ground-level content: buildings, district grounds, signs, clusters, infrastructure
- **AC-2:** `CitySky.tsx` renders all edge/connection content: CityEdge components
- **AC-3:** `CityAtmosphere.tsx` exists as an empty shell (placeholder for Phase 3)
- **AC-4:** `CityView.tsx` is a thin composition shell: `<CityBlocks /> <CitySky /> <CityAtmosphere />`
- **AC-5:** All three sub-orchestrators use the shared hooks from Story 10-2
- **AC-6:** All Story 10-1 interaction tests pass after decomposition (zero regressions)
- **AC-7:** Render order is correct: CityBlocks first, CitySky second, CityAtmosphere third

---

## Tasks/Subtasks

### Task 1: Create CityBlocks sub-orchestrator (AC: 1, 5)
- [ ] Create `packages/ui/src/features/canvas/views/CityBlocks.tsx`
- [ ] Move building rendering logic from CityView (typed buildings, Building fallback)
- [ ] Move DistrictGround rendering
- [ ] Move ClusterBuilding rendering (LOD 1)
- [ ] Move sign rendering
- [ ] Move infrastructure landmark rendering
- [ ] Use `useCityLayout`, `useCityFiltering`, `useDistrictMap` hooks

### Task 2: Create CitySky sub-orchestrator (AC: 2, 5)
- [ ] Create `packages/ui/src/features/canvas/views/CitySky.tsx`
- [ ] Move CityEdge rendering logic from CityView
- [ ] Move edge filtering (visible edges based on LOD, source/target visibility)
- [ ] Use `useCityLayout` for position data

### Task 3: Create CityAtmosphere shell (AC: 3)
- [ ] Create `packages/ui/src/features/canvas/views/CityAtmosphere.tsx`
- [ ] Empty component that returns null (placeholder for Phase 3 stories)
- [ ] Add TODO comment referencing stories 10-18 through 10-22

### Task 4: Refactor CityView as composition shell (AC: 4, 7)
- [ ] Replace all inline rendering in CityView with three sub-components
- [ ] Pass shared data via hooks (not props drilling)
- [ ] Ensure render order: CityBlocks → CitySky → CityAtmosphere
- [ ] Preserve all event handlers (hover, click, double-click)

### Task 5: Verify zero regressions (AC: 6)
- [ ] Run Story 10-1 interaction test suite — all tests must pass
- [ ] Manual visual inspection — rendering should be identical
- [ ] Check for store desync issues (shared state between sub-components)

---

## Dev Notes

### Architecture & Patterns

**Composition over inheritance:** CityView becomes a thin shell. All logic lives in hooks (Story 10-2) and sub-orchestrators. This maps cleanly to implementation phases: CityBlocks (Phase 1), CitySky (Phase 2), CityAtmosphere (Phase 3).

**Render order matters:** In R3F, render order affects transparency and layering. CityBlocks must render first (ground plane), CitySky second (edges above buildings), CityAtmosphere third (overlays on top).

**No props drilling:** Sub-orchestrators call hooks directly. They don't receive data from CityView as props. This keeps CityView truly thin.

**Shared state safety:** All three components read from the same Zustand store. Since Zustand updates are atomic, there's no risk of desync within a single frame. Selection/hover state is read-only from all three.

### Scope Boundaries

- **DO:** Move existing code into new files — no new behavior
- **DO:** Ensure pixel-perfect rendering match before/after
- **DO NOT:** Add new features, components, or store state
- **DO NOT:** Modify building components or edge components
- **DO NOT:** Begin Phase 1 work (file blocks, floor bands)

### References

- `packages/ui/src/features/canvas/views/CityView.tsx` — source component being decomposed
- `packages/ui/src/features/canvas/hooks/` — shared hooks from Story 10-2
- Story 10-1 test suite — regression safety net

---

## Dev Agent Record

### Implementation Plan
_To be filled during implementation_

### Completion Notes
_To be filled on completion_

## File List
_To be filled during implementation_

---

## Change Log
- 2026-02-10: Story created from tech-spec-city-metaphor-rethink.md
