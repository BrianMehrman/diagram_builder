# Story 9.21: Layer Toggle Store & UI

Status: review

## Story

**ID:** 9-21
**Key:** 9-21-layer-toggle-store-ui
**Title:** Layer Toggle Store & UI
**Epic:** Epic 9 - City Visualization Overhaul Phase 1
**Phase:** Epic 9-D: Infrastructure Landmarks & Layer Control
**Priority:** MEDIUM - Layer visibility control

**As a** developer viewing a codebase,
**I want** to toggle visibility of above-ground and underground layers,
**So that** I can focus on code structure or dependency connections independently.

---

## Acceptance Criteria

- **AC-1:** Store has `visibleLayers: { aboveGround: boolean, underground: boolean }` with both defaulting to `true`

- **AC-2:** `toggleLayer('aboveGround')` toggles above-ground visibility (buildings, signs, landmarks)

- **AC-3:** `toggleLayer('underground')` toggles underground visibility (dependency tunnels)

- **AC-4:** Layer toggle UI shows two toggle buttons in canvas overlay alongside density slider

- **AC-5:** Underground layer toggle replaces or wraps existing `isUndergroundMode` for backwards compatibility

---

## Tasks/Subtasks

### Task 1: Extend canvas store (AC: 1, 2, 3, 5)
- [x] Add `visibleLayers: { aboveGround: boolean; underground: boolean }` to `CanvasState`
- [x] Add `toggleLayer: (layer: 'aboveGround' | 'underground') => void` action
- [x] Default both to `true`
- [x] Wire `underground` layer to existing `isUndergroundMode` for compatibility
- [x] Include `visibleLayers` in `reset()` function

### Task 2: Create LayerToggle component (AC: 4)
- [x] Create `packages/ui/src/features/canvas/components/LayerToggle.tsx`
- [x] Two toggle buttons: "Above Ground" and "Underground"
- [x] Styled with Tailwind, positioned in canvas overlay
- [x] Reads from and writes to store `visibleLayers`

### Task 3: Wire layer visibility into CityView (AC: 2, 3)
- [x] Read `visibleLayers` from store in CityView
- [x] When `aboveGround` is false, hide buildings, signs, landmarks, district ground planes
- [x] When `underground` is false, hide dependency tunnels / underground layer
- [x] Preserve existing UndergroundLayer component behavior

### Task 4: Add LayerToggle to workspace layout (AC: 4)
- [x] Add LayerToggle component alongside DensitySlider in the canvas overlay area
- [x] Ensure both controls are visually grouped

---

## Dev Notes

### Architecture & Patterns

**Two layers only (Phase 1):** Street-level layer is deferred to Phase 2. Phase 1 has only above-ground and underground. The store and UI reflect this.

**Backwards compatibility:** The existing `isUndergroundMode` toggle in the store controls the UndergroundLayer component. The new `visibleLayers.underground` should either replace it or be synchronized with it. Recommended approach: `toggleLayer('underground')` also sets `isUndergroundMode` to maintain compatibility with any code reading that flag.

**Conditional rendering:** When a layer is hidden, the R3F components for that layer should not render (return null or use visibility). This is more performant than setting opacity to 0.

### Scope Boundaries

- **DO:** Add layer state to store
- **DO:** Create toggle UI
- **DO:** Wire visibility into CityView
- **DO:** Maintain backwards compatibility with `isUndergroundMode`
- **DO NOT:** Add a street-level layer (Phase 2)
- **DO NOT:** Modify underground tunnel components

### References

- `packages/ui/src/features/canvas/store.ts` — canvas store with `isUndergroundMode`
- `packages/ui/src/features/canvas/views/CityView.tsx` — rendering integration
- `packages/ui/src/features/canvas/views/UndergroundLayer.tsx` — existing underground component
- `packages/ui/src/features/canvas/components/DensitySlider.tsx` — overlay component pattern (story 9-5)

---

## Dev Agent Record

### Implementation Notes
- Added `LayerName`, `VisibleLayers` types and `visibleLayers`/`toggleLayer` to canvas store
- `toggleLayer('underground')` syncs with `isUndergroundMode` for backwards compatibility
- Created `LayerToggle.tsx` — two styled toggle buttons (blue when active, gray when inactive) with `aria-pressed` for accessibility
- Only visible in city view mode (same pattern as DensitySlider)
- CityView wraps above-ground content (district grounds, signs, clusters, buildings, landmarks, edges) in `{visibleLayers.aboveGround && (<>...</>)}`
- UndergroundLayer wrapped in `{visibleLayers.underground && (<UndergroundLayer ... />)}`
- Ground plane always renders regardless of layer toggles (serves as base)
- LayerToggle placed in RightPanel under "Layout" section alongside DensitySlider
- 7 store integration tests covering defaults, toggling, sync with isUndergroundMode, independence, reset

### File List
- `packages/ui/src/features/canvas/store.ts` — MODIFIED: added LayerName, VisibleLayers types, visibleLayers state, toggleLayer action
- `packages/ui/src/features/canvas/components/LayerToggle.tsx` — NEW: toggle buttons for layer visibility
- `packages/ui/src/features/canvas/components/LayerToggle.test.ts` — NEW: 7 store integration tests
- `packages/ui/src/features/canvas/views/CityView.tsx` — MODIFIED: conditional rendering based on visibleLayers
- `packages/ui/src/features/panels/RightPanel.tsx` — MODIFIED: added LayerToggle import and placement

---

## Change Log
- 2026-02-05: Story implemented — all ACs met, layer toggle store + UI + CityView wiring
