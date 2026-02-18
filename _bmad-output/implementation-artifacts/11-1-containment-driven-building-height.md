# Story 11.1: Containment-Driven Building Height

Status: not-started

## Story

**ID:** 11-1
**Key:** 11-1-containment-driven-building-height
**Title:** Containment-Driven Building Height
**Epic:** Epic 11 - Vertical Layering — 3D Semantic City
**Phase:** Epic 11-A: Method Rooms & Building Containment
**Priority:** CRITICAL - Foundation for all room-based rendering

**As a** developer viewing a 3D city visualization,
**I want** class building height to be driven by the number of method rooms it must contain,
**So that** buildings are tall enough to visually hold their methods and the Z-axis conveys containment.

**Spec Reference:** `city-metaphor-vertical-layering-spec.md` Sections 2, 4

---

## Acceptance Criteria

- **AC-1:** Building height calculation uses method count to determine room capacity (must be tall enough to stack method rooms vertically)
- **AC-2:** Minimum building height of 1 floor for zero-method classes (lobby floor)
- **AC-3:** Z-position of building base starts above the file block foundation (Z > 0)
- **AC-4:** Building footprint reflects class complexity (number of methods, properties)
- **AC-5:** Existing height encoding options (methodCount, dependencies, loc, complexity, churn) influence footprint or serve as secondary metrics — containment is primary for height
- **AC-6:** Co-located unit tests

---

## Tasks/Subtasks

### Task 1: Update height calculation utility (AC: 1, 2, 5)
- [ ] Modify `getMethodBasedHeight()` in `cityViewUtils.ts` to calculate height based on room stacking (method count × room height + padding)
- [ ] Ensure minimum 1-floor height for classes with zero methods
- [ ] Configurable room height constant (e.g., `METHOD_ROOM_HEIGHT`)
- [ ] Secondary height encoding metrics (loc, complexity, etc.) influence building footprint width/depth rather than height

### Task 2: Update building Z-positioning (AC: 3)
- [ ] Buildings render with base at Z > 0 (sitting on top of file block foundation)
- [ ] Coordinate with file block ground plane at Z = 0
- [ ] Update layout engine to output Z-offset for buildings on blocks

### Task 3: Update building footprint (AC: 4)
- [ ] Footprint width/depth scales with class complexity
- [ ] Factor in method count, property count, and optional secondary encoding metric
- [ ] Ensure footprint fits within file block boundaries

### Task 4: Write tests (AC: 6)
- [ ] Test: building height scales with method count
- [ ] Test: minimum height for zero-method class
- [ ] Test: building base Z > 0
- [ ] Test: footprint scales with complexity
- [ ] Test: backward compatibility with existing height encoding selector

---

## Dev Notes

- This story changes the fundamental meaning of building height from "metric visualization" to "containment capacity"
- Must coordinate with Story 11-2 (method room component) for room dimensions
- Existing `calculateBuildingHeight()` and `getMethodBasedHeight()` in `cityViewUtils.ts` will need updating
- The `heightEncoding` store setting should shift to controlling footprint or serve as a secondary visual cue

## Dependencies
- None (foundational story)

## Files Expected
- `packages/ui/src/features/canvas/views/cityViewUtils.ts` (MODIFIED)
- `packages/ui/src/features/canvas/views/cityViewUtils.test.ts` (MODIFIED)
- `packages/ui/src/features/canvas/components/buildings/ClassBuilding.tsx` (MODIFIED)
