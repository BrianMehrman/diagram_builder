# Basic3D LOD Grouping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce four distinct LOD levels in Basic3D so each camera zoom step reveals a new layer of node types instead of jumping from cluster blobs directly to every node.

**Architecture:** Add a pure `isNodeVisibleAtLod(node, lod)` helper to `basic3dShapes.ts` that encodes which node types are visible at each LOD. `Basic3DView` uses this helper to filter nodes and edges across four render branches (LOD 1 = clusters, LOD 2 = containers, LOD 3 = containers + structural + labels, LOD 4 = all). `Basic3DNode` gains an optional `showLabel` prop to render a name label at LOD 3+.

**Tech Stack:** React, Vitest, @testing-library/react, @react-three/drei (`Text`, `Billboard`), TypeScript

**Spec:** `docs/specs/2026-04-08-basic3d-lod-grouping-design.md`

---

## File Map

| File | Change |
|------|--------|
| `packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.ts` | Add `CONTAINER_TYPES`, `STRUCTURAL_TYPES`, `isNodeVisibleAtLod` |
| `packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.test.ts` | Add tests for `isNodeVisibleAtLod` |
| `packages/ui/src/features/canvas/layouts/basic3d/Basic3DNode.tsx` | Add optional `showLabel` prop |
| `packages/ui/src/features/canvas/layouts/basic3d/Basic3DNode.test.tsx` | Add tests for `showLabel` prop |
| `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.tsx` | Refactor to 4-branch LOD render with node + edge type filtering |
| `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.test.tsx` | Update LOD edge tests; add LOD 2 node-type filter tests |

---

## Task 1: Add `isNodeVisibleAtLod` to `basic3dShapes.ts`

