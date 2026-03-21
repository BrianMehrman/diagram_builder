# Connection Visibility Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add connection focus mode (building click highlights connections + fades others) and a toggleable 2D SVG radial overlay showing direct + second-hop connections with arrowheads, labels, and color coding.

**Architecture:** Reuse `selectedNodeId` as the connection focus trigger (clicking a building = select = focus). Add `showRadialOverlay: boolean` to the store. A new `useFocusedConnections` hook computes connected node sets. Buildings and edges read focus state from the store to adjust opacity. A fullscreen SVG overlay renders the radial diagram when toggled.

**Tech Stack:** Vitest, React Testing Library (`renderHook`), THREE.js, `@react-three/drei` (`Html`/`Text`), Zustand, SVG (no extra libraries)

**Design doc:** `_bmad-output/planning-artifacts/connection-visibility-design.md`

---

## Task 1: Add `showRadialOverlay` to the Canvas Store

**Files:**
- Modify: `packages/ui/src/features/canvas/store.ts`
- Test: `packages/ui/src/features/canvas/store.test.ts`

**Step 1: Write the failing test**

Add to `store.test.ts` inside `describe('useCanvasStore')`:

```typescript
it('defaults showRadialOverlay to false', () => {
  expect(useCanvasStore.getState().showRadialOverlay).toBe(false);
});

it('toggleRadialOverlay sets showRadialOverlay to true then false', () => {
  useCanvasStore.getState().toggleRadialOverlay();
  expect(useCanvasStore.getState().showRadialOverlay).toBe(true);

  useCanvasStore.getState().toggleRadialOverlay();
  expect(useCanvasStore.getState().showRadialOverlay).toBe(false);
});

it('reset clears showRadialOverlay', () => {
  useCanvasStore.getState().toggleRadialOverlay();
  useCanvasStore.getState().reset();
  expect(useCanvasStore.getState().showRadialOverlay).toBe(false);
});
```

**Step 2: Run test to confirm failure**

```bash
npm test -w @diagram-builder/ui -- --run store.test.ts
```

Expected: FAIL — `showRadialOverlay` and `toggleRadialOverlay` do not exist.

**Step 3: Add to `CanvasState` interface (after `highlightedNodeId` block ~line 122)**

```typescript
// Connection radial overlay
showRadialOverlay: boolean;
toggleRadialOverlay: () => void;
```

**Step 4: Add implementation to `create<CanvasState>` (after `setHighlightedNode` ~line 267)**

```typescript
// Connection radial overlay
showRadialOverlay: false,
toggleRadialOverlay: () =>
  set((state) => ({ showRadialOverlay: !state.showRadialOverlay })),
```

**Step 5: Add to `reset` action (after `highlightedNodeId: null` ~line 436)**

```typescript
showRadialOverlay: false,
```

**Step 6: Run tests to confirm pass**

```bash
npm test -w @diagram-builder/ui -- --run store.test.ts
```

Expected: PASS

**Step 7: Commit**

```bash
git add packages/ui/src/features/canvas/store.ts packages/ui/src/features/canvas/store.test.ts
git commit -m "feat(store): add showRadialOverlay state for connection map toggle"
```

---

## Task 2: `useFocusedConnections` Hook

Computes which nodes are directly connected to the selected node, and which are second-hop (connected to those). Used by buildings for opacity and by the radial overlay for its diagram data.

**Files:**
- Create: `packages/ui/src/features/canvas/hooks/useFocusedConnections.ts`
- Create: `packages/ui/src/features/canvas/hooks/useFocusedConnections.test.ts`

**Step 1: Write the failing tests**

```typescript
// useFocusedConnections.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFocusedConnections } from './useFocusedConnections';
import { useCanvasStore } from '../store';
import type { Graph, GraphNode, GraphEdge } from '../../../shared/types';

function node(id: string): GraphNode {
  return { id, type: 'file', label: id, metadata: {}, lod: 1, depth: 1, isExternal: false };
}
function edge(source: string, target: string, type: GraphEdge['type'] = 'imports'): GraphEdge {
  return { id: `${source}-${type}-${target}`, source, target, type, metadata: {} };
}

const graph: Graph = {
  nodes: [node('A'), node('B'), node('C'), node('D')],
  edges: [
    edge('A', 'B', 'imports'),
    edge('A', 'C', 'calls'),
    edge('B', 'D', 'depends_on'),
  ],
};

beforeEach(() => {
  useCanvasStore.getState().reset();
});

describe('useFocusedConnections', () => {
  it('returns empty sets when no node is selected', () => {
    const { result } = renderHook(() => useFocusedConnections(graph));
    expect(result.current.directNodeIds.size).toBe(0);
    expect(result.current.secondHopNodeIds.size).toBe(0);
    expect(result.current.directEdges).toHaveLength(0);
    expect(result.current.secondHopEdges).toHaveLength(0);
  });

  it('returns direct connections for selected node', () => {
    useCanvasStore.getState().selectNode('A');
    const { result } = renderHook(() => useFocusedConnections(graph));
    expect(result.current.directNodeIds).toContain('B');
    expect(result.current.directNodeIds).toContain('C');
    expect(result.current.directNodeIds.size).toBe(2);
    expect(result.current.directEdges).toHaveLength(2);
  });

  it('returns second-hop connections', () => {
    useCanvasStore.getState().selectNode('A');
    const { result } = renderHook(() => useFocusedConnections(graph));
    // D is connected to B which is connected to A
    expect(result.current.secondHopNodeIds).toContain('D');
  });

  it('does not include the focused node itself in direct or second-hop sets', () => {
    useCanvasStore.getState().selectNode('A');
    const { result } = renderHook(() => useFocusedConnections(graph));
    expect(result.current.directNodeIds).not.toContain('A');
    expect(result.current.secondHopNodeIds).not.toContain('A');
  });
});
```

