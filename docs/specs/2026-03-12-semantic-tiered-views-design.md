# Semantic Tiered Views — Design Spec

## Problem

The diagram builder's parser produces a full IVMGraph that the 3D canvas can render at high fidelity. But export formats (Mermaid, SVG, Draw.io, PlantUML) have hard constraints — Mermaid caps at ~1000 edges, GLTF can't represent edges, 2D formats lose spatial depth. Each exporter currently handles its limitations independently with ad-hoc logic (Mermaid collapses parent edges and deduplicates on its own). There is no shared strategy for producing format-appropriate simplified views of the graph.

## Solution

Introduce a **semantic tiered view system** where the parser produces the full graph plus a GroupHierarchy — a tree of semantically meaningful groupings based on universal computer science concepts. Consumers (exporters, UI) request views at the appropriate tier, with optional focal-point-based progressive detail degradation and capacity constraints.

## Architecture

```
Raw IVMGraph (full detail, all nodes/edges — tier 5)
    ↓
GroupHierarchy (semantic grouping tree, built by parser)
    ↓
Pre-computed standard tiers (0-5, cached)
    ↓
View Resolver API (custom views, focal pruning, constraint satisfaction)
    ↓
Consumer-appropriate IVMGraph (valid, self-contained, renderable)
```

### Ownership

- **`packages/parser`** — GroupHierarchy builder, tier materialization, semantic analysis
- **`packages/core`** — shared types (SemanticTier, GroupNode, ViewConfig, etc.), ViewResolver API
- **`packages/ui`** — consumes views via ViewResolver, maps to city/garden/etc. visual metaphor

## Data Model

### SemanticTier

Universal code structure tiers based on language-agnostic CS concepts:

```typescript
enum SemanticTier {
  Repository = 0,   // repo-level overview
  Package = 1,      // npm package, go module, java package
  Module = 2,       // directory, namespace, barrel file
  File = 3,         // individual source files
  Symbol = 4,       // class, function, interface, enum
  Detail = 5,       // method, field, variable (full graph)
}
```

**Relationship to existing `LODLevel`:** The codebase already defines `LODLevel = 0 | 1 | 2 | 3 | 4 | 5` with matching descriptions in `LOD_DESCRIPTIONS`, and every `IVMNode`/`IVMEdge` carries an `lod` field. `SemanticTier` is **the same concept, formalized as an enum**. During Phase 1, `LODLevel` will be replaced by `SemanticTier` across the codebase — the numeric values and semantic meaning are identical, so this is a type rename, not a behavioral change. Node/edge `lod` fields will be retyped to `SemanticTier`.

Initial implementation uses language-universal groupings only — language-specific refinements (e.g., Go package conventions, TS barrel files) come later.

### GroupHierarchy

```typescript
interface GroupHierarchy {
  root: GroupNode;
  tierCount: Record<SemanticTier, number>; // node count per tier for quick stats
  edgesByTier: Record<SemanticTier, AggregatedEdge[]>; // all inter-group edges at each tier
}

interface GroupNode {
  id: string;                          // e.g., "group:src/auth"
  label: string;                       // e.g., "auth"
  tier: SemanticTier;
  nodeIds: string[];                   // IVM node IDs directly in this group
  children: GroupNode[];               // sub-groups
}

interface AggregatedEdge {
  sourceGroupId: string;
  targetGroupId: string;
  breakdown: Record<EdgeType, number>; // e.g., { imports: 3, calls: 7 }
  totalWeight: number;                 // sum of breakdown values
}
```

**Edge aggregation notes:**
- Edges are stored in a flat list per tier (`edgesByTier`) rather than per-group, avoiding duplication and enabling efficient lookup for focal-point pruning.
- `contains` edges are excluded from aggregation — containment is already represented by the GroupHierarchy tree structure. Only dependency edges (`imports`, `calls`, `extends`, `implements`, `uses`, `depends_on`, `exports`) participate. Detail-tier-only edges (`type_of`, `returns`, `parameter_of`) are also excluded — they only appear at tier 5 (full graph) and have no meaningful aggregation at higher tiers.

**Key properties:**
- Every IVM node appears in exactly one GroupNode — the tree is an exhaustive, non-overlapping partition
- Internal edges (between nodes within the same group) are hidden when the group is collapsed
- External edges merge into group-to-group AggregatedEdges preserving the edge type breakdown

### ParseResult

The parser's output changes from a single IVMGraph to:

