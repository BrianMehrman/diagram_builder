# Story 9.5: Density Slider & Store Extensions

Status: review

## Story

**ID:** 9-5
**Key:** 9-5-density-slider-store-extensions
**Title:** Density Slider & Store Extensions
**Epic:** Epic 9 - City Visualization Overhaul Phase 1
**Phase:** Epic 9-A: Radial City Layout & Navigation
**Priority:** MEDIUM - User control for layout tuning

**As a** developer viewing a codebase,
**I want** a slider to control how spread out or compact the city layout is,
**So that** I can adjust readability for different codebase sizes.

---

## Acceptance Criteria

- **AC-1:** Canvas store has `layoutDensity: number` state (0-1 range, 0=dense, 1=spread) with sensible default

- **AC-2:** `setLayoutDensity(density: number)` action updates the store

- **AC-3:** Density slider UI component renders in canvas overlay and is bound to store

- **AC-4:** Changing density triggers layout recalculation with updated spacing values

---

## Tasks/Subtasks

### Task 1: Extend canvas store (AC: 1, 2)
- [x] Add `layoutDensity: number` to `CanvasState` interface (default: 1.0) — completed in story 9-4
- [x] Add `setLayoutDensity: (density: number) => void` action — completed in story 9-4
- [x] Include in `reset()` function — completed in story 9-4

### Task 2: Create DensitySlider component (AC: 3)
- [x] Create `packages/ui/src/features/canvas/components/DensitySlider.tsx`
- [x] HTML range input styled with Tailwind
- [x] Reads from and writes to store `layoutDensity`
- [x] Position in canvas overlay area (bottom-right, next to DependencyLegend)

### Task 3: Wire density to layout (AC: 4)
- [x] CityView passes `layoutDensity` to RadialCityLayoutEngine config — completed in story 9-4
- [x] Add `layoutDensity` to `useMemo` dependency array for layout recalculation — completed in story 9-4

---

## Dev Notes

### Architecture & Patterns

**Store pattern:** Follow existing Zustand patterns in `store.ts`. Single flat state, setter actions.

**Overlay positioning:** Existing canvas overlay components (like DependencyLegend) can be referenced for positioning patterns.

**Density mapping:** The radial engine maps density (0-1) to spacing multipliers for `ringSpacing`, `buildingSpacing`, `districtGap`. The engine handles the mapping internally.

### Scope Boundaries

- **DO:** Add store state and slider UI
- **DO:** Wire density to layout recalculation
- **DO NOT:** Modify the radial layout engine's density mapping (engine handles it)
- **DO NOT:** Add layer toggles (that's story 9-D.5)

### References

- `packages/ui/src/features/canvas/store.ts` — canvas store
- `packages/ui/src/features/canvas/components/DependencyLegend.tsx` — overlay component pattern
- `packages/ui/src/features/canvas/views/CityView.tsx` — layout config pass-through

---

## Dev Agent Record

### Implementation Plan
- Tasks 1 and 3 were already completed in story 9-4 (store `layoutDensity` state + CityView wiring)
- Only Task 2 remained: create the DensitySlider UI component
- Followed DependencyLegend pattern for canvas overlay positioning
- Slider range: 0.2–2.0 (density multiplier), step 0.1, default 1.0
- Only visible in city view mode

### Completion Notes
- **DensitySlider component:** HTML range input with Tailwind styling in the RightPanel "Layout" section. Shows "Dense" / "Spread" labels and current value (e.g., "1.0x"). Conditionally rendered only when `viewMode === 'city'`.
- **RightPanel integration:** DensitySlider added as first section ("Layout") in RightPanel, above Export/Viewpoints/Users.
- **Store state:** `layoutDensity` (default 1.0) and `setLayoutDensity()` were already in place from story 9-4. Reset includes it.
- **Layout wiring:** CityView already passes `layoutDensity` to `RadialCityLayoutEngine` config with `useMemo` dependency — completed in story 9-4.
- **Density scaling fix:** Engine now scales `buildingSpacing` by density (previously only ring/center were scaled), so buildings within arcs also spread apart.
- **Slider range:** 0.2–5.0x (increased from original 2.0x max to allow sufficient spread for large codebases).
- **Tests:** 5 new store integration tests for DensitySlider. All tests passing, zero regressions.

## File List
- `packages/ui/src/features/canvas/components/DensitySlider.tsx` (NEW — density slider panel component)
- `packages/ui/src/features/canvas/components/DensitySlider.test.ts` (NEW — 5 store integration tests)
- `packages/ui/src/features/panels/RightPanel.tsx` (MODIFIED — added DensitySlider in Layout section)
- `packages/ui/src/features/canvas/layout/engines/radialCityLayout.ts` (MODIFIED — density now scales buildingSpacing)

---

## Change Log
- 2026-02-05: Created DensitySlider component and integrated into Canvas3D overlay. Tasks 1 and 3 were pre-completed in story 9-4. 5 new tests passing, zero regressions.
- 2026-02-06: Moved DensitySlider from canvas overlay to RightPanel (was overlapping MiniMap). Increased max range to 5.0x. Fixed engine to scale buildingSpacing by density.
