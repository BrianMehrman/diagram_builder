# Semantic Tiered Views Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a semantic tiered view system so the parser produces a GroupHierarchy alongside the full IVMGraph, enabling consumers (exporters, 3D canvas) to request appropriately simplified views with capacity constraints and focal-point pruning.

**Architecture:** The parser builds a GroupHierarchy tree from the IVMGraph using universal CS grouping tiers (repository → package → module → file → symbol → detail). Pre-computed tier views are materialized as valid IVMGraphs. A ViewResolver in core provides both fast-path tier access and custom views with expand/collapse, focal-point degradation, and edge budget constraints.

**Tech Stack:** TypeScript, Vitest, existing IVM type system in packages/core and packages/parser

**Spec:** `docs/specs/2026-03-12-semantic-tiered-views-design.md`

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `packages/core/src/ivm/semantic-tier.ts` | `SemanticTier` enum, `GroupNode`, `GroupHierarchy`, `AggregatedEdge`, `ParseResult` types |
| `packages/core/src/ivm/semantic-tier.test.ts` | Unit tests for tier types and helpers |
| `packages/parser/src/ivm/hierarchy-builder.ts` | Builds GroupHierarchy from IVMGraph — groups nodes by tier, computes aggregated edges |
| `packages/parser/src/ivm/hierarchy-builder.test.ts` | Unit tests for hierarchy builder |
| `packages/parser/src/ivm/tier-materializer.ts` | Materializes pre-computed IVMGraph views for each tier |
| `packages/parser/src/ivm/tier-materializer.test.ts` | Unit tests for tier materialization |
| `packages/parser/src/ivm/build-parse-result.ts` | `buildParseResult()` function — orchestrates hierarchy + tiers |
| `packages/parser/src/ivm/build-parse-result.test.ts` | Integration tests for full ParseResult pipeline |
| `packages/core/src/views/view-resolver.ts` | `createViewResolver()`, `getTier()`, `getView()` implementation |
| `packages/core/src/views/view-resolver.test.ts` | Unit tests for view resolver |
| `packages/core/src/views/focal-pruner.ts` | Focal-point pruning and constraint satisfaction logic |
| `packages/core/src/views/focal-pruner.test.ts` | Unit tests for focal pruning |
| `packages/core/src/views/types.ts` | `ViewConfig`, `ViewConstraints`, `ViewResult`, `ViewResolver` interface |
| `packages/core/src/views/index.ts` | Public exports for views module |
| `packages/core/src/views/export-with-view.ts` | `exportWithView()` convenience function |
| `packages/core/src/views/export-with-view.test.ts` | Tests for export convenience function |
| `tests/fixtures/repositories/medium-ts-repo/` | Richer fixture with package/module/file/symbol/detail depth |

### Modified Files

| File | Change |
|------|--------|
| `packages/core/src/ivm/types.ts` | Replace `LODLevel` type with import from `semantic-tier.ts`, keep as deprecated alias |
| `packages/core/src/ivm/builder.ts` | Update `NODE_TYPE_LOD` and functions to use `SemanticTier` |
| `packages/core/src/ivm/index.ts` | Re-export new types from `semantic-tier.ts` |
| `packages/core/src/index.ts` | Add `export * from './views/index.js'` |
| `packages/core/src/layout/lod.ts` | Update imports to use `SemanticTier` |
| `packages/core/src/exporters/types.ts` | Update imports to use `SemanticTier` |
| `packages/parser/src/index.ts` | Export `buildParseResult`, `ParseResult`, hierarchy types |
| `packages/parser/src/ivm/ivm-converter.ts` | No changes (kept as-is for backward compat) |

---

## Chunk 1: Phase 1 — Core Types & LODLevel Migration

### Task 1: Define SemanticTier enum and GroupHierarchy types

**Files:**
- Create: `packages/core/src/ivm/semantic-tier.ts`
- Create: `packages/core/src/ivm/semantic-tier.test.ts`

- [ ] **Step 1: Write failing test for SemanticTier enum values**

```typescript
// packages/core/src/ivm/semantic-tier.test.ts
import { describe, it, expect } from 'vitest'
import {
  SemanticTier,
  SEMANTIC_TIER_DESCRIPTIONS,
  AGGREGATABLE_EDGE_TYPES,
} from './semantic-tier'

describe('SemanticTier', () => {
  it('has correct numeric values matching former LODLevel', () => {
    expect(SemanticTier.Repository).toBe(0)
    expect(SemanticTier.Package).toBe(1)
    expect(SemanticTier.Module).toBe(2)
    expect(SemanticTier.File).toBe(3)
    expect(SemanticTier.Symbol).toBe(4)
    expect(SemanticTier.Detail).toBe(5)
  })

  it('has descriptions for every tier', () => {
    const tiers = [0, 1, 2, 3, 4, 5] as SemanticTier[]
    for (const tier of tiers) {
      expect(SEMANTIC_TIER_DESCRIPTIONS[tier]).toBeDefined()
      expect(typeof SEMANTIC_TIER_DESCRIPTIONS[tier]).toBe('string')
    }
  })

  it('defines aggregatable edge types excluding contains and detail-only types', () => {
    expect(AGGREGATABLE_EDGE_TYPES).toContain('imports')
    expect(AGGREGATABLE_EDGE_TYPES).toContain('calls')
    expect(AGGREGATABLE_EDGE_TYPES).toContain('extends')
    expect(AGGREGATABLE_EDGE_TYPES).toContain('implements')
    expect(AGGREGATABLE_EDGE_TYPES).toContain('uses')
    expect(AGGREGATABLE_EDGE_TYPES).toContain('depends_on')
    expect(AGGREGATABLE_EDGE_TYPES).toContain('exports')
    // Excluded types
    expect(AGGREGATABLE_EDGE_TYPES).not.toContain('contains')
    expect(AGGREGATABLE_EDGE_TYPES).not.toContain('type_of')
    expect(AGGREGATABLE_EDGE_TYPES).not.toContain('returns')
    expect(AGGREGATABLE_EDGE_TYPES).not.toContain('parameter_of')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/core/src/ivm/semantic-tier.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement SemanticTier types**

```typescript
// packages/core/src/ivm/semantic-tier.ts
import type { EdgeType, NodeType } from './types.js'

export enum SemanticTier {
  Repository = 0,
  Package = 1,
  Module = 2,
  File = 3,
  Symbol = 4,
  Detail = 5,
}

export const SEMANTIC_TIER_DESCRIPTIONS: Record<SemanticTier, string> = {
  [SemanticTier.Repository]: 'Repository level - shows only repositories',
  [SemanticTier.Package]: 'Package level - shows packages/modules',
  [SemanticTier.Module]: 'Directory level - shows directories',
  [SemanticTier.File]: 'File level - shows files',
  [SemanticTier.Symbol]: 'Class/Function level - shows major code elements',
  [SemanticTier.Detail]: 'Full detail - shows all code elements',
}

export const NODE_TYPE_TO_TIER: Record<NodeType, SemanticTier> = {
  repository: SemanticTier.Repository,
  package: SemanticTier.Package,
  namespace: SemanticTier.Package,
  directory: SemanticTier.Module,
  module: SemanticTier.Module,
  file: SemanticTier.File,
  class: SemanticTier.Symbol,
  interface: SemanticTier.Symbol,
  enum: SemanticTier.Symbol,
  function: SemanticTier.Symbol,
  type: SemanticTier.Detail,
  method: SemanticTier.Detail,
  variable: SemanticTier.Detail,
}

export const AGGREGATABLE_EDGE_TYPES: EdgeType[] = [
  'imports',
  'calls',
  'extends',
  'implements',
  'uses',
  'depends_on',
  'exports',
]

export interface GroupNode {
  id: string
  label: string
  tier: SemanticTier
  nodeIds: string[]
  children: GroupNode[]
}

export interface AggregatedEdge {
  sourceGroupId: string
  targetGroupId: string
  breakdown: Partial<Record<EdgeType, number>>
  totalWeight: number
}

export interface GroupHierarchy {
  root: GroupNode
  tierCount: Record<SemanticTier, number>
  edgesByTier: Record<SemanticTier, AggregatedEdge[]>
}

