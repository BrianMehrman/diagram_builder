# Story 10.22: Update CityAtmosphere Orchestrator

Status: not-started

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
- [ ] Read `atmosphereOverlays` from store
- [ ] Conditionally mount: `{cranes && <ConstructionCrane />}`
- [ ] Conditionally mount: `{lighting && <CoverageLighting />}`
- [ ] Conditionally mount: `{smog && <SmogOverlay />}`
- [ ] Conditionally mount: `{deprecated && <DeprecatedOverlay />}`
- [ ] Gate all by `lodLevel >= 3`

### Task 2: Verify clean state (AC: 3, 4, 5)
- [ ] All toggles off: CityAtmosphere renders nothing (returns null)
- [ ] No data available: indicators don't mount
- [ ] Performance: unmounted components have zero render cost

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
_To be filled during implementation_

### Completion Notes
_To be filled on completion_

## File List
_To be filled during implementation_

---

## Change Log
- 2026-02-10: Story created from tech-spec-city-metaphor-rethink.md
