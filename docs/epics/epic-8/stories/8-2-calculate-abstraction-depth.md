# Story 8.2: Calculate Abstraction Depth

Status: review

## Story

**ID:** 8-2
**Key:** 8-2-calculate-abstraction-depth
**Title:** Implement BFS Abstraction Depth Calculation from Entry Points
**Epic:** Epic 8 - City-to-Cell 3D Layout
**Phase:** Implementation - Phase 1 (Data Foundation)
**Priority:** CRITICAL - Required for vertical layout

**As a** developer viewing the 3D codebase visualization,
**I want** each node assigned a depth value based on its distance from entry points,
**So that** the layout engine can position nodes vertically (entry points at ground level, utilities higher up).

---

## Acceptance Criteria

- **AC-1:** Entry points identified automatically
  - index.ts/js files
  - main.ts/js, app.ts/js, server.ts/js, entry.ts/js files
  - Files with zero incoming import edges
  - Fallback: root-level files if no matches

- **AC-2:** BFS traversal assigns depth to all reachable nodes
  - Entry points get depth 0
  - Direct imports get depth 1
  - Transitive imports increment depth
  - Minimum depth wins when reachable from multiple paths (BFS guarantees this)

- **AC-3:** Unreachable nodes handled gracefully
  - Orphan nodes (no imports, not entry points) get max depth + 1
  - Orphan node IDs returned in result

- **AC-4:** Circular dependencies handled
  - BFS visited set prevents infinite loops
  - Circular nodes get depth of first visit

- **AC-5:** Depth result returned with metadata
  - `depths: Map<string, number>` — depth per node
  - `entryPoints: string[]` — identified entry point IDs
  - `maxDepth: number` — maximum depth value
  - `orphans: string[]` — unreachable node IDs

- **AC-6:** Unit tests cover all scenarios
  - Linear chain (A → B → C)
  - Diamond pattern (A → B, A → C, B → D, C → D)
  - Circular dependency (A → B → A)
  - Multiple entry points
  - Orphan nodes
  - Empty graph
  - Single node

---

## Tasks/Subtasks

### Task 1: Implement entry point detection (AC: 1)
- [x] Detect by filename pattern (index, main, app, server, entry)
- [x] Detect by zero incoming import edges
- [x] Fallback for no matches (root-level files)

### Task 2: Implement BFS depth calculation (AC: 2, 4, 5)
- [x] Build adjacency list from import edges
- [x] Multi-source BFS from all entry points simultaneously
- [x] Track visited set for cycle handling
- [x] Return DepthResult with depths, entryPoints, maxDepth, orphans

### Task 3: Handle edge cases (AC: 3, 4)
- [x] Circular dependencies (visited set)
- [x] Orphan nodes get maxDepth + 1
- [x] Empty graph returns empty result
- [x] Single node with no edges

### Task 4: Write comprehensive unit tests (AC: 6)
- [x] Linear chain test
- [x] Diamond pattern test
- [x] Circular dependency test
- [x] Multiple entry points test
- [x] Orphan nodes test
- [x] Empty graph test
- [x] Single node test
- [x] Entry point detection tests

---

## Dev Notes

### Architecture & Patterns

**Location:** `packages/parser/src/analysis/depthCalculator.ts` — the `analysis/` directory already exists with other analysis modules (analyzer, class-extractor, function-extractor, etc.)

**Types:** Use `DependencyNode` and `DependencyEdge` from `packages/parser/src/graph/dependency-graph.ts`. These are the parser's native types. Edge type `'imports'` is what to follow for depth traversal.

**DependencyNode shape:**
```typescript
interface DependencyNode {
  id: string;
  type: 'file' | 'class' | 'function' | 'interface' | 'module';
  name: string;
  path: string;
  metadata: Record<string, unknown>;
}
```

**DependencyEdge shape:**
```typescript
interface DependencyEdge {
  source: string;
  target: string;
  type: 'imports' | 'extends' | 'implements' | 'calls' | 'exports';
  metadata: Record<string, unknown>;
}
```

**Key: Only follow `'imports'` edges for depth.** Other edge types (extends, calls, exports) don't represent abstraction depth.

**Import direction:** In the parser, `source` imports `target` — so `A imports B` means edge `{source: A, target: B}`. BFS should follow outgoing import edges from entry points.

### Algorithm

```
1. Build adjacency list: for each import edge, source → target
2. Build reverse adjacency list: for each import edge, target → source (for incoming count)
3. Identify entry points (filename heuristic + zero incoming imports)
4. Multi-source BFS from all entry points with depth 0
5. Assign orphan nodes maxDepth + 1
```

### Integration Note

This story creates the standalone algorithm. Integration into the parser pipeline is deferred — future stories will call this function and apply depths to IVM nodes. The UI can also call this directly on `GraphNode[]`/`GraphEdge[]` data since the interface shapes are compatible.

### Files to Create

- `packages/parser/src/analysis/depthCalculator.ts` — Algorithm
- `packages/parser/src/analysis/depthCalculator.test.ts` — Tests

### Files to Modify

- `packages/parser/src/index.ts` — Export new module

### References

- [Source: packages/parser/src/graph/dependency-graph.ts] — DependencyNode/DependencyEdge types
- [Source: packages/parser/src/analysis/] — Existing analysis modules pattern
- [Source: packages/parser/src/index.ts] — Parser exports

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Initial "zero incoming imports" heuristic was too broad — isolated nodes (no imports in or out) were incorrectly classified as entry points. Fixed by requiring nodes to have at least one outgoing import edge to qualify via the zero-incoming heuristic.
- All 366 parser tests pass with zero regressions.

### Completion Notes List

All 4 tasks completed:
- **Task 1 (Entry point detection):** `identifyEntryPoints()` detects by filename pattern (index/main/app/server/entry with .ts/.js/.tsx/.jsx extensions), zero incoming import edges (for nodes that actively import others), and root-level file fallback.
- **Task 2 (BFS depth calculation):** `calculateAbstractionDepth()` builds adjacency list from import edges only, runs multi-source BFS from all entry points, tracks visited via the depths Map to prevent revisits.
- **Task 3 (Edge cases):** Circular dependencies handled by BFS visited set. Orphans get maxDepth + 1. Empty graph returns zeroed result. Single entry-point node gets depth 0.
- **Task 4 (Unit tests):** 14 tests covering: entry point detection (filename patterns, zero incoming imports, fallback), linear chain, diamond pattern, circular dependency (2-node and 3-node), multiple entry points, orphan nodes, empty graph, single node, non-import edge filtering, depth map completeness.

### File List

**New Files:**
- `packages/parser/src/analysis/depthCalculator.ts` — Algorithm with `calculateAbstractionDepth()`, `identifyEntryPoints()`, and `DepthResult` type
- `packages/parser/src/analysis/depthCalculator.test.ts` — 14 unit tests

**Modified Files:**
- `packages/parser/src/index.ts` — Export `calculateAbstractionDepth`, `identifyEntryPoints`, `DepthResult`

---

## Change Log
- 2026-02-02: Implemented BFS abstraction depth calculator with entry point detection. 14 unit tests, all passing. Exported from parser index.

