# Story 9.8: Building Geometry Factory & Shape Constants

Status: not-started

## Story

**ID:** 9-8
**Key:** 9-8-building-geometry-factory
**Title:** Building Geometry Factory & Shape Constants
**Epic:** Epic 9 - City Visualization Overhaul Phase 1
**Phase:** Epic 9-B: Shape Language & Visual Differentiation
**Priority:** HIGH - Maps node types to 3D geometry

**As a** developer viewing a codebase,
**I want** each code structure type to have a distinct geometry and material configuration,
**So that** a geometry factory can map node types to Three.js render parameters.

---

## Acceptance Criteria

- **AC-1:** `class` → multi-story building config, height scaled by `methodCount` (fallback to depth-based)
- **AC-2:** `function` → single-story wide shop config, visually distinct from class
- **AC-3:** `variable` → small crate geometry config
- **AC-4:** `interface` → glass building (transparent 0.3 opacity, wireframe edges)
- **AC-5:** `abstract_class` → dashed-outline building (semi-transparent 0.5, dashed edge lines)
- **AC-6:** `enum` → crate with striped/patterned material
- **AC-7:** `cityViewUtils` updated with dimension constants and material configurations per type
- **AC-8:** Factory function has co-located unit tests

---

## Tasks/Subtasks

### Task 1: Define geometry and material config types (AC: 1-6)
- [ ] Create `packages/ui/src/features/canvas/components/buildingGeometry.ts`
- [ ] Define `GeometryConfig` interface (shape, dimensions)
- [ ] Define `MaterialConfig` interface (color, opacity, wireframe, dashed)
- [ ] Define `BuildingConfig` type combining both

### Task 2: Implement geometry factory function (AC: 1-6)
- [ ] `getBuildingConfig(node: GraphNode): BuildingConfig`
- [ ] Map each node type to appropriate geometry + material config
- [ ] Handle `methodCount` for class height (with fallback)
- [ ] Handle missing metadata gracefully

### Task 3: Update cityViewUtils (AC: 7)
- [ ] Add dimension constants: class width/depth, shop width/depth, crate size
- [ ] Add material presets: glass opacity, wireframe settings, dashed line params
- [ ] Add floor height calculation based on method count

### Task 4: Write unit tests (AC: 8)
- [ ] Create `packages/ui/src/features/canvas/components/buildingGeometry.test.ts`
- [ ] Test each node type returns correct config
- [ ] Test class height scales with methodCount
- [ ] Test class height fallback when methodCount missing
- [ ] Test unknown type returns default config

---

## Dev Notes

### Architecture & Patterns

**Pure utility function:** The factory is a pure function — takes a GraphNode, returns config. No React, no Three.js objects. Components use the config to create actual Three.js geometry.

**Separation of concerns:** This factory produces _descriptions_ of geometry. The actual R3F components (story 9-9) consume these descriptions.

### Scope Boundaries

- **DO:** Create geometry factory and config types
- **DO:** Update cityViewUtils with constants
- **DO:** Write comprehensive tests
- **DO NOT:** Create React/R3F components (that's story 9-9)
- **DO NOT:** Modify CityView.tsx (that's story 9-10)

### References

- `packages/ui/src/features/canvas/views/cityViewUtils.ts` — existing utils to extend
- `packages/ui/src/shared/types/graph.ts` — GraphNode type with extended union from story 9-7

---

## Dev Agent Record
_To be filled during implementation_

---

## Change Log
_To be filled during implementation_
