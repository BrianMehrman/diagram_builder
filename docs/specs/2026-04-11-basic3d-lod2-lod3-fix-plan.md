# Basic3D LOD 2 & 3 Blank Screen Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make LOD 2 and LOD 3 render visible nodes in the Basic3D layout for typical TypeScript codebases that only produce `file`, `function`, `class`, and `method` node types.

**Architecture:** The parser currently produces no `repository`, `package`, `namespace`, `module`, or `directory` nodes for typical TS projects. The `isNodeVisibleAtLod` helper in `basic3dShapes.ts` only shows those absent types at LOD 2/3, producing blank screens. Fix: add `'file'` to both `TOP_CONTAINER_TYPES` (LOD 2) and `CONTAINER_TYPES` (LOD 3) so file nodes appear at those zoom levels. Remove the redundant explicit `'file'` entry from `STRUCTURAL_TYPES` since it now comes in via `CONTAINER_TYPES`. Update affected tests.

**Tech Stack:** TypeScript, Vitest, @testing-library/react, React

---

## Root Cause (context for workers)

Running `npx tsx scripts/demo-exports.ts` against the `small-ts-repo` fixture confirms the parser produces only:
- `file` × 3, `function` × 3, `class` × 1, `method` × 2

`TOP_CONTAINER_TYPES = {repository, package}` — none exist → LOD 2 blank.  
`CONTAINER_TYPES = {repository, package, namespace, module, directory}` — none exist → LOD 3 blank.

`STRUCTURAL_TYPES` already includes `file` (LOD 4), so that level works.

---

## File Map

| File | Change |
|------|--------|
| `packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.ts` | Add `'file'` to `TOP_CONTAINER_TYPES` and `CONTAINER_TYPES`; remove explicit `'file'` from `STRUCTURAL_TYPES` spread (comes in via `CONTAINER_TYPES` now); update JSDoc |
| `packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.test.ts` | Update `isNodeVisibleAtLod` tests: `file` is now visible at LOD 2 and LOD 3 |
| `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.test.tsx` | Update LOD 2 and LOD 3 test cases that asserted `file` nodes are NOT rendered |

---

## Task 1: Update `isNodeVisibleAtLod` in `basic3dShapes.ts`

**Files:**
- Modify: `packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.ts`
- Test: `packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.test.ts`

- [ ] **Step 1: Write the failing tests**

Open `basic3dShapes.test.ts`. The `isNodeVisibleAtLod` describe block currently has a test group:

```ts
const TOP_CONTAINER_TYPES: NodeType[] = ['repository', 'package']
const OTHER_CONTAINER_TYPES: NodeType[] = ['namespace', 'module', 'directory']
const STRUCTURAL_ONLY_TYPES: NodeType[] = ['file', 'class', 'interface', 'type']
const LEAF_TYPES: NodeType[] = ['function', 'method', 'variable', 'enum']
```

Replace the entire `describe('isNodeVisibleAtLod', ...)` block with:

