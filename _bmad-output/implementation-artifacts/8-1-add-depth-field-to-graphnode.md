# Story 8-1: Add Depth Field to GraphNode

**Status:** not-started

---

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

**Description:**

Extend the core `GraphNode` interface with three new fields required by the city-to-cell layout system:

1. **`depth: number`** - Abstraction depth from entry point (0 = entry, higher = deeper utility)
2. **`isExternal?: boolean`** - Whether this node represents an external library import
3. **`parentId?: string`** - ID of the containing node (file contains class, class contains method)

These fields are the data foundation that all subsequent layout and rendering stories depend on.

**Context:**

Current `GraphNode` interface at `packages/ui/src/shared/types/graph.ts`:
```typescript
export interface GraphNode {
  id: string;
  type: 'file' | 'class' | 'function' | 'method' | 'variable';
  label: string;
  metadata: Record<string, unknown>;
  position?: Position3D;
  lod: number;
}
```

The core types package also has a `GraphNode` at `packages/core/src/types/graph.ts` that must stay in sync.

---

## Acceptance Criteria

- **AC-1:** GraphNode interface extended with `depth` field
  - `depth: number` - defaults to 0
  - Represents abstraction depth from entry point
  - Higher values = deeper in call chain

- **AC-2:** GraphNode interface extended with `isExternal` field
  - `isExternal?: boolean` - optional, defaults to false
  - True for nodes representing external library imports

- **AC-3:** GraphNode interface extended with `parentId` field
  - `parentId?: string` - optional
  - References the ID of the containing node
  - File is parent of classes, class is parent of methods

- **AC-4:** Both core and UI type definitions updated
  - `packages/core/src/types/graph.ts`
  - `packages/ui/src/shared/types/graph.ts`
  - Types remain in sync

- **AC-5:** Existing code handles new fields gracefully
  - New fields are optional or have defaults
  - No breaking changes to existing functionality
  - Parser continues to work without populating new fields

- **AC-6:** Unit tests validate type compatibility
  - Test creating nodes with new fields
  - Test creating nodes without new fields (backward compat)

---

## Technical Approach

### Type Extension

```typescript
// packages/core/src/types/graph.ts

export interface GraphNode {
  id: string;
  type: 'file' | 'class' | 'function' | 'method' | 'variable';
  label: string;
  metadata: Record<string, unknown>;
  position?: Position3D;
  lod: number;

  // New fields for city-to-cell layout
  depth: number;           // Abstraction depth (0 = entry point)
  isExternal?: boolean;    // External library node
  parentId?: string;       // Containing node ID
}
```

### Default Value Strategy

Existing code that creates `GraphNode` objects will need `depth: 0` added. Use a factory function to ensure defaults:

```typescript
export function createGraphNode(
  partial: Omit<GraphNode, 'depth'> & { depth?: number }
): GraphNode {
  return {
    ...partial,
    depth: partial.depth ?? 0,
    isExternal: partial.isExternal ?? false,
  };
}
```

---

## Tasks/Subtasks

### Task 1: Update core types
- [ ] Add `depth: number` to GraphNode in `packages/core/src/types/graph.ts`
- [ ] Add `isExternal?: boolean` to GraphNode
- [ ] Add `parentId?: string` to GraphNode
- [ ] Export updated type

### Task 2: Update UI types
- [ ] Mirror changes in `packages/ui/src/shared/types/graph.ts`
- [ ] Ensure UI type stays in sync with core

### Task 3: Create factory function
- [ ] Create `createGraphNode` helper with defaults
- [ ] Export from core types

### Task 4: Fix compilation errors
- [ ] Add `depth: 0` to all existing GraphNode creation sites
- [ ] Parser, API, and UI packages

### Task 5: Write unit tests
- [ ] Test node creation with all fields
- [ ] Test node creation with only required fields
- [ ] Test factory function defaults

---

## Files to Modify

- `packages/core/src/types/graph.ts` - Core type definition
- `packages/ui/src/shared/types/graph.ts` - UI type definition
- `packages/parser/src/**/*.ts` - Fix any node creation sites
- `packages/api/src/**/*.ts` - Fix any node creation sites

## Files to Create

- `packages/core/src/types/graph.test.ts` - Type tests

---

## Dependencies

- None (foundational story)

---

## Estimation

**Complexity:** Low
**Effort:** 2-3 hours
**Risk:** Low - Additive type change

---

## Definition of Done

- [ ] GraphNode has depth, isExternal, parentId fields
- [ ] Core and UI types in sync
- [ ] All existing code compiles without errors
- [ ] Factory function with defaults available
- [ ] Unit tests pass
- [ ] No breaking changes to existing functionality
