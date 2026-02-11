# Story 10.21: Create Deprecated Indicator

Status: not-started

## Story

**ID:** 10-21
**Key:** 10-21-deprecated-indicator
**Title:** Create Deprecated Indicator (Boarded-Up)
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-D: Atmosphere (Phase 3)
**Priority:** LOW - Deprecated code visualization

**As a** developer navigating the codebase,
**I want** deprecated buildings to have a boarded-up appearance,
**So that** I can immediately identify code that should not be used or extended.

---

## Acceptance Criteria

- **AC-1:** Material swap on deprecated buildings: darker color, striped/hatched texture
- **AC-2:** Data source: `metadata.isDeprecated` boolean flag
- **AC-3:** Toggleable: `atmosphereOverlays.deprecated` store setting
- **AC-4:** Graceful: no flag = normal rendering (no visual change)
- **AC-5:** Co-located unit tests

---

## Tasks/Subtasks

### Task 1: Create deprecated visual (AC: 1, 2)
- [ ] Create `packages/ui/src/features/canvas/components/atmosphere/DeprecatedOverlay.tsx`
- [ ] Or: modify building components to accept `isDeprecated` prop for material swap
- [ ] Darker base color + striped/hatched pattern (repeating texture or shader)

### Task 2: Implement controls (AC: 3, 4)
- [ ] Read `atmosphereOverlays.deprecated` from store
- [ ] No `isDeprecated` flag: render normally

### Task 3: Write tests (AC: 5)
- [ ] Test: deprecated node gets dark material
- [ ] Test: non-deprecated node unchanged
- [ ] Test: toggle off → normal rendering

---

## Dev Notes

### Scope Boundaries

- **DO:** Create deprecated visual indicator
- **DO NOT:** Wire into CityAtmosphere (that's story 10-22)

### References

- Story 10-5: `atmosphereOverlays.deprecated` store state
- `packages/ui/src/shared/types/graph.ts` — `isDeprecated` field (from Epic 9-C)

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
