# Story 9.10: CityView Type-Switched Rendering

Status: not-started

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
- [ ] Create a utility or inline switch that maps `node.type` to the correct component
- [ ] Handle all types: class, function, variable, interface, abstract_class, enum
- [ ] File nodes render as ClassBuilding (file = building in city metaphor)

### Task 2: Update CityView rendering loop (AC: 1, 2, 3)
- [ ] Update `packages/ui/src/features/canvas/views/CityView.tsx`
- [ ] Replace single `<Building>` with type-switched component selection
- [ ] Pass node, position, and interaction props to selected component
- [ ] Keep `<Building>` as default/fallback for unknown types

### Task 3: Verify with X-Ray mode (AC: 2)
- [ ] Ensure XRayBuilding still works alongside new typed components
- [ ] Typed buildings should render with x-ray opacity when x-ray mode is active

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
_To be filled during implementation_

---

## Change Log
_To be filled during implementation_