```ts
describe('isNodeVisibleAtLod', () => {
  const TOP_CONTAINER_TYPES: NodeType[] = ['repository', 'package', 'file']
  const OTHER_CONTAINER_TYPES: NodeType[] = ['namespace', 'module', 'directory']
  const CLASS_STRUCTURAL_TYPES: NodeType[] = ['class', 'interface', 'type']
  const LEAF_TYPES: NodeType[] = ['function', 'method', 'variable', 'enum']

  it('LOD 1 returns false for all node types', () => {
    const allTypes: NodeType[] = [
      ...TOP_CONTAINER_TYPES,
      ...OTHER_CONTAINER_TYPES,
      ...CLASS_STRUCTURAL_TYPES,
      ...LEAF_TYPES,
    ]
    for (const t of allTypes) {
      expect(isNodeVisibleAtLod(makeNode(t), 1), `${t} should not be visible at LOD 1`).toBe(false)
    }
  })

  it('LOD 2 returns true for top container types (repository, package, file)', () => {
    for (const t of TOP_CONTAINER_TYPES) {
      expect(isNodeVisibleAtLod(makeNode(t), 2), `${t} should be visible at LOD 2`).toBe(true)
    }
  })

  it('LOD 2 returns false for other container types (namespace, module, directory)', () => {
    for (const t of OTHER_CONTAINER_TYPES) {
      expect(isNodeVisibleAtLod(makeNode(t), 2), `${t} should NOT be visible at LOD 2`).toBe(false)
    }
  })

  it('LOD 2 returns false for class-structural and leaf types', () => {
    for (const t of [...CLASS_STRUCTURAL_TYPES, ...LEAF_TYPES]) {
      expect(isNodeVisibleAtLod(makeNode(t), 2), `${t} should NOT be visible at LOD 2`).toBe(false)
    }
  })

  it('LOD 3 returns true for all container types including file', () => {
    for (const t of [...TOP_CONTAINER_TYPES, ...OTHER_CONTAINER_TYPES]) {
      expect(isNodeVisibleAtLod(makeNode(t), 3), `${t} should be visible at LOD 3`).toBe(true)
    }
  })

  it('LOD 3 returns false for class-structural and leaf types', () => {
    for (const t of [...CLASS_STRUCTURAL_TYPES, ...LEAF_TYPES]) {
      expect(isNodeVisibleAtLod(makeNode(t), 3), `${t} should NOT be visible at LOD 3`).toBe(false)
    }
  })

  it('LOD 4 returns true for all container + structural types', () => {
    for (const t of [...TOP_CONTAINER_TYPES, ...OTHER_CONTAINER_TYPES, ...CLASS_STRUCTURAL_TYPES]) {
      expect(isNodeVisibleAtLod(makeNode(t), 4), `${t} should be visible at LOD 4`).toBe(true)
    }
  })

  it('LOD 4 returns false for leaf types', () => {
    for (const t of LEAF_TYPES) {
      expect(isNodeVisibleAtLod(makeNode(t), 4), `${t} should NOT be visible at LOD 4`).toBe(false)
    }
  })

  it('LOD 5 returns true for all node types', () => {
    const allTypes: NodeType[] = [
      ...TOP_CONTAINER_TYPES,
      ...OTHER_CONTAINER_TYPES,
      ...CLASS_STRUCTURAL_TYPES,
      ...LEAF_TYPES,
    ]
    for (const t of allTypes) {
      expect(isNodeVisibleAtLod(makeNode(t), 5), `${t} should be visible at LOD 5`).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/brianmehrman/projects/diagram_builder
npx vitest run packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.test.ts
```

Expected: FAIL — `file` is not yet in `TOP_CONTAINER_TYPES` so the LOD 2 and LOD 3 `file` assertions fail.

- [ ] **Step 3: Update `basic3dShapes.ts`**

Replace the entire `// LOD visibility` section at the bottom of `packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.ts` (lines 92–129) with:

```ts
// =============================================================================
// LOD visibility
// =============================================================================

/**
 * Top-level container types + file — visible at LOD 2 (approach).
 *
 * Includes `file` so that typical TypeScript codebases (which produce no
 * explicit repository/package nodes) still render something at LOD 2.
 */
const TOP_CONTAINER_TYPES = new Set<NodeType>(['repository', 'package', 'file'])

/**
 * All container types + file — visible at LOD 3 (district).
 * Superset of TOP_CONTAINER_TYPES.
 */
export const CONTAINER_TYPES = new Set<NodeType>([
  'repository',
  'package',
  'namespace',
  'module',
  'directory',
  'file',
])

/**
 * Container + class-structural types — visible at LOD 4 (neighborhood).
 * `file` is inherited via CONTAINER_TYPES; only class-level types added here.
 */
export const STRUCTURAL_TYPES = new Set<NodeType>([
  ...CONTAINER_TYPES,
  'class',
  'interface',
  'type',
])

/**
 * Returns true if a node should be rendered as an individual node at the given LOD level.
 *
 * LOD 1: no individual nodes (cluster layer only)
 * LOD 2: top containers + file (repository, package, file)
 * LOD 3: all container nodes (+ namespace, module, directory) + file
 * LOD 4: container + structural nodes (+ class, interface, type) — labels visible
 * LOD 5: all node types
 */
export function isNodeVisibleAtLod(node: IVMNode, lod: number): boolean {
  if (lod >= 5) return true
  if (lod === 4) return STRUCTURAL_TYPES.has(node.type)
  if (lod === 3) return CONTAINER_TYPES.has(node.type)
  if (lod === 2) return TOP_CONTAINER_TYPES.has(node.type)
  return false // LOD 1: cluster layer only
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/brianmehrman/projects/diagram_builder
git add packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.ts \
        packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.test.ts
git commit -m "fix(basic3d): include file nodes at LOD 2 and 3 — fixes blank screens on typical TS codebases"
```

