# Story 8-4: Add Parent-Child Relationships

**Status:** review

---

## Story

**ID:** 8-4
**Key:** 8-4-add-parent-child-relationships
**Title:** Establish Parent-Child Containment Relationships Between Nodes
**Epic:** Epic 8 - City-to-Cell 3D Layout
**Phase:** Implementation - Phase 1 (Data Foundation)
**Priority:** HIGH - Required for cell view

**As a** developer viewing the 3D codebase visualization,
**I want** nodes to have explicit parent-child relationships,
**So that** the cell view can show methods/functions as organelles inside their containing class.

**Description:**

Create a standalone algorithm that analyzes DependencyNode[] and DependencyEdge[] to establish containment relationships. Assigns parentId to child nodes and creates explicit 'contains' edges. This is the final Phase 1 data foundation story.

**Context:**

From UX 3D Layout Vision:
- Inside a class, methods appear as organelles
- Organelles are contained within the cell membrane
- Parent-child relationships define containment

Containment hierarchy:
- File contains Classes, Functions
- Class contains Methods (when they exist as nodes)

---

## Acceptance Criteria

- **AC-1:** Containment detected from existing graph structure
  - Class nodes get parentId pointing to their containing File node
  - Function nodes get parentId pointing to their containing File node
  - Detection uses path-based grouping and existing 'exports' edges

- **AC-2:** Explicit 'contains' edges created
  - DependencyEdge with type 'contains' links parent to children
  - Added to DependencyEdgeType union

- **AC-3:** Hierarchy traversable in both directions
  - Child → Parent via parentId in result map
  - Parent → Children via 'contains' edges in result

- **AC-4:** Edge cases handled
  - File nodes with no children (leaf files)
  - Nodes without a file parent (orphan classes/functions)
  - Multiple classes in one file
  - Empty graph

- **AC-5:** Unit tests verify containment
  - Test file with single class
  - Test file with multiple classes and functions
  - Test file with no children
  - Test orphan node (no file parent)
  - Test empty graph
  - Test containment edge creation

---

## Tasks/Subtasks

### Task 1: Add 'contains' to DependencyEdgeType (AC: 2)
- [x] Update type union in dependency-graph.ts

### Task 2: Implement containment algorithm (AC: 1, 3, 4)
- [x] Group nodes by path to find file → class/function relationships
- [x] Cross-reference with 'exports' edges for confirmation
- [x] Build parentId map (child → parent)
- [x] Create 'contains' DependencyEdges
- [x] Return ContainmentResult with parentMap, containmentEdges, rootNodes

### Task 3: Write comprehensive unit tests (AC: 5)
- [x] Test file with single class child
- [x] Test file with multiple classes and functions
- [x] Test file with no children (leaf file)
- [x] Test orphan class without file parent
- [x] Test empty graph
- [x] Test containment edges match parentMap
- [x] Test nodes at same path but different types

### Task 4: Export from parser index
- [x] Export function and types from packages/parser/src/index.ts

---

## Dev Notes

### Architecture & Patterns

**Location:** `packages/parser/src/analysis/containmentAnalyzer.ts` — follows the pattern of `depthCalculator.ts` and `externalDetector.ts`.

**Types:** Uses `DependencyNode` and `DependencyEdge` from `packages/parser/src/graph/dependency-graph.ts`.

**Key discovery:** The graph-builder already creates 'exports' edges from file → class and file → function (graph-builder.ts:104-110, 129-134). These represent containment but use the 'exports' edge type. The algorithm can detect containment from:
1. **Path grouping:** Nodes sharing the same `path` property, where a 'file' node is the parent of 'class'/'function' nodes
2. **Edge confirmation:** Existing 'exports' edges from file nodes to class/function nodes

**Node structure from graph-builder:**
- File nodes: `type: 'file'`, `id: 'file:/path/to/file.ts'`
- Class nodes: `type: 'class'`, `id: 'class:/path/to/file.ts:ClassName'`, `path: '/path/to/file.ts'`
- Function nodes: `type: 'function'`, `id: 'function:/path/to/file.ts:funcName'`, `path: '/path/to/file.ts'`

**Method nodes don't exist yet** — class methods are stored in metadata as `methods: string[]`, not as separate DependencyNodes. This algorithm handles what exists now; method-level nodes would be a future enhancement.

**DependencyEdgeType change:** Add 'contains' to the union type. This is a non-breaking addition since it only expands the type.

### Integration Note

This is a standalone algorithm. A future story can call `buildContainmentHierarchy()` during graph building to populate parentId on nodes. The algorithm works on the final graph output.

### Files to Create

- `packages/parser/src/analysis/containmentAnalyzer.ts` — Algorithm
- `packages/parser/src/analysis/containmentAnalyzer.test.ts` — Tests

### Files to Modify

- `packages/parser/src/graph/dependency-graph.ts` — Add 'contains' to DependencyEdgeType
- `packages/parser/src/index.ts` — Export new module

### References

- [Source: packages/parser/src/graph/dependency-graph.ts:9] — DependencyEdgeType
- [Source: packages/parser/src/graph/graph-builder.ts:88-135] — File→class and file→function node/edge creation
- [Source: packages/parser/src/analysis/depthCalculator.ts] — Standalone algorithm pattern

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Original story assumed AST traversal and pipeline.ts (doesn't exist). Redesigned as standalone algorithm on DependencyNode[]/DependencyEdge[] matching 8-2/8-3 pattern.
- Method nodes don't exist as separate DependencyNodes — they're metadata on class nodes. Algorithm handles current graph structure; method-level containment is a future enhancement.
- All 402 parser tests pass with zero regressions.

### Completion Notes List

All 4 tasks completed:
- **Task 1 (DependencyEdgeType):** Added `'contains'` to the type union in `dependency-graph.ts`. Non-breaking expansion.
- **Task 2 (Algorithm):** `buildContainmentHierarchy()` uses two strategies: (1) existing 'exports' edges from file→class/function, (2) path-based grouping for nodes sharing the same `path`. Returns `ContainmentResult { parentMap, containmentEdges, rootNodes }`.
- **Task 3 (Tests):** 11 tests covering: file→class, file→function, multiple children, contains edges, leaf files, root node identification, orphan classes, empty graph, path-based grouping without edges, multiple files, parentMap/edge consistency.
- **Task 4 (Exports):** `buildContainmentHierarchy` and `ContainmentResult` exported from `packages/parser/src/index.ts`.

### File List

**New Files:**
- `packages/parser/src/analysis/containmentAnalyzer.ts` — Containment algorithm with `buildContainmentHierarchy()`
- `packages/parser/src/analysis/containmentAnalyzer.test.ts` — 11 unit tests

**Modified Files:**
- `packages/parser/src/graph/dependency-graph.ts` — Added `'contains'` to `DependencyEdgeType`
- `packages/parser/src/index.ts` — Export new module

---

## Change Log
- 2026-02-02: Implemented containment hierarchy analyzer with path-based and edge-based detection. Added 'contains' edge type. 11 unit tests, all passing. Exported from parser index.

