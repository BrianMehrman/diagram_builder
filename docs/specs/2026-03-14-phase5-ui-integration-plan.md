# Phase 5 UI Integration — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the canvas to consume `ParseResult` from a new API endpoint, migrate the UI from the hand-rolled `Graph`/`GraphNode` types to `IVMGraph`/`IVMNode`, and reorganize city layout code into a `layouts/` architecture that supports alternative themes.

**Architecture:** A new `/api/graph/:repoId/parse-result` endpoint calls `buildParseResult()` server-side and returns the full semantic layer. `WorkspacePage` fetches `ParseResult`, stores it in `canvasStore`, which creates and caches a `ViewResolver`. Layout hooks read tier views from the resolver instead of the raw graph. City-specific code moves to `features/canvas/layouts/city/`; a `basic3d` stub lands as a sibling.

**Tech Stack:** TypeScript, React, Zustand, Vitest, Express, Neo4j, `@diagram-builder/core` (IVMGraph, ParseResult, ViewResolver, SemanticTier), `@diagram-builder/parser` (buildParseResult)

**Spec:** `docs/specs/2026-03-14-phase5-ui-integration-design.md`

---

## Chunk 1: Backend — Visual Field Enrichment + New Endpoints

### Task 1: Enrich graph-service.ts with visual fields in metadata.properties

**Files:**
- Modify: `packages/api/src/services/graph-service.ts`
- Modify: `packages/api/src/routes/graph.test.ts`

The Neo4j query currently returns `visibility` and `methodCount` as top-level fields on the node objects. After this task, all visual-rendering fields (`isExternal`, `depth`, `methodCount`, `isAbstract`, `hasNestedTypes`, `visibility`, `isDeprecated`, `isExported`) are written into `metadata.properties` instead of top-level fields.

- [ ] **Step 1: Write failing tests**

Add to `packages/api/src/routes/graph.test.ts`, inside the existing `GET /:repoId` describe block:

```typescript
it('puts visual rendering fields in metadata.properties, not top-level', async () => {
  const res = await request(app)
    .get(`/api/graph/${mockRepoId}`)
    .set('Authorization', `Bearer ${authToken}`)

  expect(res.status).toBe(200)
  const node = res.body.nodes[0]
  // visual fields must be in metadata.properties
  expect(node.metadata.properties).toBeDefined()
  expect(node.metadata.properties.methodCount).toBeDefined()
  expect(node.metadata.properties.visibility).toBeDefined()
  // must NOT be top-level
  expect(node.methodCount).toBeUndefined()
  expect(node.visibility).toBeUndefined()
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd packages/api && npx vitest run src/routes/graph.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `node.methodCount` is currently set at top-level.

- [ ] **Step 3: Update Neo4j query in graph-service.ts to add missing fields**

In `getFullGraph()`, update the nodes query to also fetch `isExternal`, `depth`, `isAbstract`, `hasNestedTypes`, `isDeprecated`, `isExported`:

```typescript
const nodesQuery = `
  MATCH (r:Repository {id: $repoId})-[:CONTAINS*]->(n)
  RETURN n.id as id, n.type as type, n.label as label, n.path as path,
         n.x as x, n.y as y, n.z as z, n.lod as lod, n.parentId as parentId,
         n.language as language, n.loc as loc, n.complexity as complexity,
         n.dependencyCount as dependencyCount, n.dependentCount as dependentCount,
         n.startLine as startLine, n.endLine as endLine,
         n.startColumn as startColumn, n.endColumn as endColumn,
         n.visibility as visibility, n.methodCount as methodCount,
         n.isExternal as isExternal, n.depth as depth,
         n.isAbstract as isAbstract, n.hasNestedTypes as hasNestedTypes,
         n.isDeprecated as isDeprecated, n.isExported as isExported,
         n.properties as properties
`
```

Update `Neo4jNode` interface to include both the new visual fields **and** widen the `type` field to allow the legacy `'abstract_class'` value stored in Neo4j (Step 4 will coerce it to `'class'`):

```typescript
interface Neo4jNode {
  // Widen type to allow legacy Neo4j values not in NodeType enum:
  type: NodeType | 'abstract_class'
  // ... other existing fields unchanged ...
  isExternal?: boolean
  depth?: number
  isAbstract?: boolean
  hasNestedTypes?: boolean
  isDeprecated?: boolean
  isExported?: boolean
}
```

- [ ] **Step 4: Move visual fields into metadata.properties in the node transform**

Replace the current node transform (lines ~137–169) with:

```typescript
const nodes = nodeResults.map((node) => {
  // Neo4j may store 'abstract_class' as a legacy type — coerce to IVMNode-compatible shape
  const nodeType = node.type === 'abstract_class' ? 'class' : node.type
  const isAbstract = node.isAbstract || node.type === 'abstract_class' || undefined

  return {
    id: node.id,
    type: nodeType,
    position: { x: node.x ?? 0, y: node.y ?? 0, z: node.z ?? 0 },
    lod: node.lod ?? 3,
    ...(node.parentId && { parentId: node.parentId }),
    metadata: {
      label: node.label,
      path: node.path,
      ...(node.language && { language: node.language }),
      ...(node.loc !== undefined && { loc: node.loc }),
      ...(node.complexity !== undefined && { complexity: node.complexity }),
      ...(node.dependencyCount !== undefined && { dependencyCount: node.dependencyCount }),
      ...(node.dependentCount !== undefined && { dependentCount: node.dependentCount }),
      ...(node.startLine !== undefined && node.endLine !== undefined && {
        location: {
          startLine: node.startLine,
          endLine: node.endLine,
          ...(node.startColumn !== undefined && { startColumn: node.startColumn }),
          ...(node.endColumn !== undefined && { endColumn: node.endColumn }),
        },
      }),
      properties: {
        ...(node.isExternal !== undefined && { isExternal: node.isExternal }),
        ...(node.depth !== undefined && { depth: node.depth }),
        ...(node.methodCount !== undefined && { methodCount: node.methodCount }),
        ...(isAbstract !== undefined && { isAbstract }),
        ...(node.hasNestedTypes !== undefined && { hasNestedTypes: node.hasNestedTypes }),
        ...(node.visibility !== undefined && { visibility: node.visibility }),
        ...(node.isDeprecated !== undefined && { isDeprecated: node.isDeprecated }),
        ...(node.isExported !== undefined && { isExported: node.isExported }),
        ...(node.properties ?? {}),
      },
    },
  }
})
```

- [ ] **Step 5: Run tests**

```bash
cd packages/api && npx vitest run src/routes/graph.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: all graph route tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/api/src/services/graph-service.ts packages/api/src/routes/graph.test.ts
git commit -m "feat(api): move visual rendering fields into IVMNode metadata.properties"
```

---

### Task 2: Add getParseResult() service function

**Files:**
- Modify: `packages/api/src/services/graph-service.ts`
- Modify: `packages/api/src/cache/cache-keys.ts`

- [ ] **Step 1: Extend CacheResource to include 'parse-result'**

In `packages/api/src/cache/cache-keys.ts`, update the `CacheResource` type:

```typescript
// Before:
export type CacheResource = 'graph' | 'query' | 'viewpoint' | 'workspace' | 'codebase'

// After:
export type CacheResource = 'graph' | 'query' | 'viewpoint' | 'workspace' | 'codebase' | 'parse-result'
```

- [ ] **Step 2: Add import for buildParseResult**

At the top of `graph-service.ts`, add:

```typescript
import { buildParseResult } from '@diagram-builder/parser'
import type { ParseResult } from '@diagram-builder/core'
```

- [ ] **Step 2a: Verify dependency exists**

```bash
grep "@diagram-builder/parser" packages/api/package.json
```

Expected: line confirming the dependency. If missing, run `npm install @diagram-builder/parser -w packages/api` first.

- [ ] **Step 2b: Write failing test for getParseResult**

In `packages/api/src/services/graph-service.test.ts` (create if not exists), add:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getParseResult } from './graph-service'
import * as graphService from './graph-service'

vi.mock('./graph-service', async (importOriginal) => {
  const actual = await importOriginal<typeof graphService>()
  return {
    ...actual,
    getFullGraph: vi.fn(),
  }
})

describe('getParseResult', () => {
  it('returns null when getFullGraph returns null', async () => {
    vi.mocked(graphService.getFullGraph).mockResolvedValue(null)
    const result = await getParseResult('unknown-repo')
    expect(result).toBeNull()
  })

  it('returns a ParseResult with graph, hierarchy, and tiers when graph exists', async () => {
    const mockGraph = {
      nodes: [], edges: [],
      metadata: { name: 'test', schemaVersion: '1.0.0', generatedAt: '', rootPath: '', languages: [], stats: { totalNodes: 0, totalEdges: 0, nodesByType: {}, edgesByType: {} } },
      bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
    }
    vi.mocked(graphService.getFullGraph).mockResolvedValue(mockGraph as any)
    const result = await getParseResult('repo-1')
    expect(result).not.toBeNull()
    expect(result).toHaveProperty('graph')
    expect(result).toHaveProperty('hierarchy')
    expect(result).toHaveProperty('tiers')
  })
})
```

- [ ] **Step 2c: Run test to confirm it fails**

```bash
cd packages/api && npx vitest run src/services/graph-service.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `getParseResult` not exported yet.

- [ ] **Step 3: Add getParseResult() after getFullGraph()**

```typescript
/**
 * Get ParseResult for a repository — full graph + GroupHierarchy + pre-computed tiers
 */
export async function getParseResult(repoId: string): Promise<ParseResult | null> {
  const cacheKey = buildCacheKey('parse-result', repoId)
  const cached = await cache.get<ParseResult>(cacheKey)
  if (cached) return cached

  const graph = await getFullGraph(repoId)
  if (!graph) return null

  const result = buildParseResult(graph)
  await cache.set(cacheKey, result)
  return result
}
```

- [ ] **Step 4: Run service tests**

```bash
cd packages/api && npx vitest run src/services/graph-service.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 4b: Verify TypeScript compiles**

```bash
cd packages/api && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/services/graph-service.ts packages/api/src/services/graph-service.test.ts packages/api/src/cache/cache-keys.ts
git commit -m "feat(api): add getParseResult service function"
```

---

### Task 3: Add /parse-result and /tier/:tier routes

**Files:**
- Modify: `packages/api/src/routes/graph.ts`
- Modify: `packages/api/src/routes/graph.test.ts`

