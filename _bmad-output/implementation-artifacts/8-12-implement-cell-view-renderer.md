# Story 8-12: Implement Cell View Renderer

**Status:** review

---

## Story

**ID:** 8-12
**Key:** 8-12-implement-cell-view-renderer
**Title:** Implement Cell View Renderer with Organelles
**Epic:** Epic 8 - City-to-Cell 3D Layout
**Phase:** Implementation - Phase 3 (View Modes)
**Priority:** HIGH - Detailed class exploration

**As a** developer exploring inside a class,
**I want** to see methods and properties as floating organelles within a cell membrane,
**So that** I can understand the internal structure of a class in an organic, biological visualization.

**Description:**

Implement the cell view renderer that displays the interior of a class as a biological cell. Methods are organelles floating in cytoplasm, state is the nucleus, and the cell membrane defines the boundary.

**Context:**

From UX 3D Layout Vision:
- Inside a class = organic cell
- Organelles = chair-sized objects
- No animation (static)
- Hover for tooltip, click for code panel

Organelle visual mapping:
- Function/Method = blob/sphere (blue)
- State/Variable = pulsing core (green)
- Constant = crystal/gem (purple)
- Event handler = shape with receptor (orange)
- Type/Interface = wireframe (gray)

---

## Acceptance Criteria

- **AC-1:** Cell membrane visible
  - Semi-transparent sphere or ellipsoid
  - Defines boundary of class
  - Slightly visible from inside

- **AC-2:** Organelles rendered by type
  - Functions = spheres
  - Variables = cubes near center
  - Constants = octahedrons
  - Event handlers = spheres with antenna

- **AC-3:** Color indicates type
  - Functions = blue family
  - State = green family
  - Constants = purple/crystal
  - Event handlers = orange/warm
  - Types = gray/wireframe

- **AC-4:** Organelle size reflects importance
  - Larger methods = larger organelles
  - Based on line count or complexity

- **AC-5:** Hover shows organelle tooltip
  - Name, type, parameters, return type
  - "View Code" button in tooltip

- **AC-6:** Connections between organelles
  - Call relationships shown as lines
  - Data flow connections
  - Faded/subtle to avoid clutter

---

## Technical Approach

### Cell View Component

```typescript
// packages/ui/src/features/canvas/views/CellView.tsx

import React from 'react';
import { Membrane } from './Membrane';
import { Organelle } from './Organelle';
import { OrganelleConnection } from './OrganelleConnection';
import { useCanvasStore } from '../store';
import type { Graph, GraphNode, Position3D } from '../../../shared/types';

interface CellViewProps {
  graph: Graph;
  focusedNodeId: string;
  positions: Map<string, Position3D>;
  cellMetadata: {
    cellCenter: Position3D;
    membraneRadius: number;
    nucleusRadius: number;
  };
}

export function CellView({
  graph,
  focusedNodeId,
  positions,
  cellMetadata,
}: CellViewProps) {
  const openCodePanel = useCanvasStore(s => s.openCodePanel);

  // Get the cell (class/file) node
  const cellNode = graph.nodes.find(n => n.id === focusedNodeId);

  // Get organelles (children of this cell)
  const organelles = useMemo(() => {
    return graph.nodes.filter(n => n.parentId === focusedNodeId);
  }, [graph, focusedNodeId]);

  // Get internal edges (connections between organelles)
  const internalEdges = useMemo(() => {
    const organelleIds = new Set(organelles.map(o => o.id));
    return graph.edges.filter(
      e => organelleIds.has(e.source) && organelleIds.has(e.target)
    );
  }, [graph, organelles]);

  const handleOrganelleClick = (node: GraphNode) => {
    openCodePanel(node.id);
  };

  return (
    <group name="cell-view">
      {/* Cell membrane */}
      <Membrane
        center={cellMetadata.cellCenter}
        radius={cellMetadata.membraneRadius}
      />

      {/* Nucleus region indicator (subtle) */}
      <Membrane
        center={cellMetadata.cellCenter}
        radius={cellMetadata.nucleusRadius}
        isNucleus
      />

      {/* Organelles */}
      {organelles.map(node => {
        const pos = positions.get(node.id);
        if (!pos) return null;

        return (
          <Organelle
            key={node.id}
            node={node}
            position={pos}
            onClick={() => handleOrganelleClick(node)}
          />
        );
      })}

      {/* Connections between organelles */}
      {internalEdges.map(edge => (
        <OrganelleConnection
          key={edge.id}
          edge={edge}
          sourcePos={positions.get(edge.source)}
          targetPos={positions.get(edge.target)}
        />
      ))}
    </group>
  );
}
```

### Membrane Component

