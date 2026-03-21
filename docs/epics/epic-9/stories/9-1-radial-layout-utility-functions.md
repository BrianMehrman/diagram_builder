# Story 9.1: Radial Layout Utility Functions

Status: done

## Story

**ID:** 9-1
**Key:** 9-1-radial-layout-utility-functions
**Title:** Radial Layout Utility Functions
**Epic:** Epic 9 - City Visualization Overhaul Phase 1
**Phase:** Epic 9-A: Radial City Layout & Navigation
**Priority:** CRITICAL - Foundation for radial layout engine

**As a** developer viewing a codebase,
**I want** the layout engine to compute radial positions based on dependency depth,
**So that** code structure is spatially meaningful — entry points at center, deeper code at edges.

---

## Acceptance Criteria

- **AC-1:** `calculateRingRadius(depth, config)` returns radius proportional to depth scaled by `ringSpacing` and `centerRadius`

- **AC-2:** `assignDistrictArcs(districts, ringDepth, config)` divides ring into contiguous arc segments proportional to node count with `arcPadding` between segments

- **AC-3:** `distributeDistrictsAcrossRings(districts, nodeDepths, config)` handles directories with nodes spanning multiple depth rings, allowing districts to span adjacent rings

- **AC-4:** `positionNodesInArc(nodes, arcStart, arcEnd, radius, config)` positions nodes within arc with `buildingSpacing` between them

- **AC-5:** `calculateEntryPointPosition(entryNodes, config)` positions entry-point nodes at or near center within `centerRadius`

- **AC-6:** All utility functions are pure (no side effects) and have co-located unit tests

---

## Tasks/Subtasks

### Task 1: Create radial layout utility module (AC: 1, 2, 4, 5)
- [x] Create `packages/ui/src/features/canvas/layout/engines/radialLayoutUtils.ts`
- [x] Implement `calculateRingRadius(depth, config)` — returns `centerRadius + depth * ringSpacing`
- [x] Implement `assignDistrictArcs(districts, ringDepth, config)` — proportional arc assignment
- [x] Implement `positionNodesInArc(nodes, arcStart, arcEnd, radius, config)` — polar to cartesian positioning
- [x] Implement `calculateEntryPointPosition(entryNodes, config)` — center cluster positioning

### Task 2: Implement multi-ring district distribution (AC: 3)
- [x] Implement `distributeDistrictsAcrossRings(districts, nodeDepths, config)` — handles directories spanning multiple depths
- [x] Handle edge case: directory with nodes at non-adjacent depths

### Task 3: Write unit tests (AC: 6)
- [x] Create `packages/ui/src/features/canvas/layout/engines/radialLayoutUtils.test.ts`
- [x] Test `calculateRingRadius` with various depths and configs
- [x] Test `assignDistrictArcs` with single and multiple districts
- [x] Test `distributeDistrictsAcrossRings` with single-ring and multi-ring directories
- [x] Test `positionNodesInArc` with various arc sizes and node counts
- [x] Test `calculateEntryPointPosition` with single and multiple entry points

---

## Dev Notes

### Architecture & Patterns

**Pure utility functions:** All functions are pure — they take data and config, return positions. No React, no state, no side effects. This makes them trivially testable.

**Coordinate system:** The radial layout uses polar coordinates internally (angle, radius) and converts to cartesian (x, z) for the final Position3D output. Y axis is used for depth-based height (already established pattern from CityLayoutEngine).

**Config type:** These utilities accept `RadialCityLayoutConfig` fields. The typed config interface is defined in story 9-2 alongside the engine, but utilities only need individual field values, not the full interface.

### Scope Boundaries

- **DO:** Create pure utility functions for radial position calculations
- **DO:** Write comprehensive unit tests for all functions
- **DO:** Handle edge cases (empty districts, single node, zero depth)
- **DO NOT:** Create the RadialCityLayoutEngine class (that's story 9-2)
- **DO NOT:** Create the RadialCityLayoutConfig interface (that's story 9-2)
- **DO NOT:** Modify any existing layout engine or CityView
- **DO NOT:** Add React components or store state

### References

- `packages/ui/src/features/canvas/layout/engines/cityLayout.ts` — existing grid layout for pattern reference
- `packages/ui/src/features/canvas/layout/types.ts` — LayoutEngine interface, Position3D
- `packages/ui/src/features/canvas/layout/bounds.ts` — bounding box utilities

---

## Dev Agent Record

### Implementation Plan
- Created pure utility module `radialLayoutUtils.ts` with 5 exported functions
- Each function accepts minimal typed config interfaces (not the full RadialCityLayoutConfig — that's story 9-2)
- Used polar-to-cartesian conversion: internally compute angle/radius, output x/z coordinates (y=0)
- Followed red-green-refactor: wrote 21 failing tests first, then implemented functions to pass

### Completion Notes
- **calculateRingRadius**: Simple linear formula `centerRadius + depth * ringSpacing`. Handles zero values gracefully.
- **assignDistrictArcs**: Divides 2PI proportionally by node count, subtracting total padding first. Produces contiguous non-overlapping segments.
- **positionNodesInArc**: Distributes nodes evenly across arc using `(i + 0.5) / N` fractional positioning for even spacing. Converts polar → cartesian.
- **calculateEntryPointPosition**: Single node → exact center (0,0,0). Multiple nodes → small circle at `centerRadius * 0.5`.
- **distributeDistrictsAcrossRings**: Groups district node IDs by depth, creates one RingAssignment per unique depth. Handles non-adjacent depths correctly.
- All functions are pure — no side effects, no React, no state. Typed with minimal config interfaces.
- 21 unit tests covering: normal cases, edge cases (empty inputs, zero values, single items, non-adjacent depths), proportional correctness, and spatial validity.

## File List
- `packages/ui/src/features/canvas/layout/engines/radialLayoutUtils.ts` (NEW)
- `packages/ui/src/features/canvas/layout/engines/radialLayoutUtils.test.ts` (NEW)

---

## Change Log
- 2026-02-05: Implemented all 5 radial layout utility functions with 21 co-located unit tests. All tests passing, zero regressions.