- [ ] **Step 1: Write failing tests**

Add to `packages/api/src/routes/graph.test.ts`:

```typescript
describe('GET /:repoId/parse-result', () => {
  it('returns 200 with ParseResult shape', async () => {
    const res = await request(app)
      .get(`/api/graph/${mockRepoId}/parse-result`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('graph')
    expect(res.body).toHaveProperty('hierarchy')
    expect(res.body).toHaveProperty('tiers')
    expect(res.body.graph.nodes).toBeInstanceOf(Array)
  })

  it('returns 404 for unknown repository', async () => {
    const res = await request(app)
      .get('/api/graph/nonexistent/parse-result')
      .set('Authorization', `Bearer ${authToken}`)

    expect(res.status).toBe(404)
  })

  it('requires authentication', async () => {
    const res = await request(app).get(`/api/graph/${mockRepoId}/parse-result`)
    expect(res.status).toBe(401)
  })
})

describe('GET /:repoId/tier/:tier', () => {
  it('returns 200 with IVMGraph for a valid tier (0-5)', async () => {
    const res = await request(app)
      .get(`/api/graph/${mockRepoId}/tier/3`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('nodes')
    expect(res.body).toHaveProperty('edges')
  })

  it('returns 400 for an invalid tier value', async () => {
    const res = await request(app)
      .get(`/api/graph/${mockRepoId}/tier/99`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd packages/api && npx vitest run src/routes/graph.test.ts --reporter=verbose 2>&1 | tail -30
```

Expected: FAIL — routes don't exist yet.

- [ ] **Step 3: Add routes to graph.ts**

**Note on route placement:** Express matches by segment, so `GET /:repoId` matches `/foo` (one segment) but NOT `/foo/parse-result` (two segments) — the existing `/:repoId/node/:nodeId` routes already follow this pattern. The new routes will not be shadowed regardless of order. As convention, register them before `GET /:repoId` for readability.

In `packages/api/src/routes/graph.ts`, add to imports:

```typescript
import {
  getFullGraph,
  getNodeDetails,
  getNodeDependencies,
  executeCustomQuery,
  getParseResult,
} from '../services/graph-service'
import { createViewResolver } from '@diagram-builder/core'
import type { SemanticTier } from '@diagram-builder/core'
```

Add new routes before `export { graphRouter }`:

```typescript
/**
 * GET /api/graph/:repoId/parse-result
 * Get ParseResult (graph + hierarchy + pre-computed tiers)
 */
graphRouter.get(
  '/:repoId/parse-result',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { repoId } = req.params
    if (!repoId) throw new ValidationError('Invalid request', 'Repository ID is required')

    const result = await getParseResult(repoId)
    if (!result) throw new NotFoundError('Repository not found', `No graph data for ${repoId}`)

    res.json(result)
  })
)

/**
 * GET /api/graph/:repoId/tier/:tier
 * Get a single pre-computed tier view (0-5)
 */
graphRouter.get(
  '/:repoId/tier/:tier',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { repoId, tier } = req.params
    const tierNum = Number(tier)

    if (!repoId) throw new ValidationError('Invalid request', 'Repository ID is required')
    if (isNaN(tierNum) || tierNum < 0 || tierNum > 5) {
      throw new ValidationError('Invalid tier', 'Tier must be an integer between 0 and 5')
    }

    const result = await getParseResult(repoId)
    if (!result) throw new NotFoundError('Repository not found', `No graph data for ${repoId}`)

    const resolver = createViewResolver(result)
    const tierGraph = resolver.getTier(tierNum as SemanticTier)

    res.json(tierGraph)
  })
)
```

- [ ] **Step 4: Run tests**

```bash
cd packages/api && npx vitest run src/routes/graph.test.ts --reporter=verbose 2>&1 | tail -30
```

Expected: all graph route tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/api/src/routes/graph.ts packages/api/src/routes/graph.test.ts
git commit -m "feat(api): add /parse-result and /tier/:tier endpoints"
```

---

## Chunk 2: Frontend Foundation — Store, Layout Architecture, Client Endpoints

### Task 4: Add getParseResult and getTier to UI endpoints

**Files:**
- Modify: `packages/ui/src/shared/api/endpoints.ts`

- [ ] **Step 1: Add imports and new functions**

In `endpoints.ts`, remove any existing `import type { Graph }` line (the old hand-rolled type), then add:

```typescript
import type { ParseResult, IVMGraph, SemanticTier } from '@diagram-builder/core'
```

Replace the existing `graph` export with:

```typescript
export const graph = {
  getFullGraph: (repoId: string) => apiClient.get<IVMGraph>(`/api/graph/${repoId}`),

  getParseResult: (repoId: string) =>
    apiClient.get<ParseResult>(`/api/graph/${repoId}/parse-result`),

  getTier: (repoId: string, tier: SemanticTier) =>
    apiClient.get<IVMGraph>(`/api/graph/${repoId}/tier/${tier}`),

  query: (request: GraphQueryRequest) =>
    apiClient.post<GraphQueryResponse>('/api/graph/query', request),

  getNode: (nodeId: string) => apiClient.get<unknown>(`/api/graph/nodes/${nodeId}`),

  getNodeDependencies: (nodeId: string) =>
    apiClient.get<unknown[]>(`/api/graph/nodes/${nodeId}/dependencies`),

  getNodeDependents: (nodeId: string) =>
    apiClient.get<unknown[]>(`/api/graph/nodes/${nodeId}/dependents`),
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd packages/ui && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors (existing `Graph` import on `getFullGraph` is now `IVMGraph`).

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/shared/api/endpoints.ts
git commit -m "feat(ui): add getParseResult and getTier to API client"
```

---

### Task 5: Add ParseResult, resolver, activeLayout, focusedGroupId to canvas store

**Files:**
- Modify: `packages/ui/src/features/canvas/store.ts`

- [ ] **Step 1: Write failing test**

In `packages/ui/src/features/canvas/store.test.ts` (create if not exists), add:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useCanvasStore } from './store'
import { act } from '@testing-library/react'

// Export initialState from store.ts so tests can reliably reset:
// export const initialState = { parseResult: null, resolver: null, activeLayout: 'city', ... }
// Then import it here:
import { initialState } from './store'

describe('canvas store — ParseResult', () => {
  beforeEach(() => {
    // Merge the new fields' initial values back — do NOT use `true` as second arg
    // (that would wipe all pre-existing store fields like camera, selectedNodeId, etc.)
    useCanvasStore.setState(initialState)
  })

  it('initialises parseResult and resolver as null', () => {
    const { parseResult, resolver } = useCanvasStore.getState()
    expect(parseResult).toBeNull()
    expect(resolver).toBeNull()
  })

  it('setParseResult stores result and creates resolver', () => {
    const mockResult = {
      graph: { nodes: [], edges: [], metadata: {} as any, bounds: {} as any },
      hierarchy: { root: { id: 'r', label: 'r', tier: 0, nodeIds: [], children: [] }, tierCount: {} as any, edgesByTier: {} as any },
      tiers: {} as any,
    }
    act(() => useCanvasStore.getState().setParseResult(mockResult))
    const { parseResult, resolver } = useCanvasStore.getState()
    expect(parseResult).toBe(mockResult)
    expect(resolver).not.toBeNull()
  })

  it('initialises activeLayout as city', () => {
    expect(useCanvasStore.getState().activeLayout).toBe('city')
  })

  it('setActiveLayout updates activeLayout', () => {
    act(() => useCanvasStore.getState().setActiveLayout('basic3d'))
    expect(useCanvasStore.getState().activeLayout).toBe('basic3d')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd packages/ui && npx vitest run src/features/canvas/store.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — `parseResult`, `resolver`, `activeLayout` not on store.

- [ ] **Step 3: Update store.ts**

Add imports at top of `store.ts`:

```typescript
import { createViewResolver } from '@diagram-builder/core'
import type { ParseResult, ViewResolver } from '@diagram-builder/core'
```

Export an `initialState` constant (must be `export const`, not just `const`) so tests can reliably reset the store. This should cover all fields added in this task. Merge it into the existing state's initial values when calling `create()`:

```typescript
// At module scope (not inside create()):
export const initialState = {
  parseResult: null as ParseResult | null,
  resolver: null as ViewResolver | null,
  activeLayout: 'city' as 'city' | 'basic3d',
  focusedGroupId: null as string | null,
}
```

Add to state interface (after existing fields):

```typescript
// ParseResult + ViewResolver
parseResult: ParseResult | null
resolver: ViewResolver | null
activeLayout: 'city' | 'basic3d'
focusedGroupId: string | null

setParseResult: (result: ParseResult) => void
setActiveLayout: (layout: 'city' | 'basic3d') => void
setFocusedGroupId: (id: string | null) => void
```

Add to the `create()` initial state:

```typescript
parseResult: null,
resolver: null,
activeLayout: 'city',
focusedGroupId: null,
```

Add to the `create()` actions:

```typescript
setParseResult: (result) =>
  set({ parseResult: result, resolver: createViewResolver(result) }),
setActiveLayout: (layout) => set({ activeLayout: layout }),
setFocusedGroupId: (id) => set({ focusedGroupId: id }),
```

- [ ] **Step 4: Run tests**

```bash
cd packages/ui && npx vitest run src/features/canvas/store.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: all store tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/features/canvas/store.ts packages/ui/src/features/canvas/store.test.ts
git commit -m "feat(ui): add parseResult, resolver, activeLayout to canvas store"
```

---

### Task 6: Create layout architecture — types, useLayout, basic3d stub

**Files:**
- Create: `packages/ui/src/features/canvas/layouts/types.ts`
- Create: `packages/ui/src/features/canvas/layouts/index.ts`
- Create: `packages/ui/src/features/canvas/layouts/index.test.ts`
- Create: `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.tsx`
- Create: `packages/ui/src/features/canvas/layouts/basic3d/useBasic3DLayout.ts`

- [ ] **Step 1: Create layouts/types.ts**

**Note:** The codebase already has `features/canvas/layout/` (singular) — a computation engine registry with its own `LayoutEngine` and `LayoutResult` types. The new `features/canvas/layouts/` (plural) is a **UI theme-switching layer** — a different concern. To avoid TypeScript name collisions, the new interfaces use distinct names:

```typescript
// packages/ui/src/features/canvas/layouts/types.ts
import type React from 'react'

/** A UI layout theme — selects which visual presentation to render. */
export interface UILayoutEngine {
  id: 'city' | 'basic3d'
  label: string
  component: React.ComponentType
}

/** Return type of the useLayout hook — the currently active UI engine. */
export interface ActiveLayoutResult {
  engine: UILayoutEngine
}
```

- [ ] **Step 2: Write failing test for useLayout**

```typescript
// packages/ui/src/features/canvas/layouts/index.test.ts
import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCanvasStore } from '../store'
import { useLayout } from './index'

