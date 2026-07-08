# Story 13.5: Skin Conformance Test Harness

Status: not-started

## Story

**ID:** 13-5
**Key:** 13-5-skin-conformance-harness
**Title:** Skin Conformance Test Harness
**Epic:** Epic 13 - One World, Two Skins
**Phase:** Epic 13-A: Skin Seam
**Priority:** HIGH - Defines "done" objectively for every future skin

**As a** developer,
**I want** a parameterized test suite that runs identical assertions against every registered skin,
**So that** a new skin (Gardener, or a future wireframe) must meet the same bar as the city to ship.

**Spec Reference:** `docs/specs/2026-07-07-one-world-two-skins-design.md` — Testing strategy

---

## Acceptance Criteria

- **AC-1:** `packages/ui/src/features/canvas/skins/skinConformance.test.tsx` iterates `Object.values(skins)` — adding a skin to the registry automatically enrolls it
- **AC-2:** Per skin, the suite asserts: every slot renders without throwing against a fixture graph containing **all node kinds** (file, class, interface, abstract_class, enum, function, variable, external) and **both edge tiers** (calls overhead; imports/extends/implements underground)
- **AC-3:** Per skin: slots render without throwing on an **empty graph** (no nodes/edges)
- **AC-4:** Per skin: `Ground` renders with `opacity` 0, 0.5, and 1
- **AC-5:** Architect skin passes the full suite (baseline)
- **AC-6:** The fixture graph is exported from a shared module (`skins/conformanceFixtures.ts`) so Playwright E2E can reuse the same shape later
- **AC-7:** All four CI checks pass

---

## Tasks/Subtasks

### Task 1: Conformance fixture (AC: 2, 6)
- [ ] Build `conformanceFixtures.ts` with a valid `IVMGraph` — every node kind, both edge tiers
- [ ] Respect required IVM fields: `IVMNode` (id, type, lod, position, metadata.label, metadata.path), `IVMEdge` (id, source, target, type, lod, metadata), `GraphMetadata` (name, schemaVersion, generatedAt, rootPath, stats, languages), `IVMGraph` (nodes, edges, metadata, bounds)

### Task 2: Parameterized suite (AC: 1, 2, 3, 4)
- [ ] `describe.each(Object.values(skins))` over slots × fixtures (full graph, empty graph, ground opacities)
- [ ] Reuse the R3F/drei mocking pattern from `CityView.test.tsx`

### Task 3: Baseline + verify (AC: 5, 7)
- [ ] Architect passes; fix any real defects it exposes (missing null guards on empty graphs are likely)
- [ ] All four CI checks

---

## Dev Notes

- Selection/fly-to/LOD-distance conformance assertions are added in 13-12 when the toggle exists — this story establishes the render-safety baseline first. Keep the harness structured so behavioral cases append cleanly.
- When 13-9/13-10 land, Gardener enrolls automatically and MUST pass before 13-12 ships the toggle.

## Dependencies
- 13-2 (registry), 13-4 (skin actually consumed)
