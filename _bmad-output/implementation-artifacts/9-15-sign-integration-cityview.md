# Story 9.15: Sign Integration in CityView

Status: not-started

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
- [ ] Update CityView rendering loop
- [ ] For each node, use `getSignType()` from story 9-12 to determine sign type
- [ ] Render appropriate sign component as child of building mesh
- [ ] Position sign above or beside the building (offset from building top)

### Task 2: Attach highway signs to districts (AC: 3)
- [ ] Render HighwaySign at each district boundary
- [ ] Use district name/directory as sign text
- [ ] Position at edge of district ground plane

### Task 3: Wire LOD visibility (AC: 5-8)
- [ ] Read `lodLevel` from store
- [ ] Pass to `getSignVisibility()` from story 9-12
- [ ] Set sign `visible` prop based on result
- [ ] Signs with `visible={false}` skip rendering entirely

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
_To be filled during implementation_

---

## Change Log
_To be filled during implementation_