describe('useLayout', () => {
  it('returns city engine when activeLayout is city', () => {
    useCanvasStore.setState({ activeLayout: 'city' })
    const { result } = renderHook(() => useLayout())
    expect(result.current.engine.id).toBe('city')
  })

  it('returns basic3d engine when activeLayout is basic3d', () => {
    useCanvasStore.setState({ activeLayout: 'basic3d' })
    const { result } = renderHook(() => useLayout())
    expect(result.current.engine.id).toBe('basic3d')
  })

  it('each engine has a component', () => {
    useCanvasStore.setState({ activeLayout: 'city' })
    const { result } = renderHook(() => useLayout())
    expect(result.current.engine.component).toBeDefined()
  })
})
```

- [ ] **Step 3: Run test to confirm it fails**

```bash
cd packages/ui && npx vitest run src/features/canvas/layouts/index.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: FAIL — module not found.

- [ ] **Step 4: Create basic3d stub files**

```tsx
// packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.tsx
import React from 'react'

/**
 * Basic3DView — stub layout
 * Renders nodes as spheres with line edges. Full implementation is Phase 6.
 */
export function Basic3DView() {
  return <group name="basic3d-view" />
}
```

```typescript
// packages/ui/src/features/canvas/layouts/basic3d/useBasic3DLayout.ts
/**
 * useBasic3DLayout — stub
 * Phase 6 will implement force-directed flat grid positioning.
 */
export function useBasic3DLayout() {
  return { positions: new Map() }
}
```

- [ ] **Step 5: Create layouts/index.ts with useLayout hook**

```typescript
// packages/ui/src/features/canvas/layouts/index.ts
import { useCanvasStore } from '../store'
import { Basic3DView } from './basic3d/Basic3DView'
import type { UILayoutEngine, ActiveLayoutResult } from './types'

// Temporary path — points to the pre-move location. Task 7 updates this to './city/CityView'.
import { CityView } from '../views/CityView'

const cityEngine: UILayoutEngine = {
  id: 'city',
  label: 'City',
  component: CityView,
}

const basic3dEngine: UILayoutEngine = {
  id: 'basic3d',
  label: 'Basic 3D',
  component: Basic3DView,
}

export function useLayout(): ActiveLayoutResult {
  const activeLayout = useCanvasStore((s) => s.activeLayout)
  const engine = activeLayout === 'city' ? cityEngine : basic3dEngine
  return { engine }
}
```

- [ ] **Step 6: Run tests**

```bash
cd packages/ui && npx vitest run src/features/canvas/layouts/index.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: all useLayout tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/features/canvas/layouts/
git commit -m "feat(ui): add layout architecture — types, useLayout hook, basic3d stub"
```

---

### Task 7: Move city files into layouts/city/

**Files:**
- Move: all city-specific files from `features/canvas/views/` and `features/canvas/hooks/` into `features/canvas/layouts/city/`
- Update: `features/canvas/layouts/index.ts` import

This task is a mechanical file move with import updates. No logic changes.

Files to move (update all internal imports after moving):
- `views/CityView.tsx` → `layouts/city/CityView.tsx`
- `views/CityBlocks.tsx` → `layouts/city/CityBlocks.tsx`
- `views/CitySky.tsx` → `layouts/city/CitySky.tsx`
- `views/CityAtmosphere.tsx` → `layouts/city/CityAtmosphere.tsx`
- `views/CityEdge.tsx` → `layouts/city/CityEdge.tsx`
- `views/UndergroundLayer.tsx` → `layouts/city/UndergroundLayer.tsx`
- `hooks/useCityLayout.ts` → `layouts/city/useCityLayout.ts`
- `hooks/useCityFiltering.ts` → `layouts/city/useCityFiltering.ts`
- `hooks/useCityLayout.test.ts` → `layouts/city/useCityLayout.test.ts`
- `hooks/useCityFiltering.test.ts` → `layouts/city/useCityFiltering.test.ts`

- [ ] **Step 1: Move files using git mv to preserve history**

Run all `git mv` commands together as a single shell call from the repo root (the cwd must not change between git operations):

```bash
CANVAS=packages/ui/src/features/canvas && \
mkdir -p $CANVAS/layouts/city && \
git mv $CANVAS/views/CityView.tsx $CANVAS/layouts/city/CityView.tsx && \
git mv $CANVAS/views/CityBlocks.tsx $CANVAS/layouts/city/CityBlocks.tsx && \
git mv $CANVAS/views/CitySky.tsx $CANVAS/layouts/city/CitySky.tsx && \
git mv $CANVAS/views/CityAtmosphere.tsx $CANVAS/layouts/city/CityAtmosphere.tsx && \
git mv $CANVAS/views/CityEdge.tsx $CANVAS/layouts/city/CityEdge.tsx && \
git mv $CANVAS/views/UndergroundLayer.tsx $CANVAS/layouts/city/UndergroundLayer.tsx && \
git mv $CANVAS/hooks/useCityLayout.ts $CANVAS/layouts/city/useCityLayout.ts && \
git mv $CANVAS/hooks/useCityFiltering.ts $CANVAS/layouts/city/useCityFiltering.ts && \
git mv $CANVAS/hooks/useCityLayout.test.ts $CANVAS/layouts/city/useCityLayout.test.ts && \
git mv $CANVAS/hooks/useCityFiltering.test.ts $CANVAS/layouts/city/useCityFiltering.test.ts
```

- [ ] **Step 2: Fix internal imports in moved files**

Each moved file has relative imports that now point to the wrong path. After the `git mv`, run:

```bash
cd packages/ui && npx tsc --noEmit 2>&1 | grep "Cannot find module" | head -30
```

Fix every broken relative import in the moved files. The common rewrites are:
- `../hooks/useCityLayout` → `./useCityLayout`
- `../hooks/useCityFiltering` → `./useCityFiltering`
- `../views/CityBlocks` → `./CityBlocks`
- `../views/CitySky` → `./CitySky`
- `../views/CityAtmosphere` → `./CityAtmosphere`
- `../views/CityEdge` → `./CityEdge`
- `../views/UndergroundLayer` → `./UndergroundLayer`
- `../components/` → `../../components/` (if any moved file imports shared components)
- `../store` → `../../store`

Also update `layouts/index.ts` to import from the new path:
```typescript
import { CityView } from './city/CityView'
```

Repeat `tsc --noEmit` until the `layouts/city/` files have zero "Cannot find module" errors before proceeding to Step 3.

- [ ] **Step 3: Fix any files outside layouts/ that imported the moved files**

```bash
cd packages/ui && npx tsc --noEmit 2>&1 | grep "Cannot find module" | head -20
```

Update each broken import to point to the new `layouts/city/` paths.

**Pay special attention to `ViewModeRenderer.tsx`** — it lives in `features/canvas/views/` and directly imports `CityView`. Its import must be updated to `'../layouts/city/CityView'`. Also check any barrel `views/index.ts` that re-exports city components.

**Do not remove the `graph` prop** that `ViewModeRenderer` or `CityView` currently receives — that migration happens in Chunk 4 (Task 9). Just update the import path here.

- [ ] **Step 4: Run all city tests**

```bash
cd packages/ui && npx vitest run src/features/canvas/layouts/city/ --reporter=verbose 2>&1 | tail -20
```

Expected: all city layout tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/features/canvas/
git commit -m "refactor(ui): move city layout files into layouts/city/"
```

---

## Chunk 3: IVMNode Type Migration

### Task 8: Delete GraphNode type and fix all consumers

**Files:**
- Delete: `packages/ui/src/shared/types/graph.ts`
- Modify: `packages/ui/src/shared/types/index.ts`
- Modify: 50+ UI files (all that import `Graph`, `GraphNode`, `GraphEdge`)

This is a single compile-fix pass. **Do not mix other changes into this commit.** The TypeScript compiler is your guide — fix errors until `tsc --noEmit` reports zero errors.

Before starting, get a baseline count of how many files are affected:

```bash
grep -r "GraphNode\|from.*shared/types/graph" packages/ui/src/ --include="*.ts" --include="*.tsx" -l | wc -l
```

**Field access migration reference** (from spec):

| Old access | New access |
|---|---|
| `node.label` | `node.metadata.label` |
| `node.isExternal` | `node.metadata.properties?.isExternal` |
| `node.depth` | `node.metadata.properties?.depth` |
| `node.methodCount` | `node.metadata.properties?.methodCount` |
| `node.isAbstract` | `node.metadata.properties?.isAbstract` |
| `node.hasNestedTypes` | `node.metadata.properties?.hasNestedTypes` |
| `node.visibility` | `node.metadata.properties?.visibility` |
| `node.isDeprecated` | `node.metadata.properties?.isDeprecated` |
| `node.isExported` | `node.metadata.properties?.isExported` |
| `node.id`, `node.type`, `node.position`, `node.lod`, `node.parentId` | unchanged |

Also: `'inherits'` edge type → `'extends'` in any edge type allowlists (e.g., `useCityFiltering`).
Also: `'abstract_class'` node type → `type: 'class'` with `metadata.properties.isAbstract: true`.
Also: `GraphEdge` → `IVMEdge` (IVMEdge has a superset of edge types; existing allowlists continue to work).

Note: `metadata.properties` is typed as `Record<string, unknown>`. When consuming values as typed booleans, add an explicit cast: `node.metadata.properties?.isAbstract as boolean | undefined`.

- [ ] **Step 0: Write field-mapping unit test (failing)**

Create `packages/ui/src/shared/types/ivm-field-mapping.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import type { IVMNode } from '@diagram-builder/core'
import { SemanticTier } from '@diagram-builder/core'

