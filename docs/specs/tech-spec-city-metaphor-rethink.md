# Tech-Spec: City Metaphor Rethink — Hierarchical Containment, Sky Edges, and Atmospheric Indicators

**Created:** 2026-02-10
**Status:** Ready for Development

---

## Overview

### Problem Statement

The current city visualization treats files, classes, and functions as peer buildings on a flat ground plane (Y=0). This flattens a hierarchy that's meaningful in code — files contain classes, classes contain methods — making the visualization harder to interpret than the code itself. Vertical space above the city is completely unused: no elevated dependency edges, no atmospheric information, no metric overlays.

Additionally, the developer mental model doesn't map to the current metaphor. Developers think in modules, classes, and call chains — not individual files as independent buildings. The visualization should reinforce spatial memory ("the auth module is over there") rather than require memorizing which buildings belong together.

### Solution

A complete rethink of the city metaphor organized in five layers:

1. **Land (Files):** Files become city blocks — bounded plots of land. Classes and functions are structures *on* that land. Directory-size-aware: small directories (1-3 files) render as compound blocks; larger directories show individual file blocks.

2. **Buildings (Classes, Functions):** ⚠️ **PARTIALLY SUPERSEDED** — See `city-metaphor-vertical-layering-spec.md`. Floor bands remain as LOD 1-2 simplification only; at LOD 3+, methods render as **box-shaped rooms inside buildings**. Building height is now driven primarily by containment (must accommodate method rooms). Base classes get distinct color scheme + box profile. Standalone functions are kiosks/small shops. Original text preserved below for reference: ~~Classes are multi-story buildings with visible floor bands (one per method, log-scaled height). Standalone functions are small shops. Building height is configurable (method count, LOC, complexity, dependency count, change frequency).~~

3. **Sky (Edges):** ⚠️ **PARTIALLY SUPERSEDED** — See `city-metaphor-vertical-layering-spec.md`. Inheritance (`extends`) and `implements` now route **underground** as plumbing, NOT as sky edges. Only method-to-method calls and composition remain overhead as wires. Original text preserved below for reference: ~~Dependency edges are elevated arcs tiered by type. Intra-district relationships encoded as spatial proximity (no lines). Cross-district imports as mid-sky arcs. Inheritance/implementation as high arcs. Ground shadows provide discoverability. Transit map overlay mode available.~~

4. **Atmosphere (Indicators):** City-native environmental indicators for code health metrics. Construction cranes (change frequency), smog (complexity), lighting (test coverage), boarded-up facades (deprecated). All toggleable and data-graceful.

5. **LOD (Progressive Disclosure):** 5-tier LOD from satellite (district silhouettes) to interior (method details). Float-based (0.0-4.0) with smooth fade-in. No manual needed — zoom to explore.

### Scope

**In Scope:**
- Layout engine rework (hierarchical output, two-phase positioning)
- CityView decomposition (CityBlocks, CitySky, CityAtmosphere)
- File block rendering with child placement
- Floor band system for class buildings
- Tiered sky edge rendering with ground shadows
- Toggleable atmospheric indicators
- Configurable height encoding
- Transit map overlay mode
- 5-tier LOD cascade
- Feature flag (`city-v2`) for safe rollout
- One-time onboarding tooltip

**Out of Scope:**
- Parser changes (all needed metadata already exists)
- Edge bundling (deferred enhancement)
- Underground layer (future consideration)
- LOD 4 interior view implementation (future epic)
- New building types beyond existing set

---

## Context for Development

### Codebase Patterns

- **Layout engines** implement `LayoutEngine` interface from `layout/types.ts`: `type`, `layout(graph, config)`, `canHandle(graph)`
- **Canvas store** is Zustand (`useCanvasStore`) with verb-first actions: `set{Property}`, `update{Property}`, `toggle{Property}`
- **Building components** are per-type: `ClassBuilding`, `FunctionShop`, `InterfaceBuilding`, `AbstractBuilding`, `VariableCrate`, `EnumCrate`
- **R3F constraint:** `<line>` conflicts with SVG — use `<primitive object={new THREE.Line(...)} />`
- **TS strict:** Array index access needs `!` assertion
- **Tests:** Co-located `.test.ts` files using Vitest + `@testing-library/react`