```typescript
interface ParseResult {
  graph: IVMGraph;                        // full detail (tier 5)
  hierarchy: GroupHierarchy;              // semantic grouping tree
  tiers: Record<SemanticTier, IVMGraph>;   // pre-computed standard views
}
```

**Migration strategy:** A new function `buildParseResult(graph, context)` is introduced alongside the existing `convertToIVM`. Existing callers (`codebase-service.ts`, `repository-service.ts`, `demo-exports.ts`, tests) continue using `convertToIVM` unchanged during Phases 1-3. Phase 4 migrates exporter callers to `exportWithView(parseResult, ...)`. Phase 5 migrates the UI. Once all callers are migrated, `convertToIVM` is deprecated. This avoids a big-bang breaking change.

## Pre-computed Tiers

| Tier | What you see | Typical use |
|------|-------------|-------------|
| Repository (0) | Single node per repo, edges between repos | Multi-repo overview |
| Package (1) | Package/module groups, inter-package edges | Architecture overview |
| Module (2) | Directories/namespaces, inter-module edges | Project structure |
| File (3) | Individual files, file-to-file edges | Dependency diagrams |
| Symbol (4) | Classes/functions/interfaces, relationships | Class diagrams |
| Detail (5) | Full IVMGraph — all nodes and edges | 3D canvas deep zoom |

Each tier is a complete, valid IVMGraph. Group nodes use appropriate IVM node types (`package`, `module`, `directory`, etc.) so they render naturally in any consumer. Aggregated edges carry the type breakdown in `metadata.properties`.

Tier-materialized IVMGraphs have placeholder positions (0,0,0) and placeholder bounds, consistent with the existing architecture where layout is a separate downstream step. Consumers apply their own layout (radial city, force-directed, etc.) after receiving the tier view.

Tiers are materialized during `buildParseResult` as a natural extension of the existing node-walking pass.

## View Resolver API

Lives in `packages/core`. Instantiated from a `ParseResult`, produces simplified views.

```typescript
// Factory function
function createViewResolver(result: ParseResult): ViewResolver;

interface ViewResolver {
  // Fast path — returns pre-computed standard tier
  getTier(tier: SemanticTier): IVMGraph;

  // Custom view — collapse to a base tier with selective expand/collapse
  getView(config: ViewConfig): ViewResult;
}

interface ViewConfig {
  baseTier: SemanticTier;

  // Focal point for distance-based detail degradation
  focalNodeId?: string;

  // Full detail within N hops from focal point (default: 2)
  falloffHops?: number;

  // Selective expand/collapse
  expand?: string[];    // group IDs to expand one level deeper
  collapse?: string[];  // group IDs to collapse one level shallower

  // Capacity constraints
  constraints?: ViewConstraints;
}

interface ViewConstraints {
  maxNodes?: number;
  maxEdges?: number;
  allowedEdgeTypes?: EdgeType[];
  allowedNodeTypes?: NodeType[];
}

interface ViewResult {
  graph: IVMGraph;
  pruningReport?: {
    edgesDropped: number;
    edgesDroppedByType: Record<EdgeType, number>;
    groupsCollapsed: string[];
    constraintsSatisfied: boolean;
  };
}
```

## Focal-Point Pruning Strategy

When a consumer declares constraints and a focal point, detail degrades with distance from the center:

1. **Full detail at the center** — the focal node and its immediate connections render at the requested tier
2. **Progressive collapse outward** — 1st-hop neighbors stay detailed, 2nd-hop neighbors collapse one tier up, 3rd-hop collapse another tier up
3. **Recursive until under budget** — if still over the edge limit, the outermost ring collapses further
4. **Report what was dropped** — pruning report included so consumers can show "simplified view" indicators

**Pruning priority (when no focal point):**

1. Filter by edge type — drop types the consumer doesn't need (cheapest, most meaningful cut)
2. Drop lowest-weight aggregated edges — single-import connections pruned before heavily-coupled ones
3. Collapse least-connected groups one tier up — reduces edge count dramatically
4. Report if constraints couldn't be fully satisfied

When no focal point is specified, the repository entry point serves as the natural center.

**Caching:** The ViewResolver caches recently computed custom views keyed by `ViewConfig`. The UI is expected to debounce rapid zoom/pan actions before calling `getView()` — the resolver cache is a safety net, not a substitute for debouncing.

## Consumer Integration

### Exporters

Exporters continue to accept `(graph: IVMGraph, options?)` — they don't need to know about tiers. A convenience function handles view resolution:

```typescript
function exportWithView(
  parseResult: ParseResult,
  exporter: Exporter<any>,
  options?: {
    tier?: SemanticTier;
    viewConfig?: ViewConfig;
    exportOptions?: BaseExportOptions;
  }
): ExportResult
```

**Default tiers per exporter:**
- Mermaid flowchart → File
- Mermaid classDiagram → Symbol
- PlantUML → File or Symbol (by diagram type)
- Draw.io → File
- SVG → File
- GLTF → Detail (full graph for 3D)

The Mermaid exporter's existing ad-hoc parent collapsing and dedup logic can be removed once the view resolver handles it upstream.

### UI/Canvas

- Receives `ParseResult` instead of raw IVMGraph
- Uses `getTier(File)` as initial city layout input
- On zoom into a district, calls `getView({ baseTier: File, expand: ["group:src/auth"] })`
- The city's own LOD/camera system controls *when* to expand — the view resolver controls *what* to show
- Existing radial layout, clustering, and LOD calculations continue to work on view-resolved IVMGraphs
- `useCityFiltering` manual collapse logic can be simplified — the view resolver handles it upstream

The UI's visual metaphor (city, garden, etc.) maintains its own mapping from semantic tiers to visual elements. This mapping is independent and interchangeable.

## Phasing

### Phase 1: Core Types & GroupHierarchy Builder
- Define `SemanticTier`, `GroupNode`, `GroupHierarchy`, `AggregatedEdge` types in `packages/core`
- Replace `LODLevel` with `SemanticTier` across the codebase (same values, type rename)
- Build hierarchy builder in `packages/parser` — walks IVMGraph, groups by universal CS tiers, computes aggregated edges with type breakdowns
- Add `buildParseResult` function (existing `convertToIVM` unchanged)
- Validate that `small-ts-repo` has sufficient tier depth (package/module/file/symbol levels); if not, create a richer fixture before proceeding
- Tests against fixture

### Phase 2: Tier Materialization
- Pre-compute standard tier views (0-5) from GroupHierarchy
- Each tier produces a valid, self-contained IVMGraph
- Verify: tier 5 === full graph

### Phase 3: View Resolver
- Implement `getTier()` fast path
- Implement `getView()` with expand/collapse
- Focal point + progressive collapse pruning
- Constraint satisfaction with pruning report
- Lives in `packages/core`

### Phase 4: Exporter Integration
- Add `exportWithView()` convenience function
- Wire up default tiers per exporter
- Migrate Mermaid's ad-hoc collapsing to view resolver
- Verify all 6 exporters produce valid output from tier views

### Phase 5: UI Integration
- Canvas consumes `ParseResult` instead of raw IVMGraph
- Replace manual filtering in `useCityFiltering` with view resolver calls
- Wire zoom-to-expand: camera distance triggers `getView()` with expanded groups

### Phase 6: Test Fixtures
- Expand test repositories beyond small-ts-repo
- Multi-language fixture (even if parsing is minimal)
- Large graph fixture to verify constraint satisfaction and pruning

Each phase is independently shippable and testable. Phases 1-3 are foundation. Phases 4-5 are consumer migrations. Phase 6 runs alongside everything.

## Design Decisions

| Decision | Reasoning |
|----------|-----------|
| Language-universal groupings first | Test fixtures need to grow alongside language support; no point building specific logic you can't verify |
| Parser owns the hierarchy | Parser has semantic understanding of code structure; UI layers are just renderers with different metaphors |
| ViewResolver in core | Consumed by both exporters and UI; core already sits between parser and consumers |
| Pre-computed tiers + on-demand views | 90% of consumers grab a standard tier (fast); custom views available when needed |
| Internal edges hidden on collapse | Simplifies the model; internal complexity only matters when looking inside a group |
| External edges preserve type breakdown | Cheap to store; different consumers care about different edge types |
| Focal-point pruning over uniform pruning | Matches how developers explore code — high detail where you're looking, context fades at the periphery |
| New function instead of breaking API | `buildParseResult` introduced alongside `convertToIVM`; callers migrate phase-by-phase, no big-bang break |
| `SemanticTier` replaces `LODLevel` | Same numeric values and meaning; formalized as an enum with explicit names |
| Edges stored per-tier, not per-group | Flat list avoids duplication, enables efficient bidirectional lookup for focal pruning |
| `contains` edges excluded from aggregation | Containment is structural (represented by the tree), not a dependency |
