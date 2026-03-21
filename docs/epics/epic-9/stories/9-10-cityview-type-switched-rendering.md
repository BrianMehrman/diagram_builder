# Story 9.10: CityView Type-Switched Rendering

Status: done

## Story

**ID:** 9-10
**Key:** 9-10-cityview-type-switched-rendering
**Title:** CityView Type-Switched Rendering
**Epic:** Epic 9 - City Visualization Overhaul Phase 1
**Phase:** Epic 9-B: Shape Language & Visual Differentiation
**Priority:** HIGH - Wires typed buildings into city view

**As a** developer viewing a codebase,
**I want** the city view to render the correct building component for each node type,
**So that** the city contains a mix of visually distinct structures.

---

## Acceptance Criteria

- **AC-1:** CityView selects the appropriate typed building component based on `node.type` and metadata

- **AC-2:** Mixed graphs render each node as its corresponding typed building (no uniform boxes)

- **AC-3:** Existing `Building` component serves as fallback for unrecognized types

---

## Tasks/Subtasks

### Task 1: Create building type selector (AC: 1)
- [x] Create `renderTypedBuilding()` helper function with switch statement
- [x] Handle all types: class, function, variable, interface, abstract_class, enum
- [x] File nodes render via default case using existing Building component

### Task 2: Update CityView rendering loop (AC: 1, 2, 3)
- [x] Update `packages/ui/src/features/canvas/views/CityView.tsx`
- [x] Replace `<Building>` with `renderTypedBuilding(node, pos)` call
- [x] Pass node, position props to selected component
- [x] Building remains as default/fallback for file and unknown types

### Task 3: Verify with X-Ray mode (AC: 2)
- [x] XRayBuilding still renders when isXRayMode is true (unchanged code path, runs before type switch)
- [x] X-Ray mode takes priority — typed buildings only render in normal mode

---

## Dev Notes

### Architecture & Patterns

**Type switch pattern:** A simple switch/map is preferred over complex component registration. Since the set of types is fixed and small, a switch statement in the render is clear and maintainable.

**File nodes:** In the city metaphor, `file` type nodes represent buildings. They should render as `ClassBuilding` by default (or could be a distinct `FileBuilding` — for now, use ClassBuilding since files contain classes).

**X-Ray compatibility:** The existing XRayBuilding renders transparent buildings showing internal structure. New typed components need to support an `isXRay` prop or the x-ray mode check needs to wrap them.

### Scope Boundaries

- **DO:** Wire typed building components into CityView
- **DO:** Maintain X-Ray mode compatibility
- **DO NOT:** Add sign components (that's Epic 9-C)
- **DO NOT:** Add infrastructure landmarks (that's Epic 9-D)

### References

- `packages/ui/src/features/canvas/views/CityView.tsx` — rendering loop to modify
- `packages/ui/src/features/canvas/components/buildings/` — typed components from story 9-9
- `packages/ui/src/features/canvas/views/XRayBuilding.tsx` — x-ray mode rendering

---

## Dev Agent Record

### Implementation Plan
- Added `renderTypedBuilding()` function with switch on `node.type`
- Imported all 6 typed building components from `components/buildings/`
- Replaced `<Building>` with `renderTypedBuilding(node, pos)` in the render loop
- X-Ray mode path unchanged — still takes priority before type switch

### Completion Notes
- **Type switch:** `renderTypedBuilding(node, position)` maps class→ClassBuilding, function→FunctionShop, interface→InterfaceBuilding, abstract_class→AbstractBuilding, variable→VariableCrate, enum→EnumCrate. Default (file, method, unknown)→Building.
- **X-Ray compatibility:** The `isXRayMode` check runs first and renders `<XRayBuilding>`. Only when not in x-ray mode does the type switch execute. No changes needed to XRayBuilding.
- **Clustering compatibility:** Clustered node IDs are still skipped before reaching the type switch.
- Zero TS errors, 189 tests passing, zero regressions.

## File List
- `packages/ui/src/features/canvas/views/CityView.tsx` (MODIFIED — added typed building imports, renderTypedBuilding helper, replaced Building with type switch)

---

## Change Log
- 2026-02-06: Wired 6 typed building components into CityView with type-switched rendering. X-ray and clustering paths unchanged. Zero TS errors, zero regressions.
