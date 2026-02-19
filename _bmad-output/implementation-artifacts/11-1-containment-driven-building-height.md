# Story 11.1: Containment-Driven Building Height

Status: review

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
- [x] Added `getContainmentHeight()` in `cityViewUtils.ts` — height = method count × METHOD_ROOM_HEIGHT + BUILDING_PADDING
- [x] Minimum 1-floor height for classes with zero methods (Math.max(methodCount, 1))
- [x] Configurable constants: `METHOD_ROOM_HEIGHT = 2`, `BUILDING_PADDING = 1`
- [x] Added `getFootprintScale()` — encoding metrics (loc, complexity, etc.) influence footprint width/depth (1.0–2.0 range)

### Task 2: Update building Z-positioning (AC: 3)
- [x] Added `BUILDING_Y_OFFSET = 0.1` constant for buildings sitting above file block foundation
- [x] Coordinate with file block ground plane at Z = 0
- [x] Constant available for layout engine / rendering paths to apply

### Task 3: Update building footprint (AC: 4)
- [x] Updated `buildingGeometry.ts` — class/interface/abstract_class footprint scales via `getFootprintScale()`
- [x] Encoding options now drive footprint instead of height for class-like types
- [x] Scale factor uses log2 with [1.0, 2.0] clamped range

### Task 4: Write tests (AC: 6)
- [x] Test: building height scales with method count (getContainmentHeight tests)
- [x] Test: minimum height for zero-method class
- [x] Test: BUILDING_Y_OFFSET > 0
- [x] Test: footprint scales with encoding metric (7 tests for getFootprintScale)
- [x] Test: backward compatibility — updated buildingGeometry tests (18 tests pass)

---

## Dev Notes

- This story changes the fundamental meaning of building height from "metric visualization" to "containment capacity"
- Must coordinate with Story 11-2 (method room component) for room dimensions
- Existing `calculateBuildingHeight()` and `getMethodBasedHeight()` in `cityViewUtils.ts` will need updating
- The `heightEncoding` store setting should shift to controlling footprint or serve as a secondary visual cue

## Dependencies
- None (foundational story)

## Files Modified
- `packages/ui/src/features/canvas/views/cityViewUtils.ts` — Added `getContainmentHeight()`, `getFootprintScale()`, `METHOD_ROOM_HEIGHT`, `BUILDING_PADDING`, `BUILDING_Y_OFFSET`
- `packages/ui/src/features/canvas/views/cityViewUtils.test.ts` — Added 15 new tests for containment height, footprint scale, Y offset
- `packages/ui/src/features/canvas/components/buildingGeometry.ts` — Class/interface/abstract_class use containment height + footprint scaling
- `packages/ui/src/features/canvas/components/buildingGeometry.test.ts` — Updated 18 tests for new containment model