**Step 2: Run to confirm failure**

```bash
npm test -w @diagram-builder/ui -- --run useFocusedConnections.test.ts
```

Expected: FAIL — module not found.

**Step 3: Implement the hook**

```typescript
// useFocusedConnections.ts
import { useMemo } from 'react';
import { useCanvasStore } from '../store';
import type { Graph, GraphEdge } from '../../../shared/types';

export interface FocusedConnectionsResult {
  /** IDs of nodes directly connected to the selected node (1 hop). */
  directNodeIds: Set<string>;
  /** IDs of nodes connected via a direct node (2 hops). */
  secondHopNodeIds: Set<string>;
  /** Edges between selected node and direct nodes. */
  directEdges: GraphEdge[];
  /** Edges between direct nodes and second-hop nodes. */
  secondHopEdges: GraphEdge[];
}

export function useFocusedConnections(graph: Graph): FocusedConnectionsResult {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);

  return useMemo(() => {
    const empty: FocusedConnectionsResult = {
      directNodeIds: new Set(),
      secondHopNodeIds: new Set(),
      directEdges: [],
      secondHopEdges: [],
    };

    if (!selectedNodeId) return empty;

    const directEdges: GraphEdge[] = [];
    const directNodeIds = new Set<string>();

    for (const edge of graph.edges) {
      if (edge.source === selectedNodeId) {
        directNodeIds.add(edge.target);
        directEdges.push(edge);
      } else if (edge.target === selectedNodeId) {
        directNodeIds.add(edge.source);
        directEdges.push(edge);
      }
    }

    const secondHopEdges: GraphEdge[] = [];
    const secondHopNodeIds = new Set<string>();

    for (const edge of graph.edges) {
      const srcDirect = directNodeIds.has(edge.source);
      const tgtDirect = directNodeIds.has(edge.target);

      if (srcDirect && edge.target !== selectedNodeId && !directNodeIds.has(edge.target)) {
        secondHopNodeIds.add(edge.target);
        secondHopEdges.push(edge);
      } else if (tgtDirect && edge.source !== selectedNodeId && !directNodeIds.has(edge.source)) {
        secondHopNodeIds.add(edge.source);
        secondHopEdges.push(edge);
      }
    }

    return { directNodeIds, secondHopNodeIds, directEdges, secondHopEdges };
  }, [graph, selectedNodeId]);
}
```

**Step 4: Run tests to confirm pass**

```bash
npm test -w @diagram-builder/ui -- --run useFocusedConnections.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add packages/ui/src/features/canvas/hooks/useFocusedConnections.ts packages/ui/src/features/canvas/hooks/useFocusedConnections.test.ts
git commit -m "feat(hooks): add useFocusedConnections to compute direct + second-hop edges"
```

---

## Task 3: `getNodeFocusOpacity` Utility

A pure function that maps a node's focus relationship to an opacity value. Keeps opacity logic out of components.

**Files:**
- Modify: `packages/ui/src/features/canvas/views/cityViewUtils.ts`
- Modify: `packages/ui/src/features/canvas/views/cityViewUtils.test.ts`

**Step 1: Write failing tests**

Add to `cityViewUtils.test.ts`:

```typescript
describe('getNodeFocusOpacity', () => {
  it('returns 1.0 when no node is focused', () => {
    expect(getNodeFocusOpacity('A', null, new Set(), new Set())).toBe(1.0);
  });

  it('returns 1.0 for the focused node itself', () => {
    expect(getNodeFocusOpacity('A', 'A', new Set(['B']), new Set())).toBe(1.0);
  });

  it('returns 1.0 for directly connected nodes', () => {
    expect(getNodeFocusOpacity('B', 'A', new Set(['B']), new Set())).toBe(1.0);
  });

  it('returns 0.5 for second-hop nodes', () => {
    expect(getNodeFocusOpacity('C', 'A', new Set(['B']), new Set(['C']))).toBe(0.5);
  });

  it('returns 0.15 for unrelated nodes', () => {
    expect(getNodeFocusOpacity('D', 'A', new Set(['B']), new Set(['C']))).toBe(0.15);
  });
});
```

**Step 2: Run to confirm failure**

```bash
npm test -w @diagram-builder/ui -- --run cityViewUtils.test.ts
```

Expected: FAIL — `getNodeFocusOpacity` not found.

**Step 3: Add function to `cityViewUtils.ts`**

Add near the end of the file, before the last export:

```typescript
/**
 * Returns the opacity a building should render at based on connection focus state.
 *
 * @param nodeId        The node being rendered
 * @param selectedNodeId The currently focused node (null = no focus mode)
 * @param directNodeIds  Nodes directly connected to the focused node
 * @param secondHopNodeIds Nodes connected via one intermediate hop
 */
export function getNodeFocusOpacity(
  nodeId: string,
  selectedNodeId: string | null,
  directNodeIds: Set<string>,
  secondHopNodeIds: Set<string>,
): number {
  if (!selectedNodeId) return 1.0;
  if (nodeId === selectedNodeId) return 1.0;
  if (directNodeIds.has(nodeId)) return 1.0;
  if (secondHopNodeIds.has(nodeId)) return 0.5;
  return 0.15;
}
```

**Step 4: Run tests to confirm pass**

```bash
npm test -w @diagram-builder/ui -- --run cityViewUtils.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add packages/ui/src/features/canvas/views/cityViewUtils.ts packages/ui/src/features/canvas/views/cityViewUtils.test.ts
git commit -m "feat(utils): add getNodeFocusOpacity for connection focus mode opacity"
```

---

## Task 4: Add Arrowhead to `OverheadWire`

Adds a small `THREE.ConeGeometry` at the arc endpoint oriented along the final curve tangent to show dependency direction.

**Files:**
- Modify: `packages/ui/src/features/canvas/components/OverheadWire.tsx`
- Modify: `packages/ui/src/features/canvas/components/OverheadWire.test.ts`

**Step 1: Write the failing test**

Read `OverheadWire.test.ts` first to understand existing test patterns, then add:

```typescript
it('renders an arrowhead mesh at the target endpoint', () => {
  // OverheadWire renders a <primitive> (the line) plus an arrowhead <mesh>
  // The test checks the arrowhead group is present
  const { container } = render(
    <Canvas>
      <OverheadWire
        sourcePosition={{ x: 0, y: 0, z: 0 }}
        targetPosition={{ x: 10, y: 0, z: 0 }}
        sourceHeight={3}
        targetHeight={3}
        edgeType="calls"
      />
    </Canvas>
  );
  // Component renders without error (arrowhead is created in useMemo)
  expect(container).toBeTruthy();
});
```

> Note: R3F component tests are hard to introspect deeply. The test here confirms no render error. The arrowhead geometry is validated visually.

**Step 2: Implement the arrowhead in `OverheadWire.tsx`**

Add these constants near the top of the file (after `WIRE_OPACITY`):

```typescript
/** Arrowhead cone height (world units). */
const ARROW_HEIGHT = 0.6;
/** Arrowhead cone base radius. */
const ARROW_RADIUS = 0.18;
```

Replace the `return <primitive object={lineObject} />;` block with:

```typescript
// Compute arrowhead at the target endpoint, oriented along the final tangent
const arrowObject = useMemo(() => {
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(sourcePosition.x, sourceHeight, sourcePosition.z),
    new THREE.Vector3(
      (sourcePosition.x + targetPosition.x) / 2,
      calculateWireArcPeak(
        sourceHeight,
        targetHeight,
        Math.sqrt(
          Math.pow(targetPosition.x - sourcePosition.x, 2) +
          Math.pow(targetPosition.z - sourcePosition.z, 2),
        ),
      ),
      (sourcePosition.z + targetPosition.z) / 2,
    ),
    new THREE.Vector3(targetPosition.x, targetHeight, targetPosition.z),
  );

  // Tangent at t=1 (the very end of the arc)
  const tangent = curve.getTangent(1).normalize();
  const tip = new THREE.Vector3(targetPosition.x, targetHeight, targetPosition.z);

  const coneGeometry = new THREE.ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 6);
  const color = getWireColor(edgeType);
  const coneMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: WIRE_OPACITY });
  const cone = new THREE.Mesh(coneGeometry, coneMaterial);

  // ConeGeometry points along +Y by default; align to tangent
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, tangent);
  cone.quaternion.copy(quaternion);
  cone.position.copy(tip).addScaledVector(tangent, ARROW_HEIGHT / 2);

  return cone;
}, [sourcePosition, targetPosition, sourceHeight, targetHeight, edgeType]);

return (
  <group>
    <primitive object={lineObject} />
    <primitive object={arrowObject} />
  </group>
);
```

> Important: The curve calculation in `arrowObject` duplicates the curve from `lineObject`. This is intentional — `useMemo` dependencies must be kept clean and both memos run together. Do not try to share the curve between the two memos.

**Step 3: Run tests**

```bash
npm test -w @diagram-builder/ui -- --run OverheadWire.test.ts
```

Expected: PASS

**Step 4: Commit**

```bash
git add packages/ui/src/features/canvas/components/OverheadWire.tsx packages/ui/src/features/canvas/components/OverheadWire.test.ts
git commit -m "feat(OverheadWire): add arrowhead cone at target endpoint for direction"
```

---

## Task 5: Add Arrowhead to `UndergroundPipe`

Adds a cone cap at the tube exit point (where the pipe surfaces at the target building).

**Files:**
- Modify: `packages/ui/src/features/canvas/components/UndergroundPipe.tsx`
- Modify: `packages/ui/src/features/canvas/components/UndergroundPipe.test.ts`

**Step 1: Read `UndergroundPipe.test.ts`** to see existing test structure.

**Step 2: Add a smoke test confirming arrowhead renders without error** (same pattern as Task 4).