describe('IVMNode field mapping', () => {
  const node: IVMNode = {
    id: 'test',
    type: 'class',
    position: { x: 0, y: 0, z: 0 },
    lod: SemanticTier.Symbol,
    metadata: {
      label: 'MyClass',
      path: 'src/my-class.ts',
      properties: {
        isExternal: false,
        depth: 2,
        methodCount: 5,
        isAbstract: true,
        hasNestedTypes: false,
        visibility: 'public',
        isDeprecated: false,
        isExported: true,
      },
    },
  }

  it('label is at metadata.label', () => { expect(node.metadata.label).toBe('MyClass') })
  it('isExternal is at metadata.properties.isExternal', () => { expect(node.metadata.properties?.isExternal).toBe(false) })
  it('methodCount is at metadata.properties.methodCount', () => { expect(node.metadata.properties?.methodCount).toBe(5) })
  it('isAbstract is at metadata.properties.isAbstract', () => { expect(node.metadata.properties?.isAbstract).toBe(true) })
  it('visibility is at metadata.properties.visibility', () => { expect(node.metadata.properties?.visibility).toBe('public') })
})
```

Run to verify it compiles and passes (this test uses the IVMNode type directly — it will pass immediately, serving as a living contract for the field locations):

```bash
cd packages/ui && npx vitest run src/shared/types/ivm-field-mapping.test.ts --reporter=verbose 2>&1 | tail -10
```

Expected: PASS (this is a contract test, not a red-green test — it verifies the mapping is correct before we start migrating).

- [ ] **Step 1: Delete graph.ts and remove from index**

```bash
rm packages/ui/src/shared/types/graph.ts
```

Remove the re-export from `packages/ui/src/shared/types/index.ts`.

- [ ] **Step 2: Run tsc to get the full error list**

```bash
cd packages/ui && npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
```

Note the count. Fix errors in batches by file.

- [ ] **Step 3: Add IVMGraph/IVMNode/IVMEdge imports where needed**

In each file that previously imported from `../shared/types`, replace with:

```typescript
import type { IVMGraph, IVMNode, IVMEdge } from '@diagram-builder/core'
```

- [ ] **Step 4: Fix field access at each error site**

Follow the migration reference table. Fix in this order to minimize cascading re-runs: shared types → hooks → components → pages.

Pay special attention to:
- `node.label` — most common, moves to `node.metadata.label`
- `node.metadata.properties?.X` — returns `unknown`; add `as boolean | undefined` or `as string | undefined` casts where needed
- Test fixtures: grep for `type: 'abstract_class'` and fix to `type: 'class'` + `metadata: { ..., properties: { isAbstract: true } }`

```bash
grep -r "abstract_class" packages/ui/src/ --include="*.ts" --include="*.tsx" -l
```

Fix each occurrence — do NOT silence with `as any`; use the correct IVMNode shape.

- [ ] **Step 5: Run tsc until clean**

```bash
cd packages/ui && npx tsc --noEmit 2>&1 | tail -5
```

Expected: `Found 0 errors.`

- [ ] **Step 6: Run full UI test suite**

```bash
cd packages/ui && npx vitest run --reporter=verbose 2>&1 | tail -30
```

Expected: same pass rate as before (the type change should not break test logic).

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/shared/types/ packages/ui/src/features/ packages/ui/src/pages/ packages/ui/src/components/
git commit -m "feat(ui): migrate GraphNode to IVMNode — delete Graph type, fix all consumers"
```

Note: stage the specific directories above rather than all of `src/` to avoid accidentally including unrelated staged changes.

---

## Chunk 4: ViewResolver Wiring

### Task 9: Wire useCityLayout to resolver.getTier

**Files:**
- Modify: `packages/ui/src/features/canvas/layouts/city/useCityLayout.ts`
- Modify: `packages/ui/src/features/canvas/layouts/city/useCityLayout.test.ts`
- Modify: `packages/ui/src/features/canvas/layouts/city/CityView.tsx`
- Modify: `packages/ui/src/features/canvas/layouts/city/CityBlocks.tsx`
- Modify: `packages/ui/src/features/canvas/layouts/city/CitySky.tsx`
- Modify: `packages/ui/src/features/canvas/layouts/city/CityAtmosphere.tsx`

Currently `useCityLayout` accepts `graph: IVMGraph` as a prop. After this task it reads from `canvasStore.resolver`.

- [ ] **Step 1: Write failing test**

In `useCityLayout.test.ts`, add:

```typescript
import { SemanticTier } from '@diagram-builder/core'
import { useCanvasStore } from '../../store'
import { createViewResolver } from '@diagram-builder/core'
import type { IVMNode, IVMGraph, ParseResult } from '@diagram-builder/core'

// Inline helpers — self-contained, no shared fixture file needed
function buildMinimalIVMGraph(nodeOverrides: Pick<IVMNode, 'id' | 'type' | 'lod'>[]): IVMGraph {
  const nodes: IVMNode[] = nodeOverrides.map((o) => ({
    id: o.id,
    type: o.type,
    lod: o.lod,
    position: { x: 0, y: 0, z: 0 },
    metadata: { label: o.id, path: o.id, properties: {} },
  }))
  return {
    nodes,
    edges: [],
    metadata: { name: 'test', schemaVersion: '1.0.0', generatedAt: '', rootPath: '', languages: [], stats: { totalNodes: nodes.length, totalEdges: 0, nodesByType: {} as Record<string, number>, edgesByType: {} as Record<string, number> } },
    bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
  }
}

function buildMockParseResult(graph: IVMGraph): ParseResult {
  return {
    graph,
    hierarchy: { root: { id: 'group:root', label: 'root', tier: SemanticTier.Repository, nodeIds: [], children: [] }, tierCount: {} as any, edgesByTier: {} as any },
    tiers: { 0: graph, 1: graph, 2: graph, 3: graph, 4: graph, 5: graph } as any,
  }
}

it('uses resolver.getTier(SemanticTier.File) for layout when resolver is set', () => {
  const fileTierGraph = buildMinimalIVMGraph([
    { id: 'file:a', type: 'file', lod: SemanticTier.File },
    { id: 'file:b', type: 'file', lod: SemanticTier.File },
  ])
  const mockParseResult = buildMockParseResult(fileTierGraph)
  const resolver = createViewResolver(mockParseResult)

  useCanvasStore.setState({ parseResult: mockParseResult, resolver })

  const { result } = renderHook(() => useCityLayout())

  // Layout should use the file-tier graph (2 nodes), not a bigger graph
  expect(result.current.positions.size).toBe(2)
})

it('returns empty layout when resolver is null', () => {
  useCanvasStore.setState({ resolver: null })
  const { result } = renderHook(() => useCityLayout())
  expect(result.current.positions.size).toBe(0)
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd packages/ui && npx vitest run src/features/canvas/layouts/city/useCityLayout.test.ts --reporter=verbose 2>&1 | tail -20
```

- [ ] **Step 3: Update useCityLayout signature**

Read `useCityLayout.ts` fully before making any changes. The internal layout algorithm, density calculations, and positions computation must remain entirely unchanged. Apply two targeted changes only:

**Change 1 — Add `EMPTY_GRAPH` constant, store reads, and remove the `graph` param:**

Add at module scope (top of file, after existing imports):

```typescript
import { useCanvasStore } from '../../store'
import { SemanticTier } from '@diagram-builder/core'
import type { IVMGraph, NodeType, EdgeType } from '@diagram-builder/core'

const EMPTY_GRAPH: IVMGraph = {
  nodes: [],
  edges: [],
  metadata: { name: '', schemaVersion: '1.0.0', generatedAt: '', rootPath: '', languages: [], stats: { totalNodes: 0, totalEdges: 0, nodesByType: {} as Record<NodeType, number>, edgesByType: {} as Record<EdgeType, number> } },
  bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
}
```

Change the function signature and add a `graph` local derived from the resolver:

```typescript
// Before: export function useCityLayout(graph: IVMGraph): CityLayoutResult
// After:
export function useCityLayout(): CityLayoutResult & { graph: IVMGraph } {
  const resolver = useCanvasStore((s) => s.resolver)

  const graph = useMemo(() => {
    if (!resolver) return EMPTY_GRAPH
    return resolver.getTier(SemanticTier.File)
  }, [resolver])

  // ↑ Everything above replaces the old `graph` param.
  // ↓ ALL existing layout logic below this line remains unchanged.
```

**Change 2 — Extend the return statement to include `graph`:**

Find the existing `return` at the end of the hook body. Add `graph` to it:

```typescript
// Before: return { positions, districtPositions, ... }
// After:  return { positions, districtPositions, ..., graph }
```

That is the only change to the return statement. Do not alter any other field.

- [ ] **Step 4: Update CityView.tsx to remove the graph prop**

`CityView` passes `graph` to `useCityLayout`. Remove that:

```typescript
// Before:
export function CityView({ graph }: { graph: IVMGraph }) {
  const { positions, ... } = useCityLayout(graph)

// After:
export function CityView() {
  const { positions, ... } = useCityLayout()
```

- [ ] **Step 5: Update CityBlocks, CitySky, CityAtmosphere to use the graph from useCityLayout**

The `graph` return is already added to `useCityLayout` in Step 3 (Change 2). In `CityView`, use the returned `graph` to pass down to sub-components — do **not** call `resolver.getTier()` again (that would be a duplicate call returning a different object reference).

In `CityView`, use the returned graph to pass down to sub-components:

```typescript
export function CityView() {
  const { positions, graph, ... } = useCityLayout()
  return (
    <>
      <CityBlocks graph={graph} positions={positions} />
      <CitySky graph={graph} />
      <CityAtmosphere graph={graph} />
    </>
  )
}
```

First, verify the current prop interface of each sub-component:

```bash
grep -A5 "interface.*Props" packages/ui/src/features/canvas/layouts/city/CityBlocks.tsx packages/ui/src/features/canvas/layouts/city/CitySky.tsx packages/ui/src/features/canvas/layouts/city/CityAtmosphere.tsx 2>/dev/null || echo "Files not yet at this path — check views/ directory"
```

The prop interfaces must include `graph: IVMGraph`. If they already do, no change needed. If they don't, add it:

```typescript
interface CityBlocksProps {
  graph: IVMGraph
  positions: Map<string, { x: number; y: number; z: number }>
  // ... other existing props unchanged
}

interface CitySkyProps {
  graph: IVMGraph
  // ... other existing props unchanged
}
```

After updating, run:

```bash
cd packages/ui && npx tsc --noEmit 2>&1 | head -20
```

Expected: no new errors related to the graph prop.

- [ ] **Step 6: Run tests**

```bash
cd packages/ui && npx vitest run src/features/canvas/layouts/city/useCityLayout.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/features/canvas/layouts/city/
git commit -m "feat(ui): wire useCityLayout to resolver.getTier(SemanticTier.File)"
```