### Files to Reference

| Purpose | Path |
|---|---|
| Layout types | `packages/ui/src/features/canvas/layout/types.ts` |
| Radial layout engine | `packages/ui/src/features/canvas/layout/engines/radialCityLayout.ts` |
| Layout utilities | `packages/ui/src/features/canvas/layout/engines/radialLayoutUtils.ts` |
| Cluster utilities | `packages/ui/src/features/canvas/layout/engines/clusterUtils.ts` |
| CityView | `packages/ui/src/features/canvas/views/CityView.tsx` |
| City view utilities | `packages/ui/src/features/canvas/views/cityViewUtils.ts` |
| Building geometry factory | `packages/ui/src/features/canvas/components/buildings/buildingGeometry.ts` |
| Building types | `packages/ui/src/features/canvas/components/buildings/types.ts` |
| Building index | `packages/ui/src/features/canvas/components/buildings/index.ts` |
| RooftopGarden | `packages/ui/src/features/canvas/components/buildings/RooftopGarden.tsx` |
| Nested type utils | `packages/ui/src/features/canvas/components/buildings/nestedTypeUtils.ts` |
| District ground | `packages/ui/src/features/canvas/components/DistrictGround.tsx` |
| Cluster building | `packages/ui/src/features/canvas/components/ClusterBuilding.tsx` |
| City edge | `packages/ui/src/features/canvas/components/CityEdge.tsx` |
| Canvas store | `packages/ui/src/features/canvas/store.ts` |
| Graph types (UI) | `packages/ui/src/shared/types/graph.ts` |
| IVM types (Core) | `packages/core/src/ivm/types.ts` |

### Technical Decisions

| Decision | Rationale |
|---|---|
| Hierarchical layout output, flat store API | Layout engine produces block→children hierarchy internally; public `layoutPositions` remains flat map for backward compatibility |
| Floor bands via vertex coloring on single mesh | Prevents draw call explosion — one draw call per building regardless of floor count |
| Type-based edge height (not distance-based) | Stable across density slider changes |
| Ground shadows via orthographic Y=0 projection | Always aligned with sky edges regardless of camera angle |
| Deterministic force-directed sub-layout | Seeded by hash of node IDs; same input always produces same output |
| Grid-based child placement within blocks | Guaranteed non-overlapping; cell size = `footprint / ceil(sqrt(childCount))` |
| Feature flag `city-v2` | Current city view preserved during development; no big-bang migration |

---

## Implementation Plan

### Phase 0: Structural Refactoring (Pre-requisite)

> Goal: Decompose CityView and prepare layout engine for hierarchical output. No visual changes.

- [ ] **Task 0.1:** Write CityView interaction test suite
  - Test: hover highlights building
  - Test: click selects building
  - Test: double-click drills down (viewMode transition)
  - Test: district ground renders for each directory
  - Test: edges render between connected nodes
  - Test: LOD 1 clustering activates for large districts
  - These tests become the regression safety net for all subsequent work

- [ ] **Task 0.2:** Extract shared hooks from CityView
  - `useCityLayout(graph)` — triggers layout engine, returns positions + district metadata
  - `useCityFiltering(graph)` — splits internal vs external nodes, filters by LOD
  - `useDistrictMap(nodes)` — groups nodes by directory, builds nested type map
  - Each hook tested independently

- [ ] **Task 0.3:** Decompose CityView into sub-orchestrators
  - `CityBlocks.tsx` — renders file blocks, buildings, ground planes, signs, clusters
  - `CitySky.tsx` — renders edges (currently CityEdge, later SkyEdge)
  - `CityAtmosphere.tsx` — empty shell for Phase 3
  - `CityView.tsx` becomes thin composition shell: `<CityBlocks /> <CitySky /> <CityAtmosphere />`
  - Run interaction test suite — all tests must pass

- [ ] **Task 0.4:** Extend layout types for hierarchical output
  - Add `HierarchicalLayoutResult` to `types.ts`:
    ```typescript
    interface BlockLayout {
      fileId: string;
      position: Position3D;
      footprint: { width: number; depth: number };
      children: {
        nodeId: string;
        localPosition: Position3D; // relative to block origin
      }[];
      isMerged: boolean; // single-export file merged with its building
    }

    interface DistrictLayout {
      id: string;
      arc: DistrictArc;
      blocks: BlockLayout[];
      isCompound: boolean; // small directory rendered as one compound block
    }

    interface HierarchicalLayoutResult extends LayoutResult {
      districts: DistrictLayout[];
      externalZones: InfrastructureZone[];
    }
    ```
  - Flat `layoutPositions` map derived from hierarchical result

