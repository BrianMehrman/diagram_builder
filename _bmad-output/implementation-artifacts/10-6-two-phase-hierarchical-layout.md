# Story 10.6: Implement Two-Phase Hierarchical Layout

Status: not-started

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
- [ ] Create `calculateBlockFootprint(childCount, childTypes)` utility
- [ ] Minimum footprint: 4x4 units
- [ ] Maximum footprint: capped (e.g., 20x20), excess children grid-wrapped
- [ ] Size influenced by child types (classes wider than variables)
- [ ] Unit test with edge cases: 0, 1, 50, 200 children

### Task 2: Implement Phase A — block placement on rings (AC: 1, 4)
- [ ] Modify `RadialCityLayoutEngine` to place file blocks instead of individual nodes
- [ ] Feed footprint sizes back into ring spacing to prevent overlap
- [ ] Directory-size-aware: 1-3 file dirs → single compound block
- [ ] Entry point files at center (existing behavior preserved)

### Task 3: Implement Phase B — child placement within blocks (AC: 2)
- [ ] Grid-based child placement: cell size = `footprint / ceil(sqrt(childCount))`
- [ ] Children positioned at `localPosition` relative to block origin
- [ ] Guaranteed non-overlapping via grid cells

### Task 4: Implement edge case handling (AC: 5, 6)
- [ ] Orphan detection: collect nodes whose parentId doesn't match any file node
- [ ] Place orphans in per-district "homeless" block
- [ ] Log warning for orphan nodes
- [ ] Circular parentId detection: visited-set during tree construction
- [ ] Break cycles: treat second occurrence as root-level node

### Task 5: Implement proximity refinement (AC: 7, 8)
- [ ] Force-directed sub-layout within districts
- [ ] Seed simulation deterministically (hash of node IDs)
- [ ] Cap iterations at 100
- [ ] Refine existing arc placement — don't replace it
- [ ] Only apply attractive force between nodes with actual `imports` edges

### Task 6: Wire output format (AC: 9, 10)
- [ ] Output `HierarchicalLayoutResult` from layout engine
- [ ] Use `flattenHierarchicalLayout()` (from Story 10-4) to derive flat positions
- [ ] Store flat positions in canvas store as before

### Task 7: Performance and determinism tests (AC: 11, 12)
- [ ] Benchmark with 1000-node graph — must complete in <50ms
- [ ] Run layout 10 times with same input — verify identical output

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
_To be filled during implementation_

### Completion Notes
_To be filled on completion_

## File List
_To be filled during implementation_

---

## Change Log
- 2026-02-10: Story created from tech-spec-city-metaphor-rethink.md
