# Story 10.7: Create FileBlock Component

Status: not-started

## Story

**ID:** 10-7
**Key:** 10-7-file-block-component
**Title:** Create FileBlock Component
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-B: Core Metaphor (Phase 1)
**Priority:** HIGH - Visual representation of files as land plots

**As a** developer viewing a codebase city,
**I want** files rendered as bounded city blocks (land plots) with their children inside,
**So that** I can see which classes and functions belong to each file.

---

## Acceptance Criteria

- **AC-1:** Multi-export files render with a subtle visible boundary (thin ground line or slight color shift)
- **AC-2:** Single-export files (`isMerged: true`) render with hidden boundary — the building IS the file
- **AC-3:** Block color derived from district palette (existing `cityViewUtils.ts` colors)
- **AC-4:** File name label visible at LOD 2+ (text at edge of block)
- **AC-5:** Boundary is subtle — building is always the dominant visual, not the plot
- **AC-6:** Component has co-located unit tests

---

## Tasks/Subtasks

### Task 1: Create FileBlock component (AC: 1, 2, 3, 5)
- [ ] Create `packages/ui/src/features/canvas/components/FileBlock.tsx`
- [ ] Props: `block: BlockLayout`, `districtColor: string`, `lodLevel: number`
- [ ] Render ground plane as thin rectangle with district color (slight alpha)
- [ ] Render boundary as thin line edges (not walls/fences)
- [ ] If `isMerged`: skip boundary rendering, only render ground tint
- [ ] Boundary styling: subtle — low opacity, thin stroke

### Task 2: Add file name label (AC: 4)
- [ ] Render file name as text sprite at block edge
- [ ] Visible only when `lodLevel >= 2`
- [ ] Use existing sign/label patterns from Epic 9-C

### Task 3: Write unit tests (AC: 6)
- [ ] Test: multi-export block renders visible boundary
- [ ] Test: merged block renders without boundary
- [ ] Test: file name hidden at LOD 1, visible at LOD 2+
- [ ] Test: correct district color applied

---

## Dev Notes

### Architecture & Patterns

**Subtle boundaries:** The design principle is "building dominant, plot subordinate." Think of it as a property line on a map — visible when you look for it, but not the first thing you notice. A thin ground-level line (THREE.Line or EdgesGeometry), not a wall or fence.

**Merged mode:** Single-export files don't need a visible container. The class building itself represents the file. A subtle ground color tint is enough to indicate the file boundary exists.

### Scope Boundaries

- **DO:** Create the FileBlock visual component
- **DO NOT:** Handle child placement (that's story 10-10)
- **DO NOT:** Modify the layout engine (that's story 10-6)

### References

- `packages/ui/src/features/canvas/components/DistrictGround.tsx` — similar ground plane pattern
- `packages/ui/src/features/canvas/views/cityViewUtils.ts` — color palette
- `packages/ui/src/features/canvas/layout/types.ts` — BlockLayout type

---

## Dev Agent Record

### Implementation Plan
_To be filled during implementation_

### Completion Notes
_To be filled on completion_

## File List
_To be filled during implementation_

---

## Change Log
- 2026-02-10: Story created from tech-spec-city-metaphor-rethink.md
