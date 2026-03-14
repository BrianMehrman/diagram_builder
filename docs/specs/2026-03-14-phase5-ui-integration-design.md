# Phase 5 — UI Integration Design Spec

## Problem

The canvas currently receives a UI-specific `Graph` type from `/api/graph/:repoId` and manually reconstructs semantic groupings (districts from path strings, clustering from node counts, LOD filtering) inside `useCityFiltering`. This duplicates logic that now lives properly in the `ParseResult`/`ViewResolver` layer built in Phases 1–4. The UI's own `GraphNode` type diverges from `IVMNode`, creating a maintenance burden and preventing the canvas from consuming tier views directly. There is also no layout architecture — city-specific code is scattered across `features/canvas/`, making it impossible to add alternative layouts (garden, basic 3D) without a major restructure.

## Solution

Migrate the UI to consume `ParseResult` directly. Replace the hand-rolled `Graph`/`GraphNode` types with `IVMGraph`/`IVMNode` from `@diagram-builder/core`. Wire `useCityLayout` and `useCityFiltering` to use `ViewResolver` tier views instead of the raw graph. Reorganize city-specific layout code into a `layouts/city/` module with a `LayoutEngine` interface, creating the foundation for alternative themes. Stub a `layouts/basic3d/` as the first sibling.

## Architecture Overview

```
API /api/graph/:repoId/parse-result
        ↓
    ParseResult
        ↓
  canvasStore.setParseResult()
        ↓
  createViewResolver(parseResult)
        ↓
  useLayout (city | basic3d)
        ↓
  resolver.getTier(File) → IVMGraph
        ↓
  CityView / Basic3DView
```

## API Layer

### New: `GET /api/graph/:repoId/parse-result`

Returns `ParseResult`:

```typescript
{
  graph: IVMGraph                          // full detail (tier 5)
  hierarchy: GroupHierarchy                // semantic grouping tree
  tiers: Record<SemanticTier, IVMGraph>    // pre-computed tier views 0–5
}
```

Server calls `buildParseResult(ivmGraph)` (already implemented in `packages/parser`) before serializing. No new parsing work.

### New: `GET /api/graph/:repoId/tier/:tier`

Returns a single `IVMGraph` for the requested tier (0–5). Calls `resolver.getTier(tier)` server-side. Useful for consumers that need a single tier slice without the full `ParseResult` payload.

### Existing: `GET /api/graph/:repoId`

Unchanged structurally. Gets a small enrichment: `IVMNode.metadata.properties` is populated with visual-rendering fields during the IVM conversion step in `packages/parser`:

| Field | Type | Source |
|---|---|---|
| `isExternal` | `boolean` | dependency analysis |
| `depth` | `number` | abstraction depth from entry point |
| `methodCount` | `number` | child method count |
| `isAbstract` | `boolean` | node modifier |
| `hasNestedTypes` | `boolean` | child type presence |
| `visibility` | `string` | access modifier |
| `isDeprecated` | `boolean` | JSDoc/annotation |
| `isExported` | `boolean` | export modifier |

## IVMNode Migration

### Type Deletion

`packages/ui/src/shared/types/graph.ts` is deleted. All imports of `Graph`, `GraphNode`, `GraphEdge` across the UI migrate to `IVMGraph`, `IVMNode`, `IVMEdge` from `@diagram-builder/core`.

### Visual Field Access

Components that previously read `node.methodCount` now read `node.metadata.properties?.methodCount`. This is a mechanical access-path change — no logic changes required.

### `abstract_class` Gap

`GraphNode.type` includes `abstract_class`; `IVMNode` does not. Abstract classes become `type: 'class'` with `metadata.properties.isAbstract: true`. Rendering components already branch on `isAbstract` for shape selection — behavior unchanged.

## Layout Architecture

### Directory Structure