export interface ParseResult {
  graph: import('./types.js').IVMGraph
  hierarchy: GroupHierarchy
  tiers: Record<SemanticTier, import('./types.js').IVMGraph>
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/core/src/ivm/semantic-tier.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/ivm/semantic-tier.ts packages/core/src/ivm/semantic-tier.test.ts
git commit -m "feat(core): add SemanticTier enum and GroupHierarchy types"
```

---

### Task 2: Replace LODLevel with SemanticTier across core

**Files:**
- Modify: `packages/core/src/ivm/types.ts:55` (LODLevel definition)
- Modify: `packages/core/src/ivm/types.ts:413-420` (LOD_DESCRIPTIONS)
- Modify: `packages/core/src/ivm/builder.ts:51-80` (NODE_TYPE_LOD, assignLOD, assignEdgeLOD)
- Modify: `packages/core/src/ivm/index.ts` (re-exports)
- Modify: `packages/core/src/layout/lod.ts:14` (import)
- Modify: `packages/core/src/exporters/types.ts:7` (import)

- [ ] **Step 1: Run existing tests to establish baseline**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/core/`
Expected: All tests pass (capture count)

- [ ] **Step 2: Update types.ts — deprecate LODLevel, alias to SemanticTier**

In `packages/core/src/ivm/types.ts`:
- Add import: `import { SemanticTier, SEMANTIC_TIER_DESCRIPTIONS } from './semantic-tier.js'`
- Replace the `LODLevel` type with: `/** @deprecated Use SemanticTier instead */ export type LODLevel = SemanticTier`
- Replace `LOD_DESCRIPTIONS` with: `/** @deprecated Use SEMANTIC_TIER_DESCRIPTIONS instead */ export const LOD_DESCRIPTIONS = SEMANTIC_TIER_DESCRIPTIONS`
- Keep `IVMNode.lod` and `IVMEdge.lod` typed as `LODLevel` for now (alias makes this safe)

- [ ] **Step 3: Update builder.ts — use SemanticTier**

In `packages/core/src/ivm/builder.ts`:
- Import `SemanticTier` and `NODE_TYPE_TO_TIER` from `./semantic-tier.js`
- Replace `NODE_TYPE_LOD` with: `/** @deprecated Use NODE_TYPE_TO_TIER instead */ export const NODE_TYPE_LOD = NODE_TYPE_TO_TIER`
- Update `assignLOD` to use `NODE_TYPE_TO_TIER`
- Update `assignEdgeLOD` signature to accept `SemanticTier` params

- [ ] **Step 4: Update imports in layout/lod.ts and exporters/types.ts**

In `packages/core/src/layout/lod.ts`: add import of `SemanticTier` alongside existing `LODLevel` import.
In `packages/core/src/exporters/types.ts`: add import of `SemanticTier` alongside existing `LODLevel` import.

These files can continue using `LODLevel` (it's now an alias) — no functional changes needed.

- [ ] **Step 5: Update core ivm/index.ts exports**

In `packages/core/src/ivm/index.ts`: add `export * from './semantic-tier.js'`

- [ ] **Step 6: Run all core tests to verify no regressions**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/core/`
Expected: Same test count, all pass

- [ ] **Step 7: Run parser tests to verify no regressions**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/parser/`
Expected: All pass (parser imports from core, alias keeps things compatible)

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/ivm/types.ts packages/core/src/ivm/builder.ts packages/core/src/ivm/index.ts packages/core/src/layout/lod.ts packages/core/src/exporters/types.ts
git commit -m "refactor(core): deprecate LODLevel in favor of SemanticTier enum"
```

---

### Task 3: Validate test fixture depth and create richer fixture if needed

**Files:**
- Read: `tests/fixtures/repositories/small-ts-repo/` (existing fixture)
- Create: `tests/fixtures/repositories/medium-ts-repo/` (if needed)

- [ ] **Step 1: Assess small-ts-repo tier depth**

Read the small-ts-repo fixture structure. It has:
- Repository root (tier 0) ✓
- No explicit package.json with workspaces (tier 1 — missing)
- `src/`, `src/models/`, `src/utils/` directories (tier 2) ✓
- `index.ts`, `User.ts`, `helpers.ts` files (tier 3) ✓
- `User` class (tier 4) ✓
- Methods in User class (tier 5) — check

This fixture lacks Package tier depth (no sub-packages/workspaces). Create a medium fixture.

- [ ] **Step 2: Create medium-ts-repo fixture**

```
tests/fixtures/repositories/medium-ts-repo/
├── package.json
├── src/
│   ├── index.ts
│   ├── auth/
│   │   ├── index.ts
│   │   ├── login.ts
│   │   └── types.ts
│   ├── models/
│   │   ├── index.ts
│   │   ├── User.ts
│   │   └── Post.ts
│   ├── services/
│   │   ├── index.ts
│   │   ├── user-service.ts
│   │   └── post-service.ts
│   └── utils/
│       ├── index.ts
│       ├── validators.ts
│       └── formatters.ts
└── tests/
    └── services/
        └── user-service.test.ts
```

This gives us:
- Repository (tier 0): root
- Package (tier 1): single package (package.json)
- Module (tier 2): `src/auth`, `src/models`, `src/services`, `src/utils`, `tests/services`
- File (tier 3): 11 source files
- Symbol (tier 4): classes (User, Post), functions (login, validate*, format*)
- Detail (tier 5): methods, variables

Create each file with realistic imports, classes, and functions to generate meaningful edges across modules.

- [ ] **Step 3: Write file contents for medium-ts-repo**

`package.json`:
```json
{
  "name": "medium-ts-repo",
  "version": "1.0.0",
  "type": "module"
}
```

`src/models/User.ts`:
```typescript
export class User {
  constructor(
    public id: string,
    public name: string,
    public email: string
  ) {}

  getDisplayName(): string {
    return this.name
  }

  isValid(): boolean {
    return this.email.includes('@')
  }
}
```

`src/models/Post.ts`:
```typescript
import { User } from './User'

export class Post {
  constructor(
    public id: string,
    public title: string,
    public body: string,
    public author: User
  ) {}

  getSummary(): string {
    return `${this.title} by ${this.author.getDisplayName()}`
  }
}
```

`src/models/index.ts`:
```typescript
export { User } from './User'
export { Post } from './Post'
```

`src/auth/types.ts`:
```typescript
export interface AuthToken {
  userId: string
  token: string
  expiresAt: Date
}

export interface LoginCredentials {
  email: string
  password: string
}
```

`src/auth/login.ts`:
```typescript
import { User } from '../models/User'
import type { AuthToken, LoginCredentials } from './types'

export function login(credentials: LoginCredentials): AuthToken {
  return {
    userId: credentials.email,
    token: 'mock-token',
    expiresAt: new Date(Date.now() + 3600000),
  }
}

export function validateToken(token: AuthToken): boolean {
  return token.expiresAt > new Date()
}
```

`src/auth/index.ts`:
```typescript
export { login, validateToken } from './login'
export type { AuthToken, LoginCredentials } from './types'
```

`src/utils/validators.ts`:
```typescript
import { User } from '../models/User'

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validateUser(user: User): string[] {
  const errors: string[] = []
  if (!validateEmail(user.email)) errors.push('Invalid email')
  if (!user.name) errors.push('Name required')
  return errors
}
```

`src/utils/formatters.ts`:
```typescript
import { User } from '../models/User'
import { Post } from '../models/Post'

export function formatUser(user: User): string {
  return `${user.getDisplayName()} <${user.email}>`
}

export function formatPost(post: Post): string {
  return `${post.getSummary()} (${post.body.length} chars)`
}
```

`src/utils/index.ts`:
```typescript
export { validateEmail, validateUser } from './validators'
export { formatUser, formatPost } from './formatters'
```

`src/services/user-service.ts`:
```typescript
import { User } from '../models/User'
import { validateUser } from '../utils/validators'
import { formatUser } from '../utils/formatters'
import { login } from '../auth/login'
import type { AuthToken } from '../auth/types'

export class UserService {
  private users: User[] = []

  createUser(name: string, email: string): User {
    const user = new User(String(this.users.length + 1), name, email)
    const errors = validateUser(user)
    if (errors.length > 0) throw new Error(errors.join(', '))
    this.users.push(user)
    return user
  }

  authenticate(email: string, password: string): AuthToken {
    return login({ email, password })
  }

  listUsers(): string[] {
    return this.users.map(formatUser)
  }
}
```

`src/services/post-service.ts`:
```typescript
import { Post } from '../models/Post'
import { User } from '../models/User'
import { formatPost } from '../utils/formatters'

export class PostService {
  private posts: Post[] = []

  createPost(title: string, body: string, author: User): Post {
    const post = new Post(String(this.posts.length + 1), title, body, author)
    this.posts.push(post)
    return post
  }

  listPosts(): string[] {
    return this.posts.map(formatPost)
  }
}
```

`src/services/index.ts`:
```typescript
export { UserService } from './user-service'
export { PostService } from './post-service'
```

`src/index.ts`:
```typescript
export { User, Post } from './models'
export { UserService, PostService } from './services'
export { login, validateToken } from './auth'
export { validateEmail, formatUser, formatPost } from './utils'
```

`tests/services/user-service.test.ts`:
```typescript
import { UserService } from '../../src/services/user-service'

const service = new UserService()
const user = service.createUser('Test', 'test@example.com')
console.log(user.getDisplayName())
```

- [ ] **Step 4: Verify fixture parses correctly**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/parser/src/integration/full-pipeline.test.ts`
Expected: Existing tests still pass (they use small-ts-repo)

- [ ] **Step 5: Commit**

```bash
git add tests/fixtures/repositories/medium-ts-repo/
git commit -m "test: add medium-ts-repo fixture with deeper tier hierarchy"
```

---

### Task 4: Build GroupHierarchy from IVMGraph

**Files:**
- Create: `packages/parser/src/ivm/hierarchy-builder.ts`
- Create: `packages/parser/src/ivm/hierarchy-builder.test.ts`

- [ ] **Step 1: Write failing test — builds hierarchy from simple graph**

```typescript
// packages/parser/src/ivm/hierarchy-builder.test.ts
import { describe, it, expect } from 'vitest'
import { buildGroupHierarchy } from './hierarchy-builder'
import { buildGraph } from '@diagrambuilder/core'
import { SemanticTier } from '@diagrambuilder/core'
import type { IVMGraph } from '@diagrambuilder/core'

function createMinimalGraph(): IVMGraph {
  // A graph with:
  // - 1 file node (tier 3)
  // - 1 class node with parentId = file (tier 4)
  // - 1 method node with parentId = class (tier 5)
  // - 1 contains edge file→class
  // - 1 contains edge class→method
  return buildGraph({
    nodes: [
      { id: 'file:src/index.ts', type: 'file', metadata: { label: 'index.ts', path: 'src/index.ts' } },
      { id: 'class:User', type: 'class', parentId: 'file:src/index.ts', metadata: { label: 'User', path: 'src/index.ts' } },
      { id: 'method:User.getName', type: 'method', parentId: 'class:User', metadata: { label: 'getName', path: 'src/index.ts' } },
    ],
    edges: [
      { source: 'file:src/index.ts', target: 'class:User', type: 'contains' },
      { source: 'class:User', target: 'method:User.getName', type: 'contains' },
    ],
    metadata: { name: 'test', rootPath: '/test' },
  })
}

describe('buildGroupHierarchy', () => {
  it('creates a root group at Repository tier', () => {
    const graph = createMinimalGraph()
    const hierarchy = buildGroupHierarchy(graph)

    expect(hierarchy.root.tier).toBe(SemanticTier.Repository)
    expect(hierarchy.root.children.length).toBeGreaterThan(0)
  })

  it('assigns every node to exactly one group', () => {
    const graph = createMinimalGraph()
    const hierarchy = buildGroupHierarchy(graph)

    const allNodeIds = collectAllNodeIds(hierarchy.root)
    const graphNodeIds = graph.nodes.map((n) => n.id)

    expect(allNodeIds.sort()).toEqual(graphNodeIds.sort())
  })

  it('counts nodes per tier correctly', () => {
    const graph = createMinimalGraph()
    const hierarchy = buildGroupHierarchy(graph)

    expect(hierarchy.tierCount[SemanticTier.File]).toBe(1)
    expect(hierarchy.tierCount[SemanticTier.Symbol]).toBe(1)
    expect(hierarchy.tierCount[SemanticTier.Detail]).toBe(1)
  })
})

function collectAllNodeIds(group: import('./hierarchy-builder').GroupNode): string[] {
  const ids = [...group.nodeIds]
  for (const child of group.children) {
    ids.push(...collectAllNodeIds(child))
  }
  return ids
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/parser/src/ivm/hierarchy-builder.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement buildGroupHierarchy**

```typescript
// packages/parser/src/ivm/hierarchy-builder.ts
import type { IVMGraph, IVMNode, IVMEdge, EdgeType } from '@diagrambuilder/core'
import {
  SemanticTier,
  NODE_TYPE_TO_TIER,
  AGGREGATABLE_EDGE_TYPES,
  type GroupNode,
  type GroupHierarchy,
  type AggregatedEdge,
} from '@diagrambuilder/core'

export type { GroupNode, GroupHierarchy, AggregatedEdge }

export function buildGroupHierarchy(graph: IVMGraph): GroupHierarchy {
  // Step 1: Assign each node to its tier
  const nodesByTier = groupNodesByTier(graph.nodes)

  // Step 2: Build group tree using parentId relationships
  const root = buildGroupTree(graph, nodesByTier)

  // Step 3: Compute aggregated edges for each tier
  const edgesByTier = computeAggregatedEdges(graph, root)

  // Step 4: Count nodes per tier
  const tierCount = countNodesByTier(nodesByTier)

  return { root, tierCount, edgesByTier }
}

function groupNodesByTier(nodes: IVMNode[]): Map<SemanticTier, IVMNode[]> {
  const map = new Map<SemanticTier, IVMNode[]>()
  for (const tier of Object.values(SemanticTier).filter((v) => typeof v === 'number') as SemanticTier[]) {
    map.set(tier, [])
  }
  for (const node of nodes) {
    const tier = NODE_TYPE_TO_TIER[node.type]
    map.get(tier)!.push(node)
  }
  return map
}

function buildGroupTree(graph: IVMGraph, nodesByTier: Map<SemanticTier, IVMNode[]>): GroupNode {
  // Build a map of nodeId → parentId from the graph
  const parentMap = new Map<string, string>()
  for (const node of graph.nodes) {
    if (node.parentId) {
      parentMap.set(node.id, node.parentId)
    }
  }

  // Build a map of nodeId → node for tier lookup
  const nodeMap = new Map<string, IVMNode>()
  for (const node of graph.nodes) {
    nodeMap.set(node.id, node)
  }

  // Group nodes by their path prefix to create directory-based groups
  const fileNodes = nodesByTier.get(SemanticTier.File) || []
  const dirGroups = new Map<string, string[]>()

  for (const fileNode of fileNodes) {
    const path = fileNode.metadata.path || ''
    const dir = path.substring(0, path.lastIndexOf('/')) || '.'
    if (!dirGroups.has(dir)) dirGroups.set(dir, [])
    dirGroups.get(dir)!.push(fileNode.id)
  }

  // Build module-level groups from directories
  const moduleChildren: GroupNode[] = []
  for (const [dir, fileIds] of dirGroups) {
    // For each file in this directory, collect its child symbols and details
    const fileChildren: GroupNode[] = fileIds.map((fileId) => {
      const childSymbols = graph.nodes.filter(
        (n) => n.parentId === fileId && NODE_TYPE_TO_TIER[n.type] >= SemanticTier.Symbol
      )
      const symbolChildren: GroupNode[] = childSymbols
        .filter((s) => NODE_TYPE_TO_TIER[s.type] === SemanticTier.Symbol)
        .map((symbol) => {
          const details = graph.nodes.filter(
            (n) => n.parentId === symbol.id && NODE_TYPE_TO_TIER[n.type] === SemanticTier.Detail
          )
          return {
            id: `group:${symbol.id}`,
            label: symbol.metadata.label,
            tier: SemanticTier.Symbol,
            nodeIds: [symbol.id],
            children: details.length > 0
              ? [{
                  id: `group:${symbol.id}:details`,
                  label: `${symbol.metadata.label} details`,
                  tier: SemanticTier.Detail,
                  nodeIds: details.map((d) => d.id),
                  children: [],
                }]
              : [],
          }
        })

      // Detail nodes directly under this file (not under a symbol)
      const directDetails = graph.nodes.filter(
        (n) =>
          n.parentId === fileId &&
          NODE_TYPE_TO_TIER[n.type] === SemanticTier.Detail
      )
      if (directDetails.length > 0) {
        symbolChildren.push({
          id: `group:${fileId}:details`,
          label: 'details',
          tier: SemanticTier.Detail,
          nodeIds: directDetails.map((d) => d.id),
          children: [],
        })
      }

      return {
        id: `group:${fileId}`,
        label: nodeMap.get(fileId)?.metadata.label || fileId,
        tier: SemanticTier.File,
        nodeIds: [fileId],
        children: symbolChildren,
      }
    })

    moduleChildren.push({
      id: `group:module:${dir}`,
      label: dir.split('/').pop() || dir,
      tier: SemanticTier.Module,
      nodeIds: [],
      children: fileChildren,
    })
  }

  // Package level — for now, single package wrapping all modules
  const packageGroup: GroupNode = {
    id: `group:package:${graph.metadata.name}`,
    label: graph.metadata.name,
    tier: SemanticTier.Package,
    nodeIds: [],
    children: moduleChildren,
  }

  // Repository root
  const repoNodes = nodesByTier.get(SemanticTier.Repository) || []
  const root: GroupNode = {
    id: `group:repo:${graph.metadata.name}`,
    label: graph.metadata.name,
    tier: SemanticTier.Repository,
    nodeIds: repoNodes.map((n) => n.id),
    children: [packageGroup],
  }

  return root
}

function computeAggregatedEdges(
  graph: IVMGraph,
  root: GroupNode
): Record<SemanticTier, AggregatedEdge[]> {
  const result = {} as Record<SemanticTier, AggregatedEdge[]>
  for (const tier of Object.values(SemanticTier).filter((v) => typeof v === 'number') as SemanticTier[]) {
    result[tier] = []
  }

  // Build a map: nodeId → groupId at each tier
  const nodeToGroupByTier = new Map<SemanticTier, Map<string, string>>()
  for (const tier of Object.values(SemanticTier).filter((v) => typeof v === 'number') as SemanticTier[]) {
    nodeToGroupByTier.set(tier, new Map())
  }
  assignNodeGroups(root, nodeToGroupByTier)

  // Filter to aggregatable edges only
  const aggrEdges = graph.edges.filter((e) =>
    AGGREGATABLE_EDGE_TYPES.includes(e.type)
  )

  // For each tier, compute aggregated edges
  for (const tier of Object.values(SemanticTier).filter((v) => typeof v === 'number') as SemanticTier[]) {
    const nodeToGroup = nodeToGroupByTier.get(tier)!
    const edgeMap = new Map<string, AggregatedEdge>()

    for (const edge of aggrEdges) {
      const sourceGroup = nodeToGroup.get(edge.source)
      const targetGroup = nodeToGroup.get(edge.target)

      if (!sourceGroup || !targetGroup || sourceGroup === targetGroup) continue

      const key = `${sourceGroup}→${targetGroup}`
      if (!edgeMap.has(key)) {
        edgeMap.set(key, {
          sourceGroupId: sourceGroup,
          targetGroupId: targetGroup,
          breakdown: {},
          totalWeight: 0,
        })
      }
      const agg = edgeMap.get(key)!
      agg.breakdown[edge.type] = (agg.breakdown[edge.type] || 0) + 1
      agg.totalWeight += 1
    }

    result[tier] = Array.from(edgeMap.values())
  }

  return result
}

function assignNodeGroups(
  group: GroupNode,
  nodeToGroupByTier: Map<SemanticTier, Map<string, string>>
): void {
  // At this group's tier and all tiers above, this group's nodes belong to this group
  // At tiers below, they belong to child groups
  const allNodeIds = collectAllNodeIdsFromGroup(group)

  for (const tier of Object.values(SemanticTier).filter((v) => typeof v === 'number') as SemanticTier[]) {
    const map = nodeToGroupByTier.get(tier)!
    if (tier <= group.tier) {
      // At this tier or above, all nodes map to this group
      for (const nodeId of allNodeIds) {
        map.set(nodeId, group.id)
      }
    }
  }

  // Recurse into children — they will overwrite mappings at their own tier level
  for (const child of group.children) {
    assignNodeGroups(child, nodeToGroupByTier)
  }
}

function collectAllNodeIdsFromGroup(group: GroupNode): string[] {
  const ids = [...group.nodeIds]
  for (const child of group.children) {
    ids.push(...collectAllNodeIdsFromGroup(child))
  }
  return ids
}

function countNodesByTier(
  nodesByTier: Map<SemanticTier, IVMNode[]>
): Record<SemanticTier, number> {
  const result = {} as Record<SemanticTier, number>
  for (const tier of Object.values(SemanticTier).filter((v) => typeof v === 'number') as SemanticTier[]) {
    result[tier] = nodesByTier.get(tier)?.length || 0
  }
  return result
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/parser/src/ivm/hierarchy-builder.test.ts`
Expected: PASS

- [ ] **Step 5: Write additional tests — edge aggregation**

Add to `hierarchy-builder.test.ts`:

```typescript
describe('edge aggregation', () => {
  it('aggregates cross-group edges with type breakdown', () => {
    const graph = buildGraph({
      nodes: [
        { id: 'file:src/a.ts', type: 'file', metadata: { label: 'a.ts', path: 'src/a.ts' } },
        { id: 'file:src/b.ts', type: 'file', metadata: { label: 'b.ts', path: 'src/b.ts' } },
        { id: 'class:A', type: 'class', parentId: 'file:src/a.ts', metadata: { label: 'A', path: 'src/a.ts' } },
        { id: 'class:B', type: 'class', parentId: 'file:src/b.ts', metadata: { label: 'B', path: 'src/b.ts' } },
      ],
      edges: [
        { source: 'file:src/a.ts', target: 'class:A', type: 'contains' },
        { source: 'file:src/b.ts', target: 'class:B', type: 'contains' },
        { source: 'file:src/a.ts', target: 'file:src/b.ts', type: 'imports' },
        { source: 'class:A', target: 'class:B', type: 'calls' },
        { source: 'class:A', target: 'class:B', type: 'calls' },
      ],
      metadata: { name: 'test', rootPath: '/test' },
    })

    const hierarchy = buildGroupHierarchy(graph)

    // At File tier, a.ts→b.ts should have aggregated edges
    const fileTierEdges = hierarchy.edgesByTier[SemanticTier.File]
    expect(fileTierEdges.length).toBeGreaterThan(0)

    // Should have imports + calls merged
    const edge = fileTierEdges.find(
      (e) => e.sourceGroupId.includes('a.ts') && e.targetGroupId.includes('b.ts')
    )
    expect(edge).toBeDefined()
    expect(edge!.totalWeight).toBeGreaterThanOrEqual(3) // 1 import + 2 calls
  })

  it('excludes contains edges from aggregation', () => {
    const graph = buildGraph({
      nodes: [
        { id: 'file:src/a.ts', type: 'file', metadata: { label: 'a.ts', path: 'src/a.ts' } },
        { id: 'class:A', type: 'class', parentId: 'file:src/a.ts', metadata: { label: 'A', path: 'src/a.ts' } },
      ],
      edges: [
        { source: 'file:src/a.ts', target: 'class:A', type: 'contains' },
      ],
      metadata: { name: 'test', rootPath: '/test' },
    })

    const hierarchy = buildGroupHierarchy(graph)

    // No aggregated edges should exist — the only edge is 'contains'
    for (const tier of Object.values(SemanticTier).filter((v) => typeof v === 'number') as SemanticTier[]) {
      expect(hierarchy.edgesByTier[tier]).toEqual([])
    }
  })

  it('hides internal edges when nodes are in the same group', () => {
    const graph = buildGraph({
      nodes: [
        { id: 'file:src/a.ts', type: 'file', metadata: { label: 'a.ts', path: 'src/a.ts' } },
        { id: 'class:A', type: 'class', parentId: 'file:src/a.ts', metadata: { label: 'A', path: 'src/a.ts' } },
        { id: 'class:B', type: 'class', parentId: 'file:src/a.ts', metadata: { label: 'B', path: 'src/a.ts' } },
      ],
      edges: [
        { source: 'file:src/a.ts', target: 'class:A', type: 'contains' },
        { source: 'file:src/a.ts', target: 'class:B', type: 'contains' },
        { source: 'class:A', target: 'class:B', type: 'calls' },
      ],
      metadata: { name: 'test', rootPath: '/test' },
    })

    const hierarchy = buildGroupHierarchy(graph)

    // At File tier, A→B call is internal to the file group — should not appear
    const fileTierEdges = hierarchy.edgesByTier[SemanticTier.File]
    expect(fileTierEdges).toEqual([])
  })
})
```

- [ ] **Step 6: Run all hierarchy tests**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/parser/src/ivm/hierarchy-builder.test.ts`
Expected: All PASS

- [ ] **Step 7: Commit**

```bash
git add packages/parser/src/ivm/hierarchy-builder.ts packages/parser/src/ivm/hierarchy-builder.test.ts
git commit -m "feat(parser): add buildGroupHierarchy — groups IVM nodes by semantic tier"
```

---

### Task 5: Add buildParseResult orchestrator

**Files:**
- Create: `packages/parser/src/ivm/build-parse-result.ts`
- Create: `packages/parser/src/ivm/build-parse-result.test.ts`
- Modify: `packages/parser/src/index.ts` (add exports)

- [ ] **Step 1: Write failing test**

```typescript
// packages/parser/src/ivm/build-parse-result.test.ts
import { describe, it, expect } from 'vitest'
import { buildParseResult } from './build-parse-result'
import { convertToIVM } from './ivm-converter'
import { buildDependencyGraph } from '../graph/graph-builder'
import { loadRepository } from '../repository/repository-loader'
import { SemanticTier } from '@diagrambuilder/core'
import path from 'path'

const FIXTURE_PATH = path.resolve(__dirname, '../../../../tests/fixtures/repositories/medium-ts-repo')

describe('buildParseResult', () => {
  it('produces graph, hierarchy, and tiers', async () => {
    const context = await loadRepository(FIXTURE_PATH)
    const depGraph = await buildDependencyGraph(context)
    const ivmGraph = convertToIVM(depGraph, context, {})

    const result = buildParseResult(ivmGraph)

    expect(result.graph).toBe(ivmGraph)
    expect(result.hierarchy).toBeDefined()
    expect(result.hierarchy.root.tier).toBe(SemanticTier.Repository)
    expect(result.tiers).toBeDefined()
    expect(result.tiers[SemanticTier.Detail]).toBeDefined()
  })

  it('tier Detail equals the full graph node/edge count', async () => {
    const context = await loadRepository(FIXTURE_PATH)
    const depGraph = await buildDependencyGraph(context)
    const ivmGraph = convertToIVM(depGraph, context, {})

    const result = buildParseResult(ivmGraph)

    expect(result.tiers[SemanticTier.Detail].nodes.length).toBe(ivmGraph.nodes.length)
    expect(result.tiers[SemanticTier.Detail].edges.length).toBe(ivmGraph.edges.length)
  })

  it('higher tiers have fewer nodes than lower tiers', async () => {
    const context = await loadRepository(FIXTURE_PATH)
    const depGraph = await buildDependencyGraph(context)
    const ivmGraph = convertToIVM(depGraph, context, {})

    const result = buildParseResult(ivmGraph)

    const fileTierNodes = result.tiers[SemanticTier.File].nodes.length
    const symbolTierNodes = result.tiers[SemanticTier.Symbol].nodes.length
    const detailTierNodes = result.tiers[SemanticTier.Detail].nodes.length

    expect(fileTierNodes).toBeLessThanOrEqual(symbolTierNodes)
    expect(symbolTierNodes).toBeLessThanOrEqual(detailTierNodes)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/parser/src/ivm/build-parse-result.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement buildParseResult (stub — tiers delegated to Phase 2)**

```typescript
// packages/parser/src/ivm/build-parse-result.ts
import type { IVMGraph } from '@diagrambuilder/core'
import { SemanticTier, type ParseResult } from '@diagrambuilder/core'
import { buildGroupHierarchy } from './hierarchy-builder'

export function buildParseResult(graph: IVMGraph): ParseResult {
  const hierarchy = buildGroupHierarchy(graph)

  // Phase 1: tier Detail is the full graph; other tiers are stubs
  // Phase 2 will implement full tier materialization
  const tiers = {} as Record<SemanticTier, IVMGraph>
  for (const tier of Object.values(SemanticTier).filter((v) => typeof v === 'number') as SemanticTier[]) {
    // For now, all tiers return the full graph
    // Phase 2 will replace this with materialized views
    tiers[tier] = graph
  }

  return { graph, hierarchy, tiers }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/parser/src/ivm/build-parse-result.test.ts`
Expected: PASS (the "higher tiers have fewer nodes" test may need adjustment if stubs return same graph — update assertion to be `<=` which passes when equal)

- [ ] **Step 5: Export from parser index**

In `packages/parser/src/index.ts`, add:

```typescript
export { buildParseResult } from './ivm/build-parse-result'
export { buildGroupHierarchy } from './ivm/hierarchy-builder'
```

- [ ] **Step 6: Run full parser test suite**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/parser/`
Expected: All pass

- [ ] **Step 7: Commit**

```bash
git add packages/parser/src/ivm/build-parse-result.ts packages/parser/src/ivm/build-parse-result.test.ts packages/parser/src/index.ts
git commit -m "feat(parser): add buildParseResult orchestrator with hierarchy and stub tiers"
```

---

## Chunk 2: Phase 2 — Tier Materialization

### Task 6: Implement tier materializer

**Files:**
- Create: `packages/parser/src/ivm/tier-materializer.ts`
- Create: `packages/parser/src/ivm/tier-materializer.test.ts`

- [ ] **Step 1: Write failing test — materialize File tier**

```typescript
// packages/parser/src/ivm/tier-materializer.test.ts
import { describe, it, expect } from 'vitest'
import { materializeTier } from './tier-materializer'
import { buildGroupHierarchy } from './hierarchy-builder'
import { buildGraph, SemanticTier } from '@diagrambuilder/core'
import type { IVMGraph } from '@diagrambuilder/core'

function createMultiFileGraph(): IVMGraph {
  return buildGraph({
    nodes: [
      { id: 'file:src/a.ts', type: 'file', metadata: { label: 'a.ts', path: 'src/a.ts' } },
      { id: 'file:src/b.ts', type: 'file', metadata: { label: 'b.ts', path: 'src/b.ts' } },
      { id: 'class:A', type: 'class', parentId: 'file:src/a.ts', metadata: { label: 'A', path: 'src/a.ts' } },
      { id: 'class:B', type: 'class', parentId: 'file:src/b.ts', metadata: { label: 'B', path: 'src/b.ts' } },
      { id: 'method:A.foo', type: 'method', parentId: 'class:A', metadata: { label: 'foo', path: 'src/a.ts' } },
      { id: 'method:B.bar', type: 'method', parentId: 'class:B', metadata: { label: 'bar', path: 'src/b.ts' } },
    ],
    edges: [
      { source: 'file:src/a.ts', target: 'class:A', type: 'contains' },
      { source: 'file:src/b.ts', target: 'class:B', type: 'contains' },
      { source: 'class:A', target: 'method:A.foo', type: 'contains' },
      { source: 'class:B', target: 'method:B.bar', type: 'contains' },
      { source: 'file:src/a.ts', target: 'file:src/b.ts', type: 'imports' },
      { source: 'class:A', target: 'class:B', type: 'calls' },
      { source: 'method:A.foo', target: 'method:B.bar', type: 'calls' },
    ],
    metadata: { name: 'test', rootPath: '/test' },
  })
}

describe('materializeTier', () => {
  it('Detail tier returns all nodes and edges', () => {
    const graph = createMultiFileGraph()
    const hierarchy = buildGroupHierarchy(graph)
    const view = materializeTier(graph, hierarchy, SemanticTier.Detail)

    expect(view.nodes.length).toBe(graph.nodes.length)
    expect(view.edges.length).toBe(graph.edges.length)
  })

  it('File tier collapses classes and methods into files', () => {
    const graph = createMultiFileGraph()
    const hierarchy = buildGroupHierarchy(graph)
    const view = materializeTier(graph, hierarchy, SemanticTier.File)

    // Should have file nodes only (+ any group nodes for higher tiers)
    const fileNodes = view.nodes.filter((n) => n.type === 'file')
    expect(fileNodes.length).toBe(2)

    // Should NOT have class or method nodes
    const classNodes = view.nodes.filter((n) => n.type === 'class')
    const methodNodes = view.nodes.filter((n) => n.type === 'method')
    expect(classNodes.length).toBe(0)
    expect(methodNodes.length).toBe(0)
  })

  it('File tier merges cross-file edges with type breakdown in metadata', () => {
    const graph = createMultiFileGraph()
    const hierarchy = buildGroupHierarchy(graph)
    const view = materializeTier(graph, hierarchy, SemanticTier.File)

    // Should have aggregated edges between the two files
    const edges = view.edges.filter(
      (e) => e.source.includes('a.ts') && e.target.includes('b.ts')
    )
    expect(edges.length).toBeGreaterThan(0)

    // Edge should carry weight/breakdown in metadata
    const edge = edges[0]
    expect(edge.metadata.properties?.totalWeight).toBeGreaterThan(0)
    expect(edge.metadata.properties?.breakdown).toBeDefined()
  })

  it('Module tier collapses files into directory groups', () => {
    const graph = createMultiFileGraph()
    const hierarchy = buildGroupHierarchy(graph)
    const view = materializeTier(graph, hierarchy, SemanticTier.Module)

    // All nodes in src/ should collapse into a single module group node
    // No individual file nodes should appear
    const fileNodes = view.nodes.filter((n) => n.type === 'file')
    expect(fileNodes.length).toBe(0)

    // Should have a module/directory group node
    const moduleNodes = view.nodes.filter(
      (n) => n.type === 'module' || n.type === 'directory'
    )
    expect(moduleNodes.length).toBeGreaterThan(0)
  })

  it('produces a valid IVMGraph with metadata', () => {
    const graph = createMultiFileGraph()
    const hierarchy = buildGroupHierarchy(graph)
    const view = materializeTier(graph, hierarchy, SemanticTier.File)

    expect(view.metadata).toBeDefined()
    expect(view.metadata.name).toBeDefined()
    expect(view.bounds).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/parser/src/ivm/tier-materializer.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement materializeTier**

```typescript
// packages/parser/src/ivm/tier-materializer.ts
import type { IVMGraph, IVMNode, IVMEdge, NodeType, EdgeType } from '@diagrambuilder/core'
import {
  SemanticTier,
  NODE_TYPE_TO_TIER,
  type GroupNode,
  type GroupHierarchy,
  type AggregatedEdge,
  createDefaultPosition,
} from '@diagrambuilder/core'

const TIER_TO_NODE_TYPE: Record<SemanticTier, NodeType> = {
  [SemanticTier.Repository]: 'repository',
  [SemanticTier.Package]: 'package',
  [SemanticTier.Module]: 'module',
  [SemanticTier.File]: 'file',
  [SemanticTier.Symbol]: 'class',
  [SemanticTier.Detail]: 'method',
}

export function materializeTier(
  fullGraph: IVMGraph,
  hierarchy: GroupHierarchy,
  tier: SemanticTier
): IVMGraph {
  // Detail tier is the full graph
  if (tier === SemanticTier.Detail) {
    return fullGraph
  }

  // Collect visible nodes: nodes at or above the target tier
  const visibleNodes: IVMNode[] = []
  const groupNodeMap = new Map<string, IVMNode>() // groupId → synthetic IVM node

  collectVisibleNodes(hierarchy.root, tier, fullGraph, visibleNodes, groupNodeMap)

  // Get aggregated edges for this tier
  const aggregatedEdges = hierarchy.edgesByTier[tier] || []

  // Convert aggregated edges to IVM edges
  const visibleEdges: IVMEdge[] = aggregatedEdges.map((aggEdge, index) => ({
    id: `agg-edge:${tier}:${index}`,
    source: resolveNodeId(aggEdge.sourceGroupId, groupNodeMap, visibleNodes),
    target: resolveNodeId(aggEdge.targetGroupId, groupNodeMap, visibleNodes),
    type: dominantEdgeType(aggEdge.breakdown),
    lod: tier as number as any, // SemanticTier values match LODLevel
    metadata: {
      label: `${aggEdge.totalWeight} connections`,
      weight: aggEdge.totalWeight,
      properties: {
        totalWeight: aggEdge.totalWeight,
        breakdown: aggEdge.breakdown,
        aggregated: true,
      },
    },
  }))

  // Filter out edges with unresolved source/target
  const validEdges = visibleEdges.filter(
    (e) => e.source !== '' && e.target !== ''
  )

  return {
    nodes: visibleNodes,
    edges: validEdges,
    metadata: {
      ...fullGraph.metadata,
      name: `${fullGraph.metadata.name} (tier ${tier})`,
      stats: {
        totalNodes: visibleNodes.length,
        totalEdges: validEdges.length,
        nodesByType: countByType(visibleNodes),
        edgesByType: countEdgesByType(validEdges),
      },
    },
    bounds: {
      min: createDefaultPosition(),
      max: createDefaultPosition(),
    },
  }
}

function collectVisibleNodes(
  group: GroupNode,
  targetTier: SemanticTier,
  fullGraph: IVMGraph,
  visibleNodes: IVMNode[],
  groupNodeMap: Map<string, IVMNode>
): void {
  if (group.tier === targetTier) {
    // This group becomes a visible node
    // If it directly contains IVM nodes, use the first one as representative
    if (group.nodeIds.length > 0) {
      const representative = fullGraph.nodes.find((n) => n.id === group.nodeIds[0])
      if (representative) {
        visibleNodes.push(representative)
        groupNodeMap.set(group.id, representative)
      }
    } else {
      // Synthetic group node (e.g., a directory with no direct node)
      const syntheticNode: IVMNode = {
        id: group.id,
        type: TIER_TO_NODE_TYPE[group.tier],
        position: createDefaultPosition(),
        lod: group.tier as number as any,
        metadata: {
          label: group.label,
          path: group.id,
          properties: {
            isGroup: true,
            childCount: collectAllNodeCount(group),
          },
        },
      }
      visibleNodes.push(syntheticNode)
      groupNodeMap.set(group.id, syntheticNode)
    }
    return
  }

  if (group.tier < targetTier) {
    // This group is above the target tier — include it and recurse
    if (group.nodeIds.length > 0) {
      for (const nodeId of group.nodeIds) {
        const node = fullGraph.nodes.find((n) => n.id === nodeId)
        if (node) visibleNodes.push(node)
      }
    }
    for (const child of group.children) {
      collectVisibleNodes(child, targetTier, fullGraph, visibleNodes, groupNodeMap)
    }
  }

  // group.tier > targetTier: this group is below target — skip (collapsed)
}

function resolveNodeId(
  groupId: string,
  groupNodeMap: Map<string, IVMNode>,
  visibleNodes: IVMNode[]
): string {
  const mapped = groupNodeMap.get(groupId)
  if (mapped) return mapped.id

  // Try to find a visible node with this id
  const direct = visibleNodes.find((n) => n.id === groupId)
  if (direct) return direct.id

  return ''
}

function dominantEdgeType(breakdown: Partial<Record<EdgeType, number>>): EdgeType {
  let maxType: EdgeType = 'depends_on'
  let maxCount = 0
  for (const [type, count] of Object.entries(breakdown)) {
    if (count && count > maxCount) {
      maxCount = count
      maxType = type as EdgeType
    }
  }
  return maxType
}

function collectAllNodeCount(group: GroupNode): number {
  let count = group.nodeIds.length
  for (const child of group.children) {
    count += collectAllNodeCount(child)
  }
  return count
}

function countByType(nodes: IVMNode[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const node of nodes) {
    counts[node.type] = (counts[node.type] || 0) + 1
  }
  return counts as Record<NodeType, number>
}

function countEdgesByType(edges: IVMEdge[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const edge of edges) {
    counts[edge.type] = (counts[edge.type] || 0) + 1
  }
  return counts as Record<EdgeType, number>
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/parser/src/ivm/tier-materializer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/parser/src/ivm/tier-materializer.ts packages/parser/src/ivm/tier-materializer.test.ts
git commit -m "feat(parser): add tier materializer — produces valid IVMGraph per semantic tier"
```

---

### Task 7: Wire materializer into buildParseResult

**Files:**
- Modify: `packages/parser/src/ivm/build-parse-result.ts`
- Modify: `packages/parser/src/ivm/build-parse-result.test.ts`

- [ ] **Step 1: Update buildParseResult to use materializeTier**

Replace the stub tier loop in `build-parse-result.ts` with:

```typescript
import { materializeTier } from './tier-materializer'

// Replace the stub loop with:
const tiers = {} as Record<SemanticTier, IVMGraph>
for (const tier of Object.values(SemanticTier).filter((v) => typeof v === 'number') as SemanticTier[]) {
  tiers[tier] = materializeTier(graph, hierarchy, tier)
}
```

- [ ] **Step 2: Update tests to verify real tier materialization**

Update `build-parse-result.test.ts` — the "higher tiers have fewer nodes" test should now actually verify different counts:

```typescript
it('higher tiers have strictly fewer nodes than Detail', async () => {
  const context = await loadRepository(FIXTURE_PATH)
  const depGraph = await buildDependencyGraph(context)
  const ivmGraph = convertToIVM(depGraph, context, {})

  const result = buildParseResult(ivmGraph)

  const detailNodes = result.tiers[SemanticTier.Detail].nodes.length
  const fileNodes = result.tiers[SemanticTier.File].nodes.length

  expect(fileNodes).toBeLessThan(detailNodes)
})
```

- [ ] **Step 3: Run tests**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/parser/src/ivm/build-parse-result.test.ts`
Expected: PASS

- [ ] **Step 4: Run full parser suite**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/parser/`
Expected: All pass

- [ ] **Step 5: Commit**

```bash
git add packages/parser/src/ivm/build-parse-result.ts packages/parser/src/ivm/build-parse-result.test.ts
git commit -m "feat(parser): wire tier materializer into buildParseResult"
```

---

## Chunk 3: Phase 3 — View Resolver

### Task 8: Define view resolver types

**Files:**
- Create: `packages/core/src/views/types.ts`
- Create: `packages/core/src/views/index.ts`
- Modify: `packages/core/src/index.ts`

- [ ] **Step 1: Create view types**

```typescript
// packages/core/src/views/types.ts
import type { IVMGraph, EdgeType, NodeType } from '../ivm/types.js'
import type { SemanticTier, ParseResult } from '../ivm/semantic-tier.js'

export interface ViewResolver {
  getTier(tier: SemanticTier): IVMGraph
  getView(config: ViewConfig): ViewResult
}

export interface ViewConfig {
  baseTier: SemanticTier
  focalNodeId?: string
  falloffHops?: number
  expand?: string[]
  collapse?: string[]
  constraints?: ViewConstraints
}

export interface ViewConstraints {
  maxNodes?: number
  maxEdges?: number
  allowedEdgeTypes?: EdgeType[]
  allowedNodeTypes?: NodeType[]
}

export interface ViewResult {
  graph: IVMGraph
  pruningReport?: PruningReport
}

export interface PruningReport {
  edgesDropped: number
  edgesDroppedByType: Partial<Record<EdgeType, number>>
  groupsCollapsed: string[]
  constraintsSatisfied: boolean
}
```

- [ ] **Step 2: Create index**

```typescript
// packages/core/src/views/index.ts
export * from './types.js'
export { createViewResolver } from './view-resolver.js'
```

- [ ] **Step 3: Add export to core index**

In `packages/core/src/index.ts`, add: `export * from './views/index.js'`

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/views/types.ts packages/core/src/views/index.ts packages/core/src/index.ts
git commit -m "feat(core): add ViewResolver types and ViewConfig interfaces"
```

---

### Task 9: Implement ViewResolver with getTier and basic getView

**Files:**
- Create: `packages/core/src/views/view-resolver.ts`
- Create: `packages/core/src/views/view-resolver.test.ts`

- [ ] **Step 1: Write failing test for getTier**

```typescript
// packages/core/src/views/view-resolver.test.ts
import { describe, it, expect } from 'vitest'
import { createViewResolver } from './view-resolver'
import { SemanticTier } from '../ivm/semantic-tier'
import { buildGraph } from '../ivm/builder'
import type { ParseResult } from '../ivm/semantic-tier'
import type { IVMGraph } from '../ivm/types'

function createMockParseResult(): ParseResult {
  const fullGraph = buildGraph({
    nodes: [
      { id: 'file:a.ts', type: 'file', metadata: { label: 'a.ts', path: 'a.ts' } },
      { id: 'file:b.ts', type: 'file', metadata: { label: 'b.ts', path: 'b.ts' } },
      { id: 'class:A', type: 'class', parentId: 'file:a.ts', metadata: { label: 'A', path: 'a.ts' } },
    ],
    edges: [
      { source: 'file:a.ts', target: 'file:b.ts', type: 'imports' },
      { source: 'file:a.ts', target: 'class:A', type: 'contains' },
    ],
    metadata: { name: 'test', rootPath: '/test' },
  })

  const fileTierGraph = buildGraph({
    nodes: [
      { id: 'file:a.ts', type: 'file', metadata: { label: 'a.ts', path: 'a.ts' } },
      { id: 'file:b.ts', type: 'file', metadata: { label: 'b.ts', path: 'b.ts' } },
    ],
    edges: [
      { source: 'file:a.ts', target: 'file:b.ts', type: 'imports' },
    ],
    metadata: { name: 'test (tier 3)', rootPath: '/test' },
  })

  const tiers = {} as Record<SemanticTier, IVMGraph>
  for (const t of [0, 1, 2, 3, 4, 5] as SemanticTier[]) {
    tiers[t] = t === SemanticTier.File ? fileTierGraph : fullGraph
  }

  return {
    graph: fullGraph,
    hierarchy: {
      root: { id: 'root', label: 'test', tier: SemanticTier.Repository, nodeIds: [], children: [] },
      tierCount: { 0: 0, 1: 0, 2: 0, 3: 2, 4: 1, 5: 0 } as Record<SemanticTier, number>,
      edgesByTier: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [] } as Record<SemanticTier, any[]>,
    },
    tiers,
  }
}

describe('createViewResolver', () => {
  it('getTier returns the pre-computed tier graph', () => {
    const result = createMockParseResult()
    const resolver = createViewResolver(result)

    const fileView = resolver.getTier(SemanticTier.File)
    expect(fileView.nodes.length).toBe(2) // only file nodes
  })

  it('getView with baseTier returns the same as getTier when no other options', () => {
    const result = createMockParseResult()
    const resolver = createViewResolver(result)

    const view = resolver.getView({ baseTier: SemanticTier.File })
    expect(view.graph.nodes.length).toBe(2)
    expect(view.pruningReport).toBeUndefined()
  })

  it('getView with maxEdges constraint prunes and reports', () => {
    const result = createMockParseResult()
    const resolver = createViewResolver(result)

    const view = resolver.getView({
      baseTier: SemanticTier.Detail,
      constraints: { maxEdges: 1 },
    })

    expect(view.graph.edges.length).toBeLessThanOrEqual(1)
    expect(view.pruningReport).toBeDefined()
    expect(view.pruningReport!.constraintsSatisfied).toBe(true)
  })

  it('getView with allowedEdgeTypes filters edges', () => {
    const result = createMockParseResult()
    const resolver = createViewResolver(result)

    const view = resolver.getView({
      baseTier: SemanticTier.Detail,
      constraints: { allowedEdgeTypes: ['imports'] },
    })

    for (const edge of view.graph.edges) {
      expect(edge.type).toBe('imports')
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/core/src/views/view-resolver.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement createViewResolver**

```typescript
// packages/core/src/views/view-resolver.ts
import type { IVMGraph, IVMEdge, EdgeType } from '../ivm/types.js'
import type { ParseResult, SemanticTier } from '../ivm/semantic-tier.js'
import type { ViewResolver, ViewConfig, ViewResult, PruningReport } from './types.js'

export function createViewResolver(parseResult: ParseResult): ViewResolver {
  const cache = new Map<string, ViewResult>()

  return {
    getTier(tier: SemanticTier): IVMGraph {
      return parseResult.tiers[tier]
    },

    getView(config: ViewConfig): ViewResult {
      const cacheKey = JSON.stringify(config)
      if (cache.has(cacheKey)) return cache.get(cacheKey)!

      let graph = parseResult.tiers[config.baseTier]

      // Apply edge type filter
      if (config.constraints?.allowedEdgeTypes) {
        graph = filterEdgeTypes(graph, config.constraints.allowedEdgeTypes)
      }

      // Apply node type filter
      if (config.constraints?.allowedNodeTypes) {
        graph = filterNodeTypes(graph, config.constraints.allowedNodeTypes)
      }

      // Apply edge budget
      let pruningReport: PruningReport | undefined
      if (config.constraints?.maxEdges && graph.edges.length > config.constraints.maxEdges) {
        const pruned = pruneEdgesToBudget(graph, config.constraints.maxEdges)
        graph = pruned.graph
        pruningReport = pruned.report
      } else if (config.constraints?.maxNodes && graph.nodes.length > config.constraints.maxNodes) {
        // Node budget — drop least-connected nodes
        const pruned = pruneNodesToBudget(graph, config.constraints.maxNodes)
        graph = pruned.graph
        pruningReport = pruned.report
      }

      const result: ViewResult = { graph, pruningReport }
      cache.set(cacheKey, result)
      return result
    },
  }
}

function filterEdgeTypes(graph: IVMGraph, allowedTypes: EdgeType[]): IVMGraph {
  const filteredEdges = graph.edges.filter((e) => allowedTypes.includes(e.type))
  return {
    ...graph,
    edges: filteredEdges,
    metadata: {
      ...graph.metadata,
      stats: {
        ...graph.metadata.stats,
        totalEdges: filteredEdges.length,
      },
    },
  }
}

function filterNodeTypes(graph: IVMGraph, allowedTypes: string[]): IVMGraph {
  const filteredNodes = graph.nodes.filter((n) => allowedTypes.includes(n.type))
  const nodeIds = new Set(filteredNodes.map((n) => n.id))
  const filteredEdges = graph.edges.filter(
    (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
  )
  return {
    ...graph,
    nodes: filteredNodes,
    edges: filteredEdges,
    metadata: {
      ...graph.metadata,
      stats: {
        ...graph.metadata.stats,
        totalNodes: filteredNodes.length,
        totalEdges: filteredEdges.length,
      },
    },
  }
}

function pruneEdgesToBudget(
  graph: IVMGraph,
  maxEdges: number
): { graph: IVMGraph; report: PruningReport } {
  // Sort edges by weight (aggregated edges have weight in metadata)
  // Keep highest-weight edges, drop lowest-weight
  const sorted = [...graph.edges].sort((a, b) => {
    const weightA = (a.metadata.properties?.totalWeight as number) || 1
    const weightB = (b.metadata.properties?.totalWeight as number) || 1
    return weightB - weightA // descending — keep highest weight
  })

  const kept = sorted.slice(0, maxEdges)
  const dropped = sorted.slice(maxEdges)

  const droppedByType: Partial<Record<EdgeType, number>> = {}
  for (const edge of dropped) {
    droppedByType[edge.type] = (droppedByType[edge.type] || 0) + 1
  }

  return {
    graph: {
      ...graph,
      edges: kept,
      metadata: {
        ...graph.metadata,
        stats: { ...graph.metadata.stats, totalEdges: kept.length },
      },
    },
    report: {
      edgesDropped: dropped.length,
      edgesDroppedByType: droppedByType,
      groupsCollapsed: [],
      constraintsSatisfied: true,
    },
  }
}

function pruneNodesToBudget(
  graph: IVMGraph,
  maxNodes: number
): { graph: IVMGraph; report: PruningReport } {
  // Keep nodes with most connections
  const connectionCount = new Map<string, number>()
  for (const node of graph.nodes) {
    connectionCount.set(node.id, 0)
  }
  for (const edge of graph.edges) {
    connectionCount.set(edge.source, (connectionCount.get(edge.source) || 0) + 1)
    connectionCount.set(edge.target, (connectionCount.get(edge.target) || 0) + 1)
  }

  const sorted = [...graph.nodes].sort((a, b) => {
    return (connectionCount.get(b.id) || 0) - (connectionCount.get(a.id) || 0)
  })

  const kept = sorted.slice(0, maxNodes)
  const keptIds = new Set(kept.map((n) => n.id))
  const keptEdges = graph.edges.filter(
    (e) => keptIds.has(e.source) && keptIds.has(e.target)
  )

  return {
    graph: {
      ...graph,
      nodes: kept,
      edges: keptEdges,
      metadata: {
        ...graph.metadata,
        stats: {
          ...graph.metadata.stats,
          totalNodes: kept.length,
          totalEdges: keptEdges.length,
        },
      },
    },
    report: {
      edgesDropped: graph.edges.length - keptEdges.length,
      edgesDroppedByType: {},
      groupsCollapsed: [],
      constraintsSatisfied: true,
    },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/core/src/views/view-resolver.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/views/view-resolver.ts packages/core/src/views/view-resolver.test.ts
git commit -m "feat(core): implement ViewResolver with getTier, getView, and basic constraint pruning"
```

---

### Task 10: Implement focal-point pruning

**Files:**
- Create: `packages/core/src/views/focal-pruner.ts`
- Create: `packages/core/src/views/focal-pruner.test.ts`
- Modify: `packages/core/src/views/view-resolver.ts` (integrate focal pruner)
- Modify: `packages/core/src/views/index.ts` (export)

- [ ] **Step 1: Write failing test for focal pruning**

```typescript
// packages/core/src/views/focal-pruner.test.ts
import { describe, it, expect } from 'vitest'
import { applyFocalPruning } from './focal-pruner'
import { buildGraph } from '../ivm/builder'
import type { IVMGraph } from '../ivm/types'

function createStarGraph(): IVMGraph {
  // Center node connected to 5 outer nodes, each with further connections
  return buildGraph({
    nodes: [
      { id: 'center', type: 'file', metadata: { label: 'center', path: 'center.ts' } },
      { id: 'hop1-a', type: 'file', metadata: { label: 'hop1-a', path: 'hop1-a.ts' } },
      { id: 'hop1-b', type: 'file', metadata: { label: 'hop1-b', path: 'hop1-b.ts' } },
      { id: 'hop2-a', type: 'file', metadata: { label: 'hop2-a', path: 'hop2-a.ts' } },
      { id: 'hop2-b', type: 'file', metadata: { label: 'hop2-b', path: 'hop2-b.ts' } },
      { id: 'hop3-a', type: 'file', metadata: { label: 'hop3-a', path: 'hop3-a.ts' } },
    ],
    edges: [
      { source: 'center', target: 'hop1-a', type: 'imports' },
      { source: 'center', target: 'hop1-b', type: 'imports' },
      { source: 'hop1-a', target: 'hop2-a', type: 'imports' },
      { source: 'hop1-b', target: 'hop2-b', type: 'imports' },
      { source: 'hop2-a', target: 'hop3-a', type: 'imports' },
    ],
    metadata: { name: 'test', rootPath: '/test' },
  })
}

describe('applyFocalPruning', () => {
  it('keeps focal node and all nodes within falloffHops', () => {
    const graph = createStarGraph()
    const result = applyFocalPruning(graph, 'center', 2, { maxEdges: 100 })

    const nodeIds = result.graph.nodes.map((n) => n.id)
    expect(nodeIds).toContain('center')
    expect(nodeIds).toContain('hop1-a')
    expect(nodeIds).toContain('hop1-b')
    expect(nodeIds).toContain('hop2-a')
    expect(nodeIds).toContain('hop2-b')
  })

  it('drops nodes beyond falloffHops when over budget', () => {
    const graph = createStarGraph()
    const result = applyFocalPruning(graph, 'center', 1, { maxEdges: 2 })

    const nodeIds = result.graph.nodes.map((n) => n.id)
    expect(nodeIds).toContain('center')
    // hop1 nodes should be kept (within 1 hop)
    // hop2+ nodes may be dropped to meet budget
    expect(result.graph.edges.length).toBeLessThanOrEqual(2)
  })

  it('returns pruning report', () => {
    const graph = createStarGraph()
    const result = applyFocalPruning(graph, 'center', 1, { maxEdges: 2 })

    expect(result.report).toBeDefined()
    expect(result.report.edgesDropped).toBeGreaterThanOrEqual(0)
    expect(result.report.constraintsSatisfied).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/core/src/views/focal-pruner.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement applyFocalPruning**

```typescript
// packages/core/src/views/focal-pruner.ts
import type { IVMGraph, IVMEdge, EdgeType } from '../ivm/types.js'
import type { ViewConstraints, PruningReport } from './types.js'

interface FocalPruningResult {
  graph: IVMGraph
  report: PruningReport
}

export function applyFocalPruning(
  graph: IVMGraph,
  focalNodeId: string,
  falloffHops: number,
  constraints: ViewConstraints
): FocalPruningResult {
  // Build adjacency map
  const adjacency = new Map<string, Set<string>>()
  for (const node of graph.nodes) {
    adjacency.set(node.id, new Set())
  }
  for (const edge of graph.edges) {
    adjacency.get(edge.source)?.add(edge.target)
    adjacency.get(edge.target)?.add(edge.source)
  }

  // BFS from focal node to assign hop distances
  const hopDistance = new Map<string, number>()
  const queue: [string, number][] = [[focalNodeId, 0]]
  hopDistance.set(focalNodeId, 0)

  while (queue.length > 0) {
    const [nodeId, dist] = queue.shift()!
    const neighbors = adjacency.get(nodeId) || new Set()
    for (const neighbor of neighbors) {
      if (!hopDistance.has(neighbor)) {
        hopDistance.set(neighbor, dist + 1)
        queue.push([neighbor, dist + 1])
      }
    }
  }

  // Keep all nodes within falloffHops
  let keptNodeIds = new Set<string>()
  for (const [nodeId, dist] of hopDistance) {
    if (dist <= falloffHops) {
      keptNodeIds.add(nodeId)
    }
  }

  // If still over budget, progressively shrink the radius
  let currentHops = falloffHops
  let keptEdges = graph.edges.filter(
    (e) => keptNodeIds.has(e.source) && keptNodeIds.has(e.target)
  )

  while (
    constraints.maxEdges &&
    keptEdges.length > constraints.maxEdges &&
    currentHops > 0
  ) {
    currentHops--
    keptNodeIds = new Set<string>()
    for (const [nodeId, dist] of hopDistance) {
      if (dist <= currentHops) {
        keptNodeIds.add(nodeId)
      }
    }
    keptEdges = graph.edges.filter(
      (e) => keptNodeIds.has(e.source) && keptNodeIds.has(e.target)
    )
  }

  // If still over after reducing to just the focal node, prune by weight
  if (constraints.maxEdges && keptEdges.length > constraints.maxEdges) {
    const sorted = [...keptEdges].sort((a, b) => {
      const wA = (a.metadata.properties?.totalWeight as number) || 1
      const wB = (b.metadata.properties?.totalWeight as number) || 1
      return wB - wA
    })
    keptEdges = sorted.slice(0, constraints.maxEdges)
    // Also keep only nodes that have edges
    const edgeNodeIds = new Set<string>()
    edgeNodeIds.add(focalNodeId)
    for (const e of keptEdges) {
      edgeNodeIds.add(e.source)
      edgeNodeIds.add(e.target)
    }
    keptNodeIds = edgeNodeIds
  }

  const keptNodes = graph.nodes.filter((n) => keptNodeIds.has(n.id))
  const droppedEdgeCount = graph.edges.length - keptEdges.length

  const droppedByType: Partial<Record<EdgeType, number>> = {}
  const droppedEdges = graph.edges.filter(
    (e) => !keptEdges.includes(e)
  )
  for (const edge of droppedEdges) {
    droppedByType[edge.type] = (droppedByType[edge.type] || 0) + 1
  }

  return {
    graph: {
      ...graph,
      nodes: keptNodes,
      edges: keptEdges,
      metadata: {
        ...graph.metadata,
        stats: {
          ...graph.metadata.stats,
          totalNodes: keptNodes.length,
          totalEdges: keptEdges.length,
        },
      },
    },
    report: {
      edgesDropped: droppedEdgeCount,
      edgesDroppedByType: droppedByType,
      groupsCollapsed: [],
      constraintsSatisfied:
        (!constraints.maxEdges || keptEdges.length <= constraints.maxEdges) &&
        (!constraints.maxNodes || keptNodes.length <= constraints.maxNodes),
    },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/core/src/views/focal-pruner.test.ts`
Expected: PASS

- [ ] **Step 5: Integrate focal pruner into view-resolver.ts**

In `view-resolver.ts`, update the `getView` method to check for `focalNodeId`:

```typescript
import { applyFocalPruning } from './focal-pruner.js'

// Inside getView, before edge budget pruning:
if (config.focalNodeId && config.constraints) {
  const focalResult = applyFocalPruning(
    graph,
    config.focalNodeId,
    config.falloffHops ?? 2,
    config.constraints
  )
  graph = focalResult.graph
  pruningReport = focalResult.report
}
```

- [ ] **Step 6: Update view-resolver tests for focal pruning**

Add test to `view-resolver.test.ts`:

```typescript
it('getView with focalNodeId applies focal pruning', () => {
  const result = createMockParseResult()
  const resolver = createViewResolver(result)

  const view = resolver.getView({
    baseTier: SemanticTier.Detail,
    focalNodeId: 'file:a.ts',
    falloffHops: 1,
    constraints: { maxEdges: 1 },
  })

  expect(view.graph.edges.length).toBeLessThanOrEqual(1)
  expect(view.pruningReport).toBeDefined()
})
```

- [ ] **Step 7: Run all view tests**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/core/src/views/`
Expected: All PASS

- [ ] **Step 8: Update views/index.ts exports**

Add: `export { applyFocalPruning } from './focal-pruner.js'`

- [ ] **Step 9: Commit**

```bash
git add packages/core/src/views/focal-pruner.ts packages/core/src/views/focal-pruner.test.ts packages/core/src/views/view-resolver.ts packages/core/src/views/view-resolver.test.ts packages/core/src/views/index.ts
git commit -m "feat(core): add focal-point pruning with progressive distance-based detail degradation"
```

---

### Task 10b: Implement expand/collapse in getView

**Files:**
- Modify: `packages/core/src/views/view-resolver.ts`
- Modify: `packages/core/src/views/view-resolver.test.ts`

- [ ] **Step 1: Write failing test for expand**

Add to `view-resolver.test.ts`:

```typescript
describe('expand/collapse', () => {
  it('getView with expand shows children of expanded group', () => {
    const result = createMockParseResult()
    const resolver = createViewResolver(result)

    // Expanding a group at File tier should show its Symbol-tier children
    const view = resolver.getView({
      baseTier: SemanticTier.File,
      expand: ['group:file:a.ts'], // expand file a.ts to show its classes
    })

    // Should include the class node from inside a.ts
    const classNodes = view.graph.nodes.filter((n) => n.type === 'class')
    expect(classNodes.length).toBeGreaterThan(0)
  })

  it('getView with collapse hides children of collapsed group', () => {
    const result = createMockParseResult()
    const resolver = createViewResolver(result)

    const view = resolver.getView({
      baseTier: SemanticTier.Symbol,
      collapse: ['group:file:b.ts'], // collapse b.ts — hide its symbols
    })

    // b.ts symbols should be collapsed into the file node
    // The file node should still be present
    const bNodes = view.graph.nodes.filter((n) => n.id.includes('b.ts'))
    expect(bNodes.length).toBeLessThanOrEqual(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/core/src/views/view-resolver.test.ts`
Expected: FAIL — expand/collapse not implemented

- [ ] **Step 3: Implement expand/collapse in getView**

In `view-resolver.ts`, update the `getView` method. After getting the base tier graph, process expand/collapse:

```typescript
// After getting base tier graph:
if (config.expand?.length || config.collapse?.length) {
  graph = applyExpandCollapse(
    graph,
    parseResult,
    config.baseTier,
    config.expand || [],
    config.collapse || []
  )
}
```

Add the helper function:

```typescript
function applyExpandCollapse(
  baseGraph: IVMGraph,
  parseResult: ParseResult,
  baseTier: SemanticTier,
  expandGroupIds: string[],
  collapseGroupIds: string[]
): IVMGraph {
  let nodes = [...baseGraph.nodes]
  let edges = [...baseGraph.edges]

  // Expand: for each expanded group, replace the group node with its children
  // from the next tier down
  for (const groupId of expandGroupIds) {
    const group = findGroup(parseResult.hierarchy.root, groupId)
    if (!group) continue

    // Add child nodes from the full graph
    const childNodeIds = new Set<string>()
    for (const child of group.children) {
      for (const nodeId of child.nodeIds) {
        childNodeIds.add(nodeId)
      }
      // Also add the child group's direct nodes
      if (child.nodeIds.length === 0) {
        // Synthetic group — add as a group node
        // (handled by tier materializer pattern)
      }
    }

    // Add child nodes from full graph
    const childNodes = parseResult.graph.nodes.filter((n) => childNodeIds.has(n.id))
    nodes = nodes.concat(childNodes)

    // Add edges between newly visible nodes
    const allVisibleIds = new Set(nodes.map((n) => n.id))
    const newEdges = parseResult.graph.edges.filter(
      (e) =>
        allVisibleIds.has(e.source) &&
        allVisibleIds.has(e.target) &&
        !edges.find((existing) => existing.id === e.id)
    )
    edges = edges.concat(newEdges)
  }

  // Collapse: remove children of collapsed groups, keep only the group node
  for (const groupId of collapseGroupIds) {
    const group = findGroup(parseResult.hierarchy.root, groupId)
    if (!group) continue

    const childNodeIds = new Set(collectAllNodeIdsFromGroup(group))
    // Keep the group's own representative node, remove children
    const representativeId = group.nodeIds[0]
    nodes = nodes.filter((n) => !childNodeIds.has(n.id) || n.id === representativeId)

    const nodeIdSet = new Set(nodes.map((n) => n.id))
    edges = edges.filter((e) => nodeIdSet.has(e.source) && nodeIdSet.has(e.target))
  }

  return {
    ...baseGraph,
    nodes,
    edges,
    metadata: {
      ...baseGraph.metadata,
      stats: {
        ...baseGraph.metadata.stats,
        totalNodes: nodes.length,
        totalEdges: edges.length,
      },
    },
  }
}

function findGroup(root: GroupNode, targetId: string): GroupNode | null {
  if (root.id === targetId) return root
  for (const child of root.children) {
    const found = findGroup(child, targetId)
    if (found) return found
  }
  return null
}

function collectAllNodeIdsFromGroup(group: GroupNode): string[] {
  const ids = [...group.nodeIds]
  for (const child of group.children) {
    ids.push(...collectAllNodeIdsFromGroup(child))
  }
  return ids
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/core/src/views/view-resolver.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/views/view-resolver.ts packages/core/src/views/view-resolver.test.ts
git commit -m "feat(core): implement expand/collapse in ViewResolver.getView"
```

---

## Chunk 4: Phase 4 — Exporter Integration

### Task 11: Add exportWithView convenience function

**Files:**
- Create: `packages/core/src/views/export-with-view.ts`
- Create: `packages/core/src/views/export-with-view.test.ts`
- Modify: `packages/core/src/views/index.ts`

- [ ] **Step 1: Write failing test**

```typescript
// packages/core/src/views/export-with-view.test.ts
import { describe, it, expect } from 'vitest'
import { exportWithView } from './export-with-view'
import { SemanticTier } from '../ivm/semantic-tier'
import { buildGraph } from '../ivm/builder'
import type { ParseResult } from '../ivm/semantic-tier'
import type { IVMGraph } from '../ivm/types'
import type { Exporter, ExportResult, BaseExportOptions } from '../exporters/types'

// Minimal mock exporter that returns node/edge counts
const mockExporter: Exporter<BaseExportOptions> = {
  id: 'mock',
  name: 'Mock',
  extension: '.mock',
  mimeType: 'text/plain',
  export(graph: IVMGraph): ExportResult {
    return {
      content: `nodes:${graph.nodes.length},edges:${graph.edges.length}`,
      mimeType: 'text/plain',
      extension: '.mock',
      stats: {
        nodeCount: graph.nodes.length,
        edgeCount: graph.edges.length,
        duration: 0,
        size: 0,
      },
    }
  },
  validateOptions(): string[] {
    return []
  },
}

function createTestParseResult(): ParseResult {
  const fullGraph = buildGraph({
    nodes: [
      { id: 'file:a.ts', type: 'file', metadata: { label: 'a.ts', path: 'a.ts' } },
      { id: 'file:b.ts', type: 'file', metadata: { label: 'b.ts', path: 'b.ts' } },
      { id: 'class:A', type: 'class', parentId: 'file:a.ts', metadata: { label: 'A', path: 'a.ts' } },
    ],
    edges: [
      { source: 'file:a.ts', target: 'file:b.ts', type: 'imports' },
      { source: 'file:a.ts', target: 'class:A', type: 'contains' },
    ],
    metadata: { name: 'test', rootPath: '/test' },
  })

  const fileTier = buildGraph({
    nodes: [
      { id: 'file:a.ts', type: 'file', metadata: { label: 'a.ts', path: 'a.ts' } },
      { id: 'file:b.ts', type: 'file', metadata: { label: 'b.ts', path: 'b.ts' } },
    ],
    edges: [
      { source: 'file:a.ts', target: 'file:b.ts', type: 'imports' },
    ],
    metadata: { name: 'test (tier 3)', rootPath: '/test' },
  })

  const tiers = {} as Record<SemanticTier, IVMGraph>
  for (const t of [0, 1, 2, 3, 4, 5] as SemanticTier[]) {
    tiers[t] = t === SemanticTier.File ? fileTier : fullGraph
  }

  return {
    graph: fullGraph,
    hierarchy: {
      root: { id: 'root', label: 'test', tier: SemanticTier.Repository, nodeIds: [], children: [] },
      tierCount: { 0: 0, 1: 0, 2: 0, 3: 2, 4: 1, 5: 0 } as Record<SemanticTier, number>,
      edgesByTier: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [] } as Record<SemanticTier, any[]>,
    },
    tiers,
  }
}

describe('exportWithView', () => {
  it('exports using specified tier', () => {
    const result = exportWithView(createTestParseResult(), mockExporter, {
      tier: SemanticTier.File,
    })
    expect(result.stats.nodeCount).toBe(2) // file tier has 2 nodes
  })

  it('defaults to Detail tier when no tier specified', () => {
    const result = exportWithView(createTestParseResult(), mockExporter)
    expect(result.stats.nodeCount).toBe(3) // full graph has 3 nodes
  })

  it('passes export options through to exporter', () => {
    const result = exportWithView(createTestParseResult(), mockExporter, {
      tier: SemanticTier.File,
      exportOptions: { includeMetadata: true },
    })
    expect(result).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/core/src/views/export-with-view.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement exportWithView**

```typescript
// packages/core/src/views/export-with-view.ts
import type { Exporter, ExportResult, BaseExportOptions } from '../exporters/types.js'
import type { ParseResult, SemanticTier } from '../ivm/semantic-tier.js'
import type { ViewConfig } from './types.js'
import { createViewResolver } from './view-resolver.js'

export function exportWithView(
  parseResult: ParseResult,
  exporter: Exporter<any>,
  options?: {
    tier?: SemanticTier
    viewConfig?: ViewConfig
    exportOptions?: BaseExportOptions
  }
): ExportResult {
  const resolver = createViewResolver(parseResult)

  let graph
  if (options?.viewConfig) {
    const viewResult = resolver.getView(options.viewConfig)
    graph = viewResult.graph
  } else if (options?.tier !== undefined) {
    graph = resolver.getTier(options.tier)
  } else {
    // Default: full detail
    graph = parseResult.graph
  }

  return exporter.export(graph, options?.exportOptions)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/core/src/views/export-with-view.test.ts`
Expected: PASS

- [ ] **Step 5: Update views/index.ts**

Add: `export { exportWithView } from './export-with-view.js'`

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/views/export-with-view.ts packages/core/src/views/export-with-view.test.ts packages/core/src/views/index.ts
git commit -m "feat(core): add exportWithView convenience function for tier-aware exports"
```

---

### Task 12: Verify exporters work with tier-produced IVMGraphs

**Files:**
- Create: `packages/core/src/views/__tests__/exporter-integration.test.ts`

- [ ] **Step 1: Write integration test that runs all exporters against tier views**

```typescript
// packages/core/src/views/__tests__/exporter-integration.test.ts
import { describe, it, expect } from 'vitest'
import { exportWithView } from '../export-with-view'
import { SemanticTier } from '../../ivm/semantic-tier'
import { MermaidExporter } from '../../exporters/mermaid'
import { PlantUMLExporter } from '../../exporters/plantuml'
import { DrawioExporter } from '../../exporters/drawio'
import { SVGExporter } from '../../exporters/svg'
import { GLTFExporter } from '../../exporters/gltf'
import { buildGraph } from '../../ivm/builder'
import type { ParseResult } from '../../ivm/semantic-tier'
import type { IVMGraph } from '../../ivm/types'

function createRichParseResult(): ParseResult {
  const graph = buildGraph({
    nodes: [
      { id: 'file:src/a.ts', type: 'file', metadata: { label: 'a.ts', path: 'src/a.ts' } },
      { id: 'file:src/b.ts', type: 'file', metadata: { label: 'b.ts', path: 'src/b.ts' } },
      { id: 'class:A', type: 'class', parentId: 'file:src/a.ts', metadata: { label: 'A', path: 'src/a.ts' } },
      { id: 'class:B', type: 'class', parentId: 'file:src/b.ts', metadata: { label: 'B', path: 'src/b.ts' } },
    ],
    edges: [
      { source: 'file:src/a.ts', target: 'file:src/b.ts', type: 'imports' },
      { source: 'file:src/a.ts', target: 'class:A', type: 'contains' },
      { source: 'file:src/b.ts', target: 'class:B', type: 'contains' },
      { source: 'class:A', target: 'class:B', type: 'extends' },
    ],
    metadata: { name: 'test-project', rootPath: '/test' },
  })

  // Simplified: all tiers return full graph for this integration test
  // In real usage, buildParseResult produces proper tier views
  const tiers = {} as Record<SemanticTier, IVMGraph>
  for (const t of [0, 1, 2, 3, 4, 5] as SemanticTier[]) {
    tiers[t] = graph
  }

  return {
    graph,
    hierarchy: {
      root: { id: 'root', label: 'test', tier: SemanticTier.Repository, nodeIds: [], children: [] },
      tierCount: { 0: 0, 1: 0, 2: 0, 3: 2, 4: 2, 5: 0 } as Record<SemanticTier, number>,
      edgesByTier: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [] } as Record<SemanticTier, any[]>,
    },
    tiers,
  }
}

describe('exporter integration with tiered views', () => {
  const parseResult = createRichParseResult()

  it('Mermaid produces valid output from File tier', () => {
    const mermaid = new MermaidExporter()
    const result = exportWithView(parseResult, mermaid, {
      tier: SemanticTier.File,
    })
    expect(result.content).toContain('graph')
    expect(result.mimeType).toBe('text/x-mermaid')
  })

  it('PlantUML produces valid output from File tier', () => {
    const plantuml = new PlantUMLExporter()
    const result = exportWithView(parseResult, plantuml, {
      tier: SemanticTier.File,
    })
    expect(result.content).toContain('@startuml')
    expect(result.mimeType).toBe('text/plain')
  })

  it('Draw.io produces valid output from File tier', () => {
    const drawio = new DrawioExporter()
    const result = exportWithView(parseResult, drawio, {
      tier: SemanticTier.File,
    })
    expect(result.content).toContain('mxfile')
  })

  it('SVG produces valid output from File tier', () => {
    const svg = new SVGExporter()
    const result = exportWithView(parseResult, svg, {
      tier: SemanticTier.File,
    })
    expect(result.content).toContain('<svg')
  })

  it('GLTF produces valid output from Detail tier', () => {
    const gltf = new GLTFExporter()
    const result = exportWithView(parseResult, gltf, {
      tier: SemanticTier.Detail,
    })
    expect(result.content).toContain('asset')
  })

  it('PNG produces valid output from File tier', () => {
    const png = new PNGExporter()
    const result = exportWithView(parseResult, png, {
      tier: SemanticTier.File,
    })
    expect(result).toBeDefined()
    expect(result.mimeType).toBe('image/png')
  })
})
```

Add the PNG import at the top: `import { PNGExporter } from '../../exporters/png'`

- [ ] **Step 2: Run test**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/core/src/views/__tests__/exporter-integration.test.ts`
Expected: All PASS — exporters accept any valid IVMGraph

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/views/__tests__/exporter-integration.test.ts
git commit -m "test(core): add exporter integration tests with tiered views"
```

---

### Task 12b: Add default tier-per-exporter mapping

**Files:**
- Modify: `packages/core/src/views/export-with-view.ts`
- Modify: `packages/core/src/views/export-with-view.test.ts`

- [ ] **Step 1: Write failing test for default tiers**

Add to `export-with-view.test.ts`:

```typescript
describe('default tiers per exporter', () => {
  it('uses File tier by default for Mermaid flowchart exporter', () => {
    const result = exportWithView(createTestParseResult(), mockExporterWithId('mermaid'))
    // Should use File tier (2 nodes) not Detail (3 nodes)
    expect(result.stats.nodeCount).toBe(2)
  })

  it('uses Detail tier by default for GLTF exporter', () => {
    const result = exportWithView(createTestParseResult(), mockExporterWithId('gltf'))
    // Should use Detail tier (3 nodes)
    expect(result.stats.nodeCount).toBe(3)
  })
})

function mockExporterWithId(id: string): Exporter<BaseExportOptions> {
  return { ...mockExporter, id }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/core/src/views/export-with-view.test.ts`
Expected: FAIL — no default tier logic yet

- [ ] **Step 3: Implement default tier mapping**

In `export-with-view.ts`, add the default tier map and update the fallback:

```typescript
import { SemanticTier } from '../ivm/semantic-tier.js'

const DEFAULT_EXPORTER_TIERS: Record<string, SemanticTier> = {
  mermaid: SemanticTier.File,
  'mermaid-class': SemanticTier.Symbol,
  plantuml: SemanticTier.File,
  'plantuml-class': SemanticTier.Symbol,
  drawio: SemanticTier.File,
  svg: SemanticTier.File,
  png: SemanticTier.File,
  gltf: SemanticTier.Detail,
}

// Update the fallback in exportWithView:
// Replace: graph = parseResult.graph
// With:
const defaultTier = DEFAULT_EXPORTER_TIERS[exporter.id]
if (defaultTier !== undefined) {
  graph = resolver.getTier(defaultTier)
} else {
  graph = parseResult.graph
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/core/src/views/export-with-view.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/views/export-with-view.ts packages/core/src/views/export-with-view.test.ts
git commit -m "feat(core): add default semantic tier per exporter"
```

---

### Task 12c: Document Mermaid ad-hoc collapsing migration path

> **Note:** The Mermaid exporter's existing parent collapsing and edge dedup logic (lines ~280-303 in `mermaid.ts`) should be migrated to use the view resolver in a future task. For now, both systems coexist safely — the view resolver pre-simplifies the graph, and Mermaid's internal logic handles any remaining edge reduction. Full migration is deferred until the tiered system is validated in production.

**Files:**
- Create: `docs/specs/mermaid-collapsing-migration.md`

- [ ] **Step 1: Write migration notes**

```markdown
# Mermaid Collapsing Logic Migration

## Status: Deferred

The Mermaid exporter has ad-hoc parent collapsing and edge deduplication logic
(packages/core/src/exporters/mermaid.ts, lines ~280-303). This duplicates what
the ViewResolver's tier materialization now handles.

## Current State

Both systems coexist safely:
- ViewResolver pre-simplifies the graph at the requested tier
- Mermaid's internal logic further reduces edges if needed

## Migration Plan

Once the tiered view system is validated:
1. Remove `collapseToParent` logic from Mermaid exporter
2. Remove edge deduplication logic
3. Replace with ViewResolver constraint: `{ maxEdges: 1000 }`
4. Verify Mermaid output is identical before/after

## Risk

Low — the ViewResolver produces a simpler input graph, so Mermaid's collapsing
logic becomes a no-op for most cases.
```

- [ ] **Step 2: Commit**

```bash
git add docs/specs/mermaid-collapsing-migration.md
git commit -m "docs: document Mermaid collapsing logic migration path"
```

---

## Chunk 5: Phase 5 & 6 — UI Integration & Test Fixtures

### Task 13: UI integration — canvas consumes ParseResult

> **Note:** This task outlines the UI integration approach. The exact implementation will depend on the current state of the UI's data fetching layer. The key changes are:

**Files:**
- Modify: `packages/ui/src/features/canvas/store.ts` — add `parseResult` to store alongside `graph`
- Modify: `packages/ui/src/features/canvas/hooks/useCityLayout.ts` — accept view-resolved graph
- Modify: `packages/ui/src/features/canvas/hooks/useCityFiltering.ts` — simplify using view resolver

- [ ] **Step 1: Update canvas store to hold ParseResult**

In `packages/ui/src/features/canvas/store.ts`:
- Add `parseResult?: ParseResult` to the store state
- Add `setParseResult(result: ParseResult)` action
- When `parseResult` is set, also set `graph` to the File tier view for backward compatibility

- [ ] **Step 2: Create useViewResolver hook**

Create `packages/ui/src/features/canvas/hooks/useViewResolver.ts`:
- Takes `parseResult` from store
- Returns a memoized `ViewResolver` instance
- Exposes `getView` for use by other hooks

- [ ] **Step 3: Wire zoom-to-expand**

In the LOD calculator or camera controller:
- When camera zooms into a district, call `resolver.getView({ baseTier: File, expand: [groupId] })`
- Debounce view requests (200ms) to avoid rapid recomputation during smooth zoom

- [ ] **Step 4: Simplify useCityFiltering**

Replace manual node collapsing/clustering logic with calls to the view resolver. The resolver already handles:
- Node grouping by tier
- Edge aggregation
- LOD-based visibility

Keep the internal/external node separation (this is a UI concern, not a tier concern).

- [ ] **Step 5: Run UI dev server and verify visually**

Run: `cd /Users/brianmehrman/projects/diagram_builder && ./scripts/init.sh`
Navigate to `/canvas` and verify the city renders correctly with the new data flow.

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/features/canvas/store.ts packages/ui/src/features/canvas/hooks/useViewResolver.ts packages/ui/src/features/canvas/hooks/useCityLayout.ts packages/ui/src/features/canvas/hooks/useCityFiltering.ts
git commit -m "feat(ui): integrate ViewResolver into canvas — zoom-to-expand via tiered views"
```

---

### Task 14: Expand test fixtures

**Files:**
- Create: `tests/fixtures/repositories/large-ts-repo/` (stress test fixture)

- [ ] **Step 1: Create large-ts-repo for constraint satisfaction testing**

Create a fixture with:
- 5+ directories (modules)
- 20+ files
- 50+ classes/functions
- Dense cross-module imports

This doesn't need to be real code — just enough structure to generate a graph with >100 edges to test Mermaid's constraint satisfaction and focal pruning.

- [ ] **Step 2: Write constraint satisfaction integration test**

```typescript
// packages/parser/src/integration/tier-constraints.test.ts
import { describe, it, expect } from 'vitest'
import { loadRepository, buildDependencyGraph, convertToIVM } from '../index'
import { buildParseResult } from '../ivm/build-parse-result'
import { createViewResolver, SemanticTier } from '@diagrambuilder/core'
import path from 'path'

const FIXTURE = path.resolve(__dirname, '../../../../tests/fixtures/repositories/large-ts-repo')

describe('tier constraint satisfaction', () => {
  it('respects maxEdges constraint', async () => {
    const context = await loadRepository(FIXTURE)
    const depGraph = await buildDependencyGraph(context)
    const ivmGraph = convertToIVM(depGraph, context, {})
    const parseResult = buildParseResult(ivmGraph)
    const resolver = createViewResolver(parseResult)

    const view = resolver.getView({
      baseTier: SemanticTier.File,
      constraints: { maxEdges: 10 },
    })

    expect(view.graph.edges.length).toBeLessThanOrEqual(10)
    expect(view.pruningReport?.constraintsSatisfied).toBe(true)
  })

  it('focal pruning keeps center node connected', async () => {
    const context = await loadRepository(FIXTURE)
    const depGraph = await buildDependencyGraph(context)
    const ivmGraph = convertToIVM(depGraph, context, {})
    const parseResult = buildParseResult(ivmGraph)
    const resolver = createViewResolver(parseResult)

    // Pick the first file node as focal point
    const fileNode = ivmGraph.nodes.find((n) => n.type === 'file')
    if (!fileNode) return

    const view = resolver.getView({
      baseTier: SemanticTier.File,
      focalNodeId: fileNode.id,
      falloffHops: 1,
      constraints: { maxEdges: 5 },
    })

    const nodeIds = view.graph.nodes.map((n) => n.id)
    expect(nodeIds).toContain(fileNode.id)
  })
})
```

- [ ] **Step 3: Run test**

Run: `cd /Users/brianmehrman/projects/diagram_builder && npx vitest run packages/parser/src/integration/tier-constraints.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add tests/fixtures/repositories/large-ts-repo/ packages/parser/src/integration/tier-constraints.test.ts
git commit -m "test: add large-ts-repo fixture and constraint satisfaction integration tests"
```

---

## Verification Checklist

After all tasks are complete:

- [ ] `npx vitest run packages/core/` — all core tests pass
- [ ] `npx vitest run packages/parser/` — all parser tests pass
- [ ] `npx vitest run` (full suite) — no regressions
- [ ] `convertToIVM` still works unchanged for existing callers
- [ ] `buildParseResult` produces valid hierarchy and tiers
- [ ] `createViewResolver` returns correct tier views
- [ ] Focal pruning respects edge budgets
- [ ] All 6 exporters produce valid output from tier views
- [ ] UI renders correctly with ParseResult-backed data flow
