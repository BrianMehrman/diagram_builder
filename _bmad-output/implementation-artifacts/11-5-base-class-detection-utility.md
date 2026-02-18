# Story 11.5: Base Class Detection Utility

Status: not-started

## Story

**ID:** 11-5
**Key:** 11-5-base-class-detection-utility
**Title:** Base Class Detection Utility
**Epic:** Epic 11 - Vertical Layering — 3D Semantic City
**Phase:** Epic 11-B: Base Class Visual Differentiation
**Priority:** CRITICAL - Foundation for base class rendering

**As a** developer viewing the city visualization,
**I want** the system to automatically detect which classes are base classes (inherited from by other classes),
**So that** base classes can be visually distinguished from regular classes.

**Spec Reference:** `city-metaphor-vertical-layering-spec.md` Sections 4.1, 4.2

---

## Acceptance Criteria

- **AC-1:** Utility function `isBaseClass(nodeId, edges)` returns true if any other class extends/inherits from this class
- **AC-2:** Mid-chain classes (both extend something AND are extended by something) are correctly identified as base classes
- **AC-3:** Detection works with both `extends` and `implements` edge types
- **AC-4:** Adds `isBaseClass` flag to GraphNode metadata or as a computed property
- **AC-5:** Works with both same-namespace and cross-namespace inheritance
- **AC-6:** Co-located unit tests

---

## Tasks/Subtasks

### Task 1: Create base class detection utility (AC: 1, 2, 5)
- [ ] Create `isBaseClass(nodeId: string, edges: GraphEdge[]): boolean`
- [ ] Check if any edge with type `extends` or `implements` has this node as the target
- [ ] Pure function — no side effects, no store dependency
- [ ] File: `packages/ui/src/features/canvas/views/cityViewUtils.ts` or new utility file

### Task 2: Create bulk detection for graph (AC: 1, 2, 3)
- [ ] Create `detectBaseClasses(nodes: GraphNode[], edges: GraphEdge[]): Set<string>`
- [ ] Returns set of node IDs that are base classes
- [ ] Single pass through edges for efficiency
- [ ] Handle edge types: `extends`, `implements`

### Task 3: Integrate into layout/rendering pipeline (AC: 4)
- [ ] Compute base class set during layout phase or CityView initialization
- [ ] Pass `isBaseClass` flag to building components
- [ ] Ensure flag is available before building geometry is created

### Task 4: Write tests (AC: 6)
- [ ] Test: class with subclass → isBaseClass = true
- [ ] Test: class with no subclass → isBaseClass = false
- [ ] Test: mid-chain class (extends A, extended by C) → isBaseClass = true
- [ ] Test: class implementing interface → interface isBaseClass = true
- [ ] Test: class with no edges → isBaseClass = false
- [ ] Test: cross-namespace inheritance detected

---

## Dev Notes

- The `GraphEdge` type should already have a `type` or `relationship` field — verify what edge types the parser produces for inheritance
- This is a data utility — no visual changes in this story. Visual treatment is Story 11-6.
- Edge type naming may vary: check if parser uses `extends`, `inherits`, `EXTENDS`, etc.

## Dependencies
- None (data utility)

## Files Expected
- `packages/ui/src/features/canvas/views/cityViewUtils.ts` (MODIFIED — new utility functions)
- `packages/ui/src/features/canvas/views/cityViewUtils.test.ts` (MODIFIED)
