# Story 9.2: Radial City Layout Engine

Status: done

## Story

**ID:** 9-2
**Key:** 9-2-radial-city-layout-engine
**Title:** Radial City Layout Engine
**Epic:** Epic 9 - City Visualization Overhaul Phase 1
**Phase:** Epic 9-A: Radial City Layout & Navigation
**Priority:** CRITICAL - Core layout engine

**As a** developer viewing a codebase,
**I want** the city to render in a radial layout,
**So that** I can see the architectural flow from entry point outward.

---

## Acceptance Criteria

- **AC-1:** `RadialCityLayoutEngine` implements `LayoutEngine` interface with type `'radial-city'`

- **AC-2:** `RadialCityLayoutConfig` is a typed interface extending `LayoutConfig` with explicit fields: `ringSpacing`, `arcPadding`, `districtGap`, `buildingSpacing`, `centerRadius`, `density`

- **AC-3:** Given a graph with depth-annotated nodes, `layout()` returns positions in concentric rings with depth-0 at center and deeper nodes at outer rings

- **AC-4:** External nodes are positioned at the outermost ring

- **AC-5:** Engine is registered in `LayoutRegistry` alongside existing `CityLayoutEngine`

- **AC-6:** Unit tests validate layout output for sample graphs

---

## Tasks/Subtasks

### Task 1: Define RadialCityLayoutConfig (AC: 2)
- [x] Create typed interface extending `LayoutConfig`
- [x] Fields: `ringSpacing?: number`, `arcPadding?: number`, `districtGap?: number`, `buildingSpacing?: number`, `centerRadius?: number`, `density?: number`
- [x] Sensible defaults for all fields

### Task 2: Implement RadialCityLayoutEngine (AC: 1, 3, 4)
- [x] Create `packages/ui/src/features/canvas/layout/engines/radialCityLayout.ts`
- [x] Implement `LayoutEngine` interface (type, layout, canHandle)
- [x] `layout()`: Group nodes by directory, use radial utility functions from story 9-1
- [x] Position entry points at center, internal nodes on depth rings, external nodes at outermost ring
- [x] Compute bounding box from positions
- [x] Return LayoutResult with positions, bounds, and metadata (districtCount, ringCount, etc.)

### Task 3: Register in LayoutRegistry (AC: 5)
- [x] Update `packages/ui/src/features/canvas/layout/engines/index.ts` to export engine
- [x] Register in layout registry alongside existing CityLayoutEngine

### Task 4: Write unit tests (AC: 6)
- [x] Create `packages/ui/src/features/canvas/layout/engines/radialCityLayout.test.ts`
- [x] Test layout with simple graph (5 nodes, 2 depths)
- [x] Test layout with external nodes
- [x] Test layout with multiple directories at same depth
- [x] Test that output conforms to LayoutResult interface
- [x] Test config defaults

---

## Dev Notes

### Architecture & Patterns

**Implements LayoutEngine interface:** Must have `type`, `layout(graph, config)`, and `canHandle(graph)`. See `packages/ui/src/features/canvas/layout/types.ts`.

**Uses radial utils from story 9-1:** This engine orchestrates the utility functions — it doesn't duplicate the math. It groups nodes, delegates to utils, and assembles the LayoutResult.

**canHandle:** Returns true for graphs containing file-type nodes (same as CityLayoutEngine). Both engines remain registered. CityView will use explicit type selection (story 9-4).

**No `any` types:** Config interface must use explicit typed fields, not `[key: string]: unknown` index signature only. Extends LayoutConfig which has the index signature for compatibility.

### Scope Boundaries

- **DO:** Create the engine class and config interface
- **DO:** Use utility functions from story 9-1
- **DO:** Register in layout registry
- **DO NOT:** Modify CityView.tsx (that's story 9-4)
- **DO NOT:** Add store state (that's story 9-5)
- **DO NOT:** Create UI components

### References

- `packages/ui/src/features/canvas/layout/types.ts` — LayoutEngine, LayoutConfig, LayoutResult
- `packages/ui/src/features/canvas/layout/engines/cityLayout.ts` — existing engine for pattern reference
- `packages/ui/src/features/canvas/layout/registry.ts` — LayoutRegistry
- `packages/ui/src/features/canvas/layout/bounds.ts` — boundsFromPositions utility

---

## Dev Agent Record

### Implementation Plan
- Created `RadialCityLayoutConfig` interface extending `LayoutConfig` with 6 typed fields and sensible defaults
- Created `RadialCityLayoutEngine` class implementing `LayoutEngine` interface
- Engine orchestrates radial utility functions from story 9-1 — no duplicated math
- Layout pipeline: separate internal/external nodes → position entry points at center → group by directory → distribute across rings → assign arcs → position nodes → place externals at outermost ring
- Density multiplier scales `ringSpacing` and `centerRadius` proportionally
- Exported from both engine index and layout module index

### Completion Notes
- **RadialCityLayoutConfig:** 6 optional fields with defaults: ringSpacing=20, arcPadding=0.05, districtGap=5, buildingSpacing=2, centerRadius=10, density=1.0
- **RadialCityLayoutEngine.layout():** Groups file nodes by directory, uses `distributeDistrictsAcrossRings` to handle multi-depth districts, then `assignDistrictArcs` + `positionNodesInArc` per ring. External nodes placed at `maxDepth + 1` ring. All y=0 (height handled by view layer).
- **canHandle:** Returns true for graphs with file nodes (same as CityLayoutEngine — explicit selection in story 9-4)
- **Metadata:** Returns districtCount, ringCount, externalCount, entryPointCount
- 16 unit tests covering: type, canHandle, simple/external/multi-directory graphs, config defaults, determinism, LayoutResult shape
- 108 total layout tests pass, zero regressions

## File List
- `packages/ui/src/features/canvas/layout/engines/radialCityLayout.ts` (NEW)
- `packages/ui/src/features/canvas/layout/engines/radialCityLayout.test.ts` (NEW)
- `packages/ui/src/features/canvas/layout/engines/index.ts` (MODIFIED — added RadialCityLayoutEngine export)
- `packages/ui/src/features/canvas/layout/index.ts` (MODIFIED — added RadialCityLayoutEngine export)

---

## Change Log
- 2026-02-05: Implemented RadialCityLayoutEngine with config interface, layout pipeline, registry exports, and 16 unit tests. All tests passing, zero regressions.
