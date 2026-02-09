# Tech-Spec: City Visualization Overhaul — Phase 1

**Created:** 2026-02-04
**Status:** Ready for Development
**Source:** [Brainstorming Session 2026-02-04](../analysis/brainstorming-session-2026-02-04.md)

## Overview

### Problem Statement

The current 3D city visualization has several limitations that reduce its usefulness for understanding codebases:

1. **Linear grid layout** — The `CityLayoutEngine` arranges files in a flat grid grouped by directory. This doesn't communicate dependency relationships, entry points, or architectural layers. It doesn't leverage the 3D space.
2. **No visual differentiation** — All code objects render as identical `boxGeometry [2, height, 2]` meshes. A class looks the same as a function, a variable, or an interface. Users cannot identify what they're looking at without clicking.
3. **Minimal labeling** — Basic 3D text labels exist but there is no signage system. No zoom-based label visibility, no visual encoding of access level (public/private), no district-level signage.
4. **No infrastructure distinction** — External libraries render as wireframes in a ring, but there is no distinction between databases, APIs, event buses, or other infrastructure. The city has no landmarks for orientation.

### Solution

Overhaul the city visualization across 4 priority themes, each building on the previous:

1. **Radial Layout** — Replace the grid with a radial layout where the application entry point sits at city center and code radiates outward by dependency depth. Modules cluster into district arc segments.
2. **Signage System** — Add a multi-style signage system where sign type encodes code concept (neon = public, brass plaque = private, hanging sign = class name, highway sign = module). Signs appear/disappear based on zoom level.
3. **Infrastructure & Boundaries** — Render infrastructure code as distinct landmark buildings (power stations, water towers, municipal buildings) at city edges, with boundary zones for different external connection types.
4. **Shape Language** — Replace uniform boxes with distinct shapes per code structure type: multi-story buildings (classes), single-story shops (functions), crates (variables), glass buildings (interfaces), dashed-outline buildings (abstract classes).

### Scope

**In Scope (Phase 1):**
- Radial layout engine with configurable density
- District grouping within radial rings
- Zoom-based level-of-detail for labels (4 LOD levels)
- Signage components (neon, brass, hanging, highway, label tape, marquee)
- Infrastructure landmark buildings with distinct silhouettes
- External boundary zones (harbors, airports, highways, gates)
- Shape primitives per code structure type
- Rooftop gardens for nested types
- Clustering of many small structures at high zoom
- Density slider UI control
- Store extensions for new state

**Out of Scope (Phase 2 — separate spec):**
- Connection visual encoding (thickness, color, texture by relationship type)
- Connection bundling (highway merging)
- Color encoding system (hue by domain, intensity by access, overlay by status)
- Transit-map minimap redesign
- Minimap layers and filters
- Trace mode
- Breadcrumb trail navigation
- Animated flow (pulsing connections, capsule movement)
- Building interiors at street-level zoom (mail slots, doorways, wall-mounted constants)

## Context for Development

### Codebase Patterns

- **State Management:** Zustand only — single store at `packages/ui/src/features/canvas/store.ts`
- **Layout Engines:** Pluggable via `LayoutEngine` interface, registered in `LayoutRegistry` singleton
- **Views:** Feature-based components in `packages/ui/src/features/canvas/views/`
- **Utilities:** Pure functions extracted from React components for testability (e.g., `cityViewUtils.ts`)
- **Types:** Shared types in `packages/ui/src/shared/types/graph.ts`
- **Parser Analysis:** Analysis modules in `packages/parser/src/analysis/` (depth calculator, containment analyzer, external detector)
- **Three.js:** React Three Fiber declarative components, `@react-three/drei` for helpers
- **Testing:** Co-located `.test.ts` files, pure utility functions preferred for unit testing

### Files to Reference

**Layout system (modify/extend):**
- `packages/ui/src/features/canvas/layout/engines/cityLayout.ts` — current grid layout (remains available, no longer default)
- `packages/ui/src/features/canvas/layout/registry.ts` — layout engine registry
- `packages/ui/src/features/canvas/layout/types.ts` — LayoutEngine interface, LayoutConfig, LayoutResult

**View components (modify):**
- `packages/ui/src/features/canvas/views/CityView.tsx` — main city rendering, add new building types
- `packages/ui/src/features/canvas/views/ViewModeRenderer.tsx` — view mode switching
- `packages/ui/src/features/canvas/views/cityViewUtils.ts` — color palette, building dimensions

