---
stepsCompleted: [1, 2, 3, 4]
status: complete
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-3d-layout-vision.md'
  - '_bmad-output/implementation-artifacts/tech-spec-city-visualization-overhaul.md'
  - '_bmad-output/analysis/brainstorming-session-2026-02-04.md'
architectReview: complete
---

# diagram_builder - Epic Breakdown (Epic 9)

## Overview

This document provides the epic and story breakdown for the **City Visualization Overhaul — Phase 1**, transforming the flat grid city layout into a radial 3D visualization with visual differentiation, signage, and infrastructure landmarks. This epic builds on the existing Epic 8 (City-to-Cell 3D Layout) foundation.

## Requirements Inventory

### Functional Requirements

The following PRD functional requirements are addressed by this epic:

- FR10: System can render code structure as interactive 3D visualization in web browser
- FR11: System can apply layout algorithm to position code elements spatially based on relationships
- FR12: System can automatically adjust level of detail based on camera zoom level
- FR13: System can maintain 60fps rendering performance with 1000+ visible code elements
- FR15: System can hide non-essential code elements by default
- FR16: System can visualize dependency relationships as connections between code elements
- FR17: System can highlight architectural patterns visually (layers, boundaries, coupling hotspots)
- FR18: System can represent code complexity through visual properties (size, color, weight)
- FR25: Users can view dual mini-map (2D file tree structure and 3D spatial overview)

**New FRs introduced by brainstorming session (extend PRD):**

