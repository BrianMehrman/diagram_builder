# Story 9.16: Sign Metadata Extensions on GraphNode

Status: not-started

## Story

**ID:** 9-16
**Key:** 9-16-sign-metadata-extensions
**Title:** Sign Metadata Extensions on GraphNode
**Epic:** Epic 9 - City Visualization Overhaul Phase 1
**Phase:** Epic 9-C: Signage System & Progressive Labels
**Priority:** MEDIUM - Enables sign type differentiation

**As a** developer viewing a codebase,
**I want** sign-relevant metadata available on graph nodes,
**So that** the sign system can determine appropriate sign types.

---

## Acceptance Criteria

- **AC-1:** GraphNode includes optional `visibility?: 'public' | 'protected' | 'private' | 'static'`
- **AC-2:** GraphNode includes optional `isDeprecated?: boolean`
- **AC-3:** GraphNode includes optional `isExported?: boolean`
- **AC-4:** Nodes without sign metadata fall back gracefully — default neon (public), no construction, no marquee
- **AC-5:** Values are read from `node.metadata.visibility`, `node.metadata.isDeprecated`, `node.metadata.isExported`

---

## Tasks/Subtasks

### Task 1: Extend GraphNode interface (AC: 1, 2, 3)
- [ ] Update `packages/ui/src/shared/types/graph.ts`
- [ ] Add `visibility?: 'public' | 'protected' | 'private' | 'static'`
- [ ] Add `isDeprecated?: boolean`
- [ ] Add `isExported?: boolean`
- [ ] Add JSDoc comments

### Task 2: Update ApiGraphNode (AC: 1, 2, 3)
- [ ] Update `packages/ui/src/shared/types/api.ts` if ApiGraphNode has explicit fields
- [ ] Ensure all new fields are optional

### Task 3: Verify sign utility compatibility (AC: 4, 5)
- [ ] Verify `getSignType()` from story 9-12 reads from metadata bag correctly
- [ ] Test fallback behavior when fields are not populated

### Task 4: Update tests (AC: 4)
- [ ] Update `packages/ui/src/shared/types/graph.test.ts`
- [ ] Test node creation with sign metadata fields
- [ ] Test backward compatibility

---

## Dev Notes

### Architecture & Patterns

**Metadata bag transport:** Parser populates `node.metadata.visibility`, `node.metadata.isDeprecated`, `node.metadata.isExported`. The UI type has explicit optional fields for TypeScript convenience, but the actual data transport is via the metadata bag. The sign utilities read from metadata.

**Note on ordering:** This story can be implemented before or after the sign utilities (9-12). The sign utilities already handle missing metadata via fallbacks. This story adds the explicit type fields for documentation and TypeScript support.

### Scope Boundaries

- **DO:** Add sign metadata fields to GraphNode
- **DO:** Verify compatibility with sign utilities
- **DO NOT:** Modify parser to populate these fields
- **DO NOT:** Modify sign components

### References

- `packages/ui/src/shared/types/graph.ts` — GraphNode type
- `packages/ui/src/shared/types/api.ts` — ApiGraphNode type
- `packages/ui/src/features/canvas/components/signs/signUtils.ts` — sign utilities from story 9-12

---

## Dev Agent Record
_To be filled during implementation_

---

## Change Log
_To be filled during implementation_
