# Story 11.8: Underground Pipe Component

Status: not-started

## Story

**ID:** 11-8
**Key:** 11-8-underground-pipe-component
**Title:** Underground Pipe Component
**Epic:** Epic 11 - Vertical Layering — 3D Semantic City
**Phase:** Epic 11-C: Underground Connection Layer
**Priority:** CRITICAL - Core underground rendering

**As a** developer viewing the city visualization,
**I want** import, inheritance, and implements relationships rendered as pipe/conduit lines below the ground plane,
**So that** structural dependencies are visually represented as underground plumbing that buildings are built on top of.

**Spec Reference:** `city-metaphor-vertical-layering-spec.md` Section 6.1

---

## Acceptance Criteria

- **AC-1:** Renders pipe/conduit line geometry below Z=0 (underground)
- **AC-2:** Pipes connect source building base to target building base, routed below ground
- **AC-3:** Pipe visual style reads as "plumbing/conduit" (cylindrical tube or thick line, not thin wire)
- **AC-4:** Pipes can vary in thickness or color to encode frequency or type
- **AC-5:** Supports both short-distance (same block) and long-distance (cross-district) connections
- **AC-6:** Co-located unit tests

---

## Tasks/Subtasks

### Task 1: Create UndergroundPipe component (AC: 1, 2, 3)
- [ ] Create `packages/ui/src/features/canvas/components/UndergroundPipe.tsx`
- [ ] Render as `THREE.TubeGeometry` along a path below Z=0
- [ ] Path: source position (Z=0) → dip down to pipe depth → horizontal run → rise to target position (Z=0)
- [ ] Pipe depth: Z = -2 to -5 (configurable, deeper for longer runs or inheritance)
- [ ] Material: opaque, pipe-like (matte metallic or concrete look)

### Task 2: Implement pipe routing algorithm (AC: 2, 5)
- [ ] Create `calculatePipeRoute(source: Vector3, target: Vector3, pipeDepth: number): Vector3[]`
- [ ] Route: vertical drop from source → horizontal path at depth → vertical rise to target
- [ ] For same-block connections: shallow route (Z = -1 to -2)
- [ ] For cross-district connections: deeper route (Z = -3 to -5)
- [ ] Avoid pipe-to-pipe collisions with slight lateral offset for parallel routes

### Task 3: Implement type-based visual encoding (AC: 4)
- [ ] Define pipe colors by relationship type:
  - Import/dependency: blue-gray
  - Inheritance (extends): deeper/warmer color (e.g., copper/bronze)
  - Implements: distinct color (e.g., steel/silver)
- [ ] Pipe thickness: standard for imports, thicker for inheritance
- [ ] Constants in `cityViewUtils.ts`

### Task 4: Write tests (AC: 6)
- [ ] Test: pipe renders below Z=0
- [ ] Test: pipe connects source to target positions
- [ ] Test: short-distance pipe is shallower than long-distance
- [ ] Test: color varies by relationship type
- [ ] Test: pipe route has correct waypoints (down → horizontal → up)

---

## Dev Notes

- Existing Story 8-17 (underground mode) and 8-18 (dependency tunnels) implemented a basic underground visualization — review and build on that work
- `TubeGeometry` with a `CatmullRomCurve3` path gives smooth pipe routing
- Performance: for large codebases, consider instanced pipe rendering or LOD-gating pipes
- The ground plane may need a semi-transparent mode or cutaway view to reveal pipes

## Dependencies
- None (can be developed in parallel with other 11-C stories)

## Files Expected
- `packages/ui/src/features/canvas/components/UndergroundPipe.tsx` (NEW)
- `packages/ui/src/features/canvas/components/UndergroundPipe.test.tsx` (NEW)
- `packages/ui/src/features/canvas/views/cityViewUtils.ts` (MODIFIED — pipe constants, routing utility)
