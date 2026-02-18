# Story 10.21: Create Deprecated Indicator

Status: review

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
- [x] Create `packages/ui/src/features/canvas/components/atmosphere/DeprecatedOverlay.tsx`
- [x] Create `packages/ui/src/features/canvas/components/atmosphere/deprecatedUtils.ts`
- [x] Darker base color + diagonal striped pattern via canvas texture

### Task 2: Implement controls (AC: 3, 4)
- [x] Read `atmosphereOverlays.deprecated` from store
- [x] No `isDeprecated` flag: caller checks via `isDeprecated()` utility before rendering

### Task 3: Write tests (AC: 5)
- [x] Test: deprecated node detection (direct, metadata, nested)
- [x] Test: non-deprecated node returns false
- [x] Test: toggle off → overlay not rendered
- [x] Test: material constants verified

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
Followed established atmosphere indicator pattern:
- Separate utils file for detection logic and material constants
- Component renders a semi-transparent striped overlay mesh matching building dimensions
- Diagonal stripe pattern created via canvas texture (CanvasTexture)
- Toggle-gated via `atmosphereOverlays.deprecated` store setting

### Completion Notes
- 16 tests passing (detection with direct/metadata/nested paths, constants, visibility gating)
- Zero TypeScript errors
- Component is an overlay mesh rendered on top of existing building — does not modify building itself
- Slight z-offset (0.02) to prevent z-fighting
- Stripe texture uses diagonal lines for "boarded-up" aesthetic
- NOT wired into CityAtmosphere (that's Story 10-22)

## File List
- `packages/ui/src/features/canvas/components/atmosphere/DeprecatedOverlay.tsx` (NEW)
- `packages/ui/src/features/canvas/components/atmosphere/deprecatedUtils.ts` (NEW)
- `packages/ui/src/features/canvas/components/atmosphere/DeprecatedOverlay.test.ts` (NEW)

---

## Change Log
- 2026-02-10: Story created from tech-spec-city-metaphor-rethink.md
