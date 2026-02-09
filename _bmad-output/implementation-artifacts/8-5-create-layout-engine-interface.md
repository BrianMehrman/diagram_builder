# Story 8-5: Create Layout Engine Interface

**Status:** review

---

## Story

**ID:** 8-5
**Key:** 8-5-create-layout-engine-interface
**Title:** Create Pluggable Layout Engine Interface and Registry
**Epic:** Epic 8 - City-to-Cell 3D Layout
**Phase:** Implementation - Phase 2 (Layout System)
**Priority:** CRITICAL - Foundation for all layout engines

**As a** developer working on layout algorithms,
**I want** a pluggable layout engine interface,
**So that** city, building, and cell layouts can be implemented as interchangeable engines.

**Description:**

Define the `LayoutEngine` interface that all layout algorithms must implement, along with a `LayoutRegistry` for managing and selecting engines. This enables the view mode manager to request the appropriate layout for the current view.

**Context:**

Three layout engines will be built on this interface:
1. **City Layout** (8-6) - Buildings on a grid, height = depth
2. **Building Layout** (8-7) - Floors and rooms inside a building
3. **Cell Layout** (8-8) - Organelles floating in membrane

Each engine takes a graph subset and produces Position3D values for nodes.

---

## Acceptance Criteria

- **AC-1:** LayoutEngine interface defined
  - `type: string` - Engine identifier
  - `layout(graph, config): LayoutResult` - Compute positions
  - `canHandle(graph): boolean` - Whether engine suits this graph

- **AC-2:** LayoutResult type defined
  - `positions: Map<string, Position3D>` - Node positions
  - `bounds: BoundingBox` - Layout bounding box
  - `metadata?: Record<string, unknown>` - Engine-specific data

- **AC-3:** LayoutConfig type defined
  - Common config: spacing, scale, origin
  - Engine-specific config via generics or union

- **AC-4:** LayoutRegistry manages engines
  - Register engines by type
  - Get engine by type
  - Auto-select engine based on graph characteristics

- **AC-5:** BoundingBox type defined
  - min/max Position3D
  - Helper for center, size, contains

- **AC-6:** Unit tests verify registry
  - Register/retrieve engines
  - Auto-selection logic
  - Handle missing engine gracefully

---

## Technical Approach

### Layout Engine Interface

```typescript
// packages/ui/src/features/canvas/layout/types.ts

import type { Graph, GraphNode, Position3D } from '../../../shared/types';

export interface BoundingBox {
  min: Position3D;
  max: Position3D;
}

export interface LayoutResult {
  positions: Map<string, Position3D>;
  bounds: BoundingBox;
  metadata?: Record<string, unknown>;
}

export interface LayoutConfig {
  spacing?: number;
  scale?: number;
  origin?: Position3D;
  // Engine-specific config
  [key: string]: unknown;
}

export interface LayoutEngine {
  readonly type: string;
  layout(graph: Graph, config: LayoutConfig): LayoutResult;
  canHandle(graph: Graph): boolean;
}
```

### Layout Registry

```typescript
// packages/ui/src/features/canvas/layout/registry.ts

import type { LayoutEngine, Graph } from './types';

export class LayoutRegistry {
  private engines = new Map<string, LayoutEngine>();

  register(engine: LayoutEngine): void {
    this.engines.set(engine.type, engine);
  }

  get(type: string): LayoutEngine | undefined {
    return this.engines.get(type);
  }

  autoSelect(graph: Graph): LayoutEngine | undefined {
    // Try each engine's canHandle
    for (const engine of this.engines.values()) {
      if (engine.canHandle(graph)) {
        return engine;
      }
    }
    return undefined;
  }

  getAll(): LayoutEngine[] {
    return Array.from(this.engines.values());
  }
}

// Singleton registry
export const layoutRegistry = new LayoutRegistry();
```

### BoundingBox Helpers

```typescript
// packages/ui/src/features/canvas/layout/bounds.ts

import type { BoundingBox, Position3D } from './types';

export function boundsCenter(box: BoundingBox): Position3D {
  return {
    x: (box.min.x + box.max.x) / 2,
    y: (box.min.y + box.max.y) / 2,
    z: (box.min.z + box.max.z) / 2,
  };
}

export function boundsSize(box: BoundingBox): Position3D {
  return {
    x: box.max.x - box.min.x,
    y: box.max.y - box.min.y,
    z: box.max.z - box.min.z,
  };
}

export function boundsContains(box: BoundingBox, point: Position3D): boolean {
  return (
    point.x >= box.min.x && point.x <= box.max.x &&
    point.y >= box.min.y && point.y <= box.max.y &&
    point.z >= box.min.z && point.z <= box.max.z
  );
}

export function mergeBounds(a: BoundingBox, b: BoundingBox): BoundingBox {
  return {
    min: {
      x: Math.min(a.min.x, b.min.x),
      y: Math.min(a.min.y, b.min.y),
      z: Math.min(a.min.z, b.min.z),
    },
    max: {
      x: Math.max(a.max.x, b.max.x),
      y: Math.max(a.max.y, b.max.y),
      z: Math.max(a.max.z, b.max.z),
    },
  };
}
```