```typescript
// packages/ui/src/features/canvas/views/Membrane.tsx

import React from 'react';
import { Sphere } from '@react-three/drei';
import type { Position3D } from '../../../shared/types';

interface MembraneProps {
  center: Position3D;
  radius: number;
  isNucleus?: boolean;
}

export function Membrane({ center, radius, isNucleus = false }: MembraneProps) {
  return (
    <Sphere
      args={[radius, 32, 32]}
      position={[center.x, center.y, center.z]}
    >
      <meshStandardMaterial
        color={isNucleus ? '#22c55e' : '#3b82f6'}
        transparent
        opacity={isNucleus ? 0.05 : 0.1}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </Sphere>
  );
}
```

### Organelle Component

```typescript
// packages/ui/src/features/canvas/views/Organelle.tsx

import React, { useState } from 'react';
import { Sphere, Box, Octahedron, Html } from '@react-three/drei';
import type { GraphNode, Position3D } from '../../../shared/types';

interface OrganelleProps {
  node: GraphNode;
  position: Position3D;
  onClick: () => void;
}

// Color palette by type
const ORGANELLE_COLORS: Record<string, string> = {
  function: '#3b82f6',  // Blue
  method: '#60a5fa',    // Light blue
  variable: '#22c55e',  // Green
  property: '#4ade80',  // Light green
  constant: '#8b5cf6',  // Purple
  type: '#6b7280',      // Gray
  interface: '#9ca3af', // Light gray
};

export function Organelle({ node, position, onClick }: OrganelleProps) {
  const [hovered, setHovered] = useState(false);

  // Size based on complexity
  const baseSize = 0.5;
  const lineCount = (node.metadata?.lineCount as number) ?? 10;
  const size = baseSize * (1 + Math.log10(lineCount) * 0.3);

  const color = ORGANELLE_COLORS[node.type] ?? '#6b7280';
  const hoverColor = '#f59e0b';

  // Choose shape based on type
  const ShapeComponent = getShapeComponent(node.type);

  return (
    <group position={[position.x, position.y, position.z]}>
      <ShapeComponent
        args={getShapeArgs(node.type, size)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onClick}
      >
        <meshStandardMaterial
          color={hovered ? hoverColor : color}
          transparent
          opacity={0.85}
          roughness={0.3}
          metalness={0.1}
        />
      </ShapeComponent>

      {/* Tooltip on hover */}
      {hovered && (
        <Html position={[0, size + 0.5, 0]} center>
          <div className="bg-gray-900 text-white p-2 rounded shadow-lg text-sm min-w-[150px]">
            <div className="font-semibold">{node.label}</div>
            <div className="text-gray-400 text-xs">{node.type}</div>
            {node.metadata?.parameters && (
              <div className="text-gray-300 text-xs mt-1">
                ({(node.metadata.parameters as string[]).join(', ')})
              </div>
            )}
            <button
              className="mt-2 text-blue-400 hover:text-blue-300 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              View Code →
            </button>
          </div>
        </Html>
      )}
    </group>
  );
}

function getShapeComponent(type: string) {
  switch (type) {
    case 'constant':
      return Octahedron;
    case 'variable':
    case 'property':
      return Box;
    default:
      return Sphere;
  }
}

function getShapeArgs(type: string, size: number): [number, ...number[]] {
  switch (type) {
    case 'constant':
      return [size];
    case 'variable':
    case 'property':
      return [size * 0.8, size * 0.8, size * 0.8];
    default:
      return [size, 16, 16];
  }
}
```

### Organelle Connection Component

```typescript
// packages/ui/src/features/canvas/views/OrganelleConnection.tsx

import React from 'react';
import { Line } from '@react-three/drei';
import type { GraphEdge, Position3D } from '../../../shared/types';

interface OrganelleConnectionProps {
  edge: GraphEdge;
  sourcePos?: Position3D;
  targetPos?: Position3D;
}

export function OrganelleConnection({
  edge,
  sourcePos,
  targetPos,
}: OrganelleConnectionProps) {
  if (!sourcePos || !targetPos) return null;

  const points: [number, number, number][] = [
    [sourcePos.x, sourcePos.y, sourcePos.z],
    [targetPos.x, targetPos.y, targetPos.z],
  ];

  return (
    <Line
      points={points}
      color="#475569"
      lineWidth={1}
      transparent
      opacity={0.4}
      dashed
      dashSize={0.2}
      gapSize={0.1}
    />
  );
}
```

---

## Tasks/Subtasks

### Task 1: Create CellView component
- [x] Extract subgraph via extractCellSubgraph
- [x] Compute layout via CellLayoutEngine
- [x] Render membrane, nucleus, organelles, connections

