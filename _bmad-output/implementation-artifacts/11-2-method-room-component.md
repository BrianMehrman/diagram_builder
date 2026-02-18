# Story 11.2: Method Room Component

Status: not-started

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
- [ ] Create `packages/ui/src/features/canvas/components/buildings/MethodRoom.tsx`
- [ ] Box geometry sized to fit within building walls with padding
- [ ] Accept props: method name, visibility (public/private/protected), isStatic, isConstructor
- [ ] Material color based on method type (base colors — detailed in Story 11-3)

### Task 2: Implement room layout algorithm (AC: 4)
- [ ] Create `calculateRoomLayout(methods: MethodInfo[], buildingDimensions)` utility
- [ ] Stack rooms vertically within building volume
- [ ] Multiple rooms per floor if building width allows (grid arrangement)
- [ ] Padding between rooms and between rooms and walls
- [ ] Return array of `{ position: Vector3, size: Vector3 }` for each room

### Task 3: Integrate rooms into ClassBuilding (AC: 1, 2)
- [ ] Modify `ClassBuilding.tsx` to accept method metadata
- [ ] Render `MethodRoom` children at calculated positions (local to building)
- [ ] Building walls should be semi-transparent or have cutaway to show rooms (implementation detail)
- [ ] Apply same pattern to `AbstractBuilding` and `InterfaceBuilding`

### Task 4: Write tests (AC: 6)
- [ ] Test: rooms render inside building bounds
- [ ] Test: room count matches method count
- [ ] Test: layout algorithm produces non-overlapping positions
- [ ] Test: rooms respect building wall padding

---

## Dev Notes

- Room visibility will be controlled by LOD (Story 11-4) — this story creates the component, LOD gating is separate
- Method metadata comes from parser via `node.metadata` bag — may need to verify method list is available on GraphNode
- Consider using `<group>` in R3F to position rooms relative to building origin

## Dependencies
- 11-1 (containment-driven building height — need to know building dimensions)

## Files Expected
- `packages/ui/src/features/canvas/components/buildings/MethodRoom.tsx` (NEW)
- `packages/ui/src/features/canvas/components/buildings/MethodRoom.test.tsx` (NEW)
- `packages/ui/src/features/canvas/components/buildings/ClassBuilding.tsx` (MODIFIED)
- `packages/ui/src/features/canvas/views/cityViewUtils.ts` (MODIFIED — room layout utility)
