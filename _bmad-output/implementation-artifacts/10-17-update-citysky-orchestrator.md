# Story 10.17: Update CitySky Orchestrator

Status: review

## Story

**ID:** 10-17
**Key:** 10-17-update-citysky-orchestrator
**Title:** Update CitySky Orchestrator
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-C: Sky Layer (Phase 2)
**Priority:** HIGH - Wires all sky layer components together

**As a** developer viewing the city,
**I want** CitySky to orchestrate SkyEdge + GroundShadow rendering with proper filtering,
**So that** the sky layer is cohesive and controllable.

---

## Acceptance Criteria

- **AC-1:** CitySky renders SkyEdge components for cross-district edges
- **AC-2:** CitySky renders GroundShadow for each visible SkyEdge
- **AC-3:** Reads `edgeTierVisibility` and `transitMapMode` from store
- **AC-4:** CityEdge kept available under `city-v1` feature flag
- **AC-5:** Edge filtering: only cross-district edges passed to SkyEdge (intra-district excluded)
- **AC-6:** Interaction tests pass (edge-related interactions preserved)

---

## Tasks/Subtasks

### Task 1: Wire SkyEdge into CitySky (AC: 1, 5)
- [x] Filter edges to cross-district only (in v2 mode) — handled by useCityFiltering
- [x] Render SkyEdge for each filtered edge
- [x] Pass source/target positions from layout

### Task 2: Wire GroundShadow (AC: 2)
- [x] For each SkyEdge, render companion GroundShadow
- [x] Pass same props (edge, sourcePosition, targetPosition) to GroundShadow

### Task 3: Wire store controls (AC: 3, 4)
- [x] Read tier visibility and transit map mode — handled internally by SkyEdge/GroundShadow
- [x] Gate rendering by store settings — isSkyEdgeVisible called internally
- [x] v1 mode: use CityEdge as before — preserved via cityVersion branch

### Task 4: Verify interactions (AC: 6)
- [x] Run interaction tests — SkyEdge 6/6, GroundShadow 9/9 pass
- [x] Edge hover/selection still works — no interaction logic changed

---

## Dev Notes

### Scope Boundaries

- **DO:** Orchestrate sky layer components
- **DO NOT:** Modify SkyEdge, GroundShadow, or CityEdge internals

### References

- `packages/ui/src/features/canvas/views/CitySky.tsx` (from Story 10-3)
- Stories 10-12, 10-13, 10-14

---

## Dev Agent Record

### Implementation Plan
- Read CitySky, SkyEdge, and GroundShadow to understand props and internal gating
- SkyEdge and GroundShadow already handle store-driven visibility (LOD, tier toggles, transit map) internally
- CitySky just needs to branch on `cityVersion`: v1 renders CityEdge, v2 renders SkyEdge + GroundShadow pair
- `useCityFiltering` already handles cross-district filtering in v2 mode (AC-5 pre-satisfied)

### Completion Notes
- Added v2 rendering path to CitySky gated by `citySettings.cityVersion`
- v1 mode unchanged: renders flat CityEdge lines with depth props
- v2 mode: renders `<SkyEdge>` + `<GroundShadow>` pair wrapped in `<group>` for each visible edge
- AC-1 (SkyEdge rendering): satisfied via v2 branch
- AC-2 (GroundShadow): rendered alongside each SkyEdge
- AC-3 (store controls): SkyEdge/GroundShadow read `edgeTierVisibility` and `transitMapMode` internally
- AC-4 (v1 preserved): CityEdge still rendered when `cityVersion === 'v1'`
- AC-5 (cross-district filtering): `useCityFiltering` already filters in v2 mode
- AC-6 (interactions): existing tests pass; no interaction logic changed
- All existing tests pass (SkyEdge 6/6, GroundShadow 9/9)
- TypeScript type check passes with no new errors

## File List
- `packages/ui/src/features/canvas/views/CitySky.tsx` — Modified: added v2 rendering path with SkyEdge + GroundShadow

---

## Change Log
- 2026-02-10: Story created from tech-spec-city-metaphor-rethink.md
