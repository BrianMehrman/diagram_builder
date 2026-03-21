# Story 9.8: Building Geometry Factory & Shape Constants

Status: done

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
- [x] Create `packages/ui/src/features/canvas/components/buildingGeometry.ts`
- [x] Define `GeometryConfig` interface (shape, width, height, depth)
- [x] Define `MaterialConfig` interface (opacity, transparent, wireframe, roughness, metalness, dashed)
- [x] Define `BuildingConfig` type combining both

### Task 2: Implement geometry factory function (AC: 1-6)
- [x] `getBuildingConfig(node: GraphNode): BuildingConfig`
- [x] Map each node type to appropriate geometry + material config
- [x] Handle `methodCount` for class/interface/abstract_class height (with fallback)
- [x] Handle missing metadata gracefully (default config for unknown types)

### Task 3: Update cityViewUtils (AC: 7)
- [x] Add dimension constants: CLASS_WIDTH/DEPTH, SHOP_WIDTH/DEPTH, CRATE_SIZE
- [x] Add material presets: GLASS_OPACITY, ABSTRACT_OPACITY
- [x] Add `getMethodBasedHeight()` for method-count-based height with depth fallback

### Task 4: Write unit tests (AC: 8)
- [x] Create `packages/ui/src/features/canvas/components/buildingGeometry.test.ts`
- [x] Test each node type returns correct config (class, function, variable, interface, abstract_class, enum)
- [x] Test class height scales with methodCount
- [x] Test class height fallback when methodCount missing
- [x] Test default config for file and method types

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

### Implementation Plan
- Created config types (GeometryConfig, MaterialConfig, BuildingConfig) as pure data interfaces
- Implemented `getBuildingConfig()` factory mapping 6 node types + default
- Extended cityViewUtils with type-specific dimension constants and `getMethodBasedHeight()`
- Factory is pure — no React/Three.js dependencies, just returns descriptions

### Completion Notes
- **buildingGeometry.ts:** Factory with `GeometryShape`, `GeometryConfig`, `MaterialConfig`, `BuildingConfig` types. `getBuildingConfig(node)` maps: class → multi-story (methodCount-scaled), function → wide shop, variable → small crate, interface → glass wireframe (0.3 opacity), abstract_class → dashed semi-transparent (0.5 opacity), enum → metallic crate (1.5x crate size). File/method/unknown → default.
- **cityViewUtils.ts:** Added `CLASS_WIDTH/DEPTH` (2.5), `SHOP_WIDTH/DEPTH` (3.5/1.5), `CRATE_SIZE` (1.0), `GLASS_OPACITY` (0.3), `ABSTRACT_OPACITY` (0.5), `getMethodBasedHeight()`.
- **Tests:** 11 tests covering all 6 typed configs + default, methodCount scaling, fallback behavior. All passing, zero TS errors.

## File List
- `packages/ui/src/features/canvas/components/buildingGeometry.ts` (NEW — geometry factory + config types)
- `packages/ui/src/features/canvas/components/buildingGeometry.test.ts` (NEW — 11 tests)
- `packages/ui/src/features/canvas/views/cityViewUtils.ts` (MODIFIED — type-specific constants + getMethodBasedHeight)

---

## Change Log
- 2026-02-06: Created building geometry factory with 6 type mappings, config types, dimension constants, and 11 tests. Zero TS errors, zero regressions.
