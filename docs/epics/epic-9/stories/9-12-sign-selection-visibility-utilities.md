# Story 9.12: Sign Selection & Visibility Utilities

Status: done

## Story

**ID:** 9-12
**Key:** 9-12-sign-selection-visibility-utilities
**Title:** Sign Selection & Visibility Utilities
**Epic:** Epic 9 - City Visualization Overhaul Phase 1
**Phase:** Epic 9-C: Signage System & Progressive Labels
**Priority:** CRITICAL - Foundation for sign system

**As a** developer viewing a codebase,
**I want** the system to determine which sign style and visibility applies to each node,
**So that** sign rendering is driven by testable utility logic.

---

## Acceptance Criteria

- **AC-1:** `getSignType(node)` returns `'neon'` for nodes with `metadata.visibility: 'public'`
- **AC-2:** `getSignType(node)` returns `'brass'` for nodes with `metadata.visibility: 'private'`
- **AC-3:** `getSignType(node)` returns `'hanging'` for class nodes
- **AC-4:** `getSignType(node)` returns `'highway'` for file/module-level nodes
- **AC-5:** `getSignType(node)` returns `'marquee'` for nodes with `metadata.isExported: true`
- **AC-6:** `getSignType(node)` returns `'construction'` for nodes with `metadata.isDeprecated: true`
- **AC-7:** `getSignType(node)` returns `'labelTape'` for variable nodes
- **AC-8:** `getSignVisibility(signType, lodLevel)` returns correct visibility per LOD level:
  - LOD 1 (city): highway only
  - LOD 2 (district): + hanging, neon
  - LOD 3 (neighborhood): + brass, labelTape
  - LOD 4 (street): all signs including construction
- **AC-9:** All utility functions have co-located unit tests

---

## Tasks/Subtasks

### Task 1: Define sign types (AC: 1-7)
- [x] Create `packages/ui/src/features/canvas/components/signs/signUtils.ts`
- [x] Define `SignType` union type: `'neon' | 'brass' | 'hanging' | 'highway' | 'labelTape' | 'marquee' | 'construction'`
- [x] Implement `getSignType(node: GraphNode): SignType`
- [x] Priority order for multiple matches: deprecated > exported > visibility-based > type-based

### Task 2: Implement visibility logic (AC: 8)
- [x] Implement `getSignVisibility(signType: SignType, lodLevel: number): boolean`
- [x] Define LOD visibility matrix as a constant map
- [x] LOD 1: `['highway']`
- [x] LOD 2: `['highway', 'hanging', 'neon', 'marquee']`
- [x] LOD 3: `['highway', 'hanging', 'neon', 'marquee', 'brass', 'labelTape']`
- [x] LOD 4: all types

### Task 3: Write unit tests (AC: 9)
- [x] Create `packages/ui/src/features/canvas/components/signs/signUtils.test.ts`
- [x] Test each node type/metadata → sign type mapping (22 tests)
- [x] Test each LOD level → visibility mapping (17 tests)
- [x] Test fallback behavior when metadata is missing
- [x] Test priority when node has multiple matching conditions

---

## Dev Notes

### Architecture & Patterns

**Pure utility functions:** No React, no Three.js. These functions take data and return results. Testable in isolation.

**Priority order:** A deprecated public class could match multiple sign types. Priority: deprecated (construction) > exported (marquee) > access level (neon/brass) > node type (hanging/highway/labelTape). The highest priority match wins.

**Metadata bag:** Sign metadata comes from `node.metadata.visibility`, `node.metadata.isDeprecated`, `node.metadata.isExported`. These are populated by the parser. If missing, defaults apply (e.g., assume public → neon).

### Scope Boundaries

- **DO:** Create sign type selection and visibility utilities
- **DO:** Write comprehensive unit tests
- **DO NOT:** Create R3F sign components (that's story 9-13)
- **DO NOT:** Create LOD calculator hook (that's story 9-14)
- **DO NOT:** Modify CityView (that's story 9-15)

### References

- `packages/ui/src/shared/types/graph.ts` — GraphNode type with metadata
- Tech spec Task Group 2 for sign type definitions

---

## Dev Agent Record

### Implementation Plan
- Created `signUtils.ts` with `SignType` union, `getSignType()`, and `getSignVisibility()`
- Priority chain: deprecated → exported → visibility (private/public) → node type → fallback
- LOD visibility matrix as `Record<number, Set<SignType>>` for O(1) lookup
- 42 comprehensive tests covering all ACs

### Completion Notes
- **`getSignType`:** 8-level priority chain. Deprecated (construction) > exported (marquee) > private (brass) > public (neon) > class/abstract_class (hanging) > file (highway) > variable (labelTape) > fallback (highway).
- **`getSignVisibility`:** LOD 1 shows only highway. LOD 2 adds hanging, neon, marquee. LOD 3 adds brass, labelTape. LOD 4+ shows all including construction. LOD 0/negative shows nothing.
- **42 tests:** 22 for sign type selection (priority, type-based, fallback, missing metadata), 17 for visibility (each LOD level + edge cases), 3 for edge cases (LOD 0, negative, 5+).
- Zero TS errors, 1054 total tests passing, zero regressions.

## File List
- `packages/ui/src/features/canvas/components/signs/signUtils.ts` (NEW)
- `packages/ui/src/features/canvas/components/signs/signUtils.test.ts` (NEW — 42 tests)

---

## Change Log
- 2026-02-06: Created sign selection and visibility utilities with 42 tests. Zero TS errors, zero regressions.
