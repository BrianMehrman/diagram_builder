# Story 8-10: Implement City View Renderer

**Status:** not-started

---

## Story

**ID:** 8-10
**Key:** 8-10-implement-city-view-renderer
**Title:** Implement City View Renderer with Building Silhouettes
**Epic:** Epic 8 - City-to-Cell 3D Layout
**Phase:** Implementation - Phase 3 (View Modes)
**Priority:** HIGH - Primary macro-level visualization

**As a** developer viewing the full codebase,
**I want** to see files rendered as 3D buildings in a city layout,
**So that** I get an architectural overview of the entire codebase.

**Description:**

Implement the CityView renderer that displays files as 3D building silhouettes. Building height represents abstraction depth, color indicates directory/feature grouping, and external libraries appear as distinct neighboring buildings.

**Context:**

From UX 3D Layout Vision:
- Buildings rise from ground plane
- Height = abstraction depth
- Building style = architectural (boxes with windows/details)
- Ground plane with grid lines (streets)
- External buildings have different style

---

## Acceptance Criteria

- **AC-1:** Files rendered as 3D buildings
  - Box geometry with width, depth, and height
  - Height from node depth
  - Positioned from city layout engine

- **AC-2:** Building color by directory
  - Different hue per directory
  - Consistent within directory
  - External buildings have distinct color

- **AC-3:** Ground plane rendered
  - Flat grid at Y=0
  - Grid lines for streets
  - Extends to cover all buildings

- **AC-4:** Building labels
  - File name floating above building
  - Visible from city distance
  - Billboard text (faces camera)

- **AC-5:** Hover and selection
  - Highlight on hover
  - Selection glow
  - Double-click to enter building (triggers mode change)

- **AC-6:** External library buildings
  - Smaller size
  - Different material (glass/wireframe)
  - Ring layout position

---

## Technical Approach

### CityView Component

```typescript
// packages/ui/src/features/canvas/views/CityView.tsx

import React, { useMemo } from 'react';
import { Building } from './Building';
import { GroundPlane } from './GroundPlane';
import { ExternalBuilding } from './ExternalBuilding';
import { useCanvasStore } from '../store';
import { CityLayoutEngine } from '../layout/engines/cityLayout';
import type { Graph } from '../../../shared/types';

interface CityViewProps {
  graph: Graph;
}

export function CityView({ graph }: CityViewProps) {
  const enterNode = useCanvasStore(s => s.enterNode);
  const selectedNodeId = useCanvasStore(s => s.selectedNodeId);

  // Compute layout
  const layout = useMemo(() => {
    const engine = new CityLayoutEngine();
    return engine.layout(graph, {});
  }, [graph]);

  // Separate internal and external
  const internalFiles = graph.nodes.filter(
    n => n.type === 'file' && !n.isExternal
  );
  const externalFiles = graph.nodes.filter(n => n.isExternal);

  const groundPlane = layout.metadata?.groundPlane as {
    y: number;
    width: number;
    depth: number;
  } | undefined;

  return (
    <group name="city-view">
      {/* Ground plane */}
      <GroundPlane
        width={groundPlane?.width ?? 100}
        depth={groundPlane?.depth ?? 100}
      />

      {/* Internal buildings */}
      {internalFiles.map(node => {
        const pos = layout.positions.get(node.id);
        if (!pos) return null;

        return (
          <Building
            key={node.id}
            node={node}
            position={pos}
            isSelected={selectedNodeId === node.id}
            onDoubleClick={() => enterNode(node.id)}
          />
        );
      })}

      {/* External library buildings */}
      {externalFiles.map(node => {
        const pos = layout.positions.get(node.id);
        if (!pos) return null;

        return (
          <ExternalBuilding
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

### Building Component

```typescript
// packages/ui/src/features/canvas/views/Building.tsx

import React, { useState } from 'react';
import { Box, Text, Billboard } from '@react-three/drei';
import type { GraphNode, Position3D } from '../../../shared/types';

interface BuildingProps {
  node: GraphNode;
  position: Position3D;
  isSelected: boolean;
  onDoubleClick: () => void;
}

// Directory color palette
const DIR_COLORS: Record<string, string> = {};
const COLOR_PALETTE = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316',
  '#14b8a6', '#84cc16', '#f59e0b', '#06b6d4',
];
let colorIndex = 0;