---

### Task 10: Wire useCityFiltering to GroupHierarchy

**Files:**
- Modify: `packages/ui/src/features/canvas/layouts/city/useCityFiltering.ts`
- Modify: `packages/ui/src/features/canvas/layouts/city/useCityFiltering.test.ts`

- [ ] **Step 1: Write failing test**

First, check whether `useCityFiltering` currently takes `(graph, positions)` as arguments or reads from the store. If it takes props, keep them for now — Step 3 will not change the signature, only the district-grouping logic inside the hook.

Add test fixtures and tests to `useCityFiltering.test.ts`:

```typescript
import { SemanticTier } from '@diagram-builder/core'
import { createViewResolver } from '@diagram-builder/core'
import type { ParseResult, IVMGraph } from '@diagram-builder/core'
import { useCanvasStore } from '../../store'

function makeMinimalGraph(overrides?: Partial<IVMGraph>): IVMGraph {
  return {
    nodes: [], edges: [],
    metadata: { name: 'test', schemaVersion: '1.0.0', generatedAt: '', rootPath: '', languages: [], stats: { totalNodes: 0, totalEdges: 0, nodesByType: {} as any, edgesByType: {} as any } },
    bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
    ...overrides,
  }
}

function buildMockParseResultWithHierarchy(): ParseResult {
  const fileNodeA = { id: 'file:a', type: 'file' as const, lod: SemanticTier.File, position: { x: 0, y: 0, z: 0 }, metadata: { label: 'a.ts', path: 'a.ts', properties: {} } }
  const fileNodeB = { id: 'file:b', type: 'file' as const, lod: SemanticTier.File, position: { x: 0, y: 0, z: 0 }, metadata: { label: 'b.ts', path: 'b.ts', properties: {} } }
  const graph = makeMinimalGraph({ nodes: [fileNodeA, fileNodeB] })
  const hierarchy = {
    root: {
      id: 'group:root', label: 'root', tier: SemanticTier.Repository, nodeIds: [],
      children: [{
        id: 'group:mod1', label: 'mod1', tier: SemanticTier.Module,
        nodeIds: ['file:a', 'file:b'], children: [],
      }],
    },
    tierCount: {} as any, edgesByTier: {} as any,
  }
  const tiers = { 0: graph, 1: graph, 2: graph, 3: graph, 4: graph, 5: graph } as any
  return { graph, hierarchy, tiers }
}

function buildMockParseResultWithEdges(edgeTypes: string[]): ParseResult {
  const nodeA = { id: 'file:a', type: 'file' as const, lod: SemanticTier.File, position: { x: 0, y: 0, z: 0 }, metadata: { label: 'a.ts', path: 'a.ts', properties: {} } }
  const nodeB = { id: 'file:b', type: 'file' as const, lod: SemanticTier.File, position: { x: 0, y: 0, z: 0 }, metadata: { label: 'b.ts', path: 'b.ts', properties: {} } }
  const edges = edgeTypes.map((t, i) => ({ id: `e${i}`, source: 'file:a', target: 'file:b', type: t as any, lod: SemanticTier.File, metadata: {} }))
  const graph = makeMinimalGraph({ nodes: [nodeA, nodeB], edges })
  const hierarchy = { root: { id: 'group:root', label: 'root', tier: SemanticTier.Repository, nodeIds: [], children: [] }, tierCount: {} as any, edgesByTier: {} as any }
  const tiers = { 0: graph, 1: graph, 2: graph, 3: graph, 4: graph, 5: graph } as any
  return { graph, hierarchy, tiers }
}

it('sources district groups from GroupHierarchy at Module tier, not path strings', () => {
  const parseResult = buildMockParseResultWithHierarchy()
  useCanvasStore.setState({
    parseResult,
    resolver: createViewResolver(parseResult),
    lodLevel: 2,
  })

  const graph = parseResult.tiers[SemanticTier.File]
  const positions = new Map(graph.nodes.map((n) => [n.id, { x: 0, y: 0, z: 0 }]))

  const { result } = renderHook(() => useCityFiltering(graph, positions))

  // districtGroups keys must be GroupNode IDs, not path strings
  const districtKeys = Array.from(result.current.districtGroups.keys())
  expect(districtKeys.every((k) => k.startsWith('group:'))).toBe(true)
})

it('uses extends not inherits in edge type allowlist', () => {
  const parseResult = buildMockParseResultWithEdges(['extends', 'imports'])
  useCanvasStore.setState({ parseResult, resolver: createViewResolver(parseResult) })

  const graph = parseResult.tiers[SemanticTier.File]
  const positions = new Map(graph.nodes.map((n) => [n.id, { x: 0, y: 0, z: 0 }]))

  const { result } = renderHook(() => useCityFiltering(graph, positions))

  const edgeTypes = result.current.visibleEdges.map((e) => e.type)
  expect(edgeTypes).toContain('extends')
  expect(edgeTypes).not.toContain('inherits')
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd packages/ui && npx vitest run src/features/canvas/layouts/city/useCityFiltering.test.ts --reporter=verbose 2>&1 | tail -20
```

- [ ] **Step 3: Replace district-grouping logic in useCityFiltering**

Replace the path-splitting `districtGroups` memo with hierarchy-based grouping:

```typescript
import { SemanticTier } from '@diagram-builder/core'
import type { GroupNode } from '@diagram-builder/core'
import { useCanvasStore } from '../../store'

function getModuleGroups(root: GroupNode): GroupNode[] {
  if (root.tier === SemanticTier.Module) return [root]
  return root.children.flatMap(getModuleGroups)
}

// Inside useCityFiltering:
const parseResult = useCanvasStore((s) => s.parseResult)

// Single memo traverses the hierarchy once and produces both derived structures
const { districtGroups, fileDistrictGroups } = useMemo(() => {
  const empty = {
    districtGroups: new Map<string, string[]>(),
    fileDistrictGroups: new Map<string, string[]>(),
  }
  if (!parseResult) return empty
  const moduleGroups = getModuleGroups(parseResult.hierarchy.root)
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]))
  return {
    districtGroups: new Map(moduleGroups.map((g) => [g.id, g.nodeIds])),
    fileDistrictGroups: new Map(
      moduleGroups.map((g) => [
        g.id,
        g.nodeIds.filter((id) => nodeMap.get(id)?.type === 'file'),
      ])
    ),
  }
}, [parseResult, graph.nodes])
```

- [ ] **Step 4: Update edge type allowlist**

Replace `'inherits'` with `'extends'`:

```typescript
if (
  e.type !== 'imports' &&
  e.type !== 'depends_on' &&
  e.type !== 'calls' &&
  e.type !== 'extends'   // was 'inherits'
) {
  return false
}
```

- [ ] **Step 5: TypeScript check**

```bash
cd packages/ui && npx tsc --noEmit 2>&1 | tail -10
```

Expected: 0 errors.

- [ ] **Step 6: Run tests**

```bash
cd packages/ui && npx vitest run src/features/canvas/layouts/city/useCityFiltering.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/features/canvas/layouts/city/useCityFiltering.ts packages/ui/src/features/canvas/layouts/city/useCityFiltering.test.ts
git commit -m "feat(ui): wire useCityFiltering to GroupHierarchy, fix extends/inherits edge type"
```

---

### Task 11: Migrate WorkspacePage to fetch ParseResult

**Prerequisite:** Chunk 3 (Task 8) must be fully complete — `graph.ts` is deleted and all consumers use `IVMNode` before starting this task. Task 3 (layouts/index.ts with `useLayout`) must also exist. Task 5 (Chunk 2) must also be complete — `graph.getParseResult()` client function must exist before this task's integration test can reference it.

**Files:**
- Modify: `packages/ui/src/pages/WorkspacePage.tsx` — includes 3 internal changes: remove graphData state, update SuccessNotification string, update camera root-node finder
- Modify: `packages/ui/src/features/canvas/Canvas3D.tsx`
- Modify: `packages/ui/src/features/canvas/views/ViewModeRenderer.tsx`
- Modify: `packages/ui/src/features/canvas/hud/HUD.tsx` (or equivalent path — find with grep)
- Modify: `packages/ui/src/features/canvas/components/NodeDetails.tsx` (find with grep)
- Modify: `packages/ui/src/features/navigation/Navigation.tsx` (find with grep)
- Modify: `packages/ui/src/features/search/SearchBarModal.tsx` (find with grep)
- Modify: `packages/ui/src/features/canvas/minimap/MiniMap.tsx` (find with grep)
- Modify: `packages/ui/src/features/canvas/hooks/useGlobalKeyboardShortcuts.ts` (find with grep)

Note: SuccessNotification and the camera root-node finder (consumer items 8 and 9) are both changes **inside `WorkspacePage.tsx`** — they are not separate files.

- [ ] **Step 0: Discover exact file paths and write failing smoke test**

Before editing any file, run:

```bash
grep -r "graphData" packages/ui/src/ --include="*.tsx" --include="*.ts" -l
```

Record the exact file paths in a local note (do not edit this plan document). This list is the complete set of files you must touch. **You will substitute these exact paths into the `git add` commands in Step 6** — do not use directory-level adds.

Also find the camera root-node finder (the inline `graphData.nodes.find(...)` call):

```bash
grep -r "graphData\.nodes\.find\|graphData?.nodes?.find" packages/ui/src/ --include="*.tsx" --include="*.ts" -n
```

Note the file path and line number — you will update it in Step 1.

Write a minimal failing test to guard the migration. This test reads the actual `WorkspacePage.tsx` source and will fail while `graphData` still exists:

```typescript
// Create: packages/ui/src/pages/WorkspacePage.migration.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Use import.meta.url for a path that works regardless of CWD
const __dirname = dirname(fileURLToPath(import.meta.url))

describe('WorkspacePage migration guard', () => {
  it('WorkspacePage.tsx must not reference graphData state', () => {
    const src = readFileSync(join(__dirname, 'WorkspacePage.tsx'), 'utf8')
    expect(src).not.toContain('graphData')
    expect(src).not.toContain('setGraphData')
  })
})
```

Run to confirm it fails (while `graphData` is still present):

```bash
cd packages/ui && npx vitest run src/pages/WorkspacePage.migration.test.ts --reporter=verbose 2>&1 | tail -10
```

Expected: FAIL — source still contains `graphData`.

