# Story 8-11: Implement Building View Renderer

**Status:** not-started

---

## Story

**ID:** 8-11
**Key:** 8-11-implement-building-view-renderer
**Title:** Implement Building View Renderer with Floors and Rooms
**Epic:** Epic 8 - City-to-Cell 3D Layout
**Phase:** Implementation - Phase 3 (View Modes)
**Priority:** HIGH - Mid-level exploration

**As a** developer exploring inside a file,
**I want** to see classes as floors and functions as rooms inside a building,
**So that** I can understand the internal structure of a file as an architectural space.

**Description:**

Implement the BuildingView renderer that displays the interior of a file as a multi-story building. Classes occupy separate floors, methods are rooms on those floors, and the building walls provide spatial context.

**Context:**

From UX 3D Layout Vision:
- Inside a file = multi-story building
- Floors = classes
- Rooms = methods/functions
- Walls provide boundary reference
- Scale: room-sized

---

## Acceptance Criteria

- **AC-1:** Building walls rendered
  - Semi-transparent walls for boundary
  - Visible from inside
  - Floor/ceiling planes per level

- **AC-2:** Classes rendered as floors
  - Floor slab at each class Y level
  - Floor label visible
  - Visual separation between floors

- **AC-3:** Methods/functions rendered as rooms
  - Room-sized boxes or outlined spaces
  - Color indicates type
  - Label for each room

- **AC-4:** Floor navigation
  - Click class to fly to that floor
  - Floor indicator in UI
  - Scroll between floors

- **AC-5:** Double-click class to enter cell mode
  - Triggers view mode transition
  - Pushes to navigation history

- **AC-6:** Connections between rooms
  - Call edges shown as lines between rooms
  - Cross-floor connections visible
  - Subtle styling

---

## Technical Approach

### BuildingView Component

```typescript
// packages/ui/src/features/canvas/views/BuildingView.tsx

import React, { useMemo } from 'react';
import { BuildingWalls } from './BuildingWalls';
import { Floor } from './Floor';
import { Room } from './Room';
import { useCanvasStore } from '../store';
import { BuildingLayoutEngine } from '../layout/engines/buildingLayout';
import type { Graph, Position3D } from '../../../shared/types';

interface BuildingViewProps {
  graph: Graph;
  focusedNodeId: string;
}

export function BuildingView({ graph, focusedNodeId }: BuildingViewProps) {
  const enterNode = useCanvasStore(s => s.enterNode);
  const selectedNodeId = useCanvasStore(s => s.selectedNodeId);

  // Create subgraph for this file and its children
  const subgraph = useMemo(() => {
    const fileNode = graph.nodes.find(n => n.id === focusedNodeId);
    if (!fileNode) return null;

    const children = graph.nodes.filter(
      n => n.parentId === focusedNodeId ||
           graph.nodes.some(
             c => c.parentId === focusedNodeId && n.parentId === c.id
           )
    );

    const relevantIds = new Set([fileNode.id, ...children.map(c => c.id)]);
    const relevantEdges = graph.edges.filter(
      e => relevantIds.has(e.source) && relevantIds.has(e.target)
    );

    return {
      nodes: [fileNode, ...children],
      edges: relevantEdges,
    };
  }, [graph, focusedNodeId]);

  // Compute layout
  const layout = useMemo(() => {
    if (!subgraph) return null;
    const engine = new BuildingLayoutEngine();
    return engine.layout(subgraph, {});
  }, [subgraph]);

  if (!subgraph || !layout) return null;

  const metadata = layout.metadata as {
    floorCount: number;
    floorHeight: number;
    buildingWidth: number;
    buildingDepth: number;
    totalHeight: number;
    floors: Array<{ classId: string; floorIndex: number; y: number }>;
  };

  // Get classes (floors) and their children (rooms)
  const classes = subgraph.nodes.filter(n => n.type === 'class');
  const rooms = subgraph.nodes.filter(
    n => ['function', 'method', 'variable'].includes(n.type)
  );

  return (
    <group name="building-view">
      {/* Building walls */}
      <BuildingWalls
        width={metadata.buildingWidth}
        height={metadata.totalHeight}
        depth={metadata.buildingDepth}
        origin={layout.bounds.min}
      />

      {/* Floors */}
      {metadata.floors.map(floor => (
        <Floor
          key={floor.classId}
          classNode={subgraph.nodes.find(n => n.id === floor.classId)!}
          y={floor.y}
          width={metadata.buildingWidth}
          depth={metadata.buildingDepth}
          origin={layout.bounds.min}
          onDoubleClick={() => enterNode(floor.classId)}
        />
      ))}

      {/* Rooms */}
      {rooms.map(node => {
        const pos = layout.positions.get(node.id);
        if (!pos) return null;

        return (
          <Room
            key={node.id}
            node={node}
            position={pos}
            isSelected={selectedNodeId === node.id}
          />
        );
      })}
    </group>
  );
}
```

### BuildingWalls Component