**Store (extend):**
- `packages/ui/src/features/canvas/store.ts` — add density, LOD, layer toggle state

**Types (extend):**
- `packages/ui/src/shared/types/graph.ts` — GraphNode, GraphEdge types
- `packages/ui/src/shared/types/api.ts` — API response types

**Parser (reference, may extend):**
- `packages/parser/src/analysis/depthCalculator.ts` — already calculates depth from entry points via BFS
- `packages/parser/src/analysis/containmentAnalyzer.ts` — already builds parent-child hierarchy
- `packages/parser/src/analysis/externalDetector.ts` — already detects external packages

**Existing infrastructure to preserve:**
- `packages/ui/src/features/canvas/Canvas3D.tsx` — canvas setup, camera, lighting
- `packages/ui/src/features/canvas/views/BuildingView.tsx` — building interior view (unchanged)
- `packages/ui/src/features/canvas/views/CellView.tsx` — cell interior view (unchanged)
- `packages/ui/src/features/canvas/transitions/` — transition system (may need adjustment for new positions)

### Technical Decisions

1. **New layout engine, not a modification** — Create `RadialCityLayoutEngine` implementing the existing `LayoutEngine` interface. Register it alongside the existing `CityLayoutEngine` so both remain available. The radial engine becomes the default.

2. **Depth data already exists** — The `depthCalculator.ts` already computes dependency depth from entry points using BFS. The radial layout engine consumes this data directly. No parser changes needed for basic radial positioning.

3. **Sign components as React Three Fiber components** — Each sign type (neon, brass, hanging, highway, label tape, marquee) is a reusable R3F component accepting text, position, and visibility props. Signs are children of their parent building/district mesh.

4. **LOD driven by camera distance** — Use `useFrame` to calculate camera distance to each object group and set visibility accordingly. The store's `lodLevel` can be driven automatically by zoom or manually overridden.

5. **Infrastructure nodes require type metadata** — The parser's `externalDetector.ts` identifies external packages but doesn't classify them (database vs API vs queue). Infrastructure classification will use heuristics based on package name (e.g., `pg`, `mysql` → database; `axios`, `fetch` → API; `bull`, `amqp` → queue). A new `infrastructureClassifier.ts` analysis module handles this.

6. **Shape primitives as geometry factories** — A `buildingGeometry.ts` utility maps `GraphNode.type` (and additional metadata) to Three.js geometry configurations. This keeps the view component clean and the mapping testable.

7. **Clustering uses a threshold** — When a district contains more than N structures (configurable, default 20) at city zoom level, it renders as a single compound building with a count badge. Zooming in crosses the LOD threshold and expands individual structures.

## Implementation Plan

### Tasks

**Task Group 1: Radial Layout Engine**

- [ ] 1.1: Create `RadialCityLayoutEngine` implementing `LayoutEngine` interface
  - Input: Graph with depth-annotated nodes
  - Algorithm: Group nodes by directory (district), assign each district an arc segment on its depth ring
  - Districts with nodes spanning multiple depth rings may span adjacent rings
  - Position nodes within arc segments using sub-grid or radial sub-positioning
  - Entry points (depth=0) positioned at center
  - External nodes positioned at outermost ring
  - Output: `Map<string, Position3D>`, bounding box, metadata
  - Define typed `RadialCityLayoutConfig` extending `LayoutConfig` with explicit fields: `ringSpacing`, `arcPadding`, `districtGap`, `buildingSpacing`, `centerRadius`, `density`
  - File: `packages/ui/src/features/canvas/layout/engines/radialCityLayout.ts`

- [ ] 1.2: Create radial layout utility functions (pure, testable)
  - `calculateRingRadius(depth, config)` — radius for a given depth ring
  - `assignDistrictArcs(districts, ringDepth, config)` — divide ring into arc segments per district
  - `distributeDistrictsAcrossRings(districts, nodeDepths, config)` — handle directories with nodes at multiple depths
  - `positionNodesInArc(nodes, arcStart, arcEnd, radius, config)` — place nodes within an arc
  - `calculateEntryPointPosition(entryNodes, config)` — center positioning for entry points
  - File: `packages/ui/src/features/canvas/layout/engines/radialLayoutUtils.ts`
  - Test: `packages/ui/src/features/canvas/layout/engines/radialLayoutUtils.test.ts`