**Step 3: Implement arrowhead in `UndergroundPipe.tsx`**

Import `useMemo` is already imported. Add imports:
```typescript
import { CatmullRomCurve3, Vector3, BackSide, ConeGeometry, MeshBasicMaterial, Mesh, Quaternion } from 'three';
```

Add constants after `GLOW_OFFSET`:
```typescript
const ARROW_HEIGHT = 0.5;
const ARROW_RADIUS = 0.15;
```

Add arrowhead computation inside the component, after the `curve` useMemo:

```typescript
const arrowhead = useMemo(() => {
  const pts = calculatePipeRoute(sourcePosition, targetPosition, depth);
  const lastPt = pts[pts.length - 1]!;
  const prevPt = pts[pts.length - 2]!;

  const tangent = new Vector3(
    lastPt.x - prevPt.x,
    lastPt.y - prevPt.y,
    lastPt.z - prevPt.z,
  ).normalize();

  const cone = new Mesh(
    new ConeGeometry(ARROW_RADIUS, ARROW_HEIGHT, 6),
    new MeshBasicMaterial({ color, transparent: true, opacity: 0.75 }),
  );

  const up = new Vector3(0, 1, 0);
  cone.quaternion.copy(new Quaternion().setFromUnitVectors(up, tangent));
  cone.position.set(lastPt.x, lastPt.y, lastPt.z);

  return cone;
}, [sourcePosition, targetPosition, depth, color]);
```

Update the return to include the arrowhead:
```tsx
return (
  <group>
    {/* Main conduit tube */}
    <mesh>
      <tubeGeometry args={[curve, TUBE_SEGMENTS, radius, RADIAL_SEGMENTS, false]} />
      <meshStandardMaterial color={color} roughness={0.85} metalness={0.3} transparent opacity={0.75} />
    </mesh>

    {/* Subtle outer glow shell */}
    <mesh>
      <tubeGeometry args={[curve, TUBE_SEGMENTS, radius + GLOW_OFFSET, RADIAL_SEGMENTS, false]} />
      <meshBasicMaterial color={color} transparent opacity={0.08} side={BackSide} />
    </mesh>

    {/* Direction arrowhead at target surface exit */}
    <primitive object={arrowhead} />
  </group>
);
```

**Step 4: Run tests**

```bash
npm test -w @diagram-builder/ui -- --run UndergroundPipe.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add packages/ui/src/features/canvas/components/UndergroundPipe.tsx packages/ui/src/features/canvas/components/UndergroundPipe.test.ts
git commit -m "feat(UndergroundPipe): add direction arrowhead at target surface exit"
```

---

## Task 6: Building Focus Opacity in `Building`

The `Building` component (renders `file` nodes) reads focus state and applies `getNodeFocusOpacity`.

**Files:**
- Modify: `packages/ui/src/features/canvas/views/Building.tsx`
- Test: `packages/ui/src/features/canvas/views/Building.test.ts` (read first to check if it exists; if not, create it)

**Step 1: Add import to `Building.tsx`**

```typescript
import { useFocusedConnections } from '../hooks/useFocusedConnections';
import { getNodeFocusOpacity } from './cityViewUtils';
import type { Graph } from '../../../shared/types';
```

**Step 2: Update `BuildingProps` to accept `graph`**

```typescript
interface BuildingProps {
  node: GraphNode;
  position: Position3D;
  encodingOptions?: EncodedHeightOptions;
  graph: Graph;   // needed for focus connections
}
```

**Step 3: In the component body, after `const isSelected = ...`**

```typescript
const { directNodeIds, secondHopNodeIds } = useFocusedConnections(graph);
const focusOpacity = getNodeFocusOpacity(node.id, selectedNodeId, directNodeIds, secondHopNodeIds);
const isFocusMode = selectedNodeId !== null;
```

**Step 4: Apply `focusOpacity` to the building material**

Find the `<meshStandardMaterial>` (or equivalent) in Building's JSX return. Add `transparent` and `opacity`:

```tsx
<meshStandardMaterial
  color={color}
  emissive={emissiveColor}
  emissiveIntensity={isSelected ? 0.4 : 0}
  transparent={isFocusMode}
  opacity={focusOpacity}
/>
```

**Step 5: Add a highlight ring for the focused building**

After the main building mesh, add a ring at the base when selected in focus mode:

```tsx
{isSelected && (
  <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
    <ringGeometry args={[Math.max(BUILDING_WIDTH, BUILDING_DEPTH) * 0.6, Math.max(BUILDING_WIDTH, BUILDING_DEPTH) * 0.75, 32]} />
    <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
  </mesh>
)}
```

**Step 6: Update all `<Building>` usages in `CityBlocks.tsx` to pass `graph`**

Search `CityBlocks.tsx` for `<Building` and add `graph={graph}` to each instance.

**Step 7: Run type check**

```bash
npm run type-check -w @diagram-builder/ui
```

Fix any type errors before committing.

**Step 8: Commit**

```bash
git add packages/ui/src/features/canvas/views/Building.tsx packages/ui/src/features/canvas/views/CityBlocks.tsx
git commit -m "feat(Building): apply focus opacity and selection ring in connection focus mode"
```

---

## Task 7: Focus Opacity for Class/Function Buildings