---

## Task 2: Update `Basic3DView.test.tsx` for new LOD 2/3 behavior

**Files:**
- Modify: `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.test.tsx`

Three existing tests assert that `file` nodes are NOT rendered at LOD 2 and LOD 3. After the fix they ARE rendered. Update them.

- [ ] **Step 1: Run existing Basic3DView tests to see which fail**

```bash
cd /Users/brianmehrman/projects/diagram_builder
npx vitest run packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.test.tsx
```

Expected: Two tests fail:
- `"LOD 2: renders only repository and package nodes"` — `file-a` is now rendered
- `"LOD 3: renders all container nodes"` — `file-a` is now rendered

- [ ] **Step 2: Update the LOD 2 node-type test**

Find and replace the test `'LOD 2: renders only repository and package nodes'` (around line 220):

```ts
// BEFORE — delete this entire it() block:
it('LOD 2: renders only repository and package nodes', () => {
  const nodes = [
    createNode('repo', 'repository'),
    createNode('pkg', 'package'),
    createNode('mod', 'module'),
    createNode('file-a', 'file'),
    createNode('fn-a', 'function'),
  ]
  setupLayout(makeGraph(nodes))
  useCanvasStore.getState().setLodLevel(2)
  useCanvasStore.setState({ layoutState: 'ready' })

  const { getAllByTestId } = render(<Basic3DView />)
  const rendered = getAllByTestId('basic3d-node').map((el) => el.getAttribute('data-node-id'))
  expect(rendered).toContain('repo')
  expect(rendered).toContain('pkg')
  expect(rendered).not.toContain('mod')
  expect(rendered).not.toContain('file-a')
  expect(rendered).not.toContain('fn-a')
})
```

Replace with:

```ts
it('LOD 2: renders top containers and file nodes, hides other containers and leaves', () => {
  const nodes = [
    createNode('repo', 'repository'),
    createNode('pkg', 'package'),
    createNode('mod', 'module'),
    createNode('file-a', 'file'),
    createNode('fn-a', 'function'),
  ]
  setupLayout(makeGraph(nodes))
  useCanvasStore.getState().setLodLevel(2)
  useCanvasStore.setState({ layoutState: 'ready' })

  const { getAllByTestId } = render(<Basic3DView />)
  const rendered = getAllByTestId('basic3d-node').map((el) => el.getAttribute('data-node-id'))
  expect(rendered).toContain('repo')
  expect(rendered).toContain('pkg')
  expect(rendered).toContain('file-a')
  expect(rendered).not.toContain('mod')
  expect(rendered).not.toContain('fn-a')
})
```

- [ ] **Step 3: Update the LOD 3 node-type test**

Find and replace the test `'LOD 3: renders all container nodes'` (around line 264):

```ts
// BEFORE — delete this entire it() block:
it('LOD 3: renders all container nodes', () => {
  const nodes = [
    createNode('repo', 'repository'),
    createNode('mod', 'module'),
    createNode('dir', 'directory'),
    createNode('file-a', 'file'),
    createNode('fn-a', 'function'),
  ]
  setupLayout(makeGraph(nodes))
  useCanvasStore.getState().setLodLevel(3)
  useCanvasStore.setState({ layoutState: 'ready' })

  const { getAllByTestId } = render(<Basic3DView />)
  const rendered = getAllByTestId('basic3d-node').map((el) => el.getAttribute('data-node-id'))
  expect(rendered).toContain('repo')
  expect(rendered).toContain('mod')
  expect(rendered).toContain('dir')
  expect(rendered).not.toContain('file-a')
  expect(rendered).not.toContain('fn-a')
})
```

Replace with:

```ts
it('LOD 3: renders all container nodes and file nodes, hides leaf types', () => {
  const nodes = [
    createNode('repo', 'repository'),
    createNode('mod', 'module'),
    createNode('dir', 'directory'),
    createNode('file-a', 'file'),
    createNode('fn-a', 'function'),
  ]
  setupLayout(makeGraph(nodes))
  useCanvasStore.getState().setLodLevel(3)
  useCanvasStore.setState({ layoutState: 'ready' })

  const { getAllByTestId } = render(<Basic3DView />)
  const rendered = getAllByTestId('basic3d-node').map((el) => el.getAttribute('data-node-id'))
  expect(rendered).toContain('repo')
  expect(rendered).toContain('mod')
  expect(rendered).toContain('dir')
  expect(rendered).toContain('file-a')
  expect(rendered).not.toContain('fn-a')
})
```