- [ ] 1.3: Register `RadialCityLayoutEngine` in layout registry
  - Update `packages/ui/src/features/canvas/layout/registry.ts`
  - Register alongside existing CityLayoutEngine (both available)
  - CityView.tsx will use explicit type selection (not autoSelect) to ensure radial is default

- [ ] 1.4: Add density configuration to store
  - Add `layoutDensity: number` (0-1 range, 0=dense, 1=spread) to `CanvasState`
  - Add `setLayoutDensity(density: number)` action
  - Density value passed to layout engine config, scales `ringSpacing`, `buildingSpacing`, `districtGap`
  - File: `packages/ui/src/features/canvas/store.ts`

- [ ] 1.5: Add density slider UI control
  - Slider component in canvas overlay area
  - Bound to store `layoutDensity`
  - Triggers layout recalculation on change
  - File: `packages/ui/src/features/canvas/components/DensitySlider.tsx`

- [ ] 1.6: Update `CityView.tsx` to use radial layout engine
  - Explicitly instantiate `RadialCityLayoutEngine` by type (not via registry autoSelect)
  - Pass density config from store via `RadialCityLayoutConfig`
  - Update camera auto-fit to account for circular radial bounding box (FR-V14)

- [ ] 1.7: Implement district ground planes
  - Render colored arc-segment ground planes per district
  - Each district gets a distinct color tint on its ground area
  - District borders visible as subtle lines between arc segments
  - File: `packages/ui/src/features/canvas/components/DistrictGround.tsx`

- [ ] 1.8: Implement node clustering at high zoom
  - When a district has >N nodes (configurable threshold, default 20) and LOD is city-level, render as single compound building with count badge
  - Expand into individual buildings when zooming to district level
  - File: `packages/ui/src/features/canvas/components/ClusterBuilding.tsx`
  - Utility: `packages/ui/src/features/canvas/layout/engines/clusterUtils.ts`
  - Test: `packages/ui/src/features/canvas/layout/engines/clusterUtils.test.ts`

**Task Group 2: Signage System**

- [ ] 2.1: Create sign component library
  - `NeonSign` — glowing emissive material, larger text, visible from far. Props: text, color, position, visible
  - `BrassPlaque` — small, matte metallic material, only visible close. Props: text, position, visible
  - `HangingSign` — sign suspended from bracket geometry, medium visibility. Props: text, position, visible
  - `HighwaySign` — large rectangular panel on a post, green background white text. Props: text, position, visible
  - `LabelTape` — small flat text strip attached to surface. Props: text, position, visible
  - `MarqueeSign` — large illuminated sign, potentially scrolling. Props: text, position, visible
  - `ConstructionSign` — yellow diamond/rectangle warning sign. Props: text, position, visible
  - Directory: `packages/ui/src/features/canvas/components/signs/`
  - Each sign type in its own file, barrel exported from `index.ts`
  - Performance: use instanced rendering or geometry batching when >50 signs visible (NFR-V1). Sign rendering must add <2ms per frame at neighborhood zoom with 200 visible signs.

- [ ] 2.2: Create sign selection utility
  - `getSignType(node: GraphNode): SignType` — determines which sign style to use based on node type and metadata
  - `getSignVisibility(signType: SignType, lodLevel: number): boolean` — determines if a sign is visible at current LOD
  - Maps: public → neon, private → brass, class name → hanging, module → highway, variable → label tape, export → marquee, deprecated → construction
  - File: `packages/ui/src/features/canvas/components/signs/signUtils.ts`
  - Test: `packages/ui/src/features/canvas/components/signs/signUtils.test.ts`

- [ ] 2.3: Implement zoom-based LOD for sign visibility
  - LOD levels: 1 (city) → 2 (district) → 3 (neighborhood) → 4 (street)
  - Level 1: highway signs only (module names)
  - Level 2: + hanging signs (class names), neon signs (public API)
  - Level 3: + brass plaques (private members), label tape (variables)
  - Level 4: + all remaining signs (construction, stenciled)
  - Driven by camera distance to node groups, updates store `lodLevel`
  - Must execute in same render cycle as initial layout (no flash of all signs)
  - Store `lodLevel` default changed from 4 to 1 (city level) — LOD calculator drives it up (NFR-V2)
  - File: `packages/ui/src/features/canvas/hooks/useLodCalculator.ts`