Apply the same focus opacity to `ClassBuilding`, `FunctionShop`, `InterfaceBuilding`, and `AbstractBuilding` — the other building types rendered by `CityBlocks`.

**Files:**
- Modify: `packages/ui/src/features/canvas/components/buildings/ClassBuilding.tsx` (and sibling building types)

**Approach:** Each of these components already reads `selectedNodeId` from the store (check each file). Add the same three lines used in Task 6 Step 3 and apply `focusOpacity` + `transparent` to their materials.

For each file:
1. Add imports for `useFocusedConnections`, `getNodeFocusOpacity`, and `Graph`
2. Add `graph: Graph` to props
3. Add `focusOpacity` + `isFocusMode` computation after `selectedNodeId`
4. Apply to material
5. Update `CityBlocks.tsx` to pass `graph={graph}` to each building type

**Step 1: Run type check after modifying each file**

```bash
npm run type-check -w @diagram-builder/ui
```

**Step 2: Commit**

```bash
git add packages/ui/src/features/canvas/components/buildings/
git add packages/ui/src/features/canvas/views/CityBlocks.tsx
git commit -m "feat(buildings): apply connection focus opacity to all building types"
```

---

## Task 8: Edge Highlight + Auto-Underground + Labels in Focus Mode

**8a: Auto-visible underground pipes in focus mode**

Modify `CityUnderground.tsx` line 46:

```typescript
// Auto-visible when a node is focused, even if global toggle is off
const isFocusMode = selectedNodeId !== null;
if (!undergroundVisible && !isFocusMode) return null;
```

Add to imports:
```typescript
const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
```

In focus mode, also filter `pipesToRender` to only show edges connected to the focused node:

```typescript
const pipesToRender = visibleEdges.filter((edge) => {
  if (classifyEdgeRouting(edge.type) !== 'underground') return false;
  // In focus mode: only show pipes connected to the focused building
  if (isFocusMode && selectedNodeId) {
    if (edge.source !== selectedNodeId && edge.target !== selectedNodeId) return false;
  }
  const isExternal = externalNodeIds.has(edge.source) || externalNodeIds.has(edge.target);
  if (isExternal && !externalPipesVisible && !isFocusMode) return false;
  const t = edge.type.toLowerCase();
  const isInheritance = t === 'extends' || t === 'implements' || t === 'inherits';
  if (isInheritance && !edgeTierVisibility.inheritance) return false;
  return true;
});
```

**8b: Edge labels on focused edges using `@react-three/drei` `Html`**

In `CitySky.tsx`, import `Html` from `@react-three/drei`:
```typescript
import { Html } from '@react-three/drei';
```

Also import `useCanvasStore`:
```typescript
const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
```

Inside the `edgesToRender.map(...)` for v2 mode, after the `<OverheadWire>` element, add an edge label when the edge is connected to the selected node:

```tsx
{(edge.source === selectedNodeId || edge.target === selectedNodeId) && (
  <Html
    position={[
      (srcPos.x + tgtPos.x) / 2,
      Math.max(getNodeRooftopY(srcNode), getNodeRooftopY(tgtNode)) + 2,
      (srcPos.z + tgtPos.z) / 2,
    ]}
    center
    style={{ pointerEvents: 'none' }}
  >
    <div style={{
      background: 'rgba(0,0,0,0.7)',
      color: '#fff',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '10px',
      whiteSpace: 'nowrap',
    }}>
      {edge.type}
    </div>
  </Html>
)}
```

**Step 1: Run tests**

```bash
npm test -w @diagram-builder/ui -- --run CityUnderground.test.ts
npm test -w @diagram-builder/ui -- --run CitySky.test.ts  # if it exists
```

**Step 2: Run type check**

```bash
npm run type-check -w @diagram-builder/ui
```

**Step 3: Commit**

```bash
git add packages/ui/src/features/canvas/components/CityUnderground.tsx
git add packages/ui/src/features/canvas/views/CitySky.tsx
git commit -m "feat(edges): auto-show underground pipes + edge labels in connection focus mode"
```

---

## Task 9: `FocusToggleButton` Component

A HUD button that appears when a node is selected. Toggles between 3D focus mode and the radial overlay.

**Files:**
- Create: `packages/ui/src/features/canvas/components/FocusToggleButton.tsx`
- Create: `packages/ui/src/features/canvas/components/FocusToggleButton.test.ts`

**Step 1: Write the failing test**

```typescript
// FocusToggleButton.test.ts
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FocusToggleButton } from './FocusToggleButton';
import { useCanvasStore } from '../store';

beforeEach(() => { useCanvasStore.getState().reset(); });

describe('FocusToggleButton', () => {
  it('renders nothing when no node is selected', () => {
    const { container } = render(<FocusToggleButton />);
    expect(container.firstChild).toBeNull();
  });

  it('renders "Show Map" when a node is selected and overlay is off', () => {
    useCanvasStore.getState().selectNode('node-1');
    render(<FocusToggleButton />);
    expect(screen.getByText('Show Map')).toBeTruthy();
  });

  it('renders "Close Map" when overlay is on', () => {
    useCanvasStore.getState().selectNode('node-1');
    useCanvasStore.getState().toggleRadialOverlay();
    render(<FocusToggleButton />);
    expect(screen.getByText('Close Map')).toBeTruthy();
  });

  it('calls toggleRadialOverlay on click', () => {
    useCanvasStore.getState().selectNode('node-1');
    render(<FocusToggleButton />);
    fireEvent.click(screen.getByText('Show Map'));
    expect(useCanvasStore.getState().showRadialOverlay).toBe(true);
  });
});
```