function getDirectoryColor(label: string): string {
  const dir = label.includes('/') ? label.split('/').slice(0, -1).join('/') : 'root';
  if (!DIR_COLORS[dir]) {
    DIR_COLORS[dir] = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
    colorIndex++;
  }
  return DIR_COLORS[dir];
}

export function Building({ node, position, isSelected, onDoubleClick }: BuildingProps) {
  const [hovered, setHovered] = useState(false);

  const buildingWidth = 2;
  const buildingDepth = 2;
  const floorHeight = 3;
  const buildingHeight = Math.max(floorHeight, (node.depth + 1) * floorHeight);

  const color = getDirectoryColor(node.label);
  const fileName = node.label.split('/').pop() ?? node.label;

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Building body */}
      <Box
        args={[buildingWidth, buildingHeight, buildingDepth]}
        position={[0, buildingHeight / 2, 0]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onDoubleClick={onDoubleClick}
      >
        <meshStandardMaterial
          color={hovered ? '#f59e0b' : color}
          emissive={isSelected ? color : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
          roughness={0.7}
          metalness={0.1}
        />
      </Box>

      {/* Building label */}
      <Billboard position={[0, buildingHeight + 1, 0]}>
        <Text
          fontSize={0.5}
          color="white"
          anchorX="center"
          anchorY="bottom"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          {fileName}
        </Text>
      </Billboard>
    </group>
  );
}
```

### GroundPlane Component

```typescript
// packages/ui/src/features/canvas/views/GroundPlane.tsx

import React from 'react';
import { Grid } from '@react-three/drei';

interface GroundPlaneProps {
  width: number;
  depth: number;
}

export function GroundPlane({ width, depth }: GroundPlaneProps) {
  const size = Math.max(width, depth) * 1.5;

  return (
    <Grid
      args={[size, size]}
      cellSize={3}
      cellThickness={0.5}
      cellColor="#1e293b"
      sectionSize={15}
      sectionThickness={1}
      sectionColor="#334155"
      fadeDistance={size}
      fadeStrength={1}
      followCamera={false}
      position={[size / 4, 0, size / 4]}
    />
  );
}
```

---

## Tasks/Subtasks

### Task 1: Create CityView component
- [ ] Compute layout from city engine
- [ ] Render internal and external buildings
- [ ] Wire up double-click

### Task 2: Create Building component
- [ ] Box geometry with height from depth
- [ ] Directory-based color
- [ ] Hover and selection states
- [ ] Billboard label

### Task 3: Create ExternalBuilding component
- [ ] Smaller wireframe style
- [ ] Distinct color scheme
- [ ] Package name label

### Task 4: Create GroundPlane component
- [ ] Grid at Y=0
- [ ] Street grid lines
- [ ] Sized to fit city

### Task 5: Integrate with ViewModeRenderer
- [ ] CityView rendered in city mode
- [ ] Pass graph data

### Task 6: Write unit tests
- [ ] Test building rendering
- [ ] Test color assignment
- [ ] Test ground plane sizing
- [ ] Test interaction handlers

---

## Files to Create

- `packages/ui/src/features/canvas/views/CityView.tsx` - City view component
- `packages/ui/src/features/canvas/views/Building.tsx` - Building component
- `packages/ui/src/features/canvas/views/ExternalBuilding.tsx` - External building
- `packages/ui/src/features/canvas/views/GroundPlane.tsx` - Ground plane
- `packages/ui/src/features/canvas/views/index.ts` - Exports
- `packages/ui/src/features/canvas/views/CityView.test.tsx` - Tests

## Files to Modify

- `packages/ui/src/features/canvas/components/ViewModeRenderer.tsx` - Wire CityView

---

## Dependencies

- Story 8-6 (City layout engine)
- Story 8-9 (View mode manager)

---

## Estimation

**Complexity:** Medium-High
**Effort:** 6-8 hours
**Risk:** Medium - Visual tuning needed

---

## Definition of Done

- [ ] Buildings render at correct positions
- [ ] Height reflects depth
- [ ] Colors assigned by directory
- [ ] Ground plane visible
- [ ] Labels readable
- [ ] Hover/selection work
- [ ] Double-click enters building
- [ ] Unit tests pass