- [ ] **Task 0.5:** Extend canvas store with forward-planned state
  - Add `citySettings` namespace:
    ```typescript
    citySettings: {
      heightEncoding: 'methodCount' | 'dependencies' | 'loc' | 'complexity' | 'churn';
      transitMapMode: boolean;
      atmosphereOverlays: {
        cranes: boolean;
        smog: boolean;
        lighting: boolean;
        deprecated: boolean;
      };
      edgeTierVisibility: {
        crossDistrict: boolean;
        inheritance: boolean;
      };
      cityVersion: 'v1' | 'v2'; // feature flag
    }
    ```
  - Use Zustand selectors for all new slices

### Phase 1: Core Metaphor — Files as Land, Methods as Floors

> Goal: Files become city blocks with buildings placed inside them. Class buildings show floor bands.

- [ ] **Task 1.1:** Implement two-phase layout in RadialCityLayoutEngine
  - **Phase A:** Place file blocks on radial rings (existing ring logic, but footprint-aware spacing)
  - **Phase B:** Place children within each file block using grid layout
  - Footprint calculation: `calculateBlockFootprint(childCount, childTypes) → { width, depth }`
    - Minimum: 4x4 units
    - Maximum: capped, excess children grid-wrapped
  - Feed footprint sizes back into ring spacing to prevent overlap
  - Directory-size-aware: dirs with 1-3 files produce compound blocks (`isCompound: true`)
  - Deterministic force-directed refinement within districts (seeded, capped at 100 iterations)
  - Proximity placement for nodes with actual `imports` edges between them
  - Handle edge cases:
    - Orphan nodes (parentId → non-existent parent): collect into "homeless" block per district
    - Circular parentId chains: visited-set detection, break cycle
    - Zero children: file block still gets minimum footprint

- [ ] **Task 1.2:** Create FileBlock component
  - Renders the file's ground plot as a subtle boundary (thin ground line or slight color shift)
  - Multi-export files: visible boundary
  - Single-export files (`isMerged`): boundary hidden, building IS the file representation
  - Block color derived from district palette (existing `cityViewUtils.ts` colors)
  - File name label at edge of block (visible at LOD 2+)

- [ ] **Task 1.3:** Implement floor band rendering on class buildings
  - ⚠️ **PARTIALLY SUPERSEDED** — See `city-metaphor-vertical-layering-spec.md` Section 5.
  - Floor bands remain valid as **LOD 1-2 simplification only**. At LOD 3+, methods render as box-shaped rooms inside buildings with public methods on lower floors and private/protected on upper floors.
  - Modify `ClassBuilding.tsx`:
    - Height = `log2(methodCount + 1) * FLOOR_HEIGHT` (log-scaled)
    - Floor bands rendered as vertex coloring on single mesh geometry (NOT separate meshes)
    - Floor color by visibility: public = light/glass, private = dark/solid, protected = tinted
    - Default to "public" coloring when visibility data undefined
    - Minimum 1 floor for zero-method classes ("lobby" floor)
    - Apply same to `AbstractBuilding` and `InterfaceBuilding`
  - Floor labels appear at LOD 3+ (text sprites, not geometry)

- [ ] **Task 1.4:** Update RooftopGarden for dynamic Y-offset
  - RooftopGarden Y-offset = `buildingHeight + gap` (currently hardcoded)
  - Building height is now log-scaled and variable
  - Nested types stack on top of the last method floor

- [ ] **Task 1.5:** Update CityBlocks to render hierarchical layout
  - Read `HierarchicalLayoutResult` from layout engine
  - For each district:
    - Render `DistrictGround` (existing)
    - For each block: render `FileBlock` + child buildings at `block.position + child.localPosition`
  - For compound blocks (`isCompound`): render as single ground area with internal buildings
  - Maintain existing infrastructure rendering for external nodes

