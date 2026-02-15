# Story 10.13: Create GroundShadow Component

Status: review

## Story

**ID:** 10-13
**Key:** 10-13-ground-shadow-component
**Title:** Create GroundShadow Component
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-C: Sky Layer (Phase 2)
**Priority:** HIGH - Discoverability for sky edges

**As a** developer navigating the city at ground level,
**I want** semi-transparent shadow lines on the ground below sky edges,
**So that** I can discover dependency connections without looking up.

---

## Acceptance Criteria

- **AC-1:** For each visible SkyEdge, renders its orthographic projection on Y=0 plane
- **AC-2:** Shadow vertices = arc vertices with Y set to 0 (always aligned regardless of camera)
- **AC-3:** Rendered as semi-transparent line (opacity 0.2-0.3)
- **AC-4:** Visible at LOD 2+ (same gating as SkyEdge)
- **AC-5:** In transit map mode, shadows become fully opaque
- **AC-6:** Co-located unit tests

---

## Tasks/Subtasks

### Task 1: Create GroundShadow component (AC: 1, 2, 3)
- [x] Create `packages/ui/src/features/canvas/components/GroundShadow.tsx`
- [x] Accept same curve points as parent SkyEdge
- [x] Project all points to Y=0
- [x] Render as line with low opacity material

### Task 2: Implement visibility and mode (AC: 4, 5)
- [x] Gate visibility by LOD level (same as SkyEdge)
- [x] Read `transitMapMode` from store — if active, set opacity to 1.0

### Task 3: Write tests (AC: 6)
- [x] Test: all shadow Y coordinates are 0
- [x] Test: opacity is 0.2-0.3 in normal mode
- [x] Test: opacity is 1.0 in transit map mode

---

## Dev Notes

### Architecture & Patterns

**Orthographic projection is trivial:** Copy the SkyEdge curve points, set all Y values to 0. This guarantees perfect alignment regardless of camera angle — no perspective distortion.

### Scope Boundaries

- **DO:** Create the shadow visual component
- **DO NOT:** Modify SkyEdge (companion, not modification)

### References

- Story 10-12: SkyEdge component (provides curve data)
- Story 10-5: `transitMapMode` store state

---

## Dev Agent Record

### Implementation Plan
- Mirrors SkyEdge's bezier curve construction but projects all Y to ground (0.01 to avoid z-fighting)
- Reuses `isSkyEdgeVisible` for LOD/tier gating — identical visibility rules
- Reads `transitMapMode` from store for opacity switching (0.25 normal, 1.0 transit)
- Uses `depthWrite: false` to prevent z-fighting with district ground planes
- Uses `<primitive object={THREE.Line}>` pattern (same as SkyEdge) to avoid R3F SVG conflicts

### Completion Notes
- All 9 tests passing (visibility gating, ground projection, opacity, color)
- No new TypeScript errors introduced
- Component is a companion to SkyEdge — does not modify SkyEdge at all

## File List
- `packages/ui/src/features/canvas/components/GroundShadow.tsx` (NEW)
- `packages/ui/src/features/canvas/components/GroundShadow.test.ts` (NEW)

---

## Change Log
- 2026-02-10: Story created from tech-spec-city-metaphor-rethink.md
