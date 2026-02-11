# Story 10.19: Create Lighting System for Test Coverage

Status: not-started

## Story

**ID:** 10-19
**Key:** 10-19-lighting-system-test-coverage
**Title:** Create Lighting System (Test Coverage)
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-D: Atmosphere (Phase 3)
**Priority:** MEDIUM - Test coverage visualization

**As a** developer assessing code quality,
**I want** well-tested areas to be brightly lit and untested areas to be dim,
**So that** I can visually identify testing gaps across the codebase.

---

## Acceptance Criteria

- **AC-1:** Point lights above well-tested blocks (warm, bright color)
- **AC-2:** Dim/absent lighting over untested blocks (dark, cold ambient)
- **AC-3:** Data source: `metadata.properties.testCoverage` (0-100 scale)
- **AC-4:** Toggleable: `atmosphereOverlays.lighting` store setting
- **AC-5:** Graceful: default to neutral ambient when no coverage data available
- **AC-6:** Visible at LOD 3+ only
- **AC-7:** Co-located unit tests

---

## Tasks/Subtasks

### Task 1: Create lighting indicator (AC: 1, 2, 3)
- [ ] Create `packages/ui/src/features/canvas/components/atmosphere/CoverageLighting.tsx`
- [ ] Add point light per file block with intensity proportional to coverage
- [ ] High coverage (80-100%): warm white, high intensity
- [ ] Low coverage (0-30%): no added light (ambient only)
- [ ] Mid coverage: interpolated

### Task 2: Implement controls (AC: 4, 5, 6)
- [ ] Read `atmosphereOverlays.lighting` from store
- [ ] Gate by LOD 3+
- [ ] No coverage data: render neutral (no light added or removed)

### Task 3: Write tests (AC: 7)
- [ ] Test: high coverage → bright light
- [ ] Test: low coverage → no light
- [ ] Test: missing data → neutral
- [ ] Test: toggle off → no lights

---

## Dev Notes

### Performance consideration
Point lights are expensive in Three.js. Limit to one light per file block (not per building). Consider using a custom shader or baked lighting texture for large codebases.

### Scope Boundaries

- **DO:** Create lighting indicator component
- **DO NOT:** Wire into CityAtmosphere (that's story 10-22)

### References

- Story 10-5: `atmosphereOverlays.lighting` store state
- Tech spec: Task 3.2

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