- [ ] **Task 1.6:** Implement configurable height encoding
  - Height encoding reads from `citySettings.heightEncoding` in store
  - `methodCount` (default): `log2(methodCount + 1) * FLOOR_HEIGHT`
  - `dependencies`: `log2(incomingEdgeCount + 1) * FLOOR_HEIGHT`
  - `loc`: `log2(loc / 50 + 1) * FLOOR_HEIGHT` (normalized)
  - `complexity`: `log2(complexity + 1) * FLOOR_HEIGHT`
  - `churn`: requires git data, graceful fallback to methodCount if unavailable
  - UI control: dropdown in canvas toolbar

### Phase 2: Sky Layer — Elevated Edges and Shadows

> ⚠️ **PARTIALLY SUPERSEDED** — See `city-metaphor-vertical-layering-spec.md` Section 6.
> Inheritance (`extends`) and `implements` now route **underground** as plumbing lines, NOT as sky edges.
> Overhead wires are reserved for **method-to-method calls and composition** only.
> Cross-district `import` lines also move underground. The sky/overhead layer is exclusively for runtime relationships.

- [ ] **Task 2.1:** Create SkyEdge component
  - ⚠️ **SUPERSEDED** — Edge type routing has changed. `extends` and `implements` are underground, not sky edges. Rework this task per the vertical layering spec.
  - ~~Renders bezier arc between source and target buildings~~
  - ~~Y-height determined by edge type (NOT distance):~~
    - ~~`imports` cross-district: Y = 30-50 (mid sky)~~
    - ~~`extends`: Y = 60+ (high sky)~~
    - ~~`implements`: Y = 60+ (high sky, dashed)~~
  - ~~Color by edge type: imports = blue, extends = green, implements = purple~~
  - Visibility gated by LOD and `edgeTierVisibility` store settings
  - Edge visibility threshold: show top N edges by weight at LOD 2, all at LOD 3

- [ ] **Task 2.2:** Create GroundShadow component
  - For each visible SkyEdge, render its orthographic projection on Y=0 plane
  - Shadow vertices = arc vertices with Y set to 0
  - Rendered as semi-transparent line (opacity 0.2-0.3)
  - Visible at LOD 2+ (same as SkyEdge)

- [ ] **Task 2.3:** Remove intra-district edge lines
  - Intra-district `imports` edges no longer rendered as lines
  - Their effect is encoded in proximity-based layout (Phase 1 Task 1.1)
  - `contains` edges already implicit (no rendering)

- [ ] **Task 2.4:** Implement camera tilt-assist
  - On node selection, smoothly animate camera pitch upward (0.5s ease) to reveal outgoing sky edges
  - User can cancel by moving camera during animation
  - Add `cameraTiltAssist: boolean` preference to store (default: true)

- [ ] **Task 2.5:** Implement transit map overlay mode
  - Toggle: `citySettings.transitMapMode`
  - When active: building opacity drops to 0.15, edge opacity increases to 1.0, edge width doubles
  - Ground shadows become fully opaque
  - District ground planes remain at normal opacity for context
  - Effectively: "subway map" view of the codebase

- [ ] **Task 2.6:** Update CitySky to orchestrate new edge rendering
  - Replace CityEdge usage with SkyEdge for cross-district edges
  - Render GroundShadow for each SkyEdge
  - Read `edgeTierVisibility` and `transitMapMode` from store
  - Keep CityEdge available under `city-v1` feature flag

### Phase 3: Atmosphere — Environmental Indicators

> Goal: Toggleable city-native indicators for code health metrics. Each shipped individually.

- [ ] **Task 3.1:** Create ConstructionCrane indicator (change frequency)
  - Small crane mesh placed on top of buildings with high recent change count
  - Data source: `metadata.properties.changeCount` or git-derived churn
  - Threshold: top 10% of buildings by change frequency
  - Toggleable: `atmosphereOverlays.cranes`
  - Graceful when data absent: indicator simply doesn't render

- [ ] **Task 3.2:** Create lighting system (test coverage)
  - Point lights above well-tested blocks (warm, bright)
  - Dim/absent lighting over untested blocks (dark, cold)
  - Data source: `metadata.properties.testCoverage` (0-100)
  - Toggleable: `atmosphereOverlays.lighting`
  - Graceful: default to neutral ambient when no coverage data

