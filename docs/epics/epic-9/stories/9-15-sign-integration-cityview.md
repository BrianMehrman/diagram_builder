# Story 9.15: Sign Integration in CityView

Status: done

## Story

**ID:** 9-15
**Key:** 9-15-sign-integration-cityview
**Title:** Sign Integration in CityView
**Epic:** Epic 9 - City Visualization Overhaul Phase 1
**Phase:** Epic 9-C: Signage System & Progressive Labels
**Priority:** HIGH - Wires signs into the city rendering

**As a** developer viewing a codebase,
**I want** contextual signs attached to buildings throughout the city,
**So that** I can read code names, access levels, and statuses at appropriate zoom levels.

---

## Acceptance Criteria

- **AC-1:** Class buildings have hanging signs with class name
- **AC-2:** Public function buildings have neon signs; private functions have brass plaques
- **AC-3:** District ground planes have highway signs at boundaries with module/directory name
- **AC-4:** Exported nodes have marquee signs
- **AC-5:** LOD 1 (city): only highway signs visible
- **AC-6:** LOD 2 (district): highway + hanging + neon signs visible
- **AC-7:** LOD 3 (neighborhood): all except construction signs visible
- **AC-8:** LOD 4 (street): all signs visible including construction (deprecated)

---

## Tasks/Subtasks

### Task 1: Attach signs to buildings (AC: 1, 2, 4)
- [x] Update CityView rendering loop
- [x] For each node, use `getSignType()` to determine sign type
- [x] Render appropriate sign component via `renderSign()` helper
- [x] Position sign above building using `getBuildingConfig(node).geometry.height + 1.5`

### Task 2: Attach highway signs to districts (AC: 3)
- [x] Render HighwaySign at each district arc boundary
- [x] Use last path segment of district name as sign text
- [x] Position at arc midpoint on outer edge of district ground plane (outerRadius + 1, y=1.5)

### Task 3: Wire LOD visibility (AC: 5-8)
- [x] Read `lodLevel` from store (already subscribed)
- [x] Pass to `getSignVisibility(signType, lodLevel)` for each sign
- [x] Set sign `visible` prop — signs with `visible={false}` return null (zero render cost)

---

## Dev Notes

### Architecture & Patterns

**Sign as child of building:** Each sign is rendered as a child `<group>` within the building's parent group. This means the sign moves with the building and inherits its transform.

**Sign positioning:** Signs are positioned relative to their parent building. A hanging sign goes slightly above the building's top. A brass plaque goes on the front face. Highway signs are at district edges, not attached to buildings.

**LOD-driven rendering:** The lodLevel from the store drives visibility. At LOD 1, most signs have `visible={false}` which prevents React Three Fiber from adding them to the scene graph — no render cost.

### Scope Boundaries

- **DO:** Wire sign components into CityView
- **DO:** Use sign utilities for type selection and visibility
- **DO:** Handle all LOD levels
- **DO NOT:** Modify sign components themselves
- **DO NOT:** Modify the LOD calculator
- **DO NOT:** Add infrastructure landmarks (that's Epic 9-D)

### References

- `packages/ui/src/features/canvas/views/CityView.tsx` — main integration point
- `packages/ui/src/features/canvas/components/signs/` — sign components from story 9-13
- `packages/ui/src/features/canvas/components/signs/signUtils.ts` — utilities from story 9-12
- `packages/ui/src/features/canvas/store.ts` — lodLevel state

---

## Dev Agent Record

### Implementation Plan
- Created `renderSign.tsx` helper that maps `SignType` to the correct component
- Added sign rendering in CityView's internal building loop (above each building)
- Added highway signs at district arc midpoints
- All signs LOD-controlled via `getSignVisibility(signType, lodLevel)`

### Completion Notes
- **Building signs:** Each internal file node gets a sign above it. Sign type determined by `getSignType(node)` — classes get hanging signs, public nodes get neon, etc. Positioned at `building height + 1.5` offset.
- **District highway signs:** One highway sign per district arc, positioned at arc midpoint angle on the outer radius edge. Uses last path segment as label.
- **LOD control:** `lodLevel` from store drives `getSignVisibility()`. LOD 1 shows only highway signs. LOD 4 shows everything.
- **X-Ray mode:** Signs are skipped during X-Ray mode (X-Ray building path runs before sign rendering).
- **renderSign helper:** Clean switch on `SignType` returns the correct component. Added to signs barrel export.
- Zero TS errors, 1073 total tests passing, zero regressions.

## File List
- `packages/ui/src/features/canvas/components/signs/renderSign.tsx` (NEW — sign type → component mapper)
- `packages/ui/src/features/canvas/components/signs/index.ts` (MODIFIED — added renderSign export)
- `packages/ui/src/features/canvas/views/CityView.tsx` (MODIFIED — sign imports, building signs, district highway signs)

---

## Change Log
- 2026-02-06: Wired signs into CityView with LOD visibility. Building signs above each node, highway signs at district boundaries. Zero TS errors, zero regressions.