**Step 2: Run to confirm failure**

```bash
npm test -w @diagram-builder/ui -- --run FocusToggleButton.test.ts
```

**Step 3: Implement**

```tsx
// FocusToggleButton.tsx
import { useCanvasStore } from '../store';

export function FocusToggleButton() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const showRadialOverlay = useCanvasStore((s) => s.showRadialOverlay);
  const toggleRadialOverlay = useCanvasStore((s) => s.toggleRadialOverlay);

  if (!selectedNodeId) return null;

  return (
    <button
      onClick={toggleRadialOverlay}
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        zIndex: 100,
        padding: '8px 16px',
        background: showRadialOverlay ? '#374151' : '#2563eb',
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 600,
      }}
    >
      {showRadialOverlay ? 'Close Map' : 'Show Map'}
    </button>
  );
}
```

**Step 4: Run tests**

```bash
npm test -w @diagram-builder/ui -- --run FocusToggleButton.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add packages/ui/src/features/canvas/components/FocusToggleButton.tsx packages/ui/src/features/canvas/components/FocusToggleButton.test.ts
git commit -m "feat(ui): add FocusToggleButton for Show Map / Close Map toggle"
```

---

## Task 10: `RadialOverlay` — Structure, Center Node, and Edge Colors

The SVG overlay component. This task builds the container, positions the center node, and establishes the color/style helpers.

**Files:**
- Create: `packages/ui/src/features/canvas/components/RadialOverlay.tsx`
- Create: `packages/ui/src/features/canvas/components/RadialOverlay.test.ts`

**Step 1: Write failing tests**

```typescript
// RadialOverlay.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RadialOverlay } from './RadialOverlay';
import { useCanvasStore } from '../store';
import type { Graph } from '../../../shared/types';

const graph: Graph = {
  nodes: [
    { id: 'A', type: 'file', label: 'src/A.ts', metadata: {}, lod: 1, depth: 1, isExternal: false },
    { id: 'B', type: 'file', label: 'src/B.ts', metadata: {}, lod: 1, depth: 1, isExternal: false },
  ],
  edges: [{ id: 'A-imports-B', source: 'A', target: 'B', type: 'imports', metadata: {} }],
};

beforeEach(() => { useCanvasStore.getState().reset(); });

describe('RadialOverlay', () => {
  it('renders nothing when overlay is not shown', () => {
    useCanvasStore.getState().selectNode('A');
    const { container } = render(<RadialOverlay graph={graph} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders SVG when overlay is shown and node is selected', () => {
    useCanvasStore.getState().selectNode('A');
    useCanvasStore.getState().toggleRadialOverlay();
    render(<RadialOverlay graph={graph} />);
    expect(document.querySelector('svg')).toBeTruthy();
  });

  it('shows the selected node label in the center', () => {
    useCanvasStore.getState().selectNode('A');
    useCanvasStore.getState().toggleRadialOverlay();
    render(<RadialOverlay graph={graph} />);
    expect(screen.getByText('A.ts')).toBeTruthy();
  });
});
```

**Step 2: Run to confirm failure**

```bash
npm test -w @diagram-builder/ui -- --run RadialOverlay.test.ts
```

**Step 3: Implement the base structure**

