# Story 13.9: Gardener Node Components

Status: not-started

## Story

**ID:** 13-9
**Key:** 13-9-gardener-node-components
**Title:** Gardener Node Components (Trees, Saplings, Groves)
**Epic:** Epic 13 - One World, Two Skins
**Phase:** Epic 13-C: Gardener Skin
**Priority:** HIGH - First half of the organism visual language

**As a** user,
**I want** every node kind rendered in an organic language (trees, saplings, groves),
**So that** the Gardener skin is a complete alternative to buildings — same positions, same data.

**Spec Reference:** `docs/specs/2026-07-07-one-world-two-skins-design.md` — Semantic mapping table
**Visual Reference:** `docs/mockups/one-world-two-skins.html` (Gardener toggle)

---

## Acceptance Criteria

- **AC-1:** `skins/gardener/` provides node components covering every kind the Architect skin renders: `Tree` (class), `OldGrowthTree` (base class — wider trunk, larger canopy, warm bark palette), `Sapling` (standalone function), `WireframeTree` or pale-birch variant (interface), `AbstractTree` variant (abstract class), `SeedCrate` equivalents for variable/enum (small mounds/stones), grove soil bed (file block), district soil arc (folder)
- **AC-2:** Each component consumes the same layout data as its Architect counterpart: position from the shared layout, footprint scale, containment height mapped to trunk height + canopy density (`getContainmentHeight` reused — no gardener-specific height math)
- **AC-3:** Canopy density encodes method count: leaf-cluster count = method count (capped at the same cap the city uses for rooms)
- **AC-4:** Geometry is instancing-friendly: shared `SphereGeometry`/`CylinderGeometry` instances reused across trees (pattern from the 3D-performance-LOD work); no per-leaf geometry allocation
- **AC-5:** `gardenerSkin.Structures` renders the conformance fixture graph — enrolls in the 13-5 harness and passes render-safety cases
- **AC-6:** Unit tests co-located per component (type-switch coverage mirroring `CityBlocks` type routing)
- **AC-7:** All four CI checks pass

---

## Tasks/Subtasks

### Task 1: Geometry utilities (AC: 2, 3, 4)
- [ ] `skins/gardener/treeGeometry.ts`: deterministic branch/leaf layout from node id seed (reuse 13-6 `seededRandom`), trunk height from `getContainmentHeight`, canopy cluster count from method count — pure functions, unit tested

### Task 2: Node components (AC: 1, 2, 6)
- [ ] `Tree`, `OldGrowthTree`, `Sapling`, interface/abstract variants, variable/enum ground features, `GroveBed`, district soil arc
- [ ] `GardenerStructures` orchestrator mirroring CityBlocks' type-switched routing

### Task 3: Register skin (AC: 5)
- [ ] Add `gardenerSkin` to the registry with `Structures` real, other slots temporarily aliasing Architect's (replaced in 13-10/13-11)
- [ ] Conformance harness passes for gardener Structures

### Task 4: Verify (AC: 7)
- [ ] All four CI checks

---

## Dev Notes

- Deterministic per-node seeding matters: the same class must grow the same tree every session.
- Reuse the LOD hooks as-is — trees respect the same `lodLevel` visibility rules as buildings (signs/labels come free via existing sign system if positions match).
- Aliasing Architect slots during this story keeps the skin registrable without blocking on 13-10/13-11; the toggle UI (13-12) does NOT ship until aliases are gone.

## Dependencies
- 13-4 (skin seam), 13-5 (harness), 13-6 (seeded PRNG)