- [ ] 2.4: Integrate signs into CityView
  - Attach appropriate sign components to each building based on node metadata
  - Highway signs at district boundaries (attached to `DistrictGround`)
  - Hanging signs on class buildings
  - Neon/brass on method/function buildings based on access
  - Pass LOD visibility to each sign

- [ ] 2.5: Extend GraphNode type for sign metadata
  - Add optional `visibility?: 'public' | 'protected' | 'private' | 'static'` to `GraphNode`
  - Add optional `isDeprecated?: boolean` to `GraphNode`
  - Add optional `isExported?: boolean` to `GraphNode`
  - File: `packages/ui/src/shared/types/graph.ts`
  - Parser may need updates to populate these fields — document as dependency

**Task Group 3: Infrastructure & External Boundaries**

- [ ] 3.1: Create infrastructure classifier analysis module
  - Classifies external packages by type based on package name heuristics
  - Categories: `database`, `api`, `queue`, `cache`, `filesystem`, `auth`, `logging`, `general`
  - Known package mappings: `pg/mysql/mongoose/prisma` → database, `axios/node-fetch/got` → api, `bull/amqplib/kafkajs` → queue, `redis/memcached` → cache
  - Falls back to `general` for unknown packages
  - File: `packages/parser/src/analysis/infrastructureClassifier.ts`
  - Test: `packages/parser/src/analysis/infrastructureClassifier.test.ts`
  - Output: adds `infrastructureType` to node metadata

- [ ] 3.2: Extend GraphNode for infrastructure metadata
  - Add optional `infrastructureType?: 'database' | 'api' | 'queue' | 'cache' | 'filesystem' | 'auth' | 'logging' | 'general'` to `GraphNode`
  - File: `packages/ui/src/shared/types/graph.ts`

- [ ] 3.3: Create infrastructure landmark components
  - `PowerStation` — event bus/message broker. Distinct tall industrial geometry with smokestacks/towers
  - `WaterTower` — job queue. Cylindrical tank on stilts
  - `MunicipalBuilding` — cron/scheduled tasks. Dome or clock tower
  - `Harbor` — database connections. Dock/pier geometry at city edge
  - `Airport` — external API calls. Terminal building with runway
  - `CityGate` — user entry points (HTTP endpoints). Archway/tollbooth
  - Each with unique silhouette visible from distance (tall, distinctive)
  - Directory: `packages/ui/src/features/canvas/components/infrastructure/`
  - Each landmark type in its own file, barrel exported from `index.ts`

- [ ] 3.4: Update radial layout to position infrastructure at edges
  - Infrastructure nodes positioned at outermost ring
  - Grouped by type: database nodes cluster together (harbor zone), API nodes cluster (airport zone), etc.
  - Entry-point endpoints positioned at specific edge zone (gate zone)
  - Update `RadialCityLayoutEngine` to handle infrastructure positioning
  - File: update `packages/ui/src/features/canvas/layout/engines/radialCityLayout.ts`

- [ ] 3.5: Create infrastructure rendering in CityView
  - Detect infrastructure nodes by `infrastructureType` metadata
  - Render appropriate landmark component instead of standard building
  - Landmarks render at all LOD levels (always visible as orientation aids)
  - Update `packages/ui/src/features/canvas/views/CityView.tsx`

- [ ] 3.6: Add layer toggle to store
  - Add `visibleLayers: { aboveGround: boolean, underground: boolean }` to store (Phase 1: 2 layers only; street level deferred to Phase 2)
  - Add `toggleLayer(layer: 'aboveGround' | 'underground')` action (typed, not string)
  - Default: all layers visible
  - File: update `packages/ui/src/features/canvas/store.ts`

- [ ] 3.7: Create layer toggle UI
  - Two toggle buttons for above ground / underground (street level deferred to Phase 2)
  - Positioned in canvas overlay alongside density slider
  - File: `packages/ui/src/features/canvas/components/LayerToggle.tsx`

**Task Group 4: Shape Language**

- [ ] 4.0: Extend GraphNode.type union (prerequisite for shape language)
  - Add `'interface' | 'enum' | 'abstract_class'` to `GraphNode.type` union
  - Current union: `'file' | 'class' | 'function' | 'method' | 'variable'`
  - New union: `'file' | 'class' | 'function' | 'method' | 'variable' | 'interface' | 'enum' | 'abstract_class'`
  - File: `packages/ui/src/shared/types/graph.ts`
  - Note: this is a prerequisite for Tasks 4.1-4.3 (FR-V13)

