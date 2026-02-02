# Story 8-2: Calculate Abstraction Depth

**Status:** not-started

---

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

**Description:**

Implement a BFS (Breadth-First Search) algorithm that traverses the dependency graph from identified entry points, assigning each node a `depth` value. Entry points (index files, main files, app entry) get depth 0. Files they import get depth 1. Files those import get depth 2, and so on.

This depth value directly maps to the Y-axis position in the 3D city layout — buildings grow upward from the ground based on abstraction depth.

**Context:**

From UX 3D Layout Vision:
- Base of building = entry points (depth 0)
- Higher floors = deeper abstractions
- Utilities at the top = maximum depth
- Vertical space represents abstraction layers

Entry point detection heuristics:
- Files named `index.ts/js`, `main.ts/js`, `app.ts/js`
- Files with no incoming imports (roots of the dependency graph)
- Package.json `main` or `exports` fields

---

## Acceptance Criteria

- **AC-1:** Entry points identified automatically
  - index.ts/js files at root or src/ level
  - main.ts/js, app.ts/js files
  - Files with zero incoming imports
  - Package.json entry points (if available)

- **AC-2:** BFS traversal assigns depth to all reachable nodes
  - Entry points get depth 0
  - Direct imports get depth 1
  - Transitive imports increment depth
  - Nodes choose minimum depth if reachable from multiple paths

- **AC-3:** Unreachable nodes handled gracefully
  - Orphan nodes (no imports, not entry points) get max depth + 1
  - Dead code detection flagged in metadata

- **AC-4:** Circular dependencies handled
  - BFS visited set prevents infinite loops
  - Circular nodes get depth of first visit

- **AC-5:** Depth values populated on GraphNode objects
  - `node.depth` populated for all nodes after analysis
  - Depth range available for layout normalization

- **AC-6:** Unit tests cover all scenarios
  - Linear chain (A → B → C)
  - Diamond pattern (A → B, A → C, B → D, C → D)
  - Circular dependency (A → B → A)
  - Multiple entry points
  - Orphan nodes

---

## Technical Approach

### BFS Depth Calculator

```typescript
// packages/parser/src/analysis/depthCalculator.ts

import type { GraphNode, GraphEdge } from '@diagram-builder/core';

interface DepthResult {
  depths: Map<string, number>;
  entryPoints: string[];
  maxDepth: number;
  orphans: string[];
}

export function calculateAbstractionDepth(
  nodes: GraphNode[],
  edges: GraphEdge[]
): DepthResult {
  // Build adjacency list (import direction: source imports target)
  const importedBy = new Map<string, Set<string>>();
  const imports = new Map<string, Set<string>>();

  for (const edge of edges) {
    if (edge.type === 'imports') {
      // source imports target
      if (!imports.has(edge.source)) imports.set(edge.source, new Set());
      imports.get(edge.source)!.add(edge.target);

      if (!importedBy.has(edge.target)) importedBy.set(edge.target, new Set());
      importedBy.get(edge.target)!.add(edge.source);
    }
  }

  // Identify entry points
  const entryPoints = identifyEntryPoints(nodes, importedBy);

  // BFS from all entry points simultaneously
  const depths = new Map<string, number>();
  const queue: Array<{ nodeId: string; depth: number }> = [];

  for (const ep of entryPoints) {
    depths.set(ep, 0);
    queue.push({ nodeId: ep, depth: 0 });
  }

  while (queue.length > 0) {
    const { nodeId, depth } = queue.shift()!;

    const imported = imports.get(nodeId) ?? new Set();
    for (const targetId of imported) {
      if (!depths.has(targetId)) {
        depths.set(targetId, depth + 1);
        queue.push({ nodeId: targetId, depth: depth + 1 });
      }
      // If already visited, keep the minimum depth (already set by BFS order)
    }
  }

  // Handle orphans (unreachable nodes)
  const maxDepth = Math.max(...depths.values(), 0);
  const orphans: string[] = [];

  for (const node of nodes) {
    if (!depths.has(node.id)) {
      depths.set(node.id, maxDepth + 1);
      orphans.push(node.id);
    }
  }

  return {
    depths,
    entryPoints,
    maxDepth: Math.max(...depths.values(), 0),
    orphans,
  };
}

function identifyEntryPoints(
  nodes: GraphNode[],
  importedBy: Map<string, Set<string>>
): string[] {
  const entryPoints: string[] = [];

  for (const node of nodes) {
    if (node.type !== 'file') continue;

    const label = node.label.toLowerCase();

    // Heuristic 1: Named entry points
    if (
      label.match(/^(index|main|app|server|entry)\.(ts|js|tsx|jsx)$/)
    ) {
      entryPoints.push(node.id);
      continue;
    }

    // Heuristic 2: No incoming imports (root of dependency tree)
    const incomingCount = importedBy.get(node.id)?.size ?? 0;
    if (incomingCount === 0) {
      entryPoints.push(node.id);
    }
  }

  // Fallback: if no entry points found, use all root-level files
  if (entryPoints.length === 0) {
    for (const node of nodes) {
      if (node.type === 'file' && !node.label.includes('/')) {
        entryPoints.push(node.id);
      }
    }
  }

  return entryPoints;
}
```

### Integration with Parser Pipeline

```typescript
// In parser pipeline, after graph construction:
const depthResult = calculateAbstractionDepth(graph.nodes, graph.edges);

// Apply depths to nodes
for (const node of graph.nodes) {
  node.depth = depthResult.depths.get(node.id) ?? 0;
}
```

---

## Tasks/Subtasks

### Task 1: Implement entry point detection
- [ ] Detect by filename pattern (index, main, app)
- [ ] Detect by zero incoming imports
- [ ] Fallback for no matches

### Task 2: Implement BFS traversal
- [ ] Build adjacency lists from edges
- [ ] Multi-source BFS from all entry points
- [ ] Track visited set for cycle handling

### Task 3: Handle edge cases
- [ ] Circular dependencies
- [ ] Orphan nodes
- [ ] Empty graphs

### Task 4: Integrate into parser pipeline
- [ ] Call after graph construction
- [ ] Apply depths to GraphNode objects
- [ ] Return depth metadata

### Task 5: Write comprehensive unit tests
- [ ] Linear chain
- [ ] Diamond pattern
- [ ] Circular dependency
- [ ] Multiple entry points
- [ ] Orphan nodes
- [ ] Empty graph
- [ ] Single node

---

## Files to Create

- `packages/parser/src/analysis/depthCalculator.ts` - Main algorithm
- `packages/parser/src/analysis/depthCalculator.test.ts` - Unit tests

## Files to Modify

- `packages/parser/src/analysis/index.ts` - Export new module
- `packages/parser/src/pipeline.ts` - Integrate depth calculation

---

## Dependencies

- Story 8-1 (GraphNode type with depth field)

---

## Estimation

**Complexity:** Medium
**Effort:** 4-5 hours
**Risk:** Low - Well-understood BFS algorithm

---

## Definition of Done

- [ ] Entry points detected automatically
- [ ] BFS assigns correct depth values
- [ ] Circular dependencies handled
- [ ] Orphan nodes assigned max+1 depth
- [ ] Integrated into parser pipeline
- [ ] All unit tests pass (7+ test cases)
