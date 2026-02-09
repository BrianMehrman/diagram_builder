# Story 9.9: Typed Building Components

Status: review

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
- [x] Create `packages/ui/src/features/canvas/components/buildings/` directory
- [x] Create `index.ts` barrel export
- [x] Create `types.ts` with shared `TypedBuildingProps` interface

### Task 2: Implement ClassBuilding (AC: 1)
- [x] Create `ClassBuilding.tsx`
- [x] R3F mesh with boxGeometry, height from geometry factory config (methodCount-scaled)
- [x] Accept position, node, click/hover/doubleClick interaction props

### Task 3: Implement FunctionShop (AC: 2)
- [x] Create `FunctionShop.tsx`
- [x] Single-story wider box (3.5 x 1.5), distinct proportions from class

### Task 4: Implement InterfaceBuilding (AC: 3)
- [x] Create `InterfaceBuilding.tsx`
- [x] Transparent meshStandardMaterial (opacity 0.3)
- [x] Wireframe edge overlay using `<Edges />` from drei

### Task 5: Implement AbstractBuilding (AC: 4)
- [x] Create `AbstractBuilding.tsx`
- [x] Semi-transparent fill (0.5 opacity), dashed line edges using `LineDashedMaterial` via `<primitive>`

### Task 6: Implement VariableCrate and EnumCrate (AC: 5, 6)
- [x] Create `VariableCrate.tsx` — small box (1.0), warm brown color (#8B6914)
- [x] Create `EnumCrate.tsx` — small box (1.5) with purple metallic color + edge highlights

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

### Implementation Plan
- Created shared `TypedBuildingProps` interface (node + position)
- Built 6 R3F components following existing Building.tsx pattern
- Each component uses `getBuildingConfig()` from story 9-8 for dimensions/material
- All components connect to canvas store for selection/hover state

### Completion Notes
- **ClassBuilding:** Multi-story box, directory-colored, height from methodCount. Click/doubleClick/hover.
- **FunctionShop:** Wide single-story (3.5x1.5), directory-colored. Click/hover.
- **InterfaceBuilding:** Glass material (0.3 opacity), `<Edges />` wireframe overlay. Slate-gray label.
- **AbstractBuilding:** Semi-transparent (0.5 opacity), dashed edge lines via `LineDashedMaterial` + `<primitive>`. Slate-gray label.
- **VariableCrate:** Small 1.0 box, warm brown (#8B6914). Smaller font label.
- **EnumCrate:** 1.5x box, purple (#7c3aed), metallic with edge highlights. Smaller font label.
- **Barrel export:** `index.ts` exports all 6 components + `TypedBuildingProps`.
- Zero TS errors. 41 related tests passing, zero regressions.

## File List
- `packages/ui/src/features/canvas/components/buildings/types.ts` (NEW — TypedBuildingProps)
- `packages/ui/src/features/canvas/components/buildings/ClassBuilding.tsx` (NEW)
- `packages/ui/src/features/canvas/components/buildings/FunctionShop.tsx` (NEW)
- `packages/ui/src/features/canvas/components/buildings/InterfaceBuilding.tsx` (NEW)
- `packages/ui/src/features/canvas/components/buildings/AbstractBuilding.tsx` (NEW)
- `packages/ui/src/features/canvas/components/buildings/VariableCrate.tsx` (NEW)
- `packages/ui/src/features/canvas/components/buildings/EnumCrate.tsx` (NEW)
- `packages/ui/src/features/canvas/components/buildings/index.ts` (NEW — barrel export)

---

## Change Log
- 2026-02-06: Created 6 typed building R3F components with shared props, barrel export. Zero TS errors, zero regressions.
