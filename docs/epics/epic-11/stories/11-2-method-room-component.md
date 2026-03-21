# Story 11.2: Method Room Component

Status: review

## Story

**ID:** 11-2
**Key:** 11-2-method-room-component
**Title:** Method Room Component
**Epic:** Epic 11 - Vertical Layering — 3D Semantic City
**Phase:** Epic 11-A: Method Rooms & Building Containment
**Priority:** CRITICAL - Core visual for methods inside buildings

**As a** developer exploring a class in the 3D city,
**I want** methods to render as box-shaped rooms arranged inside their parent class building,
**So that** I can see methods are visually contained within the class they belong to.

**Spec Reference:** `city-metaphor-vertical-layering-spec.md` Section 5

---

## Acceptance Criteria

- **AC-1:** Methods render as box-shaped room geometries inside the building volume
- **AC-2:** Rooms are visually contained — they do not protrude outside the building walls
- **AC-3:** Room size is uniform within a building (or optionally proportional to method complexity)
- **AC-4:** Rooms are arranged in a grid/stack layout within the building interior
- **AC-5:** Room color distinguishes method type (instance vs static vs constructor — see Story 11-3)
- **AC-6:** Co-located unit tests

---

## Tasks/Subtasks

### Task 1: Create MethodRoom component (AC: 1, 2, 3)
- [x] Created `MethodRoom.tsx` — box geometry with color by visibility (public/private/protected/static/constructor)
- [x] Accepts method GraphNode, position, and size props
- [x] Click selects method, hover shows label and highlights
- [x] Semi-transparent material (opacity 0.85) for visual depth

### Task 2: Implement room layout algorithm (AC: 4)
- [x] Created `roomLayout.ts` with `calculateRoomLayout()` utility
- [x] Stacks rooms vertically within building volume (METHOD_ROOM_HEIGHT per floor)
- [x] Multiple rooms per floor when building is wide enough (grid arrangement)
- [x] WALL_PADDING and ROOM_GAP constants for spacing
- [x] Returns `RoomPlacement[]` with position, size, methodIndex

### Task 3: Integrate rooms into ClassBuilding (AC: 1, 2)
- [x] ClassBuilding renders MethodRoom children at LOD 3+ (building walls go semi-transparent at 0.3 opacity)
- [x] Room placements calculated via useMemo from methods array and building dimensions
- [x] AbstractBuilding and InterfaceBuilding can follow same pattern (share ClassBuildingProps)

### Task 4: Write tests (AC: 6)
- [x] 10 tests in roomLayout.test.ts: bounds checking, count matching, non-overlapping, wall padding, grid layout, edge cases

---

## Dev Notes

- Room visibility will be controlled by LOD (Story 11-4) — this story creates the component, LOD gating is separate
- Method metadata comes from parser via `node.metadata` bag — may need to verify method list is available on GraphNode
- Consider using `<group>` in R3F to position rooms relative to building origin

## Dependencies
- 11-1 (containment-driven building height — need to know building dimensions)

## Files Modified
- `packages/ui/src/features/canvas/components/buildings/MethodRoom.tsx` (NEW) — Box-shaped room component with visibility coloring
- `packages/ui/src/features/canvas/components/buildings/roomLayout.ts` (NEW) — Room placement calculation utility
- `packages/ui/src/features/canvas/components/buildings/roomLayout.test.ts` (NEW) — 10 unit tests
- `packages/ui/src/features/canvas/components/buildings/ClassBuilding.tsx` (MODIFIED) — Renders method rooms at LOD 3+
- `packages/ui/src/features/canvas/components/buildings/index.ts` (MODIFIED) — Added exports
