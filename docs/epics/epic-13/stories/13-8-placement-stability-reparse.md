# Story 13.8: Placement Stability Across Re-Parses

Status: not-started

## Story

**ID:** 13-8
**Key:** 13-8-placement-stability-reparse
**Title:** Placement Stability Across Re-Parses
**Epic:** Epic 13 - One World, Two Skins
**Phase:** Epic 13-B: Deterministic Semantic Layout
**Priority:** MEDIUM - Keeps the city memorable as code evolves

**As a** user re-importing a codebase after changes,
**I want** unchanged files/classes to keep their previous positions,
**So that** my spatial memory of the city survives code evolution.

**Spec Reference:** `docs/specs/2026-07-07-one-world-two-skins-design.md` — Deterministic semantic placement / stable across re-parses

---

## Acceptance Criteria

- **AC-1:** A `PlacementMemory` module persists node placements keyed by stable identity (`metadata.path` + node name), stored per-repository (localStorage keyed by repo rootPath is sufficient for this story)
- **AC-2:** On layout, nodes present in memory keep their district and block slot; only new/removed nodes trigger local reflow within affected blocks
- **AC-3:** Adding one new file to the medium fixture and re-laying-out moves ≤ 10% of pre-existing node positions (stability test)
- **AC-4:** Deleting placement memory (or a schema version bump) falls back cleanly to fresh deterministic layout — no errors, no mixed state
- **AC-5:** Memory writes are capped (~500KB) with oldest-repo eviction; corrupt/unparseable stored JSON is discarded silently
- **AC-6:** All four CI checks pass

---

## Tasks/Subtasks

### Task 1: PlacementMemory module (AC: 1, 4, 5)
- [ ] `layout/placementMemory.ts`: `load(rootPath)`, `save(rootPath, positions)`, `SCHEMA_VERSION`, size cap + eviction, corrupt-data guard — all unit tested

### Task 2: Layout integration (AC: 2)
- [ ] Hierarchical layout consults memory before assigning slots; pins known nodes, places new nodes in remaining/appended slots
- [ ] Save updated placements after successful layout

### Task 3: Stability tests (AC: 3, 4)
- [ ] Test: fixture graph + memory → +1 file re-layout moves ≤ 10% of prior nodes
- [ ] Test: schema bump → fresh layout without error

### Task 4: Verify (AC: 6)
- [ ] All four CI checks

---

## Dev Notes

- Server-side persistence (Neo4j position storage via the existing position-update API) is a later enhancement; localStorage keeps this story UI-only. Note it in the epic when picking this up if collaboration needs shared stability sooner.
- Pinning can create district overflow (more pinned nodes than ring slots) — allow blocks to extend the outer ring rather than reshuffling everything.

## Dependencies
- 13-6, 13-7 (stable base layout to remember)