- [ ] **Task 3.3:** Create SmogOverlay indicator (complexity)
  - Semi-transparent particle cloud over high-complexity districts
  - Data source: average `metadata.complexity` across district nodes
  - Threshold: districts above 75th percentile complexity
  - Toggleable: `atmosphereOverlays.smog`
  - Use R3F `<sprite>` or `<points>` for performance

- [ ] **Task 3.4:** Create deprecated indicator (boarded-up)
  - Material swap on deprecated buildings: darker color, striped texture
  - Data source: `metadata.isDeprecated` flag
  - Toggleable: `atmosphereOverlays.deprecated`
  - Graceful: no flag = normal rendering

- [ ] **Task 3.5:** Update CityAtmosphere to orchestrate indicators
  - Read `atmosphereOverlays` from store
  - Conditionally render each indicator component
  - Ensure all indicators are LOD 3+ only

### Phase 4: Configurability

> Goal: User controls for height encoding and view modes.

- [ ] **Task 4.1:** Add height encoding selector to UI
  - Dropdown in canvas toolbar: Method Count | Dependencies | Lines of Code | Complexity | Change Frequency
  - Changing encoding triggers layout recalculation (building heights change)
  - Persist selection in store

- [ ] **Task 4.2:** Add atmosphere toggle panel
  - Checkbox group in canvas toolbar for each atmospheric indicator
  - Show indicator name + icon, disabled state when data unavailable
  - Persist selections in store

- [ ] **Task 4.3:** Add edge tier visibility controls
  - Toggle switches for: Cross-district imports, Inheritance/Implementation
  - Transit map mode toggle (separate prominent button)
  - Persist selections in store

### Acceptance Criteria

**Phase 0:**
- [ ] AC-0.1: Given the existing CityView, when interaction test suite runs, then all tests pass (hover, click, drill-down, edges, clusters)
- [ ] AC-0.2: Given the decomposed CityView (CityBlocks + CitySky + CityAtmosphere), when the same interaction test suite runs, then all tests still pass
- [ ] AC-0.3: Given the extended layout types, when TypeScript compiles, then `HierarchicalLayoutResult` is valid and extends `LayoutResult`
- [ ] AC-0.4: Given the extended store, when `citySettings` state changes, then only components subscribing to changed slices re-render

**Phase 1:**
- [ ] AC-1.1: Given a graph with files containing classes and functions, when city-v2 renders, then classes appear as buildings INSIDE their parent file's block
- [ ] AC-1.2: Given a class with N methods, when rendered in city-v2, then the building shows N floor bands with log-scaled total height
- [ ] AC-1.3: Given a file with exactly one export, when rendered, then the block boundary is hidden (merged mode)
- [ ] AC-1.4: Given a file with multiple exports, when rendered, then a subtle block boundary is visible
- [ ] AC-1.5: Given a directory with 1-3 files, when rendered, then files appear in a single compound block
- [ ] AC-1.6: Given a node with parentId pointing to non-existent parent, when layout runs, then node appears in a "homeless" block (not silently dropped)
- [ ] AC-1.7: Given a class with zero methods, when rendered, then building has 1 minimum "lobby" floor
- [ ] AC-1.8: Given children inside a file block, when rendered, then no two buildings overlap (grid-based placement)
- [ ] AC-1.9: Given heightEncoding set to "dependencies", when rendered, then building heights reflect incoming edge count

**Phase 2:**
- [ ] AC-2.1: Given cross-district import edges, when rendered in city-v2, then edges appear as elevated bezier arcs at Y=30-50
- [ ] AC-2.2: Given inheritance edges, when rendered, then edges appear at Y=60+ as arcs
- [ ] AC-2.3: Given a visible sky edge, when looking at ground, then a semi-transparent shadow line is visible at Y=0
- [ ] AC-2.4: Given a node is selected, when cameraTiltAssist is enabled, then camera smoothly tilts to reveal outgoing edges
- [ ] AC-2.5: Given transitMapMode is enabled, then building opacity drops to 0.15 and edges become fully opaque
- [ ] AC-2.6: Given intra-district import edges, when rendered in city-v2, then NO lines are drawn (proximity encoding only)