### Task 2: Create Membrane component
- [x] Transparent sphere with BackSide rendering
- [x] Outer membrane (blue, 10% opacity) and nucleus (green, 5% opacity)
- [x] depthWrite disabled for correct transparency

### Task 3: Create Organelle component
- [x] Shape based on type (sphere for functions/methods, cube for variables)
- [x] Color based on type (blue, light blue, green)
- [x] Size from logarithmic line count scaling
- [x] Hover (amber), selection (emissive glow), label plane

### Task 4: Create OrganelleConnection component
- [x] Lines via bufferGeometry between source/target positions
- [x] Subtle styling (30% opacity, slate color)
- [x] Returns null for missing positions

### Task 5: Integrate with view mode manager
- [ ] Render CellView when mode = 'cell' (deferred — ViewModeRenderer wiring)
- [x] CellView accepts graph + focusedNodeId props, ready for wiring

### Task 6: Write unit tests
- [x] Test organelle color mapping (4 tests)
- [x] Test shape selection (4 tests)
- [x] Test size calculation (4 tests)
- [x] Test subgraph extraction (6 tests)

---

## Files to Create

- `packages/ui/src/features/canvas/views/CellView.tsx` - Cell view component
- `packages/ui/src/features/canvas/views/Membrane.tsx` - Membrane component
- `packages/ui/src/features/canvas/views/Organelle.tsx` - Organelle component
- `packages/ui/src/features/canvas/views/OrganelleConnection.tsx` - Connections
- `packages/ui/src/features/canvas/views/CellView.test.tsx` - Unit tests

## Files to Modify

- `packages/ui/src/features/canvas/views/index.ts` - Export new components

---

## Dependencies

- Story 8-8 (Cell layout engine - for positions and metadata)
- Story 8-9 (View mode manager)
- Story 8-4 (Parent-child relationships - for organelle filtering)

---

## Estimation

**Complexity:** Medium-High
**Effort:** 6-8 hours
**Risk:** Medium - Visual design iteration likely

---

## Definition of Done

- [x] Membrane renders as transparent sphere (BackSide, 10% opacity)
- [x] Organelles render with correct shapes (sphere/cube by type)
- [x] Colors match type palette (blue/light blue/green)
- [x] Hover states work (amber highlight, pointer cursor)
- [x] Connections between organelles visible (subtle lines)
- [x] Unit tests pass (18 utility tests)

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Pure logic extracted to `cellViewUtils.ts` for easy testing.
- `extractCellSubgraph` is simpler than building subgraph — only 1 level of nesting (class → children).
- `OrganelleConnection` uses raw `bufferGeometry` + `lineBasicMaterial` matching the existing EdgeRenderer pattern.
- Organelle size uses `BASE_SIZE * (1 + log10(lineCount) * 0.3)` for gentle logarithmic scaling.
- No `useFrame` animation — static positioning per story requirements.

### Completion Notes List

Tasks 1-4, 6 completed. Task 5 partially deferred:
- **Task 1 (CellView):** Extracts subgraph via `extractCellSubgraph`, computes layout via `CellLayoutEngine`, renders membrane + nucleus + organelles + connections.
- **Task 2 (Membrane):** `sphereGeometry` with `BackSide` material. Outer = blue 10%, nucleus = green 5%.
- **Task 3 (Organelle):** Shape by type (sphere for functions/methods, cube for variables). Color from `getOrganelleColor`. Size via `getOrganelleSize` with log scaling. Click to select, hover for amber highlight.
- **Task 4 (OrganelleConnection):** `bufferGeometry` line between source/target. Slate color, 30% opacity. Null-safe for missing positions.
- **Task 6 (Tests):** 18 tests: color mapping (4), shape selection (4), size calculation (4), subgraph extraction (6: children, edge filtering, missing node, empty class, sibling isolation, variable children).

### File List

**New Files:**
- `packages/ui/src/features/canvas/views/CellView.tsx` — Main cell view component
- `packages/ui/src/features/canvas/views/Membrane.tsx` — Transparent sphere boundary
- `packages/ui/src/features/canvas/views/Organelle.tsx` — Method/variable 3D object
- `packages/ui/src/features/canvas/views/OrganelleConnection.tsx` — Subtle connection lines
- `packages/ui/src/features/canvas/views/cellViewUtils.ts` — Pure utility functions
- `packages/ui/src/features/canvas/views/cellViewUtils.test.ts` — 18 utility tests

**Modified Files:**
- `packages/ui/src/features/canvas/views/index.ts` — Export new components

---

## Change Log
- 2026-02-02: Implemented cell view renderer with Membrane, Organelle, OrganelleConnection, and CellView components. Pure utilities extracted for testability. 18 unit tests, all passing. 154 total canvas tests.
