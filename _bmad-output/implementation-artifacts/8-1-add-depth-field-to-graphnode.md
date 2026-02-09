# Story 8.1: Add Depth Field to GraphNode

Status: review

## Story

**ID:** 8-1
**Key:** 8-1-add-depth-field-to-graphnode
**Title:** Extend GraphNode Type with Depth, External, and Parent Fields
**Epic:** Epic 8 - City-to-Cell 3D Layout
**Phase:** Implementation - Phase 1 (Data Foundation)
**Priority:** CRITICAL - Foundation for all layout stories

**As a** developer working on the 3D layout engine,
**I want** GraphNode to include depth, isExternal, and parentId fields,
**So that** layout algorithms can position nodes vertically by abstraction depth, identify external libraries, and establish containment hierarchies.

---

## Acceptance Criteria

- **AC-1:** GraphNode interface extended with `depth` field
  - `depth?: number` — optional, defaults to 0
  - Represents abstraction depth from entry point
  - Higher values = deeper in call chain

- **AC-2:** GraphNode interface extended with `isExternal` field
  - `isExternal?: boolean` — optional, defaults to false
  - True for nodes representing external library imports

- **AC-3:** GraphNode interface extended with `parentId` field
  - `parentId?: string` — optional
  - References the ID of the containing node
  - File is parent of classes, class is parent of methods

- **AC-4:** ApiGraphNode updated to include new fields
  - `packages/ui/src/shared/types/api.ts` — add depth, isExternal, parentId
  - Ensures API responses can carry these fields to the UI

- **AC-5:** Existing code handles new fields gracefully
  - All new fields are optional — no breaking changes
  - Parser and API continue to work without populating new fields
  - All existing tests pass without modification

- **AC-6:** Unit tests validate type usage
  - Test creating nodes with new fields
  - Test creating nodes without new fields (backward compat)

---

## Tasks/Subtasks

### Task 1: Update UI GraphNode type (AC: 1, 2, 3)
- [x] Add `depth?: number` to GraphNode in `packages/ui/src/shared/types/graph.ts`
- [x] Add `isExternal?: boolean` to GraphNode
- [x] Add `parentId?: string` to GraphNode

### Task 2: Update ApiGraphNode type (AC: 4)
- [x] Add `depth?: number` to ApiGraphNode in `packages/ui/src/shared/types/api.ts`
- [x] Add `isExternal?: boolean` to ApiGraphNode
- [x] Add `parentId?: string` to ApiGraphNode

### Task 3: Verify no compilation errors (AC: 5)
- [x] Run TypeScript type-check across UI package
- [x] Confirm all fields are optional so no existing code breaks

### Task 4: Write unit tests (AC: 6)
- [x] Test creating GraphNode with new fields populated
- [x] Test creating GraphNode without new fields (backward compat)
- [x] Test that existing test utilities/helpers still work

---

## Dev Notes

### Architecture & Patterns

**Type location:** `GraphNode` is defined ONLY in the UI package at `packages/ui/src/shared/types/graph.ts`. There is NO `GraphNode` in core, parser, or API packages. The core package uses `IVMNode` (which already has `parentId`).

**API type:** `ApiGraphNode` in `packages/ui/src/shared/types/api.ts` represents data from the API. Must also be extended so API responses can carry the new fields.

**Key insight: All new fields MUST be optional.** The parser and API don't populate these fields yet (that's stories 8-2, 8-3, 8-4). Making them required would break every existing GraphNode creation site across 30+ files with no benefit.

### Core IVMNode (for reference)

The core `IVMNode` at `packages/core/src/ivm/types.ts` already has `parentId?: string`. The UI `GraphNode` is a simpler type used by canvas/navigation components.

### Scope Boundaries

- **DO:** Add optional fields to GraphNode and ApiGraphNode
- **DO:** Write tests validating type usage
- **DO NOT:** Add `depth: 0` to every node creation site (fields are optional)
- **DO NOT:** Create a factory function (premature — no consumer yet)
- **DO NOT:** Modify parser, API, or core packages (that's stories 8-2 through 8-4)

### References

- [Source: packages/ui/src/shared/types/graph.ts] — GraphNode type
- [Source: packages/ui/src/shared/types/api.ts:178-184] — ApiGraphNode type
- [Source: packages/core/src/ivm/types.ts:97-118] — IVMNode with parentId

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- TypeScript compiler correctly rejects new fields before type update (RED phase confirmed)
- All fields made optional to avoid breaking 30+ existing GraphNode creation sites

### Completion Notes List

All 4 tasks completed:
- **Task 1 (GraphNode type):** Added `depth?: number`, `isExternal?: boolean`, `parentId?: string` to `GraphNode` interface with JSDoc comments explaining each field's purpose.
- **Task 2 (ApiGraphNode type):** Mirrored the same three optional fields on `ApiGraphNode` so API responses can carry layout data.
- **Task 3 (Compilation):** TypeScript type-check passes for graph-related files. No existing code breaks because all new fields are optional. Pre-existing type error in `WorkspacePage.tsx` is unrelated.
- **Task 4 (Tests):** 7 unit tests covering: full-field node creation, backward-compatible node creation (no new fields), external library node, nested parent-child relationships, all node types, edge types, and graph with mixed nodes.

### File List

**New Files:**
- `packages/ui/src/shared/types/graph.test.ts` — 7 unit tests for type usage

**Modified Files:**
- `packages/ui/src/shared/types/graph.ts` — Added depth, isExternal, parentId to GraphNode
- `packages/ui/src/shared/types/api.ts` — Added depth, isExternal, parentId to ApiGraphNode

---

## Change Log
- 2026-02-02: Extended GraphNode and ApiGraphNode with depth, isExternal, parentId fields for city-to-cell layout foundation. All optional for backward compatibility. 7 unit tests added.
