# Story 13.10: Gardener Edge Components (Vines and Roots)

Status: not-started

## Story

**ID:** 13-10
**Key:** 13-10-gardener-edge-components
**Title:** Gardener Edge Components (Vines and Roots)
**Epic:** Epic 13 - One World, Two Skins
**Phase:** Epic 13-C: Gardener Skin
**Priority:** HIGH - Second half of the organism visual language

**As a** user,
**I want** calls rendered as vines and imports/inheritance as roots,
**So that** edge tiers keep their meaning (overhead vs underground) in the organic language.

**Spec Reference:** `docs/specs/2026-07-07-one-world-two-skins-design.md` — Semantic mapping table
**Visual Reference:** `docs/mockups/one-world-two-skins.html`

---

## Acceptance Criteria

- **AC-1:** `VineEdge` renders call edges overhead: winding CatmullRom curve (canopy-to-canopy), green organic material — same source/target/visibility semantics as `SkyEdge`
- **AC-2:** `RootEdge` renders imports/inheritance underground: same routing tier and depth logic as `UndergroundPipe` (reuse `classifyEdgeRouting`, `calculatePipeRoute`/`getPipeDepth` or shared extractions of them — no duplicated routing math)
- **AC-3:** Edge-type differentiation carries over: the distinctions `getWireMaterialType`/`WIRE_DASHED_TYPES` express in the city (e.g. dashed `composes`) have organic equivalents (e.g. segmented/knotted vine), driven by the same edge-type input
- **AC-4:** `GardenerOverhead` and `GardenerUnderground` orchestrators respect the same store toggles as the city (`undergroundVisible`, `externalPipesVisible`, edge-tier visibility controls) — toggle semantics are skin-agnostic
- **AC-5:** Gardener passes conformance harness edge cases; Architect-slot aliases from 13-9 are removed for Overhead/Underground
- **AC-6:** Unit tests: curve generation is deterministic per edge id; toggles gate rendering
- **AC-7:** All four CI checks pass

---

## Tasks/Subtasks

### Task 1: Extract shared edge routing (AC: 2)
- [ ] If `calculatePipeRoute`/`getPipeDepth`/`classifyEdgeRouting` are pipe-component-local, extract to a shared `edges/routing.ts` consumed by both skins (pure refactor, city tests stay green)

### Task 2: VineEdge + RootEdge (AC: 1, 2, 3, 6)
- [ ] `skins/gardener/VineEdge.tsx` — seeded winding curve, green material, dashed/knotted variant per edge type
- [ ] `skins/gardener/RootEdge.tsx` — pipe route reuse, root-brown material

### Task 3: Orchestrators + registry (AC: 4, 5)
- [ ] `GardenerOverhead`/`GardenerUnderground` with store-toggle gating identical to CitySky/CityUnderground
- [ ] Replace registry aliases; harness passes

### Task 4: Verify (AC: 7)
- [ ] All four CI checks

---

## Dev Notes

- Edge count is the perf hotspot (mermaid maxEdges lesson): vines use the same LOD-based edge-visibility filtering as sky wires — verify `isEdgeVisibleForLod` is applied in the shared path, not per-skin.

## Dependencies
- 13-9 (gardener structures for endpoints)