```
features/canvas/layouts/
  types.ts              ← LayoutEngine interface
  index.ts              ← useLayout hook
  city/
    useCityLayout.ts    ← moved, consumes IVMGraph from resolver.getTier(File)
    useCityFiltering.ts ← moved, delegates district grouping to hierarchy
    CityView.tsx
    CityBlocks.tsx
    CitySky.tsx
    ... (all city-specific files)
  basic3d/
    useBasic3DLayout.ts ← stub: force-directed flat grid
    Basic3DView.tsx     ← stub: spheres + line edges
```

### LayoutEngine Interface

```typescript
interface LayoutEngine {
  id: 'city' | 'basic3d'
  label: string
}
```

`useLayout` reads `activeLayout` from the canvas store and returns the correct view component.

### Canvas Store Additions

```typescript
parseResult: ParseResult | null
resolver: ViewResolver | null
activeLayout: 'city' | 'basic3d'

setParseResult(result: ParseResult): void  // also creates resolver internally
setActiveLayout(layout: 'city' | 'basic3d'): void
```

## ViewResolver Integration

### WorkspacePage

Fetches `ParseResult` from `/api/graph/:repoId/parse-result` instead of `Graph` from `/api/graph/:repoId`. Calls `canvasStore.setParseResult(parseResult)`.

### useCityLayout

Calls `resolver.getTier(SemanticTier.File)` for the initial layout IVMGraph.

### useCityFiltering

District grouping drops the manual path-splitting loop. Districts map directly to `GroupNode` children at `SemanticTier.Module` from `parseResult.hierarchy`. No reconstruction needed.

### Camera LOD → ViewResolver Mapping

| Camera LOD | Distance | ViewResolver call |
|---|---|---|
| 1 (far out) | > 120 | `getTier(SemanticTier.Module)` |
| 2 (district) | 60–120 | `getTier(SemanticTier.File)` |
| 3 (neighborhood) | 25–60 | `getView({ baseTier: File, expand: [focusedDistrict] })` |
| 4 (street) | < 25 | `getView({ baseTier: Symbol, focalNodeId: selectedNode })` |

## Testing Strategy

### Unit Tests

- Visual field access via `metadata.properties` — confirms all former `GraphNode` fields are present on `IVMNode`
- `useLayout` — correct engine selected per `activeLayout` store value
- `useCityFiltering` — district groups sourced from `hierarchy.root.children`, not path-string reconstruction
- LOD→ViewResolver mapping — pure function for camera distance → `getView()` args

### Integration Tests

- `WorkspacePage` — mocks `/api/graph/:repoId/parse-result`, confirms `ParseResult` reaches store and `resolver` is initialized
- `useCityLayout` — fixture `ParseResult` → tier view IVMGraph used for layout (not full graph)
- Layout switcher — `city` ↔ `basic3d` swap renders correct view

### Regression Tests

- All existing `useCityFiltering` tests pass after district-grouping refactor
- All existing `useCityLayout` tests pass after IVMGraph input migration
- Phase 4 exporter tests untouched

### Out of Scope for Phase 5

- Rendering bug fixes
- Garden layout
- Multi-repo `ParseResult`

## Design Decisions

| Decision | Reasoning |
|---|---|
| Delete `Graph`/`GraphNode` types | IVMNode is the source of truth; two parallel graph types create divergence risk |
| Visual fields in `metadata.properties` | IVMNode's properties bag is the right extension point; avoids changing the IVMNode interface |
| `abstract_class` → `class` + `isAbstract` | IVMNode has no `abstract_class` type; rendering already uses `isAbstract` flag for shape selection |
| `layouts/` directory | Isolates layout-specific code, makes adding themes mechanical rather than surgical |
| ViewResolver in canvas store | Avoids prop-drilling through the component tree; any hook can access tier views |
| Basic3D as stub in Phase 5 | Layout switching infrastructure lands now; full basic3D implementation is Phase 6 |
| Granular `/tier/:tier` endpoint | Supports future consumers (CLI, export pipeline) that need a single tier without full ParseResult |
