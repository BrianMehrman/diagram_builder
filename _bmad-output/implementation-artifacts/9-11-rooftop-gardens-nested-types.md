# Story 9.11: Rooftop Gardens for Nested Types

Status: not-started

## Story

**ID:** 9-11
**Key:** 9-11-rooftop-gardens-nested-types
**Title:** Rooftop Gardens for Nested Types
**Epic:** Epic 9 - City Visualization Overhaul Phase 1
**Phase:** Epic 9-B: Shape Language & Visual Differentiation
**Priority:** MEDIUM - Visual containment relationships

**As a** developer viewing a codebase,
**I want** nested types (inner classes, nested enums) to appear as smaller structures on parent building rooftops,
**So that** I can see containment relationships visually.

---

## Acceptance Criteria

- **AC-1:** Class nodes with children (via `parentId`) render nested structures as smaller buildings on the roof

- **AC-2:** Each nested level is progressively smaller and stacked (tiered, maximum 3 tiers)

- **AC-3:** More than 3 nesting tiers collapse into a count badge on the topmost tier

- **AC-4:** If containment analyzer doesn't support class→inner class `parentId`, rooftop gardens are skipped gracefully

---

## Tasks/Subtasks

### Task 1: Create RooftopGarden component (AC: 1, 2, 3)
- [ ] Create `packages/ui/src/features/canvas/components/buildings/RooftopGarden.tsx`
- [ ] R3F component that renders smaller building meshes on top of parent
- [ ] Accept props: `parentNode`, `childNodes`, `parentDimensions`
- [ ] Scale each tier: tier 1 = 60% of parent, tier 2 = 40%, tier 3 = 25%
- [ ] Position each tier centered on the roof of the tier below
- [ ] If >3 tiers, show count badge text on top tier

### Task 2: Integrate into typed building components (AC: 1, 4)
- [ ] Check `hasNestedTypes` metadata or find children via `parentId` in graph
- [ ] If children exist, render RooftopGarden as child of the building mesh
- [ ] If no children found (containment analyzer doesn't support it), skip gracefully — no error, no empty rendering

### Task 3: Build child lookup utility (AC: 1, 4)
- [ ] Create utility to find nodes whose `parentId` matches a given node ID
- [ ] Filter to only class-level children (inner classes, nested enums)
- [ ] Handle case where parentId data isn't populated

---

## Dev Notes

### Architecture & Patterns

**Prerequisite check:** The containment analyzer (`packages/parser/src/analysis/containmentAnalyzer.ts`) must support class→inner class `parentId` relationships. If it only supports file→class, rooftop gardens won't have data. The component handles this gracefully by checking if children exist.

**Ziggurat stacking:** Each tier is a smaller mesh positioned on top of the previous. This is a simple recursive or iterative render pattern. The `group` R3F element can be used to position each tier.

**Performance:** Rooftop structures are small and only render for nodes that have nested types, so the mesh count impact is minimal.

### Scope Boundaries

- **DO:** Create RooftopGarden component
- **DO:** Integrate into building components
- **DO:** Handle missing containment data gracefully
- **DO NOT:** Modify the containment analyzer
- **DO NOT:** Add click-to-enter interaction for rooftop structures

### References

- `packages/parser/src/analysis/containmentAnalyzer.ts` — containment data source
- `packages/ui/src/features/canvas/components/buildings/` — building components to extend
- `packages/ui/src/shared/types/graph.ts` — `parentId` and `hasNestedTypes` fields

---

## Dev Agent Record
_To be filled during implementation_

---

## Change Log
_To be filled during implementation_
