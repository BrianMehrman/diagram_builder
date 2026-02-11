# Story 10.11: Implement Configurable Height Encoding

Status: not-started

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
- [ ] Modify `calculateBuildingHeight(node, encoding)` to accept encoding parameter
- [ ] Implement formula for each encoding type
- [ ] Handle missing data gracefully (fallback to methodCount)

### Task 2: Wire encoding to rendering (AC: 7)
- [ ] Building components read `heightEncoding` from store
- [ ] Height recalculated when encoding changes
- [ ] Floor bands adjust to new height (log-scaled for all encodings)

### Task 3: Write unit tests (AC: 8)
- [ ] Test each encoding formula with sample data
- [ ] Test fallback when data missing (e.g., no complexity score)
- [ ] Test height update speed (<100ms)

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
_To be filled during implementation_

### Completion Notes
_To be filled on completion_

## File List
_To be filled during implementation_

---

## Change Log
- 2026-02-10: Story created from tech-spec-city-metaphor-rethink.md
