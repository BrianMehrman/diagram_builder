# Story 13.14: Membrane Crossing and Per-Skin Interiors

Status: not-started

## Story

**ID:** 13-14
**Key:** 13-14-membrane-interiors
**Title:** Membrane Crossing and Per-Skin Interiors
**Epic:** Epic 13 - One World, Two Skins
**Phase:** Epic 13-D: Continuous World
**Priority:** HIGH - The vision's threshold moment, in the one world

**As a** user flying toward a class,
**I want** its walls to go translucent and its interior to fade in as I cross the envelope,
**So that** entering a structure is a distinct, smooth threshold — not a cut.

**Spec Reference:** `docs/specs/2026-07-07-one-world-two-skins-design.md` — Phase 4; original vision `ux-3d-layout-vision.md` Level 3

---

## Acceptance Criteria

- **AC-1:** `SceneSkin` gains an `Interior` slot: `{ node: IVMNode; graph: IVMGraph; crossFade: number }` rendered inside a structure's envelope when camera proximity < threshold
- **AC-2:** Architect Interior = existing method rooms (Epic 11-2/11-3 components reused at their world positions); Gardener Interior = leaf-cluster detail (each method's leaf cluster resolves into distinct labeled foliage)
- **AC-3:** Membrane crossing: as camera distance to envelope shrinks, wall opacity ramps down and interior crossFade ramps up using `getLodTransition()`-style curves; crossing the surface completes the transition — no popping (crossfade unit-tested as a pure function of distance)
- **AC-4:** X-ray mode reuses the same Interior slot rendered at full crossFade from outside — one interior implementation per skin serves both membrane and x-ray
- **AC-5:** Interiors render ONLY for structures within interior LOD range (no whole-city interior cost); perf: medium fixture repo maintains the existing FPS budget from the LOD perf work
- **AC-6:** Conformance harness gains Interior cases (renders per skin, empty-methods class renders empty interior safely)
- **AC-7:** All four CI checks pass

---

## Tasks/Subtasks

### Task 1: Interior slot + crossfade math (AC: 1, 3)
- [ ] Extend `SceneSkin`; pure `membraneCrossFade(distanceToEnvelope): { wallOpacity, interiorFade }` with tests

### Task 2: Architect interior (AC: 2, 4)
- [ ] Adapt MethodRoom rendering into `ArchitectInterior`; wire x-ray to the slot

### Task 3: Gardener interior (AC: 2)
- [ ] `GardenerInterior` — per-method foliage detail using treeGeometry clusters

### Task 4: Gating + perf + harness (AC: 5, 6, 7)
- [ ] Proximity gating; FPS check on medium fixture; harness cases; all four CI checks

---

## Dev Notes

- Epic 8's membrane-threshold-transition (8-13) was built for the old scene-swap world — mine it for the opacity-ramp shader/material approach, but the state machine is replaced by the pure distance function.
- The vision's full organic "organelle" language (blobs/crystals/receptors by element type) is deliberately scoped OUT here — method-level interiors first. File a follow-up epic if organelle-level (statements/variables) detail is still wanted after using this.

## Dependencies
- 13-13 (derived viewMode, scene swap gone)