**Phase 3:**
- [ ] AC-3.1: Given atmosphereOverlays.cranes is enabled AND change frequency data exists, then crane meshes appear on high-churn buildings
- [ ] AC-3.2: Given atmosphereOverlays.lighting is enabled AND test coverage data exists, then well-tested areas are brightly lit
- [ ] AC-3.3: Given atmospheric data is absent, then indicators simply don't render (no errors, no placeholders)
- [ ] AC-3.4: Given all atmosphere toggles are off, then the city renders identically to when atmosphere is not implemented

**Phase 4:**
- [ ] AC-4.1: Given the height encoding dropdown, when user changes selection, then building heights update within 100ms
- [ ] AC-4.2: Given the atmosphere toggle panel, when an indicator's data is unavailable, then its toggle is disabled with explanation

**Cross-cutting:**
- [ ] AC-X.1: Given city-v1 feature flag is active, then the original CityView renders exactly as before (zero regression)
- [ ] AC-X.2: Given 1000+ nodes, when city-v2 renders, then FPS stays above 60fps
- [ ] AC-X.3: Given the same graph input, when layout runs twice, then positions are identical (deterministic)

---

## Additional Context

### Dependencies

| Dependency | Phase | Notes |
|---|---|---|
| Existing `LayoutEngine` interface | Phase 0 | Extended, not replaced |
| `parentId` on GraphNode | Phase 1 | Already populated by parser |
| `contains` edges | Phase 1 | Already populated by parser |
| `methodCount` on class nodes | Phase 1 | Already populated (Epic 9-B) |
| `visibility` on method nodes | Phase 1 | May be undefined — graceful fallback |
| `isDeprecated` flag | Phase 3 | May not exist on all nodes |
| Git change frequency data | Phase 3 | External dependency, graceful fallback |
| Test coverage data | Phase 3 | External dependency, graceful fallback |

### Testing Strategy

**Phase 0:**
- Integration test suite for CityView interactions (written BEFORE decomposition)
- Unit tests for extracted hooks (`useCityLayout`, `useCityFiltering`, `useDistrictMap`)
- Run test suite after each extraction step

**Phase 1:**
- Unit tests for `calculateBlockFootprint()` edge cases (0, 1, 50, 200 children)
- Unit tests for hierarchical layout output (orphan handling, circular parentId, compound blocks)
- Unit tests for floor band height calculation (log scaling, zero methods, configurable encoding)
- Component tests for `FileBlock` (visible/hidden boundary, merged mode)
- Component tests for floor band vertex coloring (public/private/protected colors)
- Layout determinism test: same input → same output across 10 runs

**Phase 2:**
- Unit tests for sky edge height calculation (type-based, not distance-based)
- Unit tests for ground shadow projection (Y=0 alignment)
- Component tests for SkyEdge rendering
- Component tests for transit map mode (opacity changes)
- Integration test for camera tilt-assist (smooth animation, cancellation)

**Phase 3:**
- Unit tests for indicator threshold calculations (top 10%, 75th percentile)
- Component tests for each indicator (renders when data present, absent when data missing)
- Integration test for atmosphere toggle panel

**Performance:**
- Benchmark: layout engine < 50ms for 1000 nodes
- Benchmark: 60fps with 1000 nodes in city-v2
- Profile: draw calls per building (must be 1, not per-floor)

### Notes

- **Feature flag strategy:** `citySettings.cityVersion` controls which rendering path is active. Both v1 and v2 coexist until v2 is stable. Default starts at `v1`, switched to `v2` when Phase 1 acceptance criteria pass.
- **Onboarding tooltip:** One-time tooltip on first city-v2 load: "Blocks = files. Buildings = classes. Floors = methods. Zoom in for more." Dismissed permanently after first view. Stored in localStorage.
- **Edge bundling:** Explicitly deferred. If sky spaghetti becomes a problem during Phase 2, edge bundling becomes an urgent follow-up task. Design the SkyEdge component to accept bundled edge groups.
- **LOD 4 (interior view):** Out of scope for this spec. The floor band system lays groundwork for future "enter a building" interaction where method internals are visible.
- **Migration path:** When city-v2 is stable and all acceptance criteria pass, `city-v1` code paths can be removed. No backward compatibility shims needed — the feature flag is the migration mechanism.
