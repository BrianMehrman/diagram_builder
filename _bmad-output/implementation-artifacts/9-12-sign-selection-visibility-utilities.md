# Story 9.12: Sign Selection & Visibility Utilities

Status: not-started

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
- [ ] Create `packages/ui/src/features/canvas/components/signs/signUtils.ts`
- [ ] Define `SignType` union type: `'neon' | 'brass' | 'hanging' | 'highway' | 'labelTape' | 'marquee' | 'construction'`
- [ ] Implement `getSignType(node: GraphNode): SignType`
- [ ] Priority order for multiple matches: deprecated > exported > visibility-based > type-based

### Task 2: Implement visibility logic (AC: 8)
- [ ] Implement `getSignVisibility(signType: SignType, lodLevel: number): boolean`
- [ ] Define LOD visibility matrix as a constant map
- [ ] LOD 1: `['highway']`
- [ ] LOD 2: `['highway', 'hanging', 'neon', 'marquee']`
- [ ] LOD 3: `['highway', 'hanging', 'neon', 'marquee', 'brass', 'labelTape']`
- [ ] LOD 4: all types

### Task 3: Write unit tests (AC: 9)
- [ ] Create `packages/ui/src/features/canvas/components/signs/signUtils.test.ts`
- [ ] Test each node type/metadata → sign type mapping
- [ ] Test each LOD level → visibility mapping
- [ ] Test fallback behavior when metadata is missing
- [ ] Test priority when node has multiple matching conditions

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
_To be filled during implementation_

---

## Change Log
_To be filled during implementation_
