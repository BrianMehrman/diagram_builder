# Story 10.13: Create GroundShadow Component

Status: not-started

## Story

**ID:** 10-13
**Key:** 10-13-ground-shadow-component
**Title:** Create GroundShadow Component
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-C: Sky Layer (Phase 2)
**Priority:** HIGH - Discoverability for sky edges

**As a** developer navigating the city at ground level,
**I want** semi-transparent shadow lines on the ground below sky edges,
**So that** I can discover dependency connections without looking up.

---

## Acceptance Criteria

- **AC-1:** For each visible SkyEdge, renders its orthographic projection on Y=0 plane
- **AC-2:** Shadow vertices = arc vertices with Y set to 0 (always aligned regardless of camera)
- **AC-3:** Rendered as semi-transparent line (opacity 0.2-0.3)
- **AC-4:** Visible at LOD 2+ (same gating as SkyEdge)
- **AC-5:** In transit map mode, shadows become fully opaque
- **AC-6:** Co-located unit tests

---

## Tasks/Subtasks

### Task 1: Create GroundShadow component (AC: 1, 2, 3)
- [ ] Create `packages/ui/src/features/canvas/components/GroundShadow.tsx`
- [ ] Accept same curve points as parent SkyEdge
- [ ] Project all points to Y=0
- [ ] Render as line with low opacity material

### Task 2: Implement visibility and mode (AC: 4, 5)
- [ ] Gate visibility by LOD level (same as SkyEdge)
- [ ] Read `transitMapMode` from store — if active, set opacity to 1.0

### Task 3: Write tests (AC: 6)
- [ ] Test: all shadow Y coordinates are 0
- [ ] Test: opacity is 0.2-0.3 in normal mode
- [ ] Test: opacity is 1.0 in transit map mode

---

## Dev Notes

### Architecture & Patterns

**Orthographic projection is trivial:** Copy the SkyEdge curve points, set all Y values to 0. This guarantees perfect alignment regardless of camera angle — no perspective distortion.

### Scope Boundaries

- **DO:** Create the shadow visual component
- **DO NOT:** Modify SkyEdge (companion, not modification)

### References

- Story 10-12: SkyEdge component (provides curve data)
- Story 10-5: `transitMapMode` store state

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