- [ ] **Step 1: Update WorkspacePage**

Read `WorkspacePage.tsx` fully first. Then:
- Remove: `const [graphData, setGraphData] = useState<Graph | null>(null)`
- Add store selectors:

```typescript
const setParseResult = useCanvasStore((s) => s.setParseResult)
const parseResult = useCanvasStore((s) => s.parseResult)
```

- Rename `loadGraphData` → `loadParseResult`. Keep all existing codebase lookup logic (the workspace fetch, codebase list fetch, status checks) unchanged. Replace only the final data fetch and store call:

```typescript
// Replace this line:
const data = await graph.getFullGraph(completedCodebase.repositoryId)
setGraphData(data)

// With:
const result = await graph.getParseResult(completedCodebase.repositoryId)
setParseResult(result)
```

Update all nine consumer sites (each is a distinct change):

```typescript
// 1. Canvas3D — remove graph prop
{parseResult ? <Canvas3D /> : <EmptyState onImportClick={openLeftPanel} />}

// 2–6. HUD, NodeDetails, Navigation, SearchBarModal, MiniMap — each has:
// Change: nodes={graphData?.nodes || []}
// To:     nodes={parseResult?.graph.nodes ?? []}

// 7. useGlobalKeyboardShortcuts
// Change: nodes: graphData?.nodes || []
// To:     nodes: parseResult?.graph.nodes ?? []

// 8. SuccessNotification (inline string — find with grep "graphData.nodes?.length")
// Change: `Graph loaded with ${graphData.nodes?.length || 0} nodes`
// To:     `Graph loaded with ${parseResult?.graph.nodes.length ?? 0} nodes`

// 9. Camera root-node finder (found via grep in Step 0)
// Change: graphData.nodes.find(...)
// To:     parseResult?.graph.nodes.find(...)
```

All nine consumers must be updated before the TypeScript check in Step 4.

- [ ] **Step 2: Remove graph prop from Canvas3D**

In `Canvas3D.tsx`:
```typescript
// Remove graph from props interface and all usages
export function Canvas3D({ className = '' }: { className?: string }) {
```

After removing the prop, run a TypeScript check to catch any call sites that still pass `graph=`:

```bash
cd packages/ui && npx tsc --noEmit 2>&1 | grep "Canvas3D" | head -10
```

Fix any remaining call sites before proceeding.

- [ ] **Step 3: Update ViewModeRenderer to use useLayout**

In `ViewModeRenderer.tsx`:

```typescript
import { useLayout } from '../layouts'

export function ViewModeRenderer() {
  const { engine } = useLayout()
  const LayoutView = engine.component
  return <LayoutView />
}
```

The layout-switcher integration tests in Task 13 Step 1 (`setActiveLayout('basic3d')` / `setActiveLayout('city')`) cover the layout switching behavior. If a `ViewModeRenderer.test.tsx` already exists in the codebase, update its snapshot or render assertion to reflect the new `useLayout`-driven render path.

- [ ] **Step 4: TypeScript check**

```bash
cd packages/ui && npx tsc --noEmit 2>&1 | tail -10
```

Expected: 0 errors. Fix any errors before proceeding.

- [ ] **Step 5: Run UI test suite**

```bash
cd packages/ui && npx vitest run --reporter=verbose 2>&1 | tail -30
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

Build an explicit file list from the exact paths discovered in Step 0. Use `git status` to see exactly which files changed, then `git add` each one by name. Do not use directory-level adds or dynamic grep-based adds:

```bash
git status packages/ui/src/  # review which files are modified
git add packages/ui/src/pages/WorkspacePage.tsx
git add packages/ui/src/pages/WorkspacePage.migration.test.ts
git add packages/ui/src/features/canvas/Canvas3D.tsx
git add packages/ui/src/features/canvas/views/ViewModeRenderer.tsx
# Add the dynamic paths discovered in Step 0 — substitute the exact paths found by grep:
# git add packages/ui/src/features/canvas/hud/<exact-file>
# git add packages/ui/src/features/canvas/components/<exact-file>
# git add packages/ui/src/features/navigation/<exact-file>
# git add packages/ui/src/features/search/<exact-file>
# git add packages/ui/src/features/canvas/minimap/<exact-file>
# git add packages/ui/src/features/canvas/hooks/<exact-file>
git status  # verify only the expected files are staged before committing
git commit -m "feat(ui): wire WorkspacePage to ParseResult, remove graphData state"
```

---

## Chunk 5: Camera LOD Wiring + Integration Tests

### Task 12: Wire camera lodLevel to ViewResolver calls

**Files:**
- Modify: `packages/ui/src/features/canvas/layouts/city/useCityLayout.ts`
- Modify: `packages/ui/src/features/canvas/layouts/city/useCityLayout.test.ts`

- [ ] **Step 1: Write failing tests**

Add the following to `useCityLayout.test.ts`. First, set up a `mockResolver` using `vi.fn()` spies so you can assert on which methods are called:

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCanvasStore } from '../../store'
import { useCityLayout } from './useCityLayout'
import { SemanticTier } from '@diagram-builder/core'
import type { IVMGraph } from '@diagram-builder/core'

const emptyGraph: IVMGraph = {
  nodes: [], edges: [],
  metadata: { name: '', schemaVersion: '1.0.0', generatedAt: '', rootPath: '', languages: [], stats: { totalNodes: 0, totalEdges: 0, nodesByType: {} as any, edgesByType: {} as any } },
  bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
}

// A mock ViewResolver with spy functions for assertion
const mockResolver = {
  getTier: vi.fn((_tier: SemanticTier) => emptyGraph),
  getView: vi.fn((_config: any) => ({ graph: emptyGraph })),
}

beforeEach(() => {
  vi.clearAllMocks()
})
```

**Plan-level decision (not in spec):** When `lodLevel === 4` and `selectedNodeId` is null, the fallback is `getTier(SemanticTier.Symbol)`. The design spec specifies the LOD-3 null fallback but not LOD-4. This plan-level decision is recorded here — the test and implementation below both follow this convention.

Then add the LOD dispatch tests:

```typescript
it('uses getTier(SemanticTier.Module) at lodLevel 1', () => {
  useCanvasStore.setState({ resolver: mockResolver, lodLevel: 1 })
  renderHook(() => useCityLayout())
  expect(mockResolver.getTier).toHaveBeenCalledWith(SemanticTier.Module)
})

it('uses getTier(SemanticTier.File) at lodLevel 2', () => {
  useCanvasStore.setState({ resolver: mockResolver, lodLevel: 2 })
  renderHook(() => useCityLayout())
  expect(mockResolver.getTier).toHaveBeenCalledWith(SemanticTier.File)
})

it('uses getView with expand when lodLevel is 3 and focusedGroupId is set', () => {
  useCanvasStore.setState({ resolver: mockResolver, lodLevel: 3, focusedGroupId: 'group:mod1' })
  renderHook(() => useCityLayout())
  expect(mockResolver.getView).toHaveBeenCalledWith({
    baseTier: SemanticTier.File,
    expand: ['group:mod1'],
  })
})

it('falls back to getTier(SemanticTier.File) when lodLevel is 3 but focusedGroupId is null', () => {
  useCanvasStore.setState({ resolver: mockResolver, lodLevel: 3, focusedGroupId: null })
  renderHook(() => useCityLayout())
  expect(mockResolver.getTier).toHaveBeenCalledWith(SemanticTier.File)
  expect(mockResolver.getView).not.toHaveBeenCalled()
})

it('uses getView({ baseTier: SemanticTier.Symbol, focalNodeId }) at lodLevel 4 when selectedNodeId is set', () => {
  useCanvasStore.setState({ resolver: mockResolver, lodLevel: 4, selectedNodeId: 'node-x' })
  renderHook(() => useCityLayout())
  expect(mockResolver.getView).toHaveBeenCalledWith({
    baseTier: SemanticTier.Symbol,
    focalNodeId: 'node-x',
  })
})

it('falls back to getTier(SemanticTier.Symbol) at lodLevel 4 when selectedNodeId is null', () => {
  // NOTE: This LOD-4 null fallback (SemanticTier.Symbol) is a plan-level decision —
  // the spec only documents the LOD-3 null fallback. The implementation in Step 3
  // must match this test's expectation exactly.
  useCanvasStore.setState({ resolver: mockResolver, lodLevel: 4, selectedNodeId: null })
  renderHook(() => useCityLayout())
  expect(mockResolver.getTier).toHaveBeenCalledWith(SemanticTier.Symbol)
  expect(mockResolver.getView).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd packages/ui && npx vitest run src/features/canvas/layouts/city/useCityLayout.test.ts --reporter=verbose 2>&1 | tail -20
```

- [ ] **Step 3: Add LOD→resolver dispatch to useCityLayout**

```typescript
const lodLevel = useCanvasStore((s) => s.lodLevel)
const focusedGroupId = useCanvasStore((s) => s.focusedGroupId)
const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)

const graph = useMemo(() => {
  if (!resolver) return EMPTY_GRAPH

  if (lodLevel <= 1) return resolver.getTier(SemanticTier.Module)
  if (lodLevel === 2) return resolver.getTier(SemanticTier.File)
  if (lodLevel === 3) {
    if (!focusedGroupId) return resolver.getTier(SemanticTier.File)
    return resolver.getView({ baseTier: SemanticTier.File, expand: [focusedGroupId] }).graph
  }
  // lodLevel === 4
  if (!selectedNodeId) return resolver.getTier(SemanticTier.Symbol)
  return resolver.getView({ baseTier: SemanticTier.Symbol, focalNodeId: selectedNodeId }).graph
}, [resolver, lodLevel, focusedGroupId, selectedNodeId])
```

- [ ] **Step 4: Run tests**

```bash
cd packages/ui && npx vitest run src/features/canvas/layouts/city/useCityLayout.test.ts --reporter=verbose 2>&1 | tail -20
```

Expected: all tests pass.

- [ ] **Step 5a: Add cameraPosition to canvas store (if not already present)**

Check whether `canvasStore` already has a `cameraPosition` field:

```bash
grep "cameraPosition" packages/ui/src/features/canvas/store.ts
```

If missing, add it to `store.ts`:

```typescript
// In state interface:
cameraPosition: { x: number; y: number; z: number }
setCameraPosition: (pos: { x: number; y: number; z: number }) => void

// In initialState:
cameraPosition: { x: 0, y: 0, z: 0 },

// In actions:
setCameraPosition: (pos) => set({ cameraPosition: pos }),
```