---

## Tasks/Subtasks

### Task 1: Define types
- [x] LayoutEngine interface
- [x] LayoutResult type
- [x] LayoutConfig type
- [x] BoundingBox type

### Task 2: Implement LayoutRegistry
- [x] Register/get engines
- [x] Auto-select by canHandle
- [x] Singleton instance

### Task 3: Implement BoundingBox helpers
- [x] center, size, contains, merge
- [x] Unit tests for each

### Task 4: Create directory structure
- [x] `layout/` directory
- [x] `layout/engines/` for implementations
- [x] Index exports

### Task 5: Write unit tests
- [x] Registry register/get
- [x] Registry auto-select
- [x] BoundingBox helpers
- [x] Handle missing engine

---

## Files to Create

- `packages/ui/src/features/canvas/layout/types.ts` - Core types
- `packages/ui/src/features/canvas/layout/registry.ts` - Engine registry
- `packages/ui/src/features/canvas/layout/bounds.ts` - BoundingBox helpers
- `packages/ui/src/features/canvas/layout/index.ts` - Exports
- `packages/ui/src/features/canvas/layout/engines/index.ts` - Engine exports
- `packages/ui/src/features/canvas/layout/registry.test.ts` - Registry tests
- `packages/ui/src/features/canvas/layout/bounds.test.ts` - Bounds tests

---

## Dependencies

- None (standalone interface definition)

---

## Estimation

**Complexity:** Low-Medium
**Risk:** Low - Interface design

---

## Definition of Done

- [x] LayoutEngine interface defined
- [x] LayoutResult and LayoutConfig types defined
- [x] BoundingBox type with helpers
- [x] LayoutRegistry with register/get/autoSelect
- [x] Directory structure created
- [x] Unit tests pass

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All 27 new tests pass (12 bounds + 15 registry). No new regressions — only pre-existing 7 failing test files remain.
- Added `boundsFromPositions()` helper beyond what the story specified — useful utility for computing bounds from node positions.

### Completion Notes List

All 5 tasks completed:
- **Task 1 (Types):** `LayoutEngine` interface with `type`, `layout()`, `canHandle()`. `LayoutResult` with positions Map, bounds, optional metadata. `LayoutConfig` with spacing, scale, origin, and index signature for engine-specific config. `BoundingBox` with min/max Position3D.
- **Task 2 (Registry):** `LayoutRegistry` class with `register()`, `unregister()`, `get()`, `has()`, `getAll()`, `autoSelect()`, `size`. Singleton `layoutRegistry` exported.
- **Task 3 (Bounds helpers):** `boundsCenter()`, `boundsSize()`, `boundsContains()`, `mergeBounds()`, `boundsFromPositions()`.
- **Task 4 (Directory):** Created `layout/` with `types.ts`, `registry.ts`, `bounds.ts`, `index.ts`, and `engines/index.ts` placeholder.
- **Task 5 (Tests):** 12 bounds tests (center, size, contains, merge, fromPositions), 15 registry tests (register/get, overwrite, unregister, has, getAll, size, autoSelect with various scenarios).

### File List

**New Files:**
- `packages/ui/src/features/canvas/layout/types.ts` — LayoutEngine, LayoutResult, LayoutConfig, BoundingBox interfaces
- `packages/ui/src/features/canvas/layout/registry.ts` — LayoutRegistry class + singleton
- `packages/ui/src/features/canvas/layout/bounds.ts` — BoundingBox helper functions
- `packages/ui/src/features/canvas/layout/index.ts` — Public exports
- `packages/ui/src/features/canvas/layout/engines/index.ts` — Placeholder for engine implementations
- `packages/ui/src/features/canvas/layout/bounds.test.ts` — 12 unit tests
- `packages/ui/src/features/canvas/layout/registry.test.ts` — 15 unit tests

---

## Change Log
- 2026-02-02: Created pluggable layout engine interface, registry, and BoundingBox helpers. 27 unit tests, all passing. Directory structure ready for engine implementations (8-6, 8-7, 8-8).
