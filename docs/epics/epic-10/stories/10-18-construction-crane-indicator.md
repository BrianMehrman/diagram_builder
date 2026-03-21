# Story 10.18: Create ConstructionCrane Indicator

Status: review

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
- [x] Create `packages/ui/src/features/canvas/components/atmosphere/ConstructionCrane.tsx`
- [x] Simple crane geometry (tall pole + horizontal arm + hook)
- [x] Positioned on top of parent building

### Task 2: Implement threshold logic (AC: 2)
- [x] Calculate top 10% of buildings by change frequency
- [x] Read change data from node metadata
- [x] Only show crane on buildings above threshold

### Task 3: Implement visibility controls (AC: 3, 4, 5)
- [x] Read `atmosphereOverlays.cranes` from store
- [x] Gate by LOD level (3+ only)
- [x] If no change data on any node: don't render any cranes (graceful)

### Task 4: Write tests (AC: 6)
- [x] Test: crane appears on top 10% nodes
- [x] Test: no crane when data absent
- [x] Test: hidden when toggle off
- [x] Test: hidden at LOD < 3

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
1. Created `craneUtils.ts` with three pure functions: `getChangeCount`, `computeCraneThreshold`, `shouldShowCrane`
2. Created `ConstructionCrane.tsx` R3F component with pole + arm + hook geometry
3. Created co-located tests covering all ACs (18 tests)

### Completion Notes
- Crane geometry uses three box meshes (pole, arm, hook) in construction yellow (#F59E0B)
- Dimensions scale with building height (pole = 60%, arm = 50%, hook = 15%)
- Component reads `lodLevel` and `atmosphereOverlays.cranes` from store for visibility gating
- Threshold logic separated into `craneUtils.ts` — caller decides which nodes qualify
- `computeCraneThreshold` returns `Infinity` when no change data exists (graceful degradation)
- All 18 tests pass; no new TypeScript errors introduced

## File List
- `packages/ui/src/features/canvas/components/atmosphere/ConstructionCrane.tsx` (NEW)
- `packages/ui/src/features/canvas/components/atmosphere/craneUtils.ts` (NEW)
- `packages/ui/src/features/canvas/components/atmosphere/ConstructionCrane.test.ts` (NEW)

---

## Change Log
- 2026-02-10: Story created from tech-spec-city-metaphor-rethink.md