Then find the camera component that owns the camera update loop:

```bash
grep -rn "useThree\|useFrame\|CameraController" packages/ui/src/ --include="*.tsx" --include="*.ts" -l
```

Open the file that contains a `useFrame` or camera update loop (typically named `CameraController.tsx` or similar — it may live in `features/canvas/` or `features/canvas/camera/`). Add inside its `useFrame` or camera update callback:

```typescript
const setCameraPosition = useCanvasStore((s) => s.setCameraPosition)
// Inside the camera update loop (useFrame or equivalent):
setCameraPosition({ x: camera.position.x, y: camera.position.y, z: camera.position.z })
```

If the grep returns no results, run a broader search:

```bash
grep -rn "camera.position" packages/ui/src/ --include="*.tsx" --include="*.ts" -l
```

Add `setCameraPosition` to whichever file accesses `camera.position`. If truly no file exists that reads camera position, create `packages/ui/src/features/canvas/camera/CameraSync.tsx`:

```typescript
import { useFrame } from '@react-three/fiber'
import { useCanvasStore } from '../store'

export function CameraSync() {
  const setCameraPosition = useCanvasStore((s) => s.setCameraPosition)
  useFrame(({ camera }) => {
    setCameraPosition({ x: camera.position.x, y: camera.position.y, z: camera.position.z })
  })
  return null
}
```

Mount `<CameraSync />` inside the Three.js `Canvas` element (find it with `grep -rn "Canvas>" packages/ui/src/ --include="*.tsx" -l`).

- [ ] **Step 5b: Implement focusedGroupId centroid computation with debounce**

Before writing the effect, find the exact name of the positions Map variable in the hook:

```bash
grep -n "Map<string" packages/ui/src/features/canvas/layouts/city/useCityLayout.ts | head -5
```

Note the variable name from the output (likely `positions`, but may be `nodePositions` or similar). **You MUST substitute every occurrence of `positions` in the code block below with this real variable name.** Do not copy-paste the block without verifying. After writing the effect, run:

```bash
cd packages/ui && npx tsc --noEmit 2>&1 | grep "useCityLayout" | head -5
```

to confirm no type errors from the substitution.

`focusedGroupId` must update when camera position settles, not every frame (the spec requires debounce to avoid excessive resolver re-renders). Add this to `useCityLayout.ts`:

```typescript
import { useEffect, useRef } from 'react'
import { useCanvasStore } from '../../store'
import type { GroupNode } from '@diagram-builder/core'

// `positions` here is the Map<string, {x,y,z}> that the existing layout algorithm
// already computes inside useCityLayout (the force-directed layout result).
// Place this block AFTER the existing `const positions = useMemo(...)` in the hook body.
const setFocusedGroupId = useCanvasStore((s) => s.setFocusedGroupId)
const parseResult = useCanvasStore((s) => s.parseResult)
const cameraPosition = useCanvasStore((s) => s.cameraPosition)
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

useEffect(() => {
  if (!parseResult || !positions.size) return

  if (debounceRef.current) clearTimeout(debounceRef.current)
  debounceRef.current = setTimeout(() => {
    function getModuleGroups(root: GroupNode): GroupNode[] {
      if (root.tier === SemanticTier.Module) return [root]
      return root.children.flatMap(getModuleGroups)
    }

    const moduleGroups = getModuleGroups(parseResult.hierarchy.root)
    let closestId: string | null = null
    let closestDist = Infinity

    for (const group of moduleGroups) {
      const groupPositions = group.nodeIds
        .map((id) => positions.get(id))
        .filter(Boolean) as { x: number; y: number; z: number }[]
      if (!groupPositions.length) continue

      const cx = groupPositions.reduce((s, p) => s + p.x, 0) / groupPositions.length
      const cy = groupPositions.reduce((s, p) => s + p.y, 0) / groupPositions.length
      const cz = groupPositions.reduce((s, p) => s + p.z, 0) / groupPositions.length

      const dx = cameraPosition.x - cx
      const dy = cameraPosition.y - cy
      const dz = cameraPosition.z - cz
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (dist < closestDist) { closestDist = dist; closestId = group.id }
    }

    setFocusedGroupId(closestId)
  }, 300) // 300ms debounce — prevents every-frame store writes

  return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
}, [positions, parseResult, cameraPosition, setFocusedGroupId])
```

- [ ] **Step 5c: Write and run test for centroid computation**

Use fake timers to avoid a real 400ms wait. Define the hierarchy fixture inline — do not import from Task 10 helpers (to keep this test self-contained):

```typescript
import { vi } from 'vitest'
import type { ParseResult, GroupNode } from '@diagram-builder/core'

// Inline hierarchy fixture for this test
function buildCentroidTestParseResult(): ParseResult {
  const fileNodeA = { id: 'file:a', type: 'file' as const, lod: SemanticTier.File, position: { x: 0, y: 0, z: 0 }, metadata: { label: 'a.ts', path: 'a.ts', properties: {} } }
  const graph = {
    nodes: [fileNodeA],
    edges: [],
    metadata: { name: 'test', schemaVersion: '1.0.0', generatedAt: '', rootPath: '', languages: [], stats: { totalNodes: 1, totalEdges: 0, nodesByType: {} as any, edgesByType: {} as any } },
    bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
  }
  return {
    graph,
    hierarchy: {
      root: {
        id: 'group:root', label: 'root', tier: SemanticTier.Repository, nodeIds: [],
        children: [
          { id: 'group:mod1', label: 'mod1', tier: SemanticTier.Module, nodeIds: ['file:a'], children: [] },
        ],
      },
      tierCount: {} as any, edgesByTier: {} as any,
    },
    tiers: { 0: graph, 1: graph, 2: graph, 3: graph, 4: graph, 5: graph } as any,
  }
}

describe('focusedGroupId centroid computation', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('calls setFocusedGroupId after debounce when positions are available', async () => {
    const parseResult = buildCentroidTestParseResult()
    // Use a real resolver so getTier(SemanticTier.File) returns the graph with file:a.
    // The layout engine's useMemo runs synchronously during renderHook, producing
    // positions.size === 1 (one entry for file:a). This satisfies the early-return
    // guard in the useEffect (`if (!positions.size) return`), allowing centroid
    // computation to run.
    const { createViewResolver } = await import('@diagram-builder/core')
    const realResolver = createViewResolver(parseResult)

    useCanvasStore.setState({
      resolver: realResolver,
      parseResult,
      cameraPosition: { x: 0, y: 0, z: 0 },
    })

    renderHook(() => useCityLayout())

    // Advance fake timers past the 300ms debounce
    vi.advanceTimersByTime(350)

    const focusedGroupId = useCanvasStore.getState().focusedGroupId
    // group:mod1 is the ONLY module group and contains file:a.
    // Distance from camera {0,0,0} to centroid of file:a's position = 0.
    // Result is deterministic: focusedGroupId === 'group:mod1'.
    // If this assertion fails with focusedGroupId === null, it means positions.size
    // was 0 after render — check that the layout engine runs its useMemo synchronously.
    expect(focusedGroupId).toBe('group:mod1')
  })
})
```

Run:

```bash
cd packages/ui && npx vitest run src/features/canvas/layouts/city/useCityLayout.test.ts --reporter=verbose 2>&1 | tail -30
```

Expected: centroid test passes.

- [ ] **Step 6: Commit**

List all files changed in this task, then stage each one:

```bash
git diff --name-only HEAD
```

The output will include some subset of these files depending on what changed in Steps 5a–5c. Stage every file listed:

```bash
git add packages/ui/src/features/canvas/layouts/city/useCityLayout.ts
git add packages/ui/src/features/canvas/layouts/city/useCityLayout.test.ts
```

If `store.ts` appears in the diff output, also run:
```bash
git add packages/ui/src/features/canvas/store.ts
```

If a camera controller file appears in the diff output (the file found or created in Step 5a — you recorded its path during that step), also run:
```bash
git add packages/ui/src/features/canvas/<the-camera-file-path-recorded-in-step-5a>
```
Substitute the actual file path you found or created.

Then verify and commit:
```bash
git status  # verify only the expected files are staged
git commit -m "feat(ui): wire camera lodLevel to ViewResolver tier/view calls"
```

---

### Task 13: Integration tests + full regression pass

**Files:**
- Create: `packages/ui/src/pages/WorkspacePage.integration.test.tsx`
- Run: full test suites for api, core, parser, ui

- [ ] **Step 0b: Verify WorkspacePage endpoint calls before writing test**

```bash
grep -n "endpoints\." packages/ui/src/pages/WorkspacePage.tsx
```

Confirm `WorkspacePage` calls `workspaces.get`, `codebases.list`, and `graph.getParseResult`. If any call site differs from what the test mocks below, adjust the `beforeEach` mock setup to match.

- [ ] **Step 1: Write WorkspacePage integration test**