- [ ] 4.1: Create building geometry factory
  - Maps `GraphNode.type` + metadata to Three.js geometry configuration
  - `class` → rectangular multi-story building (boxGeometry, height scales with method count)
  - `function` (standalone) → single-story shop (lower boxGeometry, wider)
  - `method` → room geometry (used inside building view, not city view directly)
  - `variable` → small crate (small boxGeometry)
  - `interface` → glass building (same shape as class but transparent material, wireframe edges)
  - `abstract class` → dashed-outline building (edges rendered with dashed line material)
  - `enum` → crate with distinct texture/color
  - Returns: `{ geometry: GeometryConfig, material: MaterialConfig }`
  - File: `packages/ui/src/features/canvas/components/buildingGeometry.ts`
  - Test: `packages/ui/src/features/canvas/components/buildingGeometry.test.ts`

- [ ] 4.2: Create typed building components
  - `ClassBuilding` — multi-story box, height = method count × floor height, opaque walls
  - `FunctionShop` — single-story wide building, distinct from class
  - `InterfaceBuilding` — glass material (transparent, 0.3 opacity), visible edges/wireframe overlay
  - `AbstractBuilding` — dashed edge lines, semi-transparent fill (0.5 opacity)
  - `VariableCrate` — small box geometry with wood-like color/texture
  - `EnumCrate` — small box with striped or patterned material
  - Directory: `packages/ui/src/features/canvas/components/buildings/`
  - Each type in its own file, barrel exported from `index.ts`

- [ ] 4.3: Update CityView to use typed building components
  - Replace single `Building` component with type-switched rendering
  - Select component based on `node.type` and metadata
  - Pass appropriate sign component as child based on task group 2
  - File: update `packages/ui/src/features/canvas/views/CityView.tsx`

- [ ] 4.4: Implement rooftop gardens for nested types
  - When a class node has children with `parentId` pointing to it, render nested structures as smaller buildings on the roof
  - Tiered stacking: each nested level is smaller and positioned on top
  - Maximum 3 tiers before clustering into a badge
  - **Prerequisite:** Verify containment analyzer supports class → inner class parentId relationships. If not supported, defer this task or add a parser prerequisite story.
  - File: `packages/ui/src/features/canvas/components/buildings/RooftopGarden.tsx`

- [ ] 4.5: Extend GraphNode type for shape metadata
  - Add optional `methodCount?: number` to `GraphNode` (drives building height)
  - Add optional `isAbstract?: boolean` to `GraphNode`
  - Add optional `hasNestedTypes?: boolean` to `GraphNode`
  - File: update `packages/ui/src/shared/types/graph.ts`
  - Note: Parser populates these via `metadata: Record<string, unknown>` bag (established pattern). UI reads from `node.metadata.methodCount`, `node.metadata.isAbstract`, etc. No API schema changes needed.

- [ ] 4.6: Update cityViewUtils with new shape constants and helpers
  - Building dimensions per type (class width/depth, shop width/depth, crate size)
  - Material configurations per type (glass opacity, wireframe settings, dashed line params)
  - Floor height calculations based on method count
  - File: update `packages/ui/src/features/canvas/views/cityViewUtils.ts`

### Acceptance Criteria

**Radial Layout:**
- [ ] AC-1: Given a graph with depth-annotated nodes, when the city view renders, then nodes are positioned in concentric rings around a central point, with depth-0 nodes at center and deeper nodes at outer rings
- [ ] AC-2: Given nodes belonging to the same directory/module, when positioned on a ring, then they cluster together in a contiguous arc segment (district)
- [ ] AC-3: Given the density slider set to minimum, when viewing the city, then buildings are spread apart with clear spacing; at maximum, buildings are tightly packed
- [ ] AC-4: Given a district with >20 nodes at city zoom level, when viewing the city, then the district renders as a single compound building with count badge; zooming in expands to individual buildings

**Signage:**
- [ ] AC-5: Given a class node, when rendered in city view, then it displays a hanging sign with the class name
- [ ] AC-6: Given a public function node, when rendered, then it displays a neon-style glowing sign; a private function displays a brass plaque style sign
- [ ] AC-7: Given the camera at city zoom level (far), when viewing the city, then only highway signs (module names) and landmark labels are visible; zooming to district level reveals class names; zooming to neighborhood level reveals private member labels
- [ ] AC-8: Given an exported node, when rendered, then it displays a marquee-style sign

