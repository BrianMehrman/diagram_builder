# Story 10.22: Update CityAtmosphere Orchestrator

Status: review

## Story

**ID:** 10-22
**Key:** 10-22-cityatmosphere-orchestrator
**Title:** Update CityAtmosphere Orchestrator
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-D: Atmosphere (Phase 3)
**Priority:** HIGH - Wires all atmospheric indicators together

**As a** developer viewing the city,
**I want** CityAtmosphere to orchestrate all environmental indicators with toggle control,
**So that** atmospheric information is cohesive and individually controllable.

---

## Acceptance Criteria

- **AC-1:** CityAtmosphere conditionally renders each indicator based on `atmosphereOverlays` store
- **AC-2:** All indicators gated by LOD 3+ visibility
- **AC-3:** City looks complete and normal when all indicators are off (no visual artifacts)
- **AC-4:** Indicators that lack data (no git history, no test coverage) simply don't render
- **AC-5:** No performance degradation when all indicators are off (components not mounted, not just hidden)

---

## Tasks/Subtasks

### Task 1: Wire indicators into CityAtmosphere (AC: 1, 2)
- [x] Read `atmosphereOverlays` from store
- [x] Conditionally mount: `{cranes && shouldShowCrane && <ConstructionCrane />}`
- [x] Conditionally mount: `{lighting && getTestCoverage != null && <CoverageLighting />}`
- [x] Conditionally mount: `{smog && <SmogOverlay />}`
- [x] Conditionally mount: `{deprecated && isDeprecated && <DeprecatedOverlay />}`
- [x] Gate all by `lodLevel >= 3` (early return null)

### Task 2: Verify clean state (AC: 3, 4, 5)
- [x] All toggles off: CityAtmosphere returns null (zero render cost)
- [x] No data available: qualification checks prevent mounting
- [x] Performance: unmounted components have zero render cost

### Task 3: Update CityView integration
- [x] Pass `graph` prop to CityAtmosphere in CityView

---

## Dev Notes

### Scope Boundaries

- **DO:** Orchestrate indicator rendering
- **DO NOT:** Modify individual indicator components
- **DO NOT:** Add UI controls (that's story 10-24)

### References

- `packages/ui/src/features/canvas/views/CityAtmosphere.tsx` (from Story 10-3)
- Stories 10-18 through 10-21 (indicator components)
- Story 10-5: `atmosphereOverlays` store state

---

## Dev Agent Record

### Implementation Plan
CityAtmosphere accepts `graph` prop and uses `useCityLayout` + `useCityFiltering` hooks to get node positions, districts, and node data. Iterates building-type nodes for per-building indicators (crane, lighting, deprecated) and provides district-level data for smog overlay.

### Completion Notes
- 20 tests passing (master toggle gating, LOD gating, data-graceful behavior, indicator qualification, building type filtering)
- Zero TypeScript errors
- CityView updated to pass `graph` prop to CityAtmosphere
- Early return null when all toggles off OR LOD < 3 (AC-5 zero render cost)
- Per-building: crane (top 10% changeCount), lighting (testCoverage != null), deprecated (isDeprecated flag)
- Per-district: smog (75th percentile avg complexity)
- Building type filter: class, function, interface, abstract_class only

## File List
- `packages/ui/src/features/canvas/views/CityAtmosphere.tsx` (MODIFIED — full implementation)
- `packages/ui/src/features/canvas/views/CityAtmosphere.test.ts` (NEW)
- `packages/ui/src/features/canvas/views/CityView.tsx` (MODIFIED — pass graph prop)

---

## Change Log
- 2026-02-10: Story created from tech-spec-city-metaphor-rethink.md
