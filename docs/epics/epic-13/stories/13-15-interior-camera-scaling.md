# Story 13.15: Interior Camera Scaling

Status: not-started

## Story

**ID:** 13-15
**Key:** 13-15-interior-camera-scaling
**Title:** Interior Camera Scaling (Near-Plane and Movement Speed)
**Epic:** Epic 13 - One World, Two Skins
**Phase:** Epic 13-D: Continuous World
**Priority:** MEDIUM - Makes "walking into a room" feel right

**As a** user inside a structure,
**I want** camera movement speed and near-plane to scale down with proximity,
**So that** small interior spaces feel walkable instead of clip-through-able.

**Spec Reference:** `docs/specs/2026-07-07-one-world-two-skins-design.md` — Phase 4 / camera-side scale solution

---

## Acceptance Criteria

- **AC-1:** Pure function `interiorCameraParams(distanceToNearestStructure): { near, moveSpeed, zoomSpeed }` — logarithmic ramp from city defaults (current values) down to interior values (near plane small enough that method rooms never clip at touching distance); unit tested at city/threshold/interior distances
- **AC-2:** Camera controls consume the params reactively; transition is continuous (no snapping) as distance changes
- **AC-3:** No z-fighting or near-plane clipping artifacts inside a building on the medium fixture (manual verification checklist in the story + E2E camera-position assertions where possible)
- **AC-4:** City-scale navigation is unaffected when far from structures (params return exact current defaults beyond the outer threshold — regression-tested)
- **AC-5:** Works identically in both skins (conformance case: params are skin-independent)
- **AC-6:** All four CI checks pass

---

## Tasks/Subtasks

### Task 1: Params function (AC: 1, 4)
- [ ] `interiorCameraParams` + tests (log ramp, exact defaults beyond threshold)

### Task 2: Controls integration (AC: 2, 3)
- [ ] Wire into the camera controls layer (reuse `nearestNodeId`-style distance tracking from the Basic3D work if a nearest-structure distance already exists; otherwise compute from layout bounds)
- [ ] `camera.updateProjectionMatrix()` on near-plane changes, throttled

### Task 3: Verify (AC: 5, 6)
- [ ] Conformance case; manual interior walkthrough; all four CI checks

---

## Dev Notes

- Cheap distance source: reuse the LOD controller's camera-distance computation rather than a new spatial query — it already runs per-frame-ish at the right cadence.
- Watch `exactOptionalPropertyTypes` when threading optional camera params (conditional spread pattern).

## Dependencies
- 13-14 (interiors exist to walk into)