```tsx
// RadialOverlay.tsx
import { useMemo } from 'react';
import { useCanvasStore } from '../store';
import { useFocusedConnections } from '../hooks/useFocedConnections';
import type { Graph, GraphNode } from '../../../shared/types';

// Edge type → color (matches 3D scene colors)
const EDGE_COLORS: Record<string, string> = {
  calls: '#34d399',
  composes: '#a78bfa',
  imports: '#94a3b8',
  depends_on: '#94a3b8',
  inherits: '#fbbf24',
  extends: '#fbbf24',
  implements: '#94a3b8',
};
const DEFAULT_EDGE_COLOR = '#94a3b8';

const DASHED_TYPES = new Set(['imports', 'depends_on', 'inherits', 'extends', 'implements']);

// SVG canvas constants
const CX = 400; // center X
const CY = 300; // center Y
const DIRECT_RADIUS = 180;
const SECOND_RADIUS = 280;
const CENTER_R = 30;
const NODE_R = 20;
const SECOND_NODE_R = 14;

function shortLabel(node: GraphNode | undefined): string {
  if (!node) return '?';
  const label = node.label ?? node.id;
  return label.split('/').pop() ?? label;
}

interface RadialOverlayProps {
  graph: Graph;
}

export function RadialOverlay({ graph }: RadialOverlayProps) {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const showRadialOverlay = useCanvasStore((s) => s.showRadialOverlay);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const toggleRadialOverlay = useCanvasStore((s) => s.toggleRadialOverlay);
  const { directEdges, secondHopEdges, directNodeIds } = useFocusedConnections(graph);

  const nodeMap = useMemo(() => {
    const m = new Map<string, GraphNode>();
    for (const n of graph.nodes) m.set(n.id, n);
    return m;
  }, [graph.nodes]);

  if (!showRadialOverlay || !selectedNodeId) return null;

  const focusedNode = nodeMap.get(selectedNodeId);
  const directIds = Array.from(directNodeIds);

  // Arrange direct nodes evenly around the center
  const directPositions = directIds.map((id, i) => {
    const angle = (2 * Math.PI * i) / directIds.length - Math.PI / 2;
    return { id, x: CX + DIRECT_RADIUS * Math.cos(angle), y: CY + DIRECT_RADIUS * Math.sin(angle) };
  });

  const posMap = new Map(directPositions.map((p) => [p.id, { x: p.x, y: p.y }]));
  posMap.set(selectedNodeId, { x: CX, y: CY });

  // Arrange second-hop nodes around their direct parents
  const secondHopIds = Array.from(
    new Set(secondHopEdges.flatMap((e) => [e.source, e.target]).filter((id) => !directNodeIds.has(id) && id !== selectedNodeId))
  );

  const secondHopPositions = secondHopIds.map((id, i) => {
    const angle = (2 * Math.PI * i) / secondHopIds.length - Math.PI / 2 + 0.2;
    return { id, x: CX + SECOND_RADIUS * Math.cos(angle), y: CY + SECOND_RADIUS * Math.sin(angle) };
  });

  for (const p of secondHopPositions) posMap.set(p.id, { x: p.x, y: p.y });

  function arrowHead(x2: number, y2: number, dx: number, dy: number, color: string) {
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return null;
    const nx = dx / len;
    const ny = dy / len;
    const px = -ny * 5;
    const py = nx * 5;
    return (
      <polygon
        points={`${x2},${y2} ${x2 - nx * 10 + px},${y2 - ny * 10 + py} ${x2 - nx * 10 - px},${y2 - ny * 10 - py}`}
        fill={color}
      />
    );
  }

  function handleNodeClick(nodeId: string) {
    selectNode(nodeId);
    // overlay stays open, re-renders centered on new node
    // toggleRadialOverlay is NOT called — we stay in overlay mode
  }

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) toggleRadialOverlay(); }}
    >
      <svg width={800} height={600} style={{ overflow: 'visible' }}>
        {/* Second-hop edges */}
        {secondHopEdges.map((edge) => {
          const src = posMap.get(edge.source);
          const tgt = posMap.get(edge.target);
          if (!src || !tgt) return null;
          const color = EDGE_COLORS[edge.type] ?? DEFAULT_EDGE_COLOR;
          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          return (
            <g key={edge.id} opacity={0.4}>
              <line
                x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                stroke={color} strokeWidth={1.5}
                strokeDasharray={DASHED_TYPES.has(edge.type) ? '5,3' : undefined}
              />
              {arrowHead(tgt.x, tgt.y, dx, dy, color)}
            </g>
          );
        })}

        {/* Direct edges */}
        {directEdges.map((edge) => {
          const src = posMap.get(edge.source);
          const tgt = posMap.get(edge.target);
          if (!src || !tgt) return null;
          const color = EDGE_COLORS[edge.type] ?? DEFAULT_EDGE_COLOR;
          const dx = tgt.x - src.x;
          const dy = tgt.y - src.y;
          const midX = (src.x + tgt.x) / 2;
          const midY = (src.y + tgt.y) / 2;
          return (
            <g key={edge.id}>
              <line
                x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                stroke={color} strokeWidth={2}
                strokeDasharray={DASHED_TYPES.has(edge.type) ? '6,3' : undefined}
              />
              {arrowHead(tgt.x, tgt.y, dx, dy, color)}
              {/* Edge type label at midpoint */}
              <text x={midX} y={midY - 6} textAnchor="middle" fontSize={10} fill={color} opacity={0.9}>
                {edge.type}
              </text>
            </g>
          );
        })}

        {/* Second-hop nodes */}
        {secondHopPositions.map(({ id, x, y }) => (
          <g key={id} onClick={() => handleNodeClick(id)} style={{ cursor: 'pointer' }} opacity={0.6}>
            <circle cx={x} cy={y} r={SECOND_NODE_R} fill="#1e293b" stroke="#64748b" strokeWidth={1.5} />
            <text x={x} y={y + SECOND_NODE_R + 12} textAnchor="middle" fontSize={9} fill="#94a3b8">
              {shortLabel(nodeMap.get(id))}
            </text>
          </g>
        ))}

        {/* Direct nodes */}
        {directPositions.map(({ id, x, y }) => (
          <g key={id} onClick={() => handleNodeClick(id)} style={{ cursor: 'pointer' }}>
            <circle cx={x} cy={y} r={NODE_R} fill="#1e293b" stroke="#60a5fa" strokeWidth={2} />
            <text x={x} y={y + NODE_R + 14} textAnchor="middle" fontSize={11} fill="#e2e8f0">
              {shortLabel(nodeMap.get(id))}
            </text>
          </g>
        ))}

        {/* Center (focused) node */}
        <circle cx={CX} cy={CY} r={CENTER_R} fill="#2563eb" stroke="#93c5fd" strokeWidth={2} />
        <text x={CX} y={CY + 4} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#fff">
          {shortLabel(focusedNode)}
        </text>
      </svg>
    </div>
  );
}
```

