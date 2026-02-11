# Story 10.20: Create SmogOverlay Indicator

Status: not-started

## Story

**ID:** 10-20
**Key:** 10-20-smog-overlay-complexity
**Title:** Create SmogOverlay Indicator (Complexity)
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-D: Atmosphere (Phase 3)
**Priority:** LOW - Complexity visualization

**As a** developer assessing technical debt,
**I want** semi-transparent smog/haze over high-complexity districts,
**So that** I can identify areas of the codebase that may need refactoring.

---

## Acceptance Criteria

- **AC-1:** Semi-transparent particle cloud over districts above 75th percentile average complexity
- **AC-2:** Data source: average `metadata.complexity` across district nodes
- **AC-3:** Toggleable: `atmosphereOverlays.smog` store setting
- **AC-4:** Graceful: no smog when complexity data absent
- **AC-5:** Visible at LOD 3+ only
- **AC-6:** Uses R3F `<sprite>` or `<points>` for performance (not volumetric)
- **AC-7:** Co-located unit tests

---

## Tasks/Subtasks

### Task 1: Create smog overlay (AC: 1, 2, 6)
- [ ] Create `packages/ui/src/features/canvas/components/atmosphere/SmogOverlay.tsx`
- [ ] Calculate average complexity per district
- [ ] Render semi-transparent sprites above districts above 75th percentile
- [ ] Use `<points>` or `<sprite>` for performance

### Task 2: Implement controls (AC: 3, 4, 5)
- [ ] Read `atmosphereOverlays.smog` from store
- [ ] Gate by LOD 3+
- [ ] No data: no smog rendered

### Task 3: Write tests (AC: 7)
- [ ] Test: smog above 75th percentile threshold
- [ ] Test: no smog when data absent
- [ ] Test: toggle off → no sprites

---

## Dev Notes

### Scope Boundaries

- **DO:** Create standalone smog indicator
- **DO NOT:** Wire into CityAtmosphere (that's story 10-22)

### References

- Story 10-5: `atmosphereOverlays.smog` store state
- Tech spec: Task 3.3

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
