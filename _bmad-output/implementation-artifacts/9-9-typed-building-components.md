# Story 9.9: Typed Building Components

Status: not-started

## Story

**ID:** 9-9
**Key:** 9-9-typed-building-components
**Title:** Typed Building Components
**Epic:** Epic 9 - City Visualization Overhaul Phase 1
**Phase:** Epic 9-B: Shape Language & Visual Differentiation
**Priority:** HIGH - Visual differentiation of code structures

**As a** developer viewing a codebase,
**I want** each code structure to render as a visually distinct 3D shape,
**So that** I can identify classes, functions, interfaces, and variables at a glance.

---

## Acceptance Criteria

- **AC-1:** `ClassBuilding` — multi-story box, height proportional to method count, opaque walls
- **AC-2:** `FunctionShop` — single-story wide building, visually distinct from class
- **AC-3:** `InterfaceBuilding` — glass material (transparent, 0.3 opacity), visible wireframe edge overlay
- **AC-4:** `AbstractBuilding` — dashed edge lines with semi-transparent fill (0.5 opacity)
- **AC-5:** `VariableCrate` — small box with wood-like color
- **AC-6:** `EnumCrate` — small box with striped/patterned material
- **AC-7:** All components accept standard props: `position`, `node`, `onClick`, `onHover`

---

## Tasks/Subtasks

### Task 1: Create building component directory (AC: 7)
- [ ] Create `packages/ui/src/features/canvas/components/buildings/` directory
- [ ] Create `index.ts` barrel export

### Task 2: Implement ClassBuilding (AC: 1)
- [ ] Create `ClassBuilding.tsx`
- [ ] R3F mesh with boxGeometry, height from geometry factory config
- [ ] Accept position, node, interaction props

### Task 3: Implement FunctionShop (AC: 2)
- [ ] Create `FunctionShop.tsx`
- [ ] Single-story wider box, distinct proportions from class

### Task 4: Implement InterfaceBuilding (AC: 3)
- [ ] Create `InterfaceBuilding.tsx`
- [ ] Transparent meshStandardMaterial (opacity 0.3)
- [ ] Wireframe edge overlay using `<Edges />` from drei or lineSegments

### Task 5: Implement AbstractBuilding (AC: 4)
- [ ] Create `AbstractBuilding.tsx`
- [ ] Semi-transparent fill, dashed line edges using `LineDashedMaterial`

### Task 6: Implement VariableCrate and EnumCrate (AC: 5, 6)
- [ ] Create `VariableCrate.tsx` — small box, warm brown color
- [ ] Create `EnumCrate.tsx` — small box with striped material (custom shader or texture)

---

## Dev Notes

### Architecture & Patterns

**R3F components:** Each building type is a React Three Fiber component using declarative JSX (`<mesh>`, `<boxGeometry>`, `<meshStandardMaterial>`).

**Geometry from factory:** Components use `getBuildingConfig` from story 9-8 to get dimensions and material params, then render accordingly.

**Interaction props:** Each component accepts `onClick` and `onPointerOver`/`onPointerOut` for selection and hover, matching the existing `Building` component pattern.

### Scope Boundaries

- **DO:** Create 6 typed building R3F components
- **DO:** Use geometry factory configs
- **DO NOT:** Modify CityView (that's story 9-10)
- **DO NOT:** Add sign components as children (that's Epic 9-C)

### References

- `packages/ui/src/features/canvas/views/Building.tsx` — existing building component for pattern reference
- `packages/ui/src/features/canvas/components/buildingGeometry.ts` — geometry factory from story 9-8

---

## Dev Agent Record
_To be filled during implementation_

---

## Change Log
_To be filled during implementation_
