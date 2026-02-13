# Story 10.11: Implement Configurable Height Encoding

Status: review

## Story

**ID:** 10-11
**Key:** 10-11-configurable-height-encoding
**Title:** Implement Configurable Height Encoding
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-B: Core Metaphor (Phase 1)
**Priority:** MEDIUM - Enhances skyline diagnostic value

**As a** developer analyzing a codebase,
**I want** to switch what building height represents (method count, dependencies, LOC, complexity, churn),
**So that** the city skyline answers different architectural questions based on my current concern.

---

## Acceptance Criteria

- **AC-1:** Height reads from `citySettings.heightEncoding` in store
- **AC-2:** `methodCount` (default): `log2(methodCount + 1) * FLOOR_HEIGHT`
- **AC-3:** `dependencies`: `log2(incomingEdgeCount + 1) * FLOOR_HEIGHT`
- **AC-4:** `loc`: `log2(loc / 50 + 1) * FLOOR_HEIGHT` (normalized)
- **AC-5:** `complexity`: `log2(complexity + 1) * FLOOR_HEIGHT`
- **AC-6:** `churn`: requires git data, graceful fallback to methodCount if unavailable
- **AC-7:** Changing encoding triggers layout recalculation — building heights update within 100ms
- **AC-8:** Unit tests for each encoding formula

---

## Tasks/Subtasks

### Task 1: Extend height calculation utility (AC: 1-6)
- [x] Modify `calculateBuildingHeight(node, encoding)` to accept encoding parameter
- [x] Implement formula for each encoding type
- [x] Handle missing data gracefully (fallback to methodCount)

### Task 2: Wire encoding to rendering (AC: 7)
- [x] Building components read `heightEncoding` from store
- [x] Height recalculated when encoding changes
- [x] Floor bands adjust to new height (log-scaled for all encodings)

### Task 3: Write unit tests (AC: 8)
- [x] Test each encoding formula with sample data
- [x] Test fallback when data missing (e.g., no complexity score)
- [x] Test height update speed (<100ms)

---

## Dev Notes

### Scope Boundaries

- **DO:** Implement height encoding logic in building components
- **DO NOT:** Add the UI dropdown control (that's story 10-23)
- **DO NOT:** Modify the layout engine — height is a rendering concern

### References

- Story 10-8: `calculateBuildingHeight` utility
- Story 10-5: `citySettings.heightEncoding` store state
- `packages/ui/src/shared/types/graph.ts` — GraphNode metadata fields

---

## Dev Agent Record

### Implementation Plan
1. Added `getEncodedHeight` dispatch function and `buildIncomingEdgeCounts` helper to `cityViewUtils.ts`
2. Extended `getBuildingConfig` to accept optional `EncodedHeightOptions` parameter
3. Updated `ClassBuildingProps` with optional `encodingOptions`
4. Updated ClassBuilding, AbstractBuilding, InterfaceBuilding to pass `encodingOptions` through to `getBuildingConfig`
5. Wired encoding through `CityBlocks`: reads `heightEncoding` from store, precomputes edge counts, builds per-node encoding options, passes to all rendering call sites
6. Added 18 new tests across cityViewUtils and buildingGeometry test files

### Completion Notes
- All encoding formulas use `log2(metric + 1) * FLOOR_HEIGHT` with graceful fallback to `getMethodBasedHeight` when data missing
- `loc` encoding normalizes by dividing by 50 before log scaling
- Encoding is reactive — changing `heightEncoding` in store triggers re-render with new heights
- No new type errors introduced; all pre-existing errors unchanged

## File List
### Modified
- `packages/ui/src/features/canvas/views/cityViewUtils.ts` — Added `getEncodedHeight`, `buildIncomingEdgeCounts`, types
- `packages/ui/src/features/canvas/views/cityViewUtils.test.ts` — 18 new tests for encoding + edge counts
- `packages/ui/src/features/canvas/components/buildingGeometry.ts` — `getBuildingConfig` accepts `EncodedHeightOptions`
- `packages/ui/src/features/canvas/components/buildingGeometry.test.ts` — 5 new encoding integration tests
- `packages/ui/src/features/canvas/components/buildings/types.ts` — Added `encodingOptions` to `ClassBuildingProps`
- `packages/ui/src/features/canvas/components/buildings/ClassBuilding.tsx` — Passes `encodingOptions` to `getBuildingConfig`
- `packages/ui/src/features/canvas/components/buildings/AbstractBuilding.tsx` — Same encoding pass-through
- `packages/ui/src/features/canvas/components/buildings/InterfaceBuilding.tsx` — Same encoding pass-through
- `packages/ui/src/features/canvas/views/CityBlocks.tsx` — Reads `heightEncoding`, computes edge counts, passes encoding to all call sites

---

## Change Log
- 2026-02-10: Story created from tech-spec-city-metaphor-rethink.md
