# Story 11.10: Underground Toggle UI

Status: review

## Story

**ID:** 11-10
**Key:** 11-10-underground-toggle-ui
**Title:** Underground Toggle UI
**Epic:** Epic 11 - Vertical Layering — 3D Semantic City
**Phase:** Epic 11-C: Underground Connection Layer
**Priority:** HIGH - User control over underground visibility

**As a** developer viewing the city visualization,
**I want** toggle controls to show/hide the underground layer, with external dependency pipes hidden by default,
**So that** I can reveal structural dependencies on demand without visual clutter.

**Spec Reference:** `city-metaphor-vertical-layering-spec.md` Sections 6.1, 7

---

## Acceptance Criteria

- **AC-1:** UI toggle to show/hide the entire underground layer (all pipes)
- **AC-2:** Separate toggle for external dependency underground pipes (hidden by default)
- **AC-3:** Internal dependency pipes (within the project codebase) shown when underground layer is visible
- **AC-4:** External dependency pipes only shown when BOTH underground toggle AND external toggle are on
- **AC-5:** Toggle state persisted in Zustand canvas store
- **AC-6:** Ground plane becomes semi-transparent when underground layer is visible (to reveal pipes below)
- **AC-7:** Co-located unit tests

---

## Tasks/Subtasks

### Task 1: Extend canvas store with underground settings (AC: 5)
- [ ] Add to `citySettings` in canvas store:
  - `undergroundVisible: boolean` (default: false)
  - `externalPipesVisible: boolean` (default: false)
- [ ] Add actions: `toggleUnderground()`, `toggleExternalPipes()`
- [ ] Ensure defaults are applied on store initialization

### Task 2: Create underground toggle UI (AC: 1, 2)
- [ ] Add toggle switches to canvas toolbar or layer control panel
- [ ] "Underground Layer" toggle (main switch)
- [ ] "External Dependencies" toggle (nested under underground, disabled when underground is off)
- [ ] Match existing layer toggle UI patterns (Story 9-21)

### Task 3: Implement visibility gating in CityUnderground (AC: 3, 4)
- [ ] Read `undergroundVisible` and `externalPipesVisible` from store
- [ ] When underground off: render nothing
- [ ] When underground on, external off: render only internal project pipes
- [ ] When both on: render all pipes (internal + external)
- [ ] Filter pipe edges by checking `isExternal` flag on source/target nodes

### Task 4: Implement ground plane transparency (AC: 6)
- [ ] When underground visible: reduce ground plane opacity (e.g., 0.3-0.5)
- [ ] When underground hidden: ground plane at full opacity
- [ ] Smooth transition when toggling (opacity animation over 0.3s)
- [ ] Apply to both district ground planes and file block foundations

### Task 5: Write tests (AC: 7)
- [ ] Test: underground hidden by default
- [ ] Test: external pipes hidden by default
- [ ] Test: toggling underground shows internal pipes
- [ ] Test: external pipes only visible when both toggles on
- [ ] Test: ground plane opacity changes with underground visibility
- [ ] Test: store state persists toggle values

---

## Dev Notes

- Story 9-21 (layer toggle store + UI) already implemented a layer toggle pattern — reuse that pattern
- Story 8-17 (underground mode) implemented a basic underground toggle — review and extend/replace
- The ground plane transparency is important UX — without it, underground pipes are invisible under opaque ground
- Consider adding hover interaction: hovering a building highlights its underground connections

## Dependencies
- 11-8 (underground pipe component)
- 11-9 (edge routing classifier)
- 9-21 (existing layer toggle pattern)

## Files Expected
- `packages/ui/src/features/canvas/store.ts` (MODIFIED — underground settings)
- `packages/ui/src/features/canvas/store.test.ts` (MODIFIED)
- `packages/ui/src/features/canvas/components/CityUnderground.tsx` (MODIFIED — visibility gating)
- `packages/ui/src/features/canvas/components/LayerToggles.tsx` (MODIFIED or new component)
- `packages/ui/src/features/canvas/components/DistrictGround.tsx` (MODIFIED — transparency)