```typescript
// packages/ui/src/features/canvas/views/BuildingWalls.tsx

import React from 'react';
import { Box } from '@react-three/drei';
import * as THREE from 'three';
import type { Position3D } from '../../../shared/types';

interface BuildingWallsProps {
  width: number;
  height: number;
  depth: number;
  origin: Position3D;
}

export function BuildingWalls({ width, height, depth, origin }: BuildingWallsProps) {
  return (
    <Box
      args={[width, height, depth]}
      position={[
        origin.x + width / 2,
        origin.y + height / 2,
        origin.z + depth / 2,
      ]}
    >
      <meshStandardMaterial
        color="#475569"
        transparent
        opacity={0.08}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </Box>
  );
}
```

### Floor and Room Components

```typescript
// packages/ui/src/features/canvas/views/Floor.tsx

import React, { useState } from 'react';
import { Plane, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { GraphNode, Position3D } from '../../../shared/types';

interface FloorProps {
  classNode: GraphNode;
  y: number;
  width: number;
  depth: number;
  origin: Position3D;
  onDoubleClick: () => void;
}

export function Floor({ classNode, y, width, depth, origin, onDoubleClick }: FloorProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <group>
      {/* Floor slab */}
      <Plane
        args={[width, depth]}
        position={[origin.x + width / 2, y, origin.z + depth / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onDoubleClick={onDoubleClick}
      >
        <meshStandardMaterial
          color={hovered ? '#334155' : '#1e293b'}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </Plane>

      {/* Floor label */}
      <Billboard position={[origin.x - 1, y + 0.5, origin.z + depth / 2]}>
        <Text
          fontSize={0.4}
          color="#94a3b8"
          anchorX="right"
        >
          {classNode.label}
        </Text>
      </Billboard>
    </group>
  );
}
```

```typescript
// packages/ui/src/features/canvas/views/Room.tsx

import React, { useState } from 'react';
import { Box, Text, Billboard, Html } from '@react-three/drei';
import type { GraphNode, Position3D } from '../../../shared/types';

const ROOM_COLORS: Record<string, string> = {
  function: '#3b82f6',
  method: '#60a5fa',
  variable: '#22c55e',
};

interface RoomProps {
  node: GraphNode;
  position: Position3D;
  isSelected: boolean;
}

export function Room({ node, position, isSelected }: RoomProps) {
  const [hovered, setHovered] = useState(false);
  const color = ROOM_COLORS[node.type] ?? '#6b7280';
  const size = 1.5;

  return (
    <group position={[position.x, position.y, position.z]}>
      <Box
        args={[size, size, size]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={hovered ? '#f59e0b' : color}
          transparent
          opacity={0.6}
          emissive={isSelected ? color : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </Box>

      <Billboard position={[0, size / 2 + 0.3, 0]}>
        <Text fontSize={0.25} color="white">
          {node.label}
        </Text>
      </Billboard>

      {hovered && (
        <Html position={[0, size + 0.5, 0]} center>
          <div className="bg-gray-900 text-white p-2 rounded text-xs">
            <div className="font-semibold">{node.label}</div>
            <div className="text-gray-400">{node.type}</div>
          </div>
        </Html>
      )}
    </group>
  );
}
```

---

## Tasks/Subtasks

### Task 1: Create BuildingView component
- [ ] Build subgraph for focused file
- [ ] Compute building layout
- [ ] Render walls, floors, rooms

### Task 2: Create BuildingWalls component
- [ ] Semi-transparent box
- [ ] Sized from layout bounds
- [ ] Visible from inside

### Task 3: Create Floor component
- [ ] Floor slab plane
- [ ] Class label
- [ ] Double-click to enter class

### Task 4: Create Room component
- [ ] Box per method/function
- [ ] Type-based color
- [ ] Hover tooltip, label

### Task 5: Integrate with ViewModeRenderer
- [ ] Render in building mode
- [ ] Pass focused node ID

### Task 6: Write unit tests
- [ ] Test subgraph extraction
- [ ] Test floor rendering
- [ ] Test room rendering
- [ ] Test interaction handlers

---

## Files to Create

- `packages/ui/src/features/canvas/views/BuildingView.tsx` - Building view component
- `packages/ui/src/features/canvas/views/BuildingWalls.tsx` - Walls component
- `packages/ui/src/features/canvas/views/Floor.tsx` - Floor component
- `packages/ui/src/features/canvas/views/Room.tsx` - Room component
- `packages/ui/src/features/canvas/views/BuildingView.test.tsx` - Tests

## Files to Modify

- `packages/ui/src/features/canvas/views/index.ts` - Export new components

---

## Dependencies

- Story 8-7 (Building layout engine)
- Story 8-9 (View mode manager)
- Story 8-4 (Parent-child relationships)

---

## Estimation

**Complexity:** Medium-High
**Effort:** 6-8 hours
**Risk:** Medium - Interior rendering and interaction tuning

---

## Definition of Done

- [ ] Building walls render transparently
- [ ] Floors at correct Y levels with labels
- [ ] Rooms render with type colors
- [ ] Double-click class enters cell mode
- [ ] Hover tooltips work
- [ ] Unit tests pass
