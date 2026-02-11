# Story 10.5: Extend Canvas Store with City Settings

Status: not-started

## Story

**ID:** 10-5
**Key:** 10-5-extend-canvas-store-city-settings
**Title:** Extend Canvas Store with City Settings
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-A: Structural Refactoring (Phase 0)
**Priority:** HIGH - Forward-planned state for Phases 1-4

**As a** developer building the new city metaphor features,
**I want** all needed store state defined upfront in a `citySettings` namespace,
**So that** Phases 1-4 can add features without restructuring the store.

---

## Acceptance Criteria

- **AC-1:** `citySettings.heightEncoding` supports: 'methodCount' | 'dependencies' | 'loc' | 'complexity' | 'churn' (default: 'methodCount')
- **AC-2:** `citySettings.transitMapMode` boolean (default: false)
- **AC-3:** `citySettings.atmosphereOverlays` object with toggles: cranes, smog, lighting, deprecated (all default: false)
- **AC-4:** `citySettings.edgeTierVisibility` object with toggles: crossDistrict, inheritance (all default: true)
- **AC-5:** `citySettings.cityVersion` feature flag: 'v1' | 'v2' (default: 'v1')
- **AC-6:** Actions follow verb-first naming: `setCityVersion`, `setHeightEncoding`, `toggleAtmosphereOverlay`, `toggleTransitMapMode`, `toggleEdgeTierVisibility`
- **AC-7:** Zustand selectors ensure new slices don't trigger re-renders in existing components
- **AC-8:** Unit tests for all new actions and selectors

---

## Tasks/Subtasks

### Task 1: Add citySettings to canvas store (AC: 1-6)
- [ ] Add `citySettings` namespace to `packages/ui/src/features/canvas/store.ts`
- [ ] Define all sub-fields with defaults
- [ ] Add verb-first actions for each setting
- [ ] Ensure existing store state is untouched

### Task 2: Create selectors (AC: 7)
- [ ] Create granular selectors: `useCityVersion()`, `useHeightEncoding()`, `useTransitMapMode()`, etc.
- [ ] Verify that changing `citySettings.transitMapMode` does NOT trigger re-render on components only reading `layoutPositions`

### Task 3: Write unit tests (AC: 8)
- [ ] Test each action sets correct state
- [ ] Test selectors return correct slices
- [ ] Test default values

---

## Dev Notes

### Architecture & Patterns

**Zustand selectors:** Use `useCanvasStore(state => state.citySettings.heightEncoding)` pattern. Components subscribe only to the slice they need.

**Forward planning:** These state slices are consumed by stories in Phases 1-4. Defining them all now ensures consistent naming and prevents store restructuring mid-implementation.

### Scope Boundaries

- **DO:** Add state and actions only — no UI components
- **DO NOT:** Add UI controls (those are stories 10-23, 10-24, 10-25)
- **DO NOT:** Wire settings into rendering (that's handled per-phase)

### References

- `packages/ui/src/features/canvas/store.ts` — existing store
- Tech spec: store extensions section

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
