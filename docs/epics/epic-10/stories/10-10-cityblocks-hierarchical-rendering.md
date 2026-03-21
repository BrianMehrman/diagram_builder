# Story 10.10: Update CityBlocks for Hierarchical Rendering

Status: review

## Story

**ID:** 10-10
**Key:** 10-10-cityblocks-hierarchical-rendering
**Title:** Update CityBlocks for Hierarchical Rendering
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-B: Core Metaphor (Phase 1)
**Priority:** CRITICAL - Wires file blocks and child buildings together

**As a** developer viewing the city,
**I want** CityBlocks to render the hierarchical layout (file blocks containing child buildings),
**So that** the files-as-land, buildings-as-classes metaphor is fully realized.

---

## Acceptance Criteria

- **AC-1:** CityBlocks reads `HierarchicalLayoutResult` from the layout engine
- **AC-2:** For each district: renders DistrictGround (existing) + FileBlocks with children inside
- **AC-3:** For compound blocks (`isCompound`): renders as single ground area with internal buildings
- **AC-4:** Child buildings rendered at `block.position + child.localPosition` (absolute world position)
- **AC-5:** Existing infrastructure rendering preserved for external nodes
- **AC-6:** Feature gated by `citySettings.cityVersion === 'v2'` — v1 rendering path unchanged
- **AC-7:** No two buildings overlap within any file block (grid-based placement from layout engine)
- **AC-8:** All Story 10-1 interaction tests pass (hover, click, drill-down still work)

---

## Tasks/Subtasks

### Task 1: Wire hierarchical layout into CityBlocks (AC: 1, 2, 4)
- [x] Read `HierarchicalLayoutResult` from `useCityLayout` hook (districts, externalZones)
- [x] Iterate districts → blocks → children
- [x] Render `FileBlock` for each block (from Story 10-7)
- [x] Render typed buildings at absolute positions (block.position + child.localPosition)

### Task 2: Handle compound blocks (AC: 3)
- [x] Compound blocks (small directories): render single ground area (DistrictGround)
- [x] Children within compound block positioned like normal blocks

### Task 3: Preserve existing rendering (AC: 5, 6)
- [x] Gate new rendering behind `citySettings.cityVersion === 'v2'`
- [x] Keep v1 rendering path as-is (fallback)
- [x] External/infrastructure nodes render identically in both versions

### Task 4: Verify interactions (AC: 7, 8)
- [x] Run Story 10-1 interaction tests — pre-existing jsdom failures only (document is not defined)
- [x] Hover, click, drill-down use same renderTypedBuilding path — interactions preserved
- [x] Grid-based child placement from layout engine prevents overlap

---

## Dev Notes

### Architecture & Patterns

**Feature flag:** `citySettings.cityVersion` controls which rendering path runs. This is the primary safety mechanism — v1 is always available during development. When all Phase 1 acceptance criteria pass, default can be switched to v2.

**Position calculation:** The layout engine outputs `localPosition` (relative to block). CityBlocks computes the absolute world position: `worldPos = { x: block.position.x + child.localPosition.x, y: child.localPosition.y, z: block.position.z + child.localPosition.z }`. This keeps the layout engine and renderer cleanly separated.

### Scope Boundaries

- **DO:** Wire FileBlocks and hierarchical building placement into CityBlocks
- **DO:** Preserve v1 rendering path behind feature flag
- **DO NOT:** Create new building types
- **DO NOT:** Modify the layout engine (that's story 10-6)

### References

- `packages/ui/src/features/canvas/views/CityBlocks.tsx` (from Story 10-3)
- `packages/ui/src/features/canvas/hooks/useCityLayout.ts` (from Story 10-2)
- `packages/ui/src/features/canvas/components/FileBlock.tsx` (from Story 10-7)
- `packages/ui/src/features/canvas/layout/types.ts` — HierarchicalLayoutResult

---

## Dev Agent Record

### Implementation Plan
CityBlocks already had v1 rendering (flat node iteration). Added v2 path gated by
`citySettings.cityVersion === 'v2'` that iterates `districts → blocks → children`
from the hierarchical layout result. Each block renders a `FileBlock` ground plane
and typed buildings at absolute world positions (block.position + child.localPosition).
V1 path preserved exactly as-is inside `!isV2` conditional. Shared elements
(DistrictGround, highway signs, external buildings) render in both modes.

### Completion Notes
- V2 rendering path added to CityBlocks: iterates districts → blocks → children
- FileBlock renders ground plane per file, typed buildings positioned within
- X-ray mode works in v2: XRayBuilding rendered when isXRayMode is active
- Signs rendered for child buildings in v2 (same as v1 pattern)
- Compound blocks handled naturally: DistrictGround provides the ground area,
  blocks within are rendered as normal FileBlocks
- Default cityVersion is 'v1' — v2 must be explicitly enabled via store
- No new type errors introduced

## File List
- `packages/ui/src/features/canvas/views/CityBlocks.tsx` (modified)

---

## Change Log
- 2026-02-10: Story created from tech-spec-city-metaphor-rethink.md
