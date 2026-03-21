# Story 11.9: Reclassify Edge Routing — Underground vs Overhead

Status: review

## Story

**ID:** 11-9
**Key:** 11-9-reclassify-edge-routing
**Title:** Reclassify Edge Routing — Underground vs Overhead
**Epic:** Epic 11 - Vertical Layering — 3D Semantic City
**Phase:** Epic 11-C: Underground Connection Layer
**Priority:** CRITICAL - Core routing logic change

**As a** developer viewing the city visualization,
**I want** structural relationships (imports, extends, implements) routed underground and runtime relationships (method calls, composition) routed overhead,
**So that** the visual routing of connections reflects their semantic nature.

**Spec Reference:** `city-metaphor-vertical-layering-spec.md` Section 6

---

## Acceptance Criteria

- **AC-1:** Edge classifier function routes edges to `underground` or `overhead` based on relationship type
- **AC-2:** Underground: `import`, `extends`, `implements`, dependency injection
- **AC-3:** Overhead: method-to-method calls, composition references
- **AC-4:** Existing SkyEdge component updated to only render overhead edges (method calls, composition)
- **AC-5:** Underground edges rendered via UndergroundPipe component (Story 11-8)
- **AC-6:** Intra-district import edges that were previously hidden (proximity-encoded) now have underground pipe option
- **AC-7:** Co-located unit tests

---

## Tasks/Subtasks

### Task 1: Create edge routing classifier (AC: 1, 2, 3)
- [ ] Create `classifyEdgeRouting(edge: GraphEdge): 'underground' | 'overhead'`
- [ ] Mapping:
  - `import` / `imports` / `IMPORTS` → underground
  - `extends` / `EXTENDS` → underground
  - `implements` / `IMPLEMENTS` → underground
  - `calls` / `CALLS` / method call → overhead
  - `composes` / `COMPOSES` / composition → overhead
  - Unknown/default → underground (safer default — structural)
- [ ] Pure function, case-insensitive matching
- [ ] File: `packages/ui/src/features/canvas/views/cityViewUtils.ts`

### Task 2: Update CitySky to filter overhead-only edges (AC: 4)
- [ ] Modify `CitySky.tsx` (or equivalent sky orchestrator)
- [ ] Filter edges through classifier — only pass `overhead` edges to `SkyEdge` components
- [ ] Remove extends/implements Y-height tiers from SkyEdge (no longer needed)
- [ ] Update SkyEdge color coding: method calls = one color, composition = another

### Task 3: Create underground edge rendering pass (AC: 5, 6)
- [ ] Create `CityUnderground.tsx` orchestrator component (or extend existing underground mode)
- [ ] Filter edges through classifier — only pass `underground` edges to `UndergroundPipe` components
- [ ] Render all underground pipes as children
- [ ] Visibility controlled by underground toggle (Story 11-10)

### Task 4: Update edge rendering pipeline (AC: 4, 5)
- [ ] Modify CityView (or CityBlocks) to render both `CitySky` and `CityUnderground`
- [ ] Ensure both layers use the same edge data source, filtered differently
- [ ] Remove old edge rendering that doesn't distinguish routing

### Task 5: Write tests (AC: 7)
- [ ] Test: import edge → underground
- [ ] Test: extends edge → underground
- [ ] Test: implements edge → underground
- [ ] Test: method call edge → overhead
- [ ] Test: composition edge → overhead
- [ ] Test: unknown edge type → underground (default)
- [ ] Test: CitySky only renders overhead edges
- [ ] Test: CityUnderground only renders underground edges

---

## Dev Notes

- This is the **key architectural change** from the vertical layering spec — it splits the single edge rendering system into two distinct layers
- Existing `SkyEdge` component from Story 10-12 will need significant modification (remove extends/implements tiers)
- Existing `GroundShadow` component from Story 10-13 may need updating — shadows now only for overhead wires
- Edge type naming conventions from the parser need verification — check what strings are actually in `GraphEdge.type`

## Dependencies
- 11-8 (underground pipe component)
- 10-12 (existing SkyEdge component to modify)
- 10-17 (existing CitySky orchestrator to modify)

## Files Modified / Created

- `packages/ui/src/features/canvas/views/cityViewUtils.ts` — Added `classifyEdgeRouting()` and `EdgeRouting` type
- `packages/ui/src/features/canvas/views/cityViewUtils.test.ts` — Added 11 classifier tests
- `packages/ui/src/features/canvas/components/CityUnderground.tsx` — NEW orchestrator filtering underground edges → UndergroundPipe
- `packages/ui/src/features/canvas/components/CityUnderground.test.ts` — NEW 6 pure utility tests
- `packages/ui/src/features/canvas/components/skyEdgeUtils.ts` — Updated: only `calls` maps to sky tier; `inherits`/`imports`/`depends_on` return null
- `packages/ui/src/features/canvas/components/skyEdgeUtils.test.ts` — Rewritten to reflect new sky-only routing
- `packages/ui/src/features/canvas/components/SkyEdge.test.ts` — Rewritten: tests now use `calls` as sky edge
- `packages/ui/src/features/canvas/components/GroundShadow.test.ts` — Updated: tests use `calls` instead of `imports`
- `packages/ui/src/features/canvas/views/CitySky.tsx` — Pre-filters edges in v2 mode: only overhead edges reach SkyEdge
- `packages/ui/src/features/canvas/views/CityView.tsx` — Added CityUnderground in v2 mode underground block
