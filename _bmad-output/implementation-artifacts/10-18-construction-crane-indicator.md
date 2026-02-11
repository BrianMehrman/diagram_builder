# Story 10.18: Create ConstructionCrane Indicator

Status: not-started

## Story

**ID:** 10-18
**Key:** 10-18-construction-crane-indicator
**Title:** Create ConstructionCrane Indicator (Change Frequency)
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-D: Atmosphere (Phase 3)
**Priority:** MEDIUM - First atmospheric indicator (most universally available data)

**As a** developer surveying the city,
**I want** construction cranes on buildings with high recent change frequency,
**So that** I can spot code hotspots — areas under active development or frequent churn.

---

## Acceptance Criteria

- **AC-1:** Small crane mesh placed on top of buildings in the top 10% by change count
- **AC-2:** Data source: `metadata.properties.changeCount` or git-derived churn
- **AC-3:** Toggleable: `atmosphereOverlays.cranes` store setting
- **AC-4:** Graceful when data absent: indicator simply doesn't render (no errors)
- **AC-5:** Visible at LOD 3+ only
- **AC-6:** Co-located unit tests

---

## Tasks/Subtasks

### Task 1: Create crane mesh (AC: 1)
- [ ] Create `packages/ui/src/features/canvas/components/atmosphere/ConstructionCrane.tsx`
- [ ] Simple crane geometry (tall pole + horizontal arm + hook)
- [ ] Positioned on top of parent building

### Task 2: Implement threshold logic (AC: 2)
- [ ] Calculate top 10% of buildings by change frequency
- [ ] Read change data from node metadata
- [ ] Only show crane on buildings above threshold

### Task 3: Implement visibility controls (AC: 3, 4, 5)
- [ ] Read `atmosphereOverlays.cranes` from store
- [ ] Gate by LOD level (3+ only)
- [ ] If no change data on any node: don't render any cranes (graceful)

### Task 4: Write tests (AC: 6)
- [ ] Test: crane appears on top 10% nodes
- [ ] Test: no crane when data absent
- [ ] Test: hidden when toggle off
- [ ] Test: hidden at LOD < 3

---

## Dev Notes

### Scope Boundaries

- **DO:** Create standalone atmospheric indicator component
- **DO NOT:** Wire into CityAtmosphere (that's story 10-22)
- **DO NOT:** Add UI toggle (that's story 10-24)

### References

- Story 10-5: `atmosphereOverlays.cranes` store state
- Tech spec: Task 3.1

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
