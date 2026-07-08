# Story 13.6: Deterministic Layout Ordering

Status: not-started

## Story

**ID:** 13-6
**Key:** 13-6-deterministic-layout-ordering
**Title:** Deterministic Layout Ordering
**Epic:** Epic 13 - One World, Two Skins
**Phase:** Epic 13-B: Deterministic Semantic Layout
**Priority:** HIGH - "Same repo, same city" is the foundation of spatial memory

**As a** user,
**I want** the same repository to always produce the same city layout,
**So that** the world is memorable across sessions and shareable between people.

**Spec Reference:** `docs/specs/2026-07-07-one-world-two-skins-design.md` — Deterministic semantic placement

---

## Acceptance Criteria

- **AC-1:** All iteration over nodes/districts in the hierarchical layout path (`useCityLayout` → layout engines → `blockLayoutUtils`) uses stable ordering: sort by `metadata.path` then `id` before placement; no `Map`/`Object.keys` iteration order dependencies
- **AC-2:** Any randomized placement (jitter, tie-breaking) uses a seeded PRNG keyed by node id — no `Math.random()` in layout code (`grep -rn "Math.random" packages/ui/src/features/canvas/layout packages/ui/src/features/canvas/layouts` is empty)
- **AC-3:** Property test: running the layout twice on the conformance fixture graph yields byte-identical position maps; shuffling input node array order yields identical positions
- **AC-4:** E2E determinism check: import the same fixture repo twice → `window.__canvasStore` positions identical
- **AC-5:** All four CI checks pass

---

## Tasks/Subtasks

### Task 1: Audit ordering dependencies (AC: 1, 2)
- [ ] Grep layout code for `Math.random`, `Object.keys`, `Map` iteration, `Set` iteration; list each placement-affecting site
- [ ] Add `sortNodesForLayout(nodes)` utility (path-then-id comparator) and apply at every entry point

### Task 2: Seeded PRNG (AC: 2)
- [ ] Add `seededRandom(key: string)` (mulberry32 or xorshift over a string hash) in layout utils with unit tests
- [ ] Replace any `Math.random()` placement jitter

### Task 3: Determinism tests (AC: 3, 4)
- [ ] Unit: double-run equality + input-shuffle invariance on fixture graph
- [ ] E2E: double-import position equality via `window.__canvasStore`

### Task 4: Verify (AC: 5)
- [ ] All four CI checks

---

## Dev Notes

- Node positions come from the layout step (parser emits 0,0,0) — determinism work is entirely UI/layout-side; no parser changes.
- Sorting must happen before district assignment AND before within-block placement — both affect final coordinates.

## Dependencies
- 13-4 (single canonical rendering path)
