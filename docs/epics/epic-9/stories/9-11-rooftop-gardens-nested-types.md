# Story 9.11: Rooftop Gardens for Nested Types

Status: done

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
- [x] Create `packages/ui/src/features/canvas/components/buildings/RooftopGarden.tsx`
- [x] R3F component that renders smaller building meshes on top of parent
- [x] Accept props: `parentNode`, `parentWidth`, `parentHeight`, `nestedMap`
- [x] Scale each tier: tier 1 = 60% of parent, tier 2 = 40%, tier 3 = 25%
- [x] Position each tier centered on the roof of the tier below
- [x] If >3 tiers, show count badge text on top tier

### Task 2: Integrate into typed building components (AC: 1, 4)
- [x] Check nested type map for children via `parentId` in graph
- [x] If children exist, render RooftopGarden as sibling in wrapping group
- [x] If no children found (containment analyzer doesn't support it), skip gracefully — no error, no empty rendering

### Task 3: Build child lookup utility (AC: 1, 4)
- [x] Create `nestedTypeUtils.ts` with `buildNestedTypeMap`, `collectNestingTiers`, `countOverflowChildren`
- [x] Filter to only class-level children (class, interface, enum, abstract_class)
- [x] Handle case where parentId data isn't populated — returns empty map

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

### Implementation Plan
- Created `nestedTypeUtils.ts` with three pure utility functions for building nested type hierarchy
- Created `RooftopGarden.tsx` R3F component rendering tiered box meshes on parent roof
- Integrated into CityView via `renderTypedBuilding` — container types (class, abstract_class, file) get rooftop gardens when they have nested children
- Used `buildNestedTypeMap` memo in CityView to avoid recomputing on every render

### Completion Notes
- **nestedTypeUtils.ts:** `buildNestedTypeMap` filters to class-level nested types (class, interface, enum, abstract_class), excluding methods/functions. `collectNestingTiers` walks up to 3 levels. `countOverflowChildren` counts anything beyond tier 3.
- **RooftopGarden.tsx:** Tier scales: 60%, 40%, 25% of parent width. Each tier is 0.8 units tall. Colors: blue → purple → pink. Overflow count badge in yellow.
- **CityView integration:** `renderTypedBuilding` now accepts `nestedMap` param. Container types with nested children get wrapped in a `<group>` with the building + `RooftopGarden`. Non-container types pass through unchanged.
- **Graceful degradation:** If containment analyzer doesn't populate `parentId` for class→inner class, `buildNestedTypeMap` returns empty map and no rooftop gardens render.
- 14 new tests in `nestedTypeUtils.test.ts`. 1013 total tests passing, zero regressions.

## File List
- `packages/ui/src/features/canvas/components/buildings/nestedTypeUtils.ts` (NEW — utility functions)
- `packages/ui/src/features/canvas/components/buildings/nestedTypeUtils.test.ts` (NEW — 14 tests)
- `packages/ui/src/features/canvas/components/buildings/RooftopGarden.tsx` (NEW — R3F component)
- `packages/ui/src/features/canvas/components/buildings/index.ts` (MODIFIED — added exports)
- `packages/ui/src/features/canvas/views/CityView.tsx` (MODIFIED — nestedTypeMap memo, updated renderTypedBuilding)

---

## Change Log
- 2026-02-06: Created RooftopGarden component with nested type utilities. Integrated into CityView with graceful degradation. 14 tests, zero TS errors, zero regressions.
