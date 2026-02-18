# Story 11.4: LOD Transition — Floor Bands to Method Rooms

Status: not-started

## Story

**ID:** 11-4
**Key:** 11-4-lod-room-transition
**Title:** LOD Transition — Floor Bands to Method Rooms
**Epic:** Epic 11 - Vertical Layering — 3D Semantic City
**Phase:** Epic 11-A: Method Rooms & Building Containment
**Priority:** HIGH - Performance-critical LOD management

**As a** developer navigating between city zoom and street zoom,
**I want** buildings to show simplified floor bands at LOD 1-2 and detailed method rooms at LOD 3+,
**So that** the visualization performs well at city scale while showing detail up close.

**Spec Reference:** `city-metaphor-vertical-layering-spec.md` Section 5

---

## Acceptance Criteria

- **AC-1:** At LOD 1-2 (city/district zoom), class buildings render with floor bands (existing vertex-colored single mesh)
- **AC-2:** At LOD 3+ (neighborhood/street zoom), class buildings render with individual method room geometries
- **AC-3:** Transition between floor bands and rooms is smooth (fade or morph, no pop-in)
- **AC-4:** Performance: floor band mode uses single mesh (existing), room mode uses instanced or grouped meshes
- **AC-5:** LOD threshold is configurable via store or constant
- **AC-6:** Co-located unit tests

---

## Tasks/Subtasks

### Task 1: Implement LOD-gated rendering in ClassBuilding (AC: 1, 2)
- [ ] Read `lodLevel` from store or receive as prop
- [ ] LOD 1-2: render existing floor band mesh (single geometry, vertex colors)
- [ ] LOD 3+: render `MethodRoom` children from Story 11-2
- [ ] Same pattern for `AbstractBuilding` and `InterfaceBuilding`

### Task 2: Implement smooth transition (AC: 3)
- [ ] Cross-fade between floor band mesh and room meshes at LOD boundary
- [ ] Floor band opacity fades out as rooms fade in (over LOD 2.5-3.0 range)
- [ ] Avoid double-rendering — only one representation fully opaque at a time

### Task 3: Optimize room rendering (AC: 4)
- [ ] Use instanced meshes for rooms when >10 methods in view
- [ ] Frustum culling on individual rooms
- [ ] Only render rooms for buildings within LOD 3+ distance threshold

### Task 4: Make threshold configurable (AC: 5)
- [ ] Define `ROOM_LOD_THRESHOLD` constant (default: 3.0)
- [ ] Optionally expose in canvas store for user tuning

### Task 5: Write tests (AC: 6)
- [ ] Test: floor bands render at LOD 1
- [ ] Test: floor bands render at LOD 2
- [ ] Test: method rooms render at LOD 3
- [ ] Test: transition opacity values at LOD 2.5
- [ ] Test: rooms not rendered when building outside LOD 3 distance

---

## Dev Notes

- The existing LOD system is float-based (0.0-4.0) with smooth fade — leverage `useLodCalculator` hook
- Floor band rendering from Story 10-8 remains the LOD 1-2 fallback — do not remove it
- Key performance concern: a large codebase at LOD 3 could have hundreds of buildings each with many rooms. Instanced rendering and frustum culling are essential.

## Dependencies
- 11-2 (method room component)
- 11-3 (floor ordering — rooms need correct placement before LOD transition)
- 10-8 (floor band rendering — existing LOD 1-2 implementation)

## Files Expected
- `packages/ui/src/features/canvas/components/buildings/ClassBuilding.tsx` (MODIFIED)
- `packages/ui/src/features/canvas/components/buildings/AbstractBuilding.tsx` (MODIFIED)
- `packages/ui/src/features/canvas/components/buildings/InterfaceBuilding.tsx` (MODIFIED)
- `packages/ui/src/features/canvas/components/buildings/ClassBuilding.test.tsx` (MODIFIED)