```typescript
// packages/ui/src/pages/WorkspacePage.integration.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor, act, renderHook } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { WorkspacePage } from './WorkspacePage'
import { useCanvasStore } from '../features/canvas/store'
import { useLayout } from '../features/canvas/layouts'
import * as endpoints from '../shared/api/endpoints'
import { SemanticTier } from '@diagram-builder/core'

vi.mock('../shared/api/endpoints')

const minimalGraph = {
  nodes: [{ id: 'file:a', type: 'file', lod: 3, position: { x: 0, y: 0, z: 0 }, metadata: { label: 'a.ts', path: 'a.ts', properties: {} } }],
  edges: [],
  metadata: { name: 'test', schemaVersion: '1.0.0', generatedAt: '', rootPath: '', languages: [], stats: { totalNodes: 1, totalEdges: 0, nodesByType: {} as any, edgesByType: {} as any } },
  bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
}

const mockParseResult = {
  graph: minimalGraph,
  hierarchy: { root: { id: 'root', label: 'root', tier: 0, nodeIds: [], children: [] }, tierCount: {} as any, edgesByTier: {} as any },
  // Provide the same graph for every tier so ViewResolver can index into tiers without error
  tiers: {
    0: minimalGraph, 1: minimalGraph, 2: minimalGraph,
    3: minimalGraph, 4: minimalGraph, 5: minimalGraph,
  } as any,
}

describe('WorkspacePage integration', () => {
  beforeEach(() => {
    vi.mocked(endpoints.workspaces.get).mockResolvedValue({ id: 'ws-1', name: 'Test WS' } as any)
    vi.mocked(endpoints.codebases.list).mockResolvedValue({
      codebases: [{ codebaseId: 'cb-1', repositoryId: 'repo-1', status: 'completed' }],
    } as any)
    vi.mocked(endpoints.graph.getParseResult).mockResolvedValue(mockParseResult as any)
  })

  it('sets parseResult in store after successful fetch', async () => {
    render(
      <MemoryRouter initialEntries={['/workspace/ws-1']}>
        <Routes>
          <Route path="/workspace/:id" element={<WorkspacePage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      const { parseResult, resolver } = useCanvasStore.getState()
      expect(parseResult).not.toBeNull()
      expect(resolver).not.toBeNull()
      // Verify graph nodes are accessible at the canonical IVMNode path
      expect(parseResult?.graph.nodes.length).toBeGreaterThan(0)
      expect(parseResult?.graph.nodes[0].metadata.label).toBeDefined()
    })
  })

  it('resolver can produce a tier graph after fetch', async () => {
    render(
      <MemoryRouter initialEntries={['/workspace/ws-1']}>
        <Routes>
          <Route path="/workspace/:id" element={<WorkspacePage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      const { resolver } = useCanvasStore.getState()
      if (!resolver) return
      const tierGraph = resolver.getTier(SemanticTier.File)
      expect(tierGraph.nodes).toBeDefined()
    })
  })

  it('parseResult.graph.nodes are accessible at IVMNode paths for all nine former graphData consumers', async () => {
    render(
      <MemoryRouter initialEntries={['/workspace/ws-1']}>
        <Routes>
          <Route path="/workspace/:id" element={<WorkspacePage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      const { parseResult } = useCanvasStore.getState()
      if (!parseResult) return

      // All nine consumers read nodes from parseResult.graph.nodes:
      const nodes = parseResult.graph.nodes

      // node shape: IVMNode — label at metadata.label, not top-level
      expect(nodes[0].metadata.label).toBeDefined()
      expect(nodes[0].id).toBeDefined()
      expect(nodes[0].type).toBeDefined()
      expect(nodes[0].position).toBeDefined()

      // Verify no top-level label (old GraphNode shape must be gone):
      expect((nodes[0] as any).label).toBeUndefined()
    })
  })
})
```

**Add a layout-switcher integration test** (separate describe block appended to the same file — `useCanvasStore`, `act`, `renderHook`, and `useLayout` are already imported at the top of the file, do not re-import them):

```typescript
describe('layout switcher', () => {
  it('setActiveLayout("basic3d") causes useLayout to return the basic3d engine', () => {
    act(() => useCanvasStore.getState().setActiveLayout('basic3d'))
    const { result } = renderHook(() => useLayout())
    expect(result.current.engine.id).toBe('basic3d')
    expect(result.current.engine.component).toBeDefined()
  })

  it('setActiveLayout("city") causes useLayout to return the city engine', () => {
    act(() => useCanvasStore.getState().setActiveLayout('city'))
    const { result } = renderHook(() => useLayout())
    expect(result.current.engine.id).toBe('city')
    expect(result.current.engine.component).toBeDefined()
  })
})
```

- [ ] **Step 2: Run integration test**

Note: This is an end-to-end validation test, not a TDD unit test. It is written AFTER all prior chunks (1–4) have been implemented. It should pass immediately without a red-green cycle. If it fails, the failure points to a gap in a prior chunk's implementation — fix that gap before proceeding.

```bash
cd packages/ui && npx vitest run src/pages/WorkspacePage.integration.test.tsx --reporter=verbose 2>&1 | tail -20
```

Expected: passes.

- [ ] **Step 2b: TypeScript check**

```bash
cd packages/ui && npx tsc --noEmit 2>&1 | tail -5
```

Expected: `Found 0 errors.`

- [ ] **Step 3: Run full regression suite across all packages**

```bash
cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/core packages/parser packages/api packages/ui 2>&1 | tail -30
```

Expected: same pass rate as before Phase 5 (the 10 pre-existing `fixture-based-integration.test.ts` failures in `packages/parser` are noise and were present before this work).

- [ ] **Step 4: TypeScript check + Final commit**

```bash
cd packages/ui && npx tsc --noEmit 2>&1 | tail -5
```

Expected: `Found 0 errors.`

```bash
git add packages/ui/src/pages/WorkspacePage.integration.test.tsx
git commit -m "test(ui): add WorkspacePage integration test for ParseResult wiring"
```

---

## Chunk 6: Environment Setup + Runtime Verification

The plan's prior chunks covered code changes and unit/integration tests. This chunk ensures the application actually runs end-to-end — dev server starts, workspace creation works, and ParseResult loads into the canvas.

### Task 14: Environment setup and dev server verification

**Files:**
- None created — env file is gitignored and must be manually copied

The worktree at `~/.worktrees/diagram_builder/feature-phase5-ui-integration/` (or wherever it was created) does not have a `.env` file — git worktrees share the repository but not gitignored files. Without `.env`, `server.ts` cannot resolve environment variables and the API fails to start, causing the "Failed to create workspace. Please check that the API is running." error in the UI.

- [ ] **Step 1: Copy .env to worktree**

```bash
cp /Users/brianmehrman/projects/diagram_builder/.env \
   /Users/brianmehrman/projects/diagram_builder_tree/feature/phase5-ui-integration/.env
```

Verify the file exists:
```bash
ls -la /Users/brianmehrman/projects/diagram_builder_tree/feature/phase5-ui-integration/.env
```

- [ ] **Step 2: Verify Docker services are running**

```bash
docker ps | grep -E "neo4j|redis"
```

If not running:
```bash
cd /Users/brianmehrman/projects/diagram_builder_tree/feature/phase5-ui-integration && docker-compose up -d neo4j redis
sleep 10
```

- [ ] **Step 3: Start the dev server**

In one terminal:
```bash
cd /Users/brianmehrman/projects/diagram_builder_tree/feature/phase5-ui-integration && npm run dev
```

Expected output within 10 seconds:
```
🚀 Server running on port 4000 in development mode
   Health check: http://localhost:4000/health
vite dev server ready on port 3000
```

- [ ] **Step 4: Verify API health endpoint**

```bash
curl -s http://localhost:4000/health | head -5
```

Expected: `{"status":"healthy"}`

If the API fails to start, check:
1. `.env` file is present and has `DATABASE_URL`, `NEO4J_URI`, `REDIS_URL`
2. Neo4j and Redis Docker containers are running
3. Check API logs for specific errors

- [ ] **Step 5: Commit nothing** — this task is environment setup only, no code changes

---

### Task 15: End-to-end smoke test — workspace creation and graph loading

**Files:**
- None — manual verification

With the dev server running (Task 14 complete):

- [ ] **Step 1: Verify homepage loads and workspace is created**

Open `http://localhost:3000` in a browser.

Expected:
- HomePage loads
- Auto-creates "Default Workspace" (or lists existing workspaces)
- Navigates to `/workspace/:id`

If "Failed to create workspace. Please check that the API is running." still appears:
1. Confirm `curl http://localhost:4000/api/workspaces` returns a response (not connection refused)
2. Check browser network tab for the failing request URL and status code
3. Check API logs for the workspace creation error

- [ ] **Step 2: Import or select a codebase**

From the WorkspacePage, import a codebase (or select an existing one if already imported).

Expected:
- Codebase status shows `completed`
- After selection, `graph.getParseResult(repositoryId)` is called (visible in browser network tab as `GET /api/graph/:repoId/parse-result`)
- Canvas3D renders with city buildings visible

If the canvas shows empty (no buildings):
1. Open browser console and check for errors
2. Check that `canvasStore.parseResult` is set: in browser console, run `window.__zustand_canvas_store?.getState().parseResult`
3. Check that `canvasStore.resolver` is non-null
4. If resolver is null, check that `setParseResult` is being called in `WorkspacePage.tsx`

- [ ] **Step 3: Verify ParseResult endpoint directly**

```bash
# Replace REPO_ID with an actual repository ID from your database
curl -s -H "Authorization: Bearer dev-token" \
  http://localhost:4000/api/graph/REPO_ID/parse-result | \
  python3 -m json.tool | head -30
```

Expected: JSON with `graph`, `hierarchy`, and `tiers` keys.

If the endpoint returns an error, check:
1. `getFullGraph(repoId)` returns data (test `GET /api/graph/REPO_ID`)
2. `buildParseResult(graph)` doesn't throw (add a try/catch log in `graph-service.ts` temporarily)

- [ ] **Step 4: Verify LOD transitions work**

With the canvas loaded:
- Zoom out (scroll back) → city switches to module-level view (fewer, larger groups)
- Zoom in → city switches to file-level view, then symbol-level

Expected behavior per `useCityLayout`:
- `lodLevel 1`: `resolver.getTier(SemanticTier.Module)` — module clusters
- `lodLevel 2`: `resolver.getTier(SemanticTier.File)` — file-level buildings
- `lodLevel 3`: `resolver.getView({ baseTier: SemanticTier.File, expand: [focusedGroupId] })` — expanded district
- `lodLevel 4`: `resolver.getView({ baseTier: SemanticTier.Symbol, focalNodeId: selectedNodeId })` — symbol detail

---

## Done

Phase 5 is complete when:
- [ ] `GET /api/graph/:repoId/parse-result` returns `ParseResult`
- [ ] `GET /api/graph/:repoId/tier/:tier` returns a single tier `IVMGraph`
- [ ] `packages/ui/src/shared/types/graph.ts` is deleted
- [ ] `npx tsc --noEmit` in `packages/ui` reports 0 errors
- [ ] City layout files live in `layouts/city/`
- [ ] `Basic3DView` stub exists in `layouts/basic3d/`
- [ ] `useLayout` hook returns the active engine
- [ ] `useCityLayout` reads from `resolver.getTier()` based on `lodLevel`
- [ ] `useCityFiltering` sources districts from `GroupHierarchy`, not path strings
- [ ] `WorkspacePage` has no `graphData` state — all consumers read from `canvasStore.parseResult`
- [ ] Full vitest run passes (minus the 10 pre-existing parser fixture failures)
- [ ] Dev server starts cleanly with `.env` present
- [ ] Workspace creation succeeds (`POST /api/workspaces`)
- [ ] ParseResult endpoint returns valid data (`GET /api/graph/:repoId/parse-result`)
- [ ] Canvas renders buildings after codebase is loaded