**Step 4: Run tests**

```bash
npm test -w @diagram-builder/ui -- --run RadialOverlay.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add packages/ui/src/features/canvas/components/RadialOverlay.tsx packages/ui/src/features/canvas/components/RadialOverlay.test.ts
git commit -m "feat(RadialOverlay): add SVG radial connection map with direct and second-hop nodes"
```

---

## Task 11: Escape Key to Exit Focus Mode

Pressing Escape clears `selectedNodeId` and `showRadialOverlay`, returning to normal view.

**Files:**
- Create: `packages/ui/src/features/canvas/hooks/useFocusEscape.ts`
- Create: `packages/ui/src/features/canvas/hooks/useFocusEscape.test.ts`

**Step 1: Write failing tests**

```typescript
// useFocusEscape.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFocusEscape } from './useFocusEscape';
import { useCanvasStore } from '../store';

beforeEach(() => { useCanvasStore.getState().reset(); });

describe('useFocusEscape', () => {
  it('clears selectedNodeId on Escape', () => {
    useCanvasStore.getState().selectNode('node-1');
    renderHook(() => useFocusEscape());
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(useCanvasStore.getState().selectedNodeId).toBeNull();
  });

  it('clears showRadialOverlay on Escape', () => {
    useCanvasStore.getState().selectNode('node-1');
    useCanvasStore.getState().toggleRadialOverlay();
    renderHook(() => useFocusEscape());
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(useCanvasStore.getState().showRadialOverlay).toBe(false);
  });
});
```

**Step 2: Implement**

```typescript
// useFocusEscape.ts
import { useEffect } from 'react';
import { useCanvasStore } from '../store';

export function useFocusEscape() {
  const selectNode = useCanvasStore((s) => s.selectNode);
  const showRadialOverlay = useCanvasStore((s) => s.showRadialOverlay);
  const toggleRadialOverlay = useCanvasStore((s) => s.toggleRadialOverlay);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        selectNode(null);
        if (showRadialOverlay) toggleRadialOverlay();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectNode, showRadialOverlay, toggleRadialOverlay]);
}
```

**Step 3: Run tests**

```bash
npm test -w @diagram-builder/ui -- --run useFocusEscape.test.ts
```

Expected: PASS

**Step 4: Commit**

```bash
git add packages/ui/src/features/canvas/hooks/useFocusEscape.ts packages/ui/src/features/canvas/hooks/useFocusEscape.test.ts
git commit -m "feat(hooks): add useFocusEscape to clear focus mode on Escape key"
```

---

## Task 12: Wire Everything into `CityView` and `WorkspacePage`

Connect all new components into the rendering tree.

**Files:**
- Modify: `packages/ui/src/features/canvas/views/CityView.tsx`
- Modify: `packages/ui/src/features/workspace/WorkspacePage.tsx` (or wherever the canvas is mounted — search for `<CityView`)

**Step 1: Update `CityView.tsx`**

Add import:
```typescript
import { useFocusEscape } from '../hooks/useFocusEscape';
```

Inside `CityView`, call the hook:
```typescript
useFocusEscape();
```

**Step 2: Find the parent component that wraps the R3F canvas**

Run:
```bash
grep -r "CityView\|Canvas" packages/ui/src/features/workspace/ --include="*.tsx" -l
```

Open that file. It will have a `<Canvas>` from `@react-three/fiber` and likely a wrapping `<div>`.

**Step 3: Add `FocusToggleButton` and `RadialOverlay` to the wrapper div**

Find the wrapper `<div>` that contains `<Canvas>`. It should have `position: relative` (add it if missing). Add:

```tsx
<div style={{ position: 'relative', width: '100%', height: '100%' }}>
  <Canvas ...>
    <CityView graph={graph} />
  </Canvas>
  <FocusToggleButton />
  <RadialOverlay graph={graph} />
</div>
```

Import the new components:
```typescript
import { FocusToggleButton } from '../canvas/components/FocusToggleButton';
import { RadialOverlay } from '../canvas/components/RadialOverlay';
```

**Step 4: Run type check and tests**

```bash
npm run type-check -w @diagram-builder/ui
npm test -w @diagram-builder/ui -- --run
```

Fix any type errors.

**Step 5: Commit**

```bash
git add packages/ui/src/features/canvas/views/CityView.tsx
git add packages/ui/src/features/ # workspace page change
git commit -m "feat(CityView): wire focus escape, FocusToggleButton, and RadialOverlay into scene"
```

---

## Final Verification

```bash
# Full test suite
npm test -w @diagram-builder/ui -- --run

# Type check
npm run type-check -w @diagram-builder/ui

# Lint
npm run lint -w @diagram-builder/ui
```

Start the dev server and manually verify:
1. Click a building → scene fades, connected buildings highlighted, edges bright with arrowheads + labels
2. Click "Show Map" → SVG radial overlay appears with direct and second-hop spokes
3. Click a node in the overlay → overlay re-centers on new node
4. Click "Close Map" → returns to 3D focus mode
5. Press Escape → returns to normal view
6. Underground pipes auto-appear in focus mode showing structural connections
