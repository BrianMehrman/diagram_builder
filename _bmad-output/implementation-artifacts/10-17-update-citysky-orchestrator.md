# Story 10.17: Update CitySky Orchestrator

Status: not-started

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
- [ ] Filter edges to cross-district only (in v2 mode)
- [ ] Render SkyEdge for each filtered edge
- [ ] Pass source/target positions from layout

### Task 2: Wire GroundShadow (AC: 2)
- [ ] For each SkyEdge, render companion GroundShadow
- [ ] Pass curve points from SkyEdge to GroundShadow

### Task 3: Wire store controls (AC: 3, 4)
- [ ] Read tier visibility and transit map mode
- [ ] Gate rendering by store settings
- [ ] v1 mode: use CityEdge as before

### Task 4: Verify interactions (AC: 6)
- [ ] Run interaction tests
- [ ] Edge hover/selection still works

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
_To be filled during implementation_

### Completion Notes
_To be filled on completion_

## File List
_To be filled during implementation_

---

## Change Log
- 2026-02-10: Story created from tech-spec-city-metaphor-rethink.md