**Files:**
- Modify: `packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.ts`
- Test: `packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `basic3dShapes.test.ts` (after the existing `isAbstractNode` describe block):

```ts
import {
  getShapeForType,
  getColorForType,
  isAbstractNode,
  isNodeVisibleAtLod,
  type Basic3DShape,
} from './basic3dShapes'
```

Then add:

```ts
describe('isNodeVisibleAtLod', () => {
  const CONTAINER_NODE_TYPES: NodeType[] = ['repository', 'package', 'namespace', 'module', 'directory']
  const STRUCTURAL_ONLY_TYPES: NodeType[] = ['file', 'class', 'interface', 'type']
  const LEAF_TYPES: NodeType[] = ['function', 'method', 'variable', 'enum']

  it('LOD 1 returns false for all individual node types', () => {
    for (const t of ALL_NODE_TYPES) {
      expect(isNodeVisibleAtLod(makeNode(t), 1), `${t} should not be visible at LOD 1`).toBe(false)
    }
  })

  it('LOD 2 returns true for all container types', () => {
    for (const t of CONTAINER_NODE_TYPES) {
      expect(isNodeVisibleAtLod(makeNode(t), 2), `${t} should be visible at LOD 2`).toBe(true)
    }
  })

  it('LOD 2 returns false for structural-only types', () => {
    for (const t of STRUCTURAL_ONLY_TYPES) {
      expect(isNodeVisibleAtLod(makeNode(t), 2), `${t} should not be visible at LOD 2`).toBe(false)
    }
  })

  it('LOD 2 returns false for leaf types', () => {
    for (const t of LEAF_TYPES) {
      expect(isNodeVisibleAtLod(makeNode(t), 2), `${t} should not be visible at LOD 2`).toBe(false)
    }
  })

  it('LOD 3 returns true for all container types', () => {
    for (const t of CONTAINER_NODE_TYPES) {
      expect(isNodeVisibleAtLod(makeNode(t), 3), `${t} should be visible at LOD 3`).toBe(true)
    }
  })

  it('LOD 3 returns true for structural-only types', () => {
    for (const t of STRUCTURAL_ONLY_TYPES) {
      expect(isNodeVisibleAtLod(makeNode(t), 3), `${t} should be visible at LOD 3`).toBe(true)
    }
  })

  it('LOD 3 returns false for leaf types', () => {
    for (const t of LEAF_TYPES) {
      expect(isNodeVisibleAtLod(makeNode(t), 3), `${t} should not be visible at LOD 3`).toBe(false)
    }
  })

  it('LOD 4 returns true for all node types', () => {
    for (const t of ALL_NODE_TYPES) {
      expect(isNodeVisibleAtLod(makeNode(t), 4), `${t} should be visible at LOD 4`).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/brianmehrman/projects/diagram_builder
npx vitest run packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.test.ts
```

Expected: FAIL — `isNodeVisibleAtLod is not a function`

- [ ] **Step 3: Implement `isNodeVisibleAtLod` in `basic3dShapes.ts`**

Add after the existing `isAbstractNode` export (after line 87):

```ts
// =============================================================================
// LOD visibility
// =============================================================================

const CONTAINER_TYPES = new Set<NodeType>([
  'repository',
  'package',
  'namespace',
  'module',
  'directory',
])

const STRUCTURAL_TYPES = new Set<NodeType>([
  ...CONTAINER_TYPES,
  'file',
  'class',
  'interface',
  'type',
])

/**
 * Returns true if a node should be rendered as an individual node at the given LOD level.
 *
 * LOD 1: no individual nodes (cluster layer only)
 * LOD 2: container types only (repository, package, namespace, module, directory)
 * LOD 3: container + structural types (+ file, class, interface, type)
 * LOD 4: all types
 */
export function isNodeVisibleAtLod(node: IVMNode, lod: number): boolean {
  if (lod >= 4) return true
  if (lod === 3) return STRUCTURAL_TYPES.has(node.type)
  if (lod === 2) return CONTAINER_TYPES.has(node.type)
  return false
}
```

- [ ] **Step 4: Update the import in the test file**

Replace the import at the top of `basic3dShapes.test.ts`:

```ts
import {
  getShapeForType,
  getColorForType,
  isAbstractNode,
  isNodeVisibleAtLod,
  type Basic3DShape,
} from './basic3dShapes'
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
npx vitest run packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.test.ts
```

Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.ts \
        packages/ui/src/features/canvas/layouts/basic3d/basic3dShapes.test.ts
git commit -m "feat(basic3d): add isNodeVisibleAtLod helper for 4-level LOD type filtering"
```

---

## Task 2: Add `showLabel` prop to `Basic3DNode`

**Files:**
- Modify: `packages/ui/src/features/canvas/layouts/basic3d/Basic3DNode.tsx`
- Test: `packages/ui/src/features/canvas/layouts/basic3d/Basic3DNode.test.tsx`

- [ ] **Step 1: Write the failing tests**

Append inside the `describe('Basic3DNode', ...)` block in `Basic3DNode.test.tsx`, after the last existing `it(...)`:

```ts
  describe('showLabel', () => {
    it('does not render a label when showLabel is omitted', () => {
      const node = createNode('node-label-off', 'file')
      const { queryAllByTestId } = render(
        <Basic3DNode node={node} position={defaultPosition} isSelected={false} />
      )
      expect(queryAllByTestId('basic3d-node-label')).toHaveLength(0)
    })

    it('does not render a label when showLabel is false', () => {
      const node = createNode('node-label-false', 'file')
      const { queryAllByTestId } = render(
        <Basic3DNode node={node} position={defaultPosition} isSelected={false} showLabel={false} />
      )
      expect(queryAllByTestId('basic3d-node-label')).toHaveLength(0)
    })

    it('renders a label with the node metadata label text when showLabel is true', () => {
      const node = createNode('node-label-on', 'class')
      const { getByTestId } = render(
        <Basic3DNode node={node} position={defaultPosition} isSelected={false} showLabel={true} />
      )
      const label = getByTestId('basic3d-node-label')
      expect(label).toBeDefined()
      expect(label.textContent).toBe('node-label-on')
    })
  })
```

The test relies on `data-testid="basic3d-node-label"` being rendered by the `Text` component from `@react-three/drei`. The mock in `Basic3DNode.test.tsx` does not mock `@react-three/drei` — add the mock block at the top of the file, before the `vi.mock('@react-three/fiber', ...)` block:

```ts
vi.mock('@react-three/drei', () => ({
  Text: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="basic3d-node-label" {...props}>{children}</div>
  ),
  Billboard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run packages/ui/src/features/canvas/layouts/basic3d/Basic3DNode.test.tsx
```

Expected: FAIL — `basic3d-node-label` not found

- [ ] **Step 3: Add `showLabel` prop to `Basic3DNode.tsx`**

Replace the `Basic3DNodeProps` interface and `Basic3DNode` component:

```ts
import type { IVMNode, Position3D } from '@diagram-builder/core'
import { Text, Billboard } from '@react-three/drei'
import { useCanvasStore } from '../../store'
import { getShapeForType, getColorForType, isAbstractNode } from './basic3dShapes'

export interface Basic3DNodeProps {
  node: IVMNode
  position: Position3D
  isSelected: boolean
  showLabel?: boolean
}
```

Then at the end of the `<group>` JSX in `Basic3DNode`, after the `<mesh>` block, add the label:

```tsx
export function Basic3DNode({ node, position, isSelected, showLabel = false }: Basic3DNodeProps) {
  const selectNode = useCanvasStore((s) => s.selectNode)
  const setHoveredNode = useCanvasStore((s) => s.setHoveredNode)

  const shape = getShapeForType(node.type)
  const color = getColorForType(node.type)
  const wireframe = isAbstractNode(node)

  const handleClick = () => {
    selectNode(node.id)
  }

  const handlePointerOver = () => {
    setHoveredNode(node.id)
  }

  const handlePointerOut = () => {
    setHoveredNode(null)
  }

  return (
    <group
      name="basic3d-node"
      position={[position.x, position.y, position.z]}
      userData={{ nodeId: node.id, wireframe, selected: isSelected }}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      <mesh>
        {renderGeometry(shape)}
        <meshStandardMaterial
          color={color}
          wireframe={wireframe}
          emissive={isSelected ? color : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>
      {showLabel && (
        <Billboard>
          <Text
            position={[0, -2, 0]}
            fontSize={1.2}
            color="#FFFFFF"
            anchorX="center"
            anchorY="top"
          >
            {node.metadata.label}
          </Text>
        </Billboard>
      )}
    </group>
  )
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run packages/ui/src/features/canvas/layouts/basic3d/Basic3DNode.test.tsx
```

Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/features/canvas/layouts/basic3d/Basic3DNode.tsx \
        packages/ui/src/features/canvas/layouts/basic3d/Basic3DNode.test.tsx
git commit -m "feat(basic3d): add showLabel prop to Basic3DNode for LOD 3+ labels"
```

---

## Task 3: Refactor `Basic3DView` for 4-branch LOD rendering

**Files:**
- Modify: `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.tsx`
- Test: `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.test.tsx`

- [ ] **Step 1: Update existing tests and add new LOD filter tests**

In `Basic3DView.test.tsx`, make the following changes:

**1a. Update the "renders no edges at LOD 3" test** — under `describe('LOD-driven edge visibility', ...)`, replace the existing test:

```ts
// BEFORE (delete this):
it('renders no edges at LOD 3 (nodes visible, edges not)', () => {
  const nodes = [createNode('a'), createNode('b')]
  const edges = [createEdge('a', 'b')]
  setupLayout(makeGraph(nodes, edges))
  useCanvasStore.getState().setLodLevel(3)
  useCanvasStore.setState({ layoutState: 'ready' })

  const { queryAllByTestId } = render(<Basic3DView />)
  expect(queryAllByTestId('basic3d-node')).toHaveLength(2)
  expect(queryAllByTestId('basic3d-edge')).toHaveLength(0)
})
```

Replace with:

```ts
it('renders structural nodes and their edges at LOD 3', () => {
  const nodes = [createNode('a', 'file'), createNode('b', 'file')]
  const edges = [createEdge('a', 'b')]
  setupLayout(makeGraph(nodes, edges))
  useCanvasStore.getState().setLodLevel(3)
  useCanvasStore.setState({ layoutState: 'ready' })

  const { getAllByTestId } = render(<Basic3DView />)
  expect(getAllByTestId('basic3d-node')).toHaveLength(2)
  expect(getAllByTestId('basic3d-edge')).toHaveLength(1)
})
```

**1b. Add new describe block for LOD node-type filtering** — append after the `describe('LOD-driven edge visibility', ...)` block:

```ts
describe('LOD node-type filtering', () => {
  it('renders only container nodes at LOD 2', () => {
    const nodes = [
      createNode('mod', 'module'),
      createNode('dir', 'directory'),
      createNode('file-a', 'file'),
      createNode('fn-a', 'function'),
    ]
    setupLayout(makeGraph(nodes))
    useCanvasStore.getState().setLodLevel(2)
    useCanvasStore.setState({ layoutState: 'ready' })

    const { getAllByTestId, queryAllByTestId } = render(<Basic3DView />)
    const rendered = getAllByTestId('basic3d-node').map((el) => el.getAttribute('data-node-id'))
    expect(rendered).toContain('mod')
    expect(rendered).toContain('dir')
    expect(rendered).not.toContain('file-a')
    expect(rendered).not.toContain('fn-a')
    expect(queryAllByTestId('basic3d-edge')).toHaveLength(0)
  })

  it('renders edge at LOD 2 when both endpoints are container types', () => {
    const nodes = [createNode('mod-a', 'module'), createNode('mod-b', 'module')]
    const edges = [createEdge('mod-a', 'mod-b')]
    setupLayout(makeGraph(nodes, edges))
    useCanvasStore.getState().setLodLevel(2)
    useCanvasStore.setState({ layoutState: 'ready' })

    const { getAllByTestId } = render(<Basic3DView />)
    expect(getAllByTestId('basic3d-node')).toHaveLength(2)
    expect(getAllByTestId('basic3d-edge')).toHaveLength(1)
  })

  it('hides edge at LOD 2 when one endpoint is not a container type', () => {
    const nodes = [createNode('mod-a', 'module'), createNode('file-b', 'file')]
    const edges = [createEdge('mod-a', 'file-b')]
    setupLayout(makeGraph(nodes, edges))
    useCanvasStore.getState().setLodLevel(2)
    useCanvasStore.setState({ layoutState: 'ready' })

    const { queryAllByTestId } = render(<Basic3DView />)
    expect(queryAllByTestId('basic3d-edge')).toHaveLength(0)
  })

  it('renders container + structural nodes at LOD 3', () => {
    const nodes = [
      createNode('mod', 'module'),
      createNode('file-a', 'file'),
      createNode('cls', 'class'),
      createNode('fn-a', 'function'),
    ]
    setupLayout(makeGraph(nodes))
    useCanvasStore.getState().setLodLevel(3)
    useCanvasStore.setState({ layoutState: 'ready' })

    const { getAllByTestId } = render(<Basic3DView />)
    const rendered = getAllByTestId('basic3d-node').map((el) => el.getAttribute('data-node-id'))
    expect(rendered).toContain('mod')
    expect(rendered).toContain('file-a')
    expect(rendered).toContain('cls')
    expect(rendered).not.toContain('fn-a')
  })

  it('renders all nodes at LOD 4', () => {
    const nodes = [
      createNode('mod', 'module'),
      createNode('file-a', 'file'),
      createNode('fn-a', 'function'),
      createNode('meth', 'method'),
    ]
    setupLayout(makeGraph(nodes))
    useCanvasStore.getState().setLodLevel(4)
    useCanvasStore.setState({ layoutState: 'ready' })

    const { getAllByTestId } = render(<Basic3DView />)
    expect(getAllByTestId('basic3d-node')).toHaveLength(4)
  })

  it('passes showLabel=false to nodes at LOD 2', () => {
    const nodes = [createNode('mod', 'module')]
    setupLayout(makeGraph(nodes))
    useCanvasStore.getState().setLodLevel(2)
    useCanvasStore.setState({ layoutState: 'ready' })

    render(<Basic3DView />)
    const calls = mockBasic3DNode.mock.calls
    for (const [props] of calls) {
      expect(props.showLabel).toBe(false)
    }
  })

  it('passes showLabel=true to nodes at LOD 3', () => {
    const nodes = [createNode('file-a', 'file')]
    setupLayout(makeGraph(nodes))
    useCanvasStore.getState().setLodLevel(3)
    useCanvasStore.setState({ layoutState: 'ready' })

    render(<Basic3DView />)
    const calls = mockBasic3DNode.mock.calls
    for (const [props] of calls) {
      expect(props.showLabel).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Run the tests to confirm the new tests fail and the updated test fails**

```bash
npx vitest run packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.test.tsx
```

Expected: Multiple FAILures — node-type filter tests fail; existing "renders no edges at LOD 3" test now passes after being replaced, but the new tests for LOD 2 filtering fail.

- [ ] **Step 3: Implement the 4-branch LOD render in `Basic3DView.tsx`**

Replace the entire file content with:

```tsx
/**
 * Basic3DView — root layout component for the Basic3D layout.
 *
 * Shows a loading indicator while the worker computes layout.
 *
 * LOD 1:   ClusterLayer (proxy spheres per module group)
 * LOD 2:   Container nodes only (repository, package, namespace, module, directory)
 *           + edges between container-typed endpoints
 * LOD 3:   Container + structural nodes (+ file, class, interface, type) with labels
 *           + edges between structural-typed endpoints
 * LOD 4:   All nodes + edges (proximity-based edge culling via isEdgeVisibleForLod)
 */

import { useMemo, type JSX } from 'react'
import { Text } from '@react-three/drei'
import { useCanvasStore } from '../../store'
import { LodController } from '../../components/LodController'
import { useBasic3DLayout } from './useBasic3DLayout'
import { Basic3DNode } from './Basic3DNode'
import { Basic3DEdge } from './Basic3DEdge'
import { ClusterLayer } from './ClusterLayer'
import { isEdgeVisibleForLod } from '../../views/wireUtils'
import { isNodeVisibleAtLod } from './basic3dShapes'

export function Basic3DView() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)
  const lodLevel = useCanvasStore((s) => s.lodLevel)
  const layoutState = useCanvasStore((s) => s.layoutState)
  const cameraPosition = useCanvasStore((s) => s.camera.position)

  const { positions, graph } = useBasic3DLayout()

  const nodeById = useMemo(
    () => new Map(graph.nodes.map((n) => [n.id, n])),
    [graph.nodes]
  )

  // ── Loading state ──────────────────────────────────────────────────────────
  if (layoutState === 'computing') {
    return (
      <group name="basic3d-loading">
        <LodController />
        <Text position={[0, 0, 0]} fontSize={2} color="#888888" anchorX="center" anchorY="middle">
          Loading…
        </Text>
      </group>
    )
  }

  // ── LOD 1: cluster proxies ─────────────────────────────────────────────────
  if (lodLevel <= 1) {
    return (
      <group name="basic3d-view">
        <LodController />
        <ClusterLayer />
      </group>
    )
  }

  // ── LOD 2–3: type-filtered nodes + edges ──────────────────────────────────
  if (lodLevel <= 3) {
    const showLabel = lodLevel >= 3
    const visibleNodes = graph.nodes.filter((n) => isNodeVisibleAtLod(n, lodLevel))

    const visibleEdges = graph.edges.reduce<JSX.Element[]>((acc, edge) => {
      const srcNode = nodeById.get(edge.source)
      const tgtNode = nodeById.get(edge.target)
      if (!srcNode || !tgtNode) return acc
      if (!isNodeVisibleAtLod(srcNode, lodLevel) || !isNodeVisibleAtLod(tgtNode, lodLevel)) {
        return acc
      }
      const from = positions.get(edge.source)
      const to = positions.get(edge.target)
      if (from === undefined || to === undefined) return acc
      acc.push(<Basic3DEdge key={edge.id} from={from} to={to} />)
      return acc
    }, [])

    return (
      <group name="basic3d-view">
        <LodController />
        {visibleNodes.map((node) => {
          const position = positions.get(node.id) ?? { x: 0, y: 0, z: 0 }
          return (
            <Basic3DNode
              key={node.id}
              node={node}
              position={position}
              isSelected={node.id === selectedNodeId}
              showLabel={showLabel}
            />
          )
        })}
        {visibleEdges}
      </group>
    )
  }

  // ── LOD 4: all nodes + proximity-culled edges ──────────────────────────────
  return (
    <group name="basic3d-view">
      <LodController />

      {graph.nodes.map((node) => {
        const position = positions.get(node.id) ?? { x: 0, y: 0, z: 0 }
        return (
          <Basic3DNode
            key={node.id}
            node={node}
            position={position}
            isSelected={node.id === selectedNodeId}
            showLabel={true}
          />
        )
      })}

      {graph.edges.reduce<JSX.Element[]>((acc, edge) => {
        const from = positions.get(edge.source)
        const to = positions.get(edge.target)
        if (
          from !== undefined &&
          to !== undefined &&
          isEdgeVisibleForLod(
            edge.source,
            edge.target,
            selectedNodeId,
            lodLevel,
            from,
            to,
            cameraPosition
          )
        ) {
          acc.push(<Basic3DEdge key={edge.id} from={from} to={to} />)
        }
        return acc
      }, [])}
    </group>
  )
}
```

- [ ] **Step 4: Run all Basic3D tests**

```bash
npx vitest run packages/ui/src/features/canvas/layouts/basic3d/
```

Expected: All tests PASS

- [ ] **Step 5: Run full test suite to check for regressions**

```bash
npx vitest run
```

Expected: All tests PASS (no regressions outside basic3d/)

- [ ] **Step 6: Run type-check and lint**

```bash
cd /Users/brianmehrman/projects/diagram_builder
npm run type-check
npm run lint
npm run format:check
```

Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.tsx \
        packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.test.tsx
git commit -m "feat(basic3d): 4-level LOD rendering — containers at LOD2, structural at LOD3, all at LOD4"
```