- [ ] **Step 4: Update the `showLabel` test for LOD 2**

The test `'passes showLabel=false at LOD 2 and 3'` uses a `module` node (visible at LOD 3 but not LOD 2). After the fix, `module` is still NOT in `TOP_CONTAINER_TYPES` for LOD 2, so the LOD 2 iteration runs vacuously (zero calls). Switch to a `file` node which IS visible at both LOD 2 and LOD 3:

Find test `'passes showLabel=false at LOD 2 and 3'` (around line 420):

```ts
// BEFORE:
it('passes showLabel=false at LOD 2 and 3', () => {
  const nodes = [createNode('mod', 'module')]
  setupLayout(makeGraph(nodes))
  for (const lod of [2, 3]) {
    vi.clearAllMocks()
    useCanvasStore.getState().setLodLevel(lod)
    useCanvasStore.setState({ layoutState: 'ready' })
    render(<Basic3DView />)
    const calls = mockBasic3DNode.mock.calls
    for (const [props] of calls) {
      expect(props.showLabel, `LOD ${lod} should have showLabel=false`).toBe(false)
    }
  }
})
```

Replace with:

```ts
it('passes showLabel=false at LOD 2 and 3', () => {
  const nodes = [createNode('file-a', 'file')]
  setupLayout(makeGraph(nodes))
  for (const lod of [2, 3]) {
    vi.clearAllMocks()
    useCanvasStore.getState().setLodLevel(lod)
    useCanvasStore.setState({ layoutState: 'ready' })
    render(<Basic3DView />)
    const calls = mockBasic3DNode.mock.calls
    expect(calls.length, `LOD ${lod} should have rendered at least one node`).toBeGreaterThan(0)
    for (const [props] of calls) {
      expect(props.showLabel, `LOD ${lod} should have showLabel=false`).toBe(false)
    }
  }
})
```

- [ ] **Step 5: Run Basic3DView tests to confirm all pass**

```bash
cd /Users/brianmehrman/projects/diagram_builder
npx vitest run packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.test.tsx
```

Expected: All tests PASS.

- [ ] **Step 6: Run the full basic3d test suite**

```bash
npx vitest run packages/ui/src/features/canvas/layouts/basic3d/
```

Expected: All tests PASS.

- [ ] **Step 7: Run the full test suite for regressions**

```bash
npx vitest run
```

Expected: All tests PASS (no regressions outside basic3d/).

- [ ] **Step 8: Run type-check, lint, and format check**

```bash
cd /Users/brianmehrman/projects/diagram_builder
npm run type-check
npm run lint
npm run format:check
```

Expected: No errors on any of the three commands.

- [ ] **Step 9: Commit**

```bash
cd /Users/brianmehrman/projects/diagram_builder
git add packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.test.tsx
git commit -m "test(basic3d): update LOD 2/3 tests — file nodes now visible at those levels"
```

---

## Self-Review

**Spec coverage:**
- Root cause identified: parser produces no container-type nodes → LOD 2/3 blank ✓
- Fix: add `file` to `TOP_CONTAINER_TYPES` and `CONTAINER_TYPES` ✓
- Tests updated for `basic3dShapes.ts` (LOD 2/3 assertions) ✓
- Tests updated for `Basic3DView.test.tsx` (two node-type tests + showLabel vacuity fix) ✓
- Full CI checklist (type-check + lint + format:check + test) ✓

**Placeholder scan:** No TBD, no "fill in details", all test/implementation code is concrete.

**Type consistency:**
- `isNodeVisibleAtLod` signature unchanged: `(node: IVMNode, lod: number): boolean` ✓
- `TOP_CONTAINER_TYPES`, `CONTAINER_TYPES`, `STRUCTURAL_TYPES` all exported correctly ✓
- Test helper `makeNode` and `createNode` unchanged ✓

**Behavior table after fix:**

| LOD | Camera distance | Visible node types (small-ts-repo) | Was |
|-----|----------------|------------------------------------|-----|
| 1 | > 200 | cluster blobs only | cluster blobs only |
| 2 | 120–200 | file (3 nodes) | **blank** |
| 3 | 60–120 | file (3 nodes) | **blank** |
| 4 | 25–60 | file + class (4 nodes) | file + class (4 nodes) |
| 5 | ≤ 25 | all 9 nodes | all 9 nodes |
