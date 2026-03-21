# Story 10.2: Extract Shared Hooks from CityView

Status: review

## Story

**ID:** 10-2
**Key:** 10-2-extract-shared-hooks
**Title:** Extract Shared Hooks from CityView
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-A: Structural Refactoring (Phase 0)
**Priority:** HIGH - Prerequisite for CityView decomposition

**As a** developer preparing CityView for decomposition,
**I want** shared computation logic extracted into reusable hooks,
**So that** the three sub-orchestrators (CityBlocks, CitySky, CityAtmosphere) can share logic without duplication.

---

## Acceptance Criteria

- **AC-1:** `useCityLayout(graph)` hook triggers the layout engine and returns positions + district arc metadata
- **AC-2:** `useCityFiltering(graph)` hook splits nodes into internal vs external, filters by LOD level
- **AC-3:** `useDistrictMap(nodes)` hook groups nodes by directory path and builds the nested type map for RooftopGarden
- **AC-4:** Each hook has co-located unit tests
- **AC-5:** CityView refactored to use these hooks (no behavior change)
- **AC-6:** All Story 10-1 interaction tests still pass after refactoring

---

## Tasks/Subtasks

### Task 1: Extract useCityLayout hook (AC: 1)
- [x] Create `packages/ui/src/features/canvas/hooks/useCityLayout.ts`
- [x] Move layout engine invocation logic from CityView into hook
- [x] Return: `{ positions, districtArcs, bounds, groundWidth, groundDepth }`
- [x] Memoize layout computation (only recompute when graph or density changes)

### Task 2: Extract useCityFiltering hook (AC: 2)
- [x] Create `packages/ui/src/features/canvas/hooks/useCityFiltering.ts`
- [x] Move internal/external node splitting logic from CityView
- [x] Move LOD-based filtering logic
- [x] Return: `{ internalNodes, externalNodes, districtGroups, clusters, clusteredNodeIds, childrenByFile, nodeMap, visibleEdges }`

### Task 3: Extract useDistrictMap hook (AC: 3)
- [x] Create `packages/ui/src/features/canvas/hooks/useDistrictMap.ts`
- [x] Move nested type map construction (for RooftopGarden)
- [x] Return: `{ nestedTypeMap }`

### Task 4: Write unit tests (AC: 4)
- [x] Test `useCityLayout` with mock graph — returns positions for all nodes (6 tests)
- [x] Test `useCityFiltering` — correctly splits internal/external, respects LOD (13 tests)
- [x] Test `useDistrictMap` — groups by directory, builds nested type chains (5 tests)

### Task 5: Refactor CityView to use hooks (AC: 5, 6)
- [x] Replace inline computation in CityView with hook calls
- [x] Verify zero behavior change — run Story 10-1 test suite (26/26 pass)
- [x] Verify identical rendering output

---

## Dev Notes

### Architecture & Patterns

**Hook extraction pattern:** Each hook encapsulates one concern. CityView becomes a thin component that calls three hooks and passes results to child components. This is the standard React pattern for separating concerns.

**Memoization:** `useCityLayout` must memoize with `useMemo` keyed on `[graph, layoutDensity]`. Layout is expensive — don't recompute on every render.

### Scope Boundaries

- **DO:** Extract existing logic into hooks — no new behavior
- **DO:** Write tests for each hook in isolation
- **DO NOT:** Change any visual rendering
- **DO NOT:** Add new store state
- **DO NOT:** Begin the CityView decomposition (that's story 10-3)

### References

- `packages/ui/src/features/canvas/views/CityView.tsx` — source of logic to extract
- `packages/ui/src/features/canvas/store.ts` — store hooks consumed
- `packages/ui/src/features/canvas/components/buildings/nestedTypeUtils.ts` — nested type logic

---

## Dev Agent Record

### Implementation Plan
Extracted three hooks from CityView inline logic, wrote co-located tests, refactored CityView to use hooks.

### Completion Notes
- All 24 hook unit tests pass (6 + 13 + 5)
- All 26 CityView regression tests pass (story 10-1 suite)
- TypeScript type-check: no new errors (all pre-existing)
- CityView reduced from 425 to 325 lines; computation logic now reusable for story 10-3

## File List
### New Files
- `packages/ui/src/features/canvas/hooks/useCityLayout.ts` — layout computation hook
- `packages/ui/src/features/canvas/hooks/useCityFiltering.ts` — node splitting, clustering, edge filtering hook
- `packages/ui/src/features/canvas/hooks/useDistrictMap.ts` — nested type map hook
- `packages/ui/src/features/canvas/hooks/useCityLayout.test.ts` — 6 tests
- `packages/ui/src/features/canvas/hooks/useCityFiltering.test.ts` — 13 tests
- `packages/ui/src/features/canvas/hooks/useDistrictMap.test.ts` — 5 tests

### Modified Files
- `packages/ui/src/features/canvas/views/CityView.tsx` — replaced inline useMemo/useEffect blocks with hook calls

---

## Change Log
- 2026-02-10: Story created from tech-spec-city-metaphor-rethink.md
- 2026-02-11: Implementation complete — 3 hooks extracted, 24 tests, CityView refactored
