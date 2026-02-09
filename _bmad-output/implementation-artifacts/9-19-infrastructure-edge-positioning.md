# Story 9.19: Infrastructure Edge Positioning

Status: not-started

## Story

**ID:** 9-19
**Key:** 9-19-infrastructure-edge-positioning
**Title:** Infrastructure Edge Positioning
**Epic:** Epic 9 - City Visualization Overhaul Phase 1
**Phase:** Epic 9-D: Infrastructure Landmarks & Layer Control
**Priority:** HIGH - Groups infrastructure by type at city edges

**As a** developer viewing a codebase,
**I want** infrastructure nodes positioned at the city edges grouped by type,
**So that** databases cluster at the harbor zone, APIs at the airport zone, etc.

---

## Acceptance Criteria

- **AC-1:** External nodes of the same infrastructure type cluster together in a dedicated edge zone arc

- **AC-2:** Database nodes appear in a contiguous "harbor zone" arc at the outermost ring

- **AC-3:** API nodes appear in a contiguous "airport zone" arc at the outermost ring

- **AC-4:** Entry-point endpoints appear in a "gate zone" arc at the city edge

- **AC-5:** Each infrastructure zone has visual separation from adjacent zones

---

## Tasks/Subtasks

### Task 1: Update radial layout for infrastructure zones (AC: 1-5)
- [ ] Update `packages/ui/src/features/canvas/layout/engines/radialCityLayout.ts`
- [ ] Group external nodes by `metadata.infrastructureType`
- [ ] Assign each infrastructure type a dedicated arc segment on the outermost ring
- [ ] Order zones consistently (e.g., database, api, queue, cache, auth, logging, filesystem, general)
- [ ] Add gap between zones for visual separation

### Task 2: Add zone metadata to layout output (AC: 1)
- [ ] Include zone arc information in `LayoutResult.metadata`
- [ ] Zone metadata: `{ type, arcStart, arcEnd, nodeCount }` per zone
- [ ] Used by CityView to optionally render zone labels or boundaries

### Task 3: Handle missing infrastructure types (AC: 1)
- [ ] If `infrastructureType` is not set on external nodes, fall back to `'general'`
- [ ] All unclassified external nodes group in the `'general'` zone

---

## Dev Notes

### Architecture & Patterns

**Extends radial layout:** This story modifies the `RadialCityLayoutEngine` to handle infrastructure-typed external nodes. Currently, external nodes are positioned in a simple ring. This update groups them by type into arc zones.

**Zone ordering:** A fixed zone order ensures consistent positioning across re-renders. The order should be meaningful — databases (harbor) might be at one compass direction, APIs (airport) at another.

**Fallback:** If the infrastructure classifier hasn't run (no `infrastructureType` in metadata), all external nodes go to the `'general'` zone, which behaves like the current ring positioning.

### Scope Boundaries

- **DO:** Update RadialCityLayoutEngine to group external nodes by infrastructure type
- **DO:** Add zone metadata to layout output
- **DO:** Handle missing infrastructure type gracefully
- **DO NOT:** Create landmark components (that's story 9-18)
- **DO NOT:** Render zone labels (signs handle that via Epic 9-C)

### References

- `packages/ui/src/features/canvas/layout/engines/radialCityLayout.ts` — radial engine from story 9-2
- `packages/parser/src/analysis/infrastructureClassifier.ts` — classifier from story 9-17

---

## Dev Agent Record
_To be filled during implementation_

---

## Change Log
_To be filled during implementation_