**Infrastructure:**
- [ ] AC-9: Given an external database package (e.g., `pg`, `prisma`), when rendered in city view, then it appears as a harbor/dock landmark at the city edge, visually distinct from standard buildings
- [ ] AC-10: Given an external API package (e.g., `axios`), when rendered, then it appears as an airport landmark
- [ ] AC-11: Given a queue/event package (e.g., `bull`, `kafkajs`), when rendered, then it appears as a power station landmark
- [ ] AC-12: Given infrastructure landmarks, when viewing from any position in the city, then at least the tallest landmarks remain visible as orientation aids
- [ ] AC-13: Given the layer toggle UI, when toggling a layer off, then the corresponding visual elements hide; toggling on restores them

**Shape Language:**
- [ ] AC-14: Given a class node, when rendered in city view, then it appears as a multi-story building with height proportional to method count
- [ ] AC-15: Given a standalone function node, when rendered, then it appears as a single-story shop visually distinct from a class building
- [ ] AC-16: Given an interface node, when rendered, then it appears as a transparent/glass building with visible wireframe edges
- [ ] AC-17: Given an abstract class node, when rendered, then it appears with dashed outlines and semi-transparent fill
- [ ] AC-18: Given a variable node visible at close zoom, when rendered, then it appears as a small crate distinct from buildings
- [ ] AC-19: Given a class with nested inner types, when rendered, then nested types appear as smaller structures on the roof of the parent building (rooftop garden)

## Additional Context

### Dependencies

**Parser dependencies (soft — transported via metadata bag):**

All parser-produced fields are transported via the existing `metadata: Record<string, unknown>` bag on `GraphNode`. No API schema changes are needed. UI reads from `node.metadata.*`. This is the established pattern used by `externalDetector.ts`.

- `node.metadata.visibility` (public/private/protected) — parser must extract access modifiers. If not yet available, signs default to neon (public) style.
- `node.metadata.isDeprecated` — parser must detect `@deprecated` annotations. If not available, construction signs are not rendered.
- `node.metadata.isExported` — parser must detect `export` keywords. If not available, marquee signs are not rendered.
- `node.metadata.methodCount` — parser must count methods per class. If not available, class building height uses fallback (depth-based calculation already exists).
- `node.metadata.isAbstract` — parser must detect `abstract` keyword. If not available, all classes render as solid buildings.
- `node.metadata.infrastructureType` — infrastructure classifier populates this for external nodes. If not available, external nodes render as generic wireframes.

**These parser dependencies are soft — the visualization degrades gracefully without them.** Each feature has a sensible fallback, so parser work can happen in parallel or after the UI implementation.

### Testing Strategy

**Unit tests (co-located, .test.ts):**
- Radial layout utility functions (position calculations, arc assignment, ring radius)
- Sign selection utility (node type → sign type mapping)
- Sign visibility utility (LOD level → visibility)
- Infrastructure classifier (package name → infrastructure type)
- Building geometry factory (node type → geometry config)
- Cluster utility (threshold, grouping logic)

**Component tests:**
- Sign components render correct geometry/material
- Infrastructure landmarks render distinct silhouettes
- Typed building components render correct geometry per type
- ClusterBuilding renders count badge

**Integration tests:**
- RadialCityLayoutEngine produces valid positions for a sample graph
- CityView renders correct building types for a mixed graph
- LOD system shows/hides signs at correct zoom levels
- Density slider triggers layout recalculation

### Notes

**Performance considerations:**
- Radial layout computation should be memoized (only recalculate when graph or density changes)
- Sign text rendering is expensive in Three.js — use `troika-three-text` or `@react-three/drei` Text component with frustum culling
- LOD-based visibility prevents rendering thousands of sign meshes at city zoom
- Clustering reduces mesh count for large codebases

**Future phase reference:**
Themes 4 (Color Encoding), 5 (Connection System), and 7 (Transit-Map Minimap) are documented in the [brainstorming session](../analysis/brainstorming-session-2026-02-04.md) and will be covered in a separate Phase 2 tech spec. Key concepts:
- Connection visual encoding (thickness, color, texture per relationship type)
- Connection bundling (many-to-one highway merging)
- Color hue by domain category, intensity by access level, overlay by dynamic status
- Transit-map minimap with 8 toggleable layers and trace mode
- Breadcrumb trail navigation
