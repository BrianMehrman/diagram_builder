# Story 9.7: Extend GraphNode Type Union & Shape Metadata

Status: review

## Story

**ID:** 9-7
**Key:** 9-7-extend-graphnode-type-union
**Title:** Extend GraphNode Type Union & Shape Metadata
**Epic:** Epic 9 - City Visualization Overhaul Phase 1
**Phase:** Epic 9-B: Shape Language & Visual Differentiation
**Priority:** CRITICAL - Prerequisite for all shape language stories

**As a** developer viewing a codebase,
**I want** the system to recognize interfaces, enums, and abstract classes as distinct types,
**So that** each can be rendered with a unique visual identity.

---

## Acceptance Criteria

- **AC-1:** GraphNode.type union includes `'interface' | 'enum' | 'abstract_class'` alongside existing types
  - New union: `'file' | 'class' | 'function' | 'method' | 'variable' | 'interface' | 'enum' | 'abstract_class'`

- **AC-2:** GraphNode includes optional shape metadata fields: `methodCount?: number`, `isAbstract?: boolean`, `hasNestedTypes?: boolean`

- **AC-3:** Shape metadata values are read from `node.metadata.methodCount`, `node.metadata.isAbstract`, etc. (metadata bag transport pattern — no API schema changes)

- **AC-4:** All new fields are optional — no breaking changes to existing code

- **AC-5:** Unit tests validate type usage with new types and metadata

---

## Tasks/Subtasks

### Task 1: Extend GraphNode type union (AC: 1, 4)
- [x] Update `packages/ui/src/shared/types/graph.ts`
- [x] Add `'interface' | 'enum' | 'abstract_class'` to the type union
- [x] Verify TypeScript compilation passes (all new types are in the union, no breaking changes)

### Task 2: Add shape metadata fields (AC: 2)
- [x] Add `methodCount?: number` to GraphNode
- [x] Add `isAbstract?: boolean` to GraphNode
- [x] Add `hasNestedTypes?: boolean` to GraphNode
- [x] Add JSDoc comments explaining each field

### Task 3: Update ApiGraphNode if needed (AC: 3, 4)
- [x] Check `packages/ui/src/shared/types/api.ts` for ApiGraphNode
- [x] Add matching optional fields (methodCount, isAbstract, hasNestedTypes)
- [x] Ensure API responses can carry new types (ApiGraphNode.type is `string`, already accepts any value)

### Task 4: Write unit tests (AC: 5)
- [x] Update `packages/ui/src/shared/types/graph.test.ts`
- [x] Test creating nodes with type `'interface'`, `'enum'`, `'abstract_class'`
- [x] Test creating nodes with shape metadata fields
- [x] Test backward compatibility (nodes without new fields still valid)

---

## Dev Notes

### Architecture & Patterns

**Metadata bag transport:** Parser populates fields via `metadata: Record<string, unknown>`. UI reads from `node.metadata.methodCount` etc. This is the established pattern from `externalDetector.ts`. No API schema changes needed.

**Optional fields only:** All new fields must be optional. Making them required would break every existing GraphNode creation site.

**Prerequisite story:** Stories 9-8 through 9-11 depend on these type extensions being in place.

### Scope Boundaries

- **DO:** Extend type union and add metadata fields
- **DO:** Update ApiGraphNode to match
- **DO:** Write tests
- **DO NOT:** Modify parser to populate new fields (parser work is separate)
- **DO NOT:** Create building components (that's stories 9-8, 9-9)
- **DO NOT:** Add sign-related fields (that's story 9-16)

### References

- `packages/ui/src/shared/types/graph.ts` — GraphNode type (line 19-31)
- `packages/ui/src/shared/types/api.ts` — ApiGraphNode type
- `packages/ui/src/shared/types/graph.test.ts` — existing tests

---

## Dev Agent Record

### Implementation Plan
- Extended GraphNode.type union with 3 new types: `interface`, `enum`, `abstract_class`
- Added 3 optional shape metadata fields with JSDoc comments
- Updated ApiGraphNode with matching optional fields
- Added 4 new tests + updated existing type coverage test

### Completion Notes
- **GraphNode.type:** Union extended from 5 to 8 types. All new types are optional additions — no breaking changes.
- **Shape metadata:** `methodCount`, `isAbstract`, `hasNestedTypes` added as optional fields with JSDoc. These will be populated by the parser via the metadata bag transport pattern.
- **ApiGraphNode:** Already uses `type: string` (not a union), so it accepts any type value. Added matching optional shape fields for explicit transport.
- **Tests:** 4 new tests (interface node, enum node, abstract class with all metadata, backward compatibility). 11 total tests passing.
- **Zero TS errors** in changed files. No existing code broken — all fields optional.

## File List
- `packages/ui/src/shared/types/graph.ts` (MODIFIED — type union + shape metadata fields)
- `packages/ui/src/shared/types/api.ts` (MODIFIED — ApiGraphNode shape metadata fields)
- `packages/ui/src/shared/types/graph.test.ts` (MODIFIED — 4 new tests)

---

## Change Log
- 2026-02-06: Extended GraphNode type union with interface/enum/abstract_class, added shape metadata fields, updated ApiGraphNode, 4 new tests. Zero TS errors, zero regressions.
