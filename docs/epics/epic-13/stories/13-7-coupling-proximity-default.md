# Story 13.7: Coupling-Driven Proximity as the Placement Rule

Status: not-started

## Story

**ID:** 13-7
**Key:** 13-7-coupling-proximity-default
**Title:** Coupling-Driven Proximity as the Placement Rule
**Epic:** Epic 13 - One World, Two Skins
**Phase:** Epic 13-B: Deterministic Semantic Layout
**Priority:** HIGH - Makes position mean something ("layout communicates")

**As a** user,
**I want** strongly-coupled files/classes placed near each other within their district,
**So that** physical distance in the city reads as architectural distance in the code.

**Spec Reference:** `docs/specs/2026-07-07-one-world-two-skins-design.md` — Deterministic semantic placement

---

## Acceptance Criteria

- **AC-1:** `proximityRefinement` (in `layout/engines/proximityRefinement.ts`) runs as a standard stage of the hierarchical city layout — not an optional pass
- **AC-2:** Coupling weight = count of `imports` + `calls` edges between two file blocks (both directions summed)
- **AC-3:** Within a district, mean edge length between coupled blocks is measurably lower than uncoupled pairs on the medium fixture repo (`tests/fixtures/repositories/medium-ts-repo/`) — assert ratio < 0.8 in a layout-quality test
- **AC-4:** Refinement is deterministic (uses 13-6 ordering + seeded PRNG) — double-run equality test stays green
- **AC-5:** Layout compute time for the medium fixture stays under 2× the pre-refinement baseline (record baseline in the test)
- **AC-6:** All four CI checks pass

---

## Tasks/Subtasks

### Task 1: Wire refinement into the pipeline (AC: 1, 2)
- [ ] Read current `proximityRefinement.ts` contract; extend weights to imports+calls if it only counts one
- [ ] Call it unconditionally from the hierarchical layout after initial ring placement

### Task 2: Quality + determinism tests (AC: 3, 4)
- [ ] Layout-quality test comparing coupled vs uncoupled mean distances on medium fixture
- [ ] Re-run 13-6 determinism tests

### Task 3: Perf guard (AC: 5)
- [ ] Time layout on medium fixture before/after; assert budget in test (skip-able in CI via env if flaky)

### Task 4: Verify (AC: 6)
- [ ] All four CI checks

---

## Dev Notes

- Don't chase optimal graph layout — a single swap-based refinement pass that provably beats random adjacency is enough. YAGNI on simulated annealing.
- District membership (folder = district) is fixed BEFORE refinement; refinement only reorders within a district.

## Dependencies
- 13-6 (deterministic substrate to refine on)
