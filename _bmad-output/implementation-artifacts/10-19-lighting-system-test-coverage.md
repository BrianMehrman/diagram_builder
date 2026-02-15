# Story 10.19: Create Lighting System for Test Coverage

Status: review

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
- Created `coverageLightingUtils.ts` with coverage extraction and intensity/color mapping
- Created `CoverageLighting.tsx` R3F component rendering `<pointLight>` above buildings
- Created `CoverageLighting.test.ts` with 18 unit tests covering utilities and store gating

### Completion Notes
- Follows the ConstructionCrane (10-18) sister pattern exactly: same props interface, same store gating, same test structure
- `getTestCoverage` returns `null` (not 0) for absent data — distinguishes "untested" from "no data" (AC-5)
- Intensity mapping: 0-30% → 0, 30-80% → linearly interpolated 0–1.5, 80-100% → 1.5–2.0
- Color mapping: warm white `#FFF5E0` for high coverage, RGB-lerped blend for mid-range, neutral `#FFFFFF` fallback
- Point light positioned at `buildingHeight * 1.3` Y, with `distance = buildingHeight * 4` and `decay = 2`
- All 18 tests passing, no new TypeScript errors introduced

## File List
- `packages/ui/src/features/canvas/components/atmosphere/coverageLightingUtils.ts` — **Created** — coverage extraction, intensity mapping, color mapping
- `packages/ui/src/features/canvas/components/atmosphere/CoverageLighting.tsx` — **Created** — R3F point light component
- `packages/ui/src/features/canvas/components/atmosphere/CoverageLighting.test.ts` — **Created** — 18 co-located unit tests
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — **Modified** — marked 10-19 as review
- `_bmad-output/implementation-artifacts/10-19-lighting-system-test-coverage.md` — **Modified** — dev agent record

---

## Change Log
- 2026-02-10: Story created from tech-spec-city-metaphor-rethink.md
