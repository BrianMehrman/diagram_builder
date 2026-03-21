# Story 10.20: Create SmogOverlay Indicator

Status: review

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
- [x] Create `packages/ui/src/features/canvas/components/atmosphere/SmogOverlay.tsx`
- [x] Calculate average complexity per district
- [x] Render semi-transparent sprites above districts above 75th percentile
- [x] Use `<sprite>` for performance

### Task 2: Implement controls (AC: 3, 4, 5)
- [x] Read `atmosphereOverlays.smog` from store
- [x] Gate by LOD 3+
- [x] No data: no smog rendered

### Task 3: Write tests (AC: 7)
- [x] Test: smog above 75th percentile threshold
- [x] Test: no smog when data absent
- [x] Test: toggle off → no sprites

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
Followed established atmosphere indicator pattern from ConstructionCrane (10-18) and CoverageLighting (10-19):
- Separate utils file for pure data extraction and threshold logic
- Component reads store for LOD gating and toggle state
- Sprite-based rendering for performance (AC-6)
- Per-district average complexity with 75th percentile threshold

### Completion Notes
- 26 tests passing (utility extraction, average calculation, threshold, shouldShow, opacity, visibility gating)
- Zero TypeScript errors
- Component accepts `districts` and `districtNodeMap` props — caller provides district-to-node mapping
- Sprite particles distributed deterministically across district arc geometry
- Opacity scales with complexity above threshold (0.15 to 0.45 range)
- NOT wired into CityAtmosphere (that's Story 10-22)

## File List
- `packages/ui/src/features/canvas/components/atmosphere/SmogOverlay.tsx` (NEW)
- `packages/ui/src/features/canvas/components/atmosphere/smogUtils.ts` (NEW)
- `packages/ui/src/features/canvas/components/atmosphere/SmogOverlay.test.ts` (NEW)

---

## Change Log
- 2026-02-10: Story created from tech-spec-city-metaphor-rethink.md
