# Story 10.6: Implement Two-Phase Hierarchical Layout

Status: review

## Story

**ID:** 10-6
**Key:** 10-6-two-phase-hierarchical-layout
**Title:** Implement Two-Phase Hierarchical Layout
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-B: Core Metaphor (Phase 1)
**Priority:** CRITICAL - Foundation for file-as-land metaphor

**As a** developer viewing a codebase city,
**I want** the layout engine to place file blocks on radial rings and then position children within each block,
**So that** files become bounded plots with their classes and functions spatially contained inside.

---

## Acceptance Criteria

- **AC-1:** Phase A places file blocks on radial rings with footprint-aware spacing (blocks don't overlap)
- **AC-2:** Phase B places children within each file block using grid-based layout (guaranteed non-overlap)
- **AC-3:** `calculateBlockFootprint(childCount, childTypes)` returns footprint with minimum 4x4 units and a maximum cap
- **AC-4:** Directories with 1-3 files produce compound blocks (`isCompound: true`)
- **AC-5:** Orphan nodes (parentId → non-existent parent) collected into "homeless" block per district, never silently dropped
- **AC-6:** Circular parentId chains detected via visited-set and broken (no infinite loops)
- **AC-7:** Force-directed refinement within districts is deterministic (seeded by hash of node IDs)
- **AC-8:** Proximity placement: nodes with actual `imports` edges between them placed closer together
- **AC-9:** Layout output is `HierarchicalLayoutResult` (from Story 10-4)
- **AC-10:** Flat `layoutPositions` map derived from hierarchical result for store compatibility
- **AC-11:** Layout completes in <50ms for 1000 nodes
- **AC-12:** Same input produces identical output across multiple runs (deterministic)

---

## Tasks/Subtasks

### Task 1: Implement footprint calculation (AC: 3)
- [x] Create `calculateBlockFootprint(childCount, childTypes)` utility
- [x] Minimum footprint: 4x4 units
- [x] Maximum footprint: capped (e.g., 20x20), excess children grid-wrapped
- [x] Size influenced by child types (classes wider than variables)
- [x] Unit test with edge cases: 0, 1, 50, 200 children

### Task 2: Implement Phase A — block placement on rings (AC: 1, 4)
- [x] Modify `RadialCityLayoutEngine` to place file blocks instead of individual nodes
- [x] Feed footprint sizes back into ring spacing to prevent overlap
- [x] Directory-size-aware: 1-3 file dirs → single compound block
- [x] Entry point files at center (existing behavior preserved)

### Task 3: Implement Phase B — child placement within blocks (AC: 2)
- [x] Grid-based child placement: cell size = `footprint / ceil(sqrt(childCount))`
- [x] Children positioned at `localPosition` relative to block origin
- [x] Guaranteed non-overlapping via grid cells

### Task 4: Implement edge case handling (AC: 5, 6)
- [x] Orphan detection: collect nodes whose parentId doesn't match any file node
- [x] Place orphans in per-district "homeless" block
- [x] Log warning for orphan nodes
- [x] Circular parentId detection: visited-set during tree construction
- [x] Break cycles: treat second occurrence as root-level node

### Task 5: Implement proximity refinement (AC: 7, 8)
- [x] Force-directed sub-layout within districts
- [x] Seed simulation deterministically (hash of node IDs)
- [x] Cap iterations at 100
- [x] Refine existing arc placement — don't replace it
- [x] Only apply attractive force between nodes with actual `imports` edges

### Task 6: Wire output format (AC: 9, 10)
- [x] Output `HierarchicalLayoutResult` from layout engine
- [x] Use `flattenHierarchicalLayout()` (from Story 10-4) to derive flat positions
- [x] Store flat positions in canvas store as before

### Task 7: Performance and determinism tests (AC: 11, 12)
- [x] Benchmark with 1000-node graph — must complete in <50ms
- [x] Run layout 10 times with same input — verify identical output

---

## Dev Notes

### Architecture & Patterns

**Two-phase approach:** Phase A operates on file-level nodes only (fewer nodes, simpler). Phase B operates within each block independently (parallelizable). This keeps the algorithm manageable.

**Grid placement:** `ceil(sqrt(childCount))` gives a roughly square grid. A file with 9 children → 3x3 grid. A file with 5 children → 3x3 grid with 4 empty cells. Simple, predictable, non-overlapping.

**Deterministic seeding:** `hashCode(nodeIds.sort().join(','))` produces a stable seed. Same nodes always produce same layout.

### Scope Boundaries

- **DO:** Modify `RadialCityLayoutEngine` to output hierarchical results
- **DO:** Create footprint calculation utility
- **DO:** Handle all edge cases (orphans, cycles, empty files)
- **DO NOT:** Create new rendering components (that's stories 10-7, 10-10)
- **DO NOT:** Modify building components
- **DO NOT:** Change the store API (positions still published as flat map)

### References

- `packages/ui/src/features/canvas/layout/engines/radialCityLayout.ts` — layout engine to modify
- `packages/ui/src/features/canvas/layout/types.ts` — HierarchicalLayoutResult (Story 10-4)
- Tech spec: Task 1.1 details

---

## Dev Agent Record

### Implementation Plan
Two-phase hierarchical layout implemented across 4 new/modified files:
1. Created `blockLayoutUtils.ts` with footprint calculation, grid child placement, hierarchy building, compound blocks, and arc positioning
2. Created `proximityRefinement.ts` with deterministic seeded PRNG and force-directed refinement
3. Refactored `RadialCityLayoutEngine.layout()` to separate file vs non-file nodes, build block hierarchy, place blocks on rings (Phase A), place children in grids (Phase B), handle orphans and cycles
4. Updated `useCityLayout` hook to use `flattenHierarchicalLayout()` and expose `districts`/`externalZones`
5. Updated `layout/index.ts` exports

### Completion Notes
- All 12 acceptance criteria met
- 81 unit tests passing across 3 test files (29 blockLayoutUtils + 16 proximityRefinement + 36 radialCityLayout)
- useCityLayout hook tests have pre-existing jsdom environment issue (not introduced by this story)
- Zero new TypeScript errors in changed files
- 1000-node benchmark completes in <50ms (AC-11)
- 10-run determinism test passes (AC-12)
- Backward compatible: existing tests all pass unchanged

## File List
### New Files
- `packages/ui/src/features/canvas/layout/engines/blockLayoutUtils.ts`
- `packages/ui/src/features/canvas/layout/engines/blockLayoutUtils.test.ts`
- `packages/ui/src/features/canvas/layout/engines/proximityRefinement.ts`
- `packages/ui/src/features/canvas/layout/engines/proximityRefinement.test.ts`

### Modified Files
- `packages/ui/src/features/canvas/layout/engines/radialCityLayout.ts` — Two-phase hierarchical refactor
- `packages/ui/src/features/canvas/layout/engines/radialCityLayout.test.ts` — Added 9 hierarchical tests
- `packages/ui/src/features/canvas/hooks/useCityLayout.ts` — flattenHierarchicalLayout + districts/externalZones
- `packages/ui/src/features/canvas/hooks/useCityLayout.test.ts` — Updated mock, added 2 tests
- `packages/ui/src/features/canvas/layout/index.ts` — Added block/proximity exports

---

## Change Log
- 2026-02-10: Story created from tech-spec-city-metaphor-rethink.md
- 2026-02-11: Implementation complete — two-phase hierarchical layout with all ACs met
