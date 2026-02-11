# Story 10.4: Extend Layout Types for Hierarchical Output

Status: not-started

## Story

**ID:** 10-4
**Key:** 10-4-hierarchical-layout-types
**Title:** Extend Layout Types for Hierarchical Output
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-A: Structural Refactoring (Phase 0)
**Priority:** HIGH - Type foundation for Phase 1 layout engine changes

**As a** developer implementing the two-phase layout engine,
**I want** hierarchical layout result types defined (BlockLayout, DistrictLayout, HierarchicalLayoutResult),
**So that** the layout engine can output structured block-and-children data consumed by CityBlocks.

---

## Acceptance Criteria

- **AC-1:** `BlockLayout` interface defines: fileId, position, footprint (width/depth), children array (nodeId + localPosition), isMerged flag
- **AC-2:** `DistrictLayout` interface defines: id, arc, blocks array, isCompound flag
- **AC-3:** `HierarchicalLayoutResult` extends `LayoutResult` with districts array and externalZones array
- **AC-4:** Flat `layoutPositions` map can be derived from hierarchical result (helper function)
- **AC-5:** TypeScript compiles with strict mode — all types are sound
- **AC-6:** Helper function `flattenHierarchicalLayout(result) → Map<string, Position3D>` has unit tests

---

## Tasks/Subtasks

### Task 1: Define hierarchical layout types (AC: 1, 2, 3, 5)
- [ ] Add to `packages/ui/src/features/canvas/layout/types.ts`:
  - `BlockLayout` interface
  - `DistrictLayout` interface
  - `HierarchicalLayoutResult` extending `LayoutResult`
- [ ] Ensure backward compatibility — existing `LayoutResult` unchanged

### Task 2: Implement flatten helper (AC: 4, 6)
- [ ] Create `flattenHierarchicalLayout(result: HierarchicalLayoutResult): Map<string, Position3D>`
- [ ] For each district → block → child: compute absolute position as `block.position + child.localPosition`
- [ ] Include block positions themselves (file nodes)
- [ ] Include external zone positions
- [ ] Unit test with nested hierarchies, merged blocks, compound districts

---

## Dev Notes

### Architecture & Patterns

**Backward compatibility:** The existing `LayoutResult` type and the flat `layoutPositions` map in the store remain the public API. `HierarchicalLayoutResult` is consumed only by `CityBlocks.tsx`. The `flattenHierarchicalLayout` helper bridges the two.

**Type design:** `localPosition` on children is relative to the block's origin. This allows the layout engine to compute child placement independently of block placement — the two phases are cleanly separable.

### Scope Boundaries

- **DO:** Define types and the flatten helper only
- **DO:** Write unit tests for the flatten helper
- **DO NOT:** Modify the layout engine (that's story 10-6)
- **DO NOT:** Modify the canvas store (that's story 10-5)

### References

- `packages/ui/src/features/canvas/layout/types.ts` — existing layout types
- Tech spec: `HierarchicalLayoutResult` definition

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
