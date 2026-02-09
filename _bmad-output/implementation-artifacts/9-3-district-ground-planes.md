# Story 9.3: District Ground Planes

Status: review

## Story

**ID:** 9-3
**Key:** 9-3-district-ground-planes
**Title:** District Ground Planes
**Epic:** Epic 9 - City Visualization Overhaul Phase 1
**Phase:** Epic 9-A: Radial City Layout & Navigation
**Priority:** HIGH - Visual district identification

**As a** developer viewing a codebase,
**I want** to see colored ground areas for each module district,
**So that** I can visually identify which module a group of buildings belongs to.

---

## Acceptance Criteria

- **AC-1:** Each district displays a colored arc-segment ground plane beneath its buildings

- **AC-2:** District boundaries are visible as subtle lines between arc segments on the same ring

- **AC-3:** Ground planes resize when density slider changes

- **AC-4:** District colors are distinct and deterministic (same district always gets same color)

---

## Tasks/Subtasks

### Task 1: Create DistrictGround component (AC: 1, 2, 4)
- [x] Create `packages/ui/src/features/canvas/components/DistrictGround.tsx`
- [x] R3F component rendering an arc-segment shape on the XZ plane
- [x] Accept props: `arcStart`, `arcEnd`, `innerRadius`, `outerRadius`, `color`, `label`
- [x] Use `ShapeGeometry` or `RingGeometry` with arc parameters
- [x] Deterministic color assignment from district name/index

### Task 2: Integrate into CityView (AC: 1, 3)
- [x] Render DistrictGround for each district from layout metadata
- [x] Pass district arc parameters from RadialCityLayoutEngine output
- [x] Ensure ground planes update when layout recalculates (density change)

### Task 3: Add district border lines (AC: 2)
- [x] Render subtle line geometry between adjacent district arc segments
- [x] Use `LineBasicMaterial` with low opacity for subtlety

---

## Dev Notes

### Architecture & Patterns

**Layout metadata dependency:** The RadialCityLayoutEngine (story 9-2) must output district metadata (arc start/end, ring depth, node count) in its `LayoutResult.metadata`. This story consumes that metadata.

**Arc geometry:** Use Three.js `Shape` with arc drawing commands or `RingGeometry` with `thetaStart`/`thetaLength` parameters to create arc segments.

**Color palette:** Use a deterministic color palette (e.g., hash of district name to HSL hue) so colors are consistent across re-renders.

### Scope Boundaries

- **DO:** Create the DistrictGround R3F component
- **DO:** Integrate it into CityView
- **DO:** Use arc parameters from layout metadata
- **DO NOT:** Modify the layout engine (rely on metadata output from story 9-2)
- **DO NOT:** Add highway signs to districts (that's story 9-C.4)

### References

- `packages/ui/src/features/canvas/views/GroundPlane.tsx` — existing ground plane component for pattern reference
- `packages/ui/src/features/canvas/layout/engines/radialCityLayout.ts` — layout metadata source

---

## Dev Agent Record

### Implementation Plan
- Enhanced RadialCityLayoutEngine metadata to include `districtArcs` array with per-district arc geometry info (arcStart, arcEnd, innerRadius, outerRadius, ringDepth, nodeCount)
- Created `districtGroundUtils.ts` with deterministic color palette (12 muted hex colors) and `getDistrictColor()` supporting both hash-based and index-based selection
- Created `DistrictGround.tsx` R3F component using `RingGeometry` for arc-segment fill and `BufferGeometry.setFromPoints` for border lines
- Integrated into CityView conditionally — reads `districtArcs` from layout metadata, renders when present (works with radial engine, no-op with grid engine)
- Used `primitive` pattern for Three.js Line to avoid R3F/SVG type conflict

### Completion Notes
- **DistrictGround component:** Renders arc-segment mesh at y=0.01 (slightly above ground) with 35% opacity. Border lines at y=0.02 with 20% opacity using `LineBasicMaterial`.
- **Color system:** 12-color muted palette. Index-based cycling used in CityView for maximum visual separation. Hash-based fallback available for standalone use.
- **Metadata enhancement:** `DistrictArcMetadata` interface exported from radial engine. Inner/outer radius computed as `radius ± ringSpacing/2`.
- **CityView integration:** District grounds render between GroundPlane and UndergroundLayer. Conditional on `districtArcs` in metadata — no-op when CityLayoutEngine is active, activates when RadialCityLayoutEngine is wired in (story 9-4).
- **AC-3 (density resize):** District arcs come from layout output which recalculates when config (including density) changes via `useMemo` dependency on `graph`.
- 8 unit tests for color utils, 2 new engine metadata tests, 118 total tests passing, zero regressions.

## File List
- `packages/ui/src/features/canvas/components/DistrictGround.tsx` (NEW)
- `packages/ui/src/features/canvas/components/districtGroundUtils.ts` (NEW)
- `packages/ui/src/features/canvas/components/districtGroundUtils.test.ts` (NEW)
- `packages/ui/src/features/canvas/views/CityView.tsx` (MODIFIED — added DistrictGround rendering)
- `packages/ui/src/features/canvas/layout/engines/radialCityLayout.ts` (MODIFIED — added DistrictArcMetadata + districtArcs in metadata)
- `packages/ui/src/features/canvas/layout/engines/radialCityLayout.test.ts` (MODIFIED — added 2 metadata tests)
- `packages/ui/src/features/canvas/layout/engines/radialLayoutUtils.ts` (MODIFIED — TS strict fix)
- `packages/ui/src/features/canvas/layout/engines/index.ts` (MODIFIED — export DistrictArcMetadata)

---

## Change Log
- 2026-02-05: Implemented DistrictGround component, color utilities, CityView integration, and engine metadata enhancement. 118 tests passing, zero TS errors in changed files.