- FR-V1: System can position code elements radially based on dependency depth from entry point
- FR-V2: System can group code elements into visually distinct districts by module/namespace
- FR-V3: System can render distinct building shapes per code structure type (class, function, variable, interface, abstract class, enum)
- FR-V4: System can display contextual signage (labels) with different visual styles encoding access level and code concept
- FR-V5: System can show/hide signage based on camera zoom level (LOD-based label visibility)
- FR-V6: System can render infrastructure code as distinct landmark buildings (power stations, water towers, municipal buildings)
- FR-V7: System can classify external packages by infrastructure type (database, API, queue, cache)
- FR-V8: System can position infrastructure nodes at city edges grouped by type (harbors, airports, gates)
- FR-V9: System can render nested types as rooftop structures on parent buildings (contingent on containment analyzer supporting nested types — see Architect Notes #5)
- FR-V10: System can cluster many small structures into a single compound building at high zoom levels
- FR-V11: Users can control layout density via configurable slider
- FR-V12: System can toggle visibility of visual layers (above ground and underground; street level deferred to Phase 2 — see Architect Notes #6)
- FR-V13: GraphNode.type union must support 'interface', 'enum', and 'abstract_class' types for shape differentiation (prerequisite for FR-V3)
- FR-V14: Camera auto-fit must account for radial bounding box geometry when framing the city view

**Layout engine switching decision (Architect Review #2):**

The `RadialCityLayoutEngine` becomes the default city layout. The existing `CityLayoutEngine` (grid) remains registered in the `LayoutRegistry` but is **not** the auto-select default. No layout-switching UI is included in Phase 1. If needed later, a dropdown can be added. The radial engine takes priority via explicit type selection in `CityView.tsx` rather than relying on registry `autoSelect` iteration order (resolves Architect Review #7).

### Non-Functional Requirements

Relevant NFRs from PRD:

- NFR-P6: Maintain 60fps minimum frame rate with 1000+ visible nodes
- NFR-P7: LOD transitions execute smoothly without visible stuttering or frame drops
- NFR-P8: Initial 3D scene render completes in less than 3 seconds
- NFR-P9: Navigation input-to-render latency remains under 16ms
- NFR-SC4: 3D visualization handles progressive loading for large codebases using chunking and spatial partitioning

**New NFRs from Architect Review:**

- NFR-V1: Sign components must use instanced rendering or geometry batching when >50 signs are visible in the frustum. Sign rendering must add <2ms per frame at neighborhood zoom with 200 visible signs. (Architect Review #4)
- NFR-V2: LOD calculator must execute in the same render cycle as initial layout to prevent a flash of all signs on first render. Store `lodLevel` defaults to 1 (city level) rather than 4 (street level). (Architect Review #8)

### Additional Requirements

**From Architecture:**
- Zustand-only state management (NO Redux, NO Context API)
- Feature-based file organization (NOT type-based)
- TypeScript strict mode, no `any` types
- Co-located tests (`.test.ts` next to source)
- Layout engines must implement the existing `LayoutEngine` interface
- React Three Fiber for all Three.js rendering

**From UX 3D Layout Vision:**
- City metaphor for macro level (architectural, geometric)
- Height = abstraction depth (meaningful dimension)
- Progressive disclosure (details appear as you zoom in)
- Distinct visual identity per code element type
- Underground mode for dependency visualization already exists (extend, don't rebuild)
- X-ray mode already exists (preserve existing behavior)

**From Tech Spec:**
- New `RadialCityLayoutEngine` alongside existing grid engine (radial is default, grid remains available)
- Parser analysis modules already provide depth, containment, and external detection data
- Infrastructure classification via package-name heuristics (new analysis module)
- Sign components as reusable R3F components
- Shape primitives via geometry factory utility
- Clustering threshold configurable (default 20)
- Performance: memoize layout computation, frustum culling for signs, LOD-based visibility

**From Architect Review (additional technical requirements):**

- `RadialCityLayoutEngine` must define a typed `RadialCityLayoutConfig` interface with explicit fields (`ringSpacing`, `arcPadding`, `districtGap`, `buildingSpacing`, `centerRadius`, `density`) — no reliance on untyped index signature. (Architect Review #11)
- Layout engine files live in `packages/ui/src/features/canvas/layout/engines/` (not `layout/` root). New `radialCityLayout.ts` goes alongside existing `cityLayout.ts` in `engines/`. (Architect Review #10)
- New parser fields (`visibility`, `isDeprecated`, `isExported`, `methodCount`, `isAbstract`, `infrastructureType`) are transported via the existing `metadata: Record<string, unknown>` bag on `GraphNode`. No API schema changes are needed — UI reads these from `node.metadata`. This is the established pattern used by `externalDetector.ts`. (Architect Review #9)
- Radial layout utility must include a `distributeDistrictsAcrossRings` function that handles directories with nodes spanning multiple depth rings. A district may span adjacent rings rather than forcing all nodes onto one ring.
- `CityView.tsx` must explicitly instantiate `RadialCityLayoutEngine` by type (not via `autoSelect`) to avoid registry iteration order issues.

### Architect Review Notes

The following items were identified during the architect review and are tracked here for story design awareness:

1. **GraphNode type union extension** — `'interface' | 'enum' | 'abstract_class'` must be added. Covered by FR-V13. This is a prerequisite for shape language stories.

2. **Layout engine switching** — No UI switching in Phase 1. Radial is default, grid remains registered. CityView uses explicit type selection.

3. **Camera auto-fit for radial layout** — Radial bounding box is circular, not rectangular. Camera framing logic needs update. Covered by FR-V14.

4. **Sign performance budget** — High risk area. 1000-node codebases at neighborhood/street zoom could have 100-200 visible signs. Instanced rendering or batching required. Covered by NFR-V1.

5. **Rooftop gardens depend on nested type containment** — The containment analyzer (`containmentAnalyzer.ts`) must support class → inner class parentId relationships for rooftop gardens to work. **Action:** Verify this before implementing FR-V9. If not supported, defer rooftop gardens or add a parser prerequisite story.

6. **Street-level layer content** — In Phase 1, the "street level" layer has no dedicated content (request flows and entry points are Phase 2). **Decision:** Phase 1 layer toggle includes only "above ground" (buildings, signs, infrastructure) and "underground" (dependency tunnels). Street-level toggle is deferred to Phase 2. FR-V12 updated accordingly.

7. **Registry auto-select priority** — Both city engines return `canHandle: true` for file-node graphs. Resolved by having CityView use explicit type selection rather than auto-select.

8. **lodLevel default conflict** — Current default is 4 (street level, all detail). New LOD system expects camera distance to drive the level. **Decision:** Default to 1 (city level) and let the LOD calculator hook drive it up based on camera distance. Prevents flash of all signs on initial render. Covered by NFR-V2.

9. **API pass-through for parser fields** — New parser metadata fields use the existing `metadata: Record<string, unknown>` bag. No API schema changes needed. UI reads from `node.metadata.visibility`, `node.metadata.methodCount`, etc.

10. **Tech spec file paths corrected** — Layout engine files are in `layout/engines/`, not `layout/` root. Tech spec should reference `packages/ui/src/features/canvas/layout/engines/radialCityLayout.ts`.

11. **Typed RadialCityLayoutConfig** — Must define explicit typed interface extending `LayoutConfig`, not rely on `[key: string]: unknown`. Aligns with no-any-types rule.

### FR Coverage Map

| FR | Epic | Description |
|---|---|---|
| FR10 | 9-B | Render code as interactive 3D visualization |
| FR11 | 9-A | Apply layout algorithm based on relationships |
| FR12 | 9-A, 9-C | Auto-adjust LOD based on zoom |
| FR13 | 9-A | Maintain 60fps with 1000+ elements |
| FR15 | 9-A, 9-C | Hide non-essential elements by default |
| FR16 | 9-D | Visualize dependency relationships |
| FR17 | 9-B, 9-C, 9-D | Highlight architectural patterns visually |
| FR18 | 9-B | Represent complexity through visual properties |
| FR25 | 9-D | Dual mini-map support |
| FR-V1 | 9-A | Radial positioning by dependency depth |
| FR-V2 | 9-A | District grouping by module/namespace |
| FR-V3 | 9-B | Distinct shapes per code structure type |
| FR-V4 | 9-C | Contextual signage with visual styles |
| FR-V5 | 9-C | Zoom-based signage visibility |
| FR-V6 | 9-D | Infrastructure landmark buildings |
| FR-V7 | 9-D | Classify external packages by infra type |
| FR-V8 | 9-D | Position infrastructure at city edges |
| FR-V9 | 9-B | Rooftop structures for nested types |
| FR-V10 | 9-A | Cluster small structures at high zoom |
| FR-V11 | 9-A | Density slider control |
| FR-V12 | 9-D | Layer visibility toggle |
| FR-V13 | 9-B | GraphNode.type union extension |
| FR-V14 | 9-A | Camera auto-fit for radial bounding box |

## Epic List

### Epic 9-A: Radial City Layout & Navigation

Users can view their codebase as a radial city where the entry point sits at center and code radiates outward by dependency depth, with districts grouping related modules. Users can adjust city density to spread or compact the view.

**FRs covered:** FR-V1, FR-V2, FR-V10, FR-V11, FR-V14, FR11, FR12, FR13, FR15
**NFRs addressed:** NFR-P6, NFR-P8, NFR-P9, NFR-SC4, NFR-V2

**Key deliverables:**
- RadialCityLayoutEngine with typed RadialCityLayoutConfig
- Radial layout utilities (ring radius, district arcs, multi-ring district distribution)
- District arc segments with colored ground planes
- Clustering for large districts (>20 nodes → compound building)
- Density slider UI control
- Camera auto-fit for radial bounding box
- lodLevel default fix (4 → 1)
- CityView updated to explicitly use radial engine

**Dependencies:** None (foundational epic)

#### Story 9-A.1: Radial Layout Utility Functions

As a developer viewing a codebase,
I want the layout engine to compute radial positions based on dependency depth,
So that code structure is spatially meaningful — entry points at center, deeper code at edges.

**Acceptance Criteria:**

**Given** a set of nodes with depth values and directory groupings
**When** `calculateRingRadius(depth, config)` is called
**Then** it returns a radius proportional to the depth value scaled by `ringSpacing` and `centerRadius`

**Given** a set of districts on a single depth ring
**When** `assignDistrictArcs(districts, ringDepth, config)` is called
**Then** each district receives a contiguous arc segment proportional to its node count with `arcPadding` between segments

**Given** a directory with nodes spanning multiple depth rings
**When** `distributeDistrictsAcrossRings(districts, nodeDepths, config)` is called
**Then** the district spans adjacent rings rather than forcing all nodes onto one ring

**Given** nodes assigned to an arc segment
**When** `positionNodesInArc(nodes, arcStart, arcEnd, radius, config)` is called
**Then** nodes are positioned within the arc with `buildingSpacing` between them

**Given** entry-point nodes (depth=0)
**When** `calculateEntryPointPosition(entryNodes, config)` is called
**Then** they are positioned at or near the center point within `centerRadius`

#### Story 9-A.2: Radial City Layout Engine

As a developer viewing a codebase,
I want the city to render in a radial layout,
So that I can see the architectural flow from entry point outward.

**Acceptance Criteria:**

**Given** a graph with depth-annotated nodes
**When** the `RadialCityLayoutEngine.layout()` is called
**Then** it returns positions in concentric rings with depth-0 at center and deeper nodes at outer rings

**Given** the `RadialCityLayoutEngine`
**When** it is instantiated
**Then** it implements the `LayoutEngine` interface with type `'radial-city'`

**Given** a `RadialCityLayoutConfig`
**When** it is defined
**Then** it is a typed interface extending `LayoutConfig` with explicit fields: `ringSpacing`, `arcPadding`, `districtGap`, `buildingSpacing`, `centerRadius`, `density`

**Given** external nodes in the graph
**When** the layout is computed
**Then** external nodes are positioned at the outermost ring

**Given** the radial layout engine
**When** registered in the `LayoutRegistry`
**Then** it is available alongside the existing `CityLayoutEngine`

#### Story 9-A.3: District Ground Planes

As a developer viewing a codebase,
I want to see colored ground areas for each module district,
So that I can visually identify which module a group of buildings belongs to.

**Acceptance Criteria:**

**Given** nodes grouped into districts by directory/module
**When** the city view renders
**Then** each district displays a colored arc-segment ground plane beneath its buildings

**Given** multiple districts on the same ring
**When** rendered
**Then** district boundaries are visible as subtle lines between arc segments

**Given** district ground planes
**When** the density slider changes
**Then** ground planes resize to match the new layout spacing

#### Story 9-A.4: CityView Radial Integration & Camera Auto-Fit

As a developer viewing a codebase,
I want the city view to use the radial layout by default with proper camera framing,
So that I see the full radial city on initial load.

**Acceptance Criteria:**

**Given** the `CityView` component
**When** it instantiates a layout engine
**Then** it explicitly uses `RadialCityLayoutEngine` (not via registry `autoSelect`)

**Given** the radial layout produces a circular bounding box
**When** the camera auto-fits to the scene
**Then** the entire radial city is visible with appropriate padding

**Given** the store's `lodLevel`
**When** the view initializes
**Then** `lodLevel` defaults to 1 (city level), and the LOD calculator hook drives it based on camera distance (NFR-V2)

**Given** density config from the store
**When** passed to the radial engine
**Then** the layout recalculates with updated spacing values

#### Story 9-A.5: Density Slider & Store Extensions

As a developer viewing a codebase,
I want a slider to control how spread out or compact the city layout is,
So that I can adjust readability for different codebase sizes.

**Acceptance Criteria:**

**Given** the canvas store
**When** `layoutDensity` state is accessed
**Then** it returns a number in range 0-1 (0=dense, 1=spread) with a sensible default

**Given** the density slider UI component
**When** the user drags it
**Then** the store's `layoutDensity` updates and the city layout recalculates

**Given** the density value changes
**When** the radial engine receives the new config
**Then** `ringSpacing`, `buildingSpacing`, and `districtGap` scale proportionally

#### Story 9-A.6: Node Clustering at High Zoom

As a developer viewing a large codebase from far away,
I want large districts to collapse into a single compound building,
So that the city remains readable and performant at city-level zoom.

**Acceptance Criteria:**

**Given** a district with more than 20 nodes (configurable threshold)
**When** the LOD level is 1 (city level)
**Then** the district renders as a single compound building with a count badge showing the number of contained nodes

**Given** a clustered district
**When** the user zooms to district level (LOD 2)
**Then** the compound building expands into individual buildings

**Given** the clustering threshold
**When** configured via the radial layout config
**Then** the threshold value is respected (default 20)

---

### Epic 9-B: Shape Language & Visual Differentiation

Users can visually identify what type of code structure they're looking at — classes appear as multi-story buildings, functions as single-story shops, variables as crates, interfaces as glass buildings, abstract classes as dashed-outline buildings, and enums as textured crates. Nested types appear as rooftop structures.

**FRs covered:** FR-V3, FR-V9, FR-V13, FR10, FR17, FR18
**NFRs addressed:** NFR-P6, NFR-P7

**Key deliverables:**
- GraphNode.type union extension (interface, enum, abstract_class)
- Building geometry factory (type → geometry + material config)
- 6 typed building components (ClassBuilding, FunctionShop, InterfaceBuilding, AbstractBuilding, VariableCrate, EnumCrate)
- Rooftop gardens for nested types (contingent on containment analyzer — Architect Note #5)
- Updated cityViewUtils with shape constants and helpers

**Dependencies:** Builds on 9-A (radial positions), but standalone functional with any layout

#### Story 9-B.1: Extend GraphNode Type Union & Shape Metadata

As a developer viewing a codebase,
I want the system to recognize interfaces, enums, and abstract classes as distinct types,
So that each can be rendered with a unique visual identity.

**Acceptance Criteria:**

**Given** the `GraphNode` type definition
**When** updated
**Then** the `type` union includes `'interface' | 'enum' | 'abstract_class'` alongside existing types

**Given** the `GraphNode` interface
**When** updated with shape metadata
**Then** it includes optional fields: `methodCount?: number`, `isAbstract?: boolean`, `hasNestedTypes?: boolean`

**Given** nodes with shape metadata
**When** accessed by UI components
**Then** metadata values are read from `node.metadata.methodCount`, `node.metadata.isAbstract`, etc. (metadata bag transport pattern)

#### Story 9-B.2: Building Geometry Factory & Shape Constants

As a developer viewing a codebase,
I want each code structure type to have a distinct geometry and material configuration,
So that a geometry factory can map node types to Three.js render parameters.

**Acceptance Criteria:**

**Given** a `GraphNode` with `type: 'class'`
**When** the geometry factory processes it
**Then** it returns a rectangular multi-story building config with height scaled by `methodCount` (or depth-based fallback)

**Given** a `GraphNode` with `type: 'function'`
**When** the geometry factory processes it
**Then** it returns a single-story wide shop config visually distinct from a class

**Given** a `GraphNode` with `type: 'variable'`
**When** the geometry factory processes it
**Then** it returns a small crate geometry config

**Given** a `GraphNode` with `type: 'interface'`
**When** the geometry factory processes it
**Then** it returns a glass building config (transparent material, 0.3 opacity, wireframe edges)

**Given** a `GraphNode` with `type: 'abstract_class'`
**When** the geometry factory processes it
**Then** it returns a dashed-outline building config (semi-transparent fill, 0.5 opacity, dashed edge lines)

**Given** a `GraphNode` with `type: 'enum'`
**When** the geometry factory processes it
**Then** it returns a crate config with distinct striped/patterned material

**Given** `cityViewUtils`
**When** updated
**Then** it includes dimension constants and material configurations for each building type

#### Story 9-B.3: Typed Building Components

As a developer viewing a codebase,
I want each code structure to render as a visually distinct 3D shape,
So that I can identify classes, functions, interfaces, and variables at a glance.

**Acceptance Criteria:**

**Given** a class node
**When** rendered in city view
**Then** it appears as a `ClassBuilding` — multi-story box with height proportional to method count, opaque walls

**Given** a standalone function node
**When** rendered in city view
**Then** it appears as a `FunctionShop` — single-story wide building visually distinct from a class

**Given** an interface node
**When** rendered in city view
**Then** it appears as an `InterfaceBuilding` — glass material (transparent, 0.3 opacity) with visible wireframe edge overlay

**Given** an abstract class node
**When** rendered in city view
**Then** it appears as an `AbstractBuilding` — dashed edge lines with semi-transparent fill (0.5 opacity)

**Given** a variable node at close zoom
**When** rendered in city view
**Then** it appears as a `VariableCrate` — small box with wood-like color

**Given** an enum node
**When** rendered in city view
**Then** it appears as an `EnumCrate` — small box with striped/patterned material

#### Story 9-B.4: CityView Type-Switched Rendering

As a developer viewing a codebase,
I want the city view to render the correct building component for each node type,
So that the city contains a mix of visually distinct structures.

**Acceptance Criteria:**

**Given** the `CityView` component rendering nodes
**When** it encounters each node
**Then** it selects the appropriate typed building component based on `node.type` and metadata

**Given** a mixed graph with classes, functions, variables, interfaces, and enums
**When** the city view renders
**Then** each node renders as its corresponding typed building (no uniform boxes)

**Given** the existing `Building` component
**When** replaced with type-switched rendering
**Then** the `Building` component serves as fallback for any unrecognized types

#### Story 9-B.5: Rooftop Gardens for Nested Types

As a developer viewing a codebase,
I want nested types (inner classes, nested enums) to appear as smaller structures on parent building rooftops,
So that I can see containment relationships visually.

**Acceptance Criteria:**

**Given** a class node with children whose `parentId` points to it
**When** rendered in city view
**Then** nested structures appear as smaller buildings on the roof of the parent building

**Given** multiple levels of nesting
**When** rendered
**Then** each nested level is progressively smaller and stacked (tiered, maximum 3 tiers)

**Given** more than 3 nesting tiers
**When** rendered
**Then** excess tiers are collapsed into a count badge on the topmost tier

**Given** the containment analyzer does not support class → inner class `parentId`
**When** this story is implemented
**Then** rooftop gardens are skipped gracefully (buildings render without rooftop structures)

---

### Epic 9-C: Signage System & Progressive Labels

Users can see contextual labels throughout the city that communicate code concepts at a glance — neon signs for public APIs, brass plaques for private members, hanging signs for class names, highway signs for modules. Labels appear and disappear based on zoom level for readability.

**FRs covered:** FR-V4, FR-V5, FR12, FR15, FR17
**NFRs addressed:** NFR-V1, NFR-V2, NFR-P6, NFR-P7

**Key deliverables:**
- 7 sign type R3F components (NeonSign, BrassPlaque, HangingSign, HighwaySign, LabelTape, MarqueeSign, ConstructionSign)
- Instanced rendering / geometry batching for sign performance (NFR-V1)
- Sign selection utility (node metadata → sign type)
- LOD-based visibility system (4 zoom levels)
- LOD calculator hook (camera distance → lodLevel)
- Sign metadata extensions on GraphNode (visibility, isDeprecated, isExported via metadata bag)

**Dependencies:** Builds on 9-B (signs attach to typed buildings), but standalone functional with generic buildings

#### Story 9-C.1: Sign Selection & Visibility Utilities

As a developer viewing a codebase,
I want the system to determine which sign style and visibility applies to each node,
So that sign rendering is driven by testable utility logic.

**Acceptance Criteria:**

**Given** a node with `metadata.visibility: 'public'`
**When** `getSignType(node)` is called
**Then** it returns `'neon'`

**Given** a node with `metadata.visibility: 'private'`
**When** `getSignType(node)` is called
**Then** it returns `'brass'`

**Given** a node with `type: 'class'`
**When** `getSignType(node)` is called
**Then** it returns `'hanging'` (class name sign)

**Given** a file/module-level node
**When** `getSignType(node)` is called
**Then** it returns `'highway'` (module sign)

**Given** a node with `metadata.isExported: true`
**When** `getSignType(node)` is called
**Then** it returns `'marquee'`

**Given** a node with `metadata.isDeprecated: true`
**When** `getSignType(node)` is called
**Then** it returns `'construction'`

**Given** a variable node
**When** `getSignType(node)` is called
**Then** it returns `'labelTape'`

**Given** a sign type of `'highway'` and LOD level 1 (city)
**When** `getSignVisibility('highway', 1)` is called
**Then** it returns `true`

**Given** a sign type of `'brass'` and LOD level 1 (city)
**When** `getSignVisibility('brass', 1)` is called
**Then** it returns `false`

**Given** LOD level 3 (neighborhood)
**When** `getSignVisibility` is called for each sign type
**Then** highway, hanging, neon, brass, and labelTape are all visible

#### Story 9-C.2: Sign Component Library

As a developer viewing a codebase,
I want visually distinct sign components for each code concept,
So that labels communicate meaning through their appearance.

**Acceptance Criteria:**

**Given** a `NeonSign` component
**When** rendered
**Then** it displays glowing emissive text, larger size, visible from far distance

**Given** a `BrassPlaque` component
**When** rendered
**Then** it displays small matte metallic text, only visible at close range

**Given** a `HangingSign` component
**When** rendered
**Then** it displays text suspended from a bracket, medium visibility range

**Given** a `HighwaySign` component
**When** rendered
**Then** it displays a large rectangular panel on a post with green background and white text

**Given** a `LabelTape` component
**When** rendered
**Then** it displays a small flat text strip attached to a surface

**Given** a `MarqueeSign` component
**When** rendered
**Then** it displays large illuminated text

**Given** a `ConstructionSign` component
**When** rendered
**Then** it displays a yellow diamond/rectangle warning sign

**Given** more than 50 signs visible in the frustum
**When** rendered simultaneously
**Then** sign components use instanced rendering or geometry batching to maintain performance (NFR-V1: <2ms per frame at 200 visible signs)

#### Story 9-C.3: LOD Calculator Hook

As a developer navigating a codebase city,
I want the level of detail to adjust automatically as I zoom in and out,
So that labels appear progressively without overwhelming the view.

**Acceptance Criteria:**

**Given** the camera at far distance (city zoom)
**When** the `useLodCalculator` hook runs
**Then** it sets the store's `lodLevel` to 1

**Given** the camera at medium distance (district zoom)
**When** the hook runs
**Then** it sets `lodLevel` to 2

**Given** the camera at close distance (neighborhood zoom)
**When** the hook runs
**Then** it sets `lodLevel` to 3

**Given** the camera at very close distance (street zoom)
**When** the hook runs
**Then** it sets `lodLevel` to 4

**Given** the initial render
**When** the LOD calculator executes
**Then** it runs in the same render cycle as the layout to prevent a flash of all signs (NFR-V2)

**Given** the LOD level transitions
**When** changing between levels
**Then** transitions are smooth without visible stuttering (NFR-P7)

#### Story 9-C.4: Sign Integration in CityView

As a developer viewing a codebase,
I want contextual signs attached to buildings throughout the city,
So that I can read code names, access levels, and statuses at appropriate zoom levels.

**Acceptance Criteria:**

**Given** a class building in the city view
**When** rendered
**Then** it has a hanging sign with the class name attached

**Given** a public function building
**When** rendered
**Then** it has a neon sign with the function name

**Given** a private function building
**When** rendered
**Then** it has a brass plaque with the function name

**Given** a district ground plane
**When** rendered
**Then** it has a highway sign at the boundary with the module/directory name

**Given** an exported node
**When** rendered
**Then** it has a marquee sign

**Given** LOD level 1 (city zoom)
**When** viewing the city
**Then** only highway signs (module names) are visible

**Given** LOD level 2 (district zoom)
**When** viewing the city
**Then** highway signs + hanging signs (class names) + neon signs (public API) are visible

**Given** LOD level 3 (neighborhood zoom)
**When** viewing the city
**Then** all signs except construction signs are visible

**Given** LOD level 4 (street zoom)
**When** viewing the city
**Then** all sign types are visible including construction (deprecated) signs

#### Story 9-C.5: Sign Metadata Extensions on GraphNode

As a developer viewing a codebase,
I want sign-relevant metadata available on graph nodes,
So that the sign system can determine appropriate sign types.

**Acceptance Criteria:**

**Given** the `GraphNode` interface
**When** updated
**Then** it includes optional fields: `visibility?: 'public' | 'protected' | 'private' | 'static'`, `isDeprecated?: boolean`, `isExported?: boolean`

**Given** a node without sign metadata populated
**When** the sign system reads it
**Then** it falls back gracefully — defaults to neon (public) sign style, no construction sign, no marquee sign

**Given** nodes with metadata populated by the parser
**When** accessed by the sign utilities
**Then** values are read from `node.metadata.visibility`, `node.metadata.isDeprecated`, `node.metadata.isExported`

---

### Epic 9-D: Infrastructure Landmarks & Layer Control

Users can orient themselves in the city using distinctive infrastructure landmarks — harbors for databases, airports for external APIs, power stations for event buses. External packages are classified by type and positioned at city edges in themed zones. Users can toggle above-ground and underground layers.

**FRs covered:** FR-V6, FR-V7, FR-V8, FR-V12, FR16, FR17, FR25
**NFRs addressed:** NFR-P6

**Key deliverables:**
- Infrastructure classifier analysis module (package name → infra type heuristics)
- GraphNode infrastructureType metadata field
- 6 infrastructure landmark R3F components (PowerStation, WaterTower, MunicipalBuilding, Harbor, Airport, CityGate)
- Infrastructure edge positioning in radial layout
- Layer toggle store extension (aboveGround, underground — 2 layers in Phase 1)
- Layer toggle UI component

**Dependencies:** Builds on 9-A (edge positioning), but standalone functional with any layout

#### Story 9-D.1: Infrastructure Classifier Analysis Module

As a developer viewing a codebase,
I want external packages classified by infrastructure type,
So that the city can render them as distinct landmarks.

**Acceptance Criteria:**

**Given** an external package with name `pg`, `mysql`, `mongoose`, or `prisma`
**When** the infrastructure classifier processes it
**Then** it returns `infrastructureType: 'database'`

**Given** an external package with name `axios`, `node-fetch`, or `got`
**When** the classifier processes it
**Then** it returns `infrastructureType: 'api'`

**Given** an external package with name `bull`, `amqplib`, or `kafkajs`
**When** the classifier processes it
**Then** it returns `infrastructureType: 'queue'`

**Given** an external package with name `redis` or `memcached`
**When** the classifier processes it
**Then** it returns `infrastructureType: 'cache'`

**Given** an unknown external package
**When** the classifier processes it
**Then** it returns `infrastructureType: 'general'`

**Given** the classifier output
**When** stored on the node
**Then** it is accessible via `node.metadata.infrastructureType`

#### Story 9-D.2: Infrastructure Landmark Components

As a developer viewing a codebase,
I want infrastructure nodes rendered as distinctive landmark buildings,
So that I can orient myself in the city and identify external system connections at a glance.

**Acceptance Criteria:**

**Given** an external node with `infrastructureType: 'queue'`
**When** rendered in city view
**Then** it appears as a `PowerStation` — tall industrial geometry with smokestacks/towers, visually distinct silhouette

**Given** an external node with `infrastructureType: 'queue'` (job queue variant)
**When** rendered in city view
**Then** it appears as a `WaterTower` — cylindrical tank on stilts

**Given** a cron/scheduled task node
**When** rendered in city view
**Then** it appears as a `MunicipalBuilding` — dome or clock tower

**Given** an external node with `infrastructureType: 'database'`
**When** rendered in city view
**Then** it appears as a `Harbor` — dock/pier geometry at the city edge

**Given** an external node with `infrastructureType: 'api'`
**When** rendered in city view
**Then** it appears as an `Airport` — terminal building with runway

**Given** an entry-point endpoint node
**When** rendered in city view
**Then** it appears as a `CityGate` — archway/tollbooth at the city edge

**Given** any infrastructure landmark
**When** viewed from any position in the city
**Then** its tall/distinctive silhouette remains visible as an orientation aid at all LOD levels

#### Story 9-D.3: Infrastructure Edge Positioning

As a developer viewing a codebase,
I want infrastructure nodes positioned at the city edges grouped by type,
So that databases cluster at the harbor zone, APIs at the airport zone, etc.

**Acceptance Criteria:**

**Given** external nodes classified by infrastructure type
**When** the radial layout positions them
**Then** nodes of the same type cluster together in a dedicated edge zone

**Given** database-type nodes
**When** positioned
**Then** they appear in a contiguous "harbor zone" arc at the outermost ring

**Given** API-type nodes
**When** positioned
**Then** they appear in a contiguous "airport zone" arc at the outermost ring

**Given** entry-point endpoints
**When** positioned
**Then** they appear in a "gate zone" arc at the city edge

**Given** multiple infrastructure types
**When** the layout assigns edge zones
**Then** each zone has visual separation from adjacent zones

#### Story 9-D.4: Infrastructure Rendering in CityView

As a developer viewing a codebase,
I want the city view to render infrastructure landmarks instead of generic buildings for classified nodes,
So that the city has recognizable landmarks for navigation.

**Acceptance Criteria:**

**Given** a node with `metadata.infrastructureType` set
**When** the CityView renders it
**Then** it uses the appropriate infrastructure landmark component instead of a standard building

**Given** a node with `metadata.infrastructureType: 'general'` or no `infrastructureType`
**When** the CityView renders it
**Then** it renders as a standard external building (wireframe)

**Given** infrastructure landmarks
**When** rendered at any LOD level
**Then** landmarks remain visible (not hidden by LOD filtering)

#### Story 9-D.5: Layer Toggle Store & UI

As a developer viewing a codebase,
I want to toggle visibility of above-ground and underground layers,
So that I can focus on code structure or dependency connections independently.

**Acceptance Criteria:**

**Given** the canvas store
**When** `visibleLayers` state is accessed
**Then** it returns `{ aboveGround: boolean, underground: boolean }` with both defaulting to `true`

**Given** the `toggleLayer('aboveGround')` action
**When** called
**Then** the `aboveGround` layer visibility toggles and buildings/signs/landmarks hide or show

**Given** the `toggleLayer('underground')` action
**When** called
**Then** the `underground` layer visibility toggles and dependency tunnels hide or show

**Given** the layer toggle UI component
**When** rendered
**Then** it shows two toggle buttons (above ground / underground) in the canvas overlay alongside the density slider

**Given** the existing `isUndergroundMode` toggle
**When** the new layer system is implemented
**Then** the underground layer toggle replaces or wraps the existing `isUndergroundMode` boolean for backwards compatibility
