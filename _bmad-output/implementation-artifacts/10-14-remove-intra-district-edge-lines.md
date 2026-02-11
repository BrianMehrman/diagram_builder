# Story 10.14: Remove Intra-District Edge Lines

Status: not-started

## Story

**ID:** 10-14
**Key:** 10-14-remove-intra-district-edge-lines
**Title:** Remove Intra-District Edge Lines
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-C: Sky Layer (Phase 2)
**Priority:** MEDIUM - Ground plane decluttering

**As a** developer viewing the city,
**I want** intra-district import edges encoded as spatial proximity rather than drawn lines,
**So that** the ground plane is clean and uncluttered.

---

## Acceptance Criteria

- **AC-1:** Intra-district `imports` edges are NOT rendered as lines in city-v2
- **AC-2:** `contains` edges are NOT rendered (already implicit from spatial containment)
- **AC-3:** Only cross-district edges are rendered as SkyEdge arcs
- **AC-4:** Proximity-based layout (from Story 10-6) ensures related nodes are visually close
- **AC-5:** Feature gated behind `cityVersion === 'v2'` — v1 still shows all edges

---

## Tasks/Subtasks

### Task 1: Filter edges in CitySky (AC: 1, 2, 3, 5)
- [ ] In city-v2 mode: filter edges to cross-district only before rendering
- [ ] Determine "cross-district" by comparing source/target directory paths
- [ ] Skip `contains` edges entirely
- [ ] v1 mode: render all edges as before (no change)

### Task 2: Verify proximity encoding (AC: 4)
- [ ] Confirm Story 10-6 proximity layout places related nodes closer
- [ ] Visual verification: files that import each other are spatially adjacent

---

## Dev Notes

### Scope Boundaries

- **DO:** Filter edge rendering in city-v2 mode
- **DO NOT:** Remove edge data from the graph — edges still exist for selection, tooltips, etc.
- **DO NOT:** Modify CityEdge component

### References

- `packages/ui/src/features/canvas/views/CitySky.tsx`
- Story 10-6: proximity-based layout
- Story 10-12: SkyEdge for cross-district edges

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
