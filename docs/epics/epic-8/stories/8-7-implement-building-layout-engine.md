# Story 8-7: Implement Building Layout Engine

**Status:** review

---

## Story

**ID:** 8-7
**Key:** 8-7-implement-building-layout-engine
**Title:** Implement Building Layout Algorithm with Floors and Rooms
**Epic:** Epic 8 - City-to-Cell 3D Layout
**Phase:** Implementation - Phase 2 (Layout System)
**Priority:** HIGH - Required for building view

**As a** developer exploring inside a file,
**I want** classes and functions laid out as floors and rooms inside a building,
**So that** I can see the internal structure of a file as an architectural space.

**Description:**

Implement the building layout engine that positions a file's child nodes (classes, top-level functions) as floors and rooms within a building. Each class occupies a floor, with methods as rooms on that floor.

**Context:**

From UX 3D Layout Vision:
- Inside a file = building interior
- Classes = floors
- Functions at file level = rooms on ground floor
- Scale: room-sized spaces

Layout strategy:
- Vertical stacking for classes (floors)
- Horizontal grid within floors (rooms)
- Common areas for module-level items
- Building walls define boundary

---

## Acceptance Criteria

- **AC-1:** Classes positioned as floors
  - Each class occupies a floor at a distinct Y level
  - Floor spacing consistent
  - Floors stack vertically

- **AC-2:** File-level functions as ground floor rooms
  - Top-level functions/variables on ground floor
  - Grid arrangement within floor

- **AC-3:** Building footprint calculated
  - Width/depth based on largest floor
  - Consistent wall boundary

- **AC-4:** Floor metadata tracked
  - Which floor = which class
  - Floor Y level
  - Room positions within floor

- **AC-5:** Deterministic layout
  - Same file = same layout
  - Sorted by declaration order or name

---

## Technical Approach

### Building Layout Engine

```typescript
// packages/ui/src/features/canvas/layout/engines/buildingLayout.ts

import type { LayoutEngine, LayoutConfig, LayoutResult, BoundingBox } from '../types';
import type { Graph, GraphNode, Position3D } from '../../../../shared/types';

interface BuildingLayoutConfig extends LayoutConfig {
  floorHeight?: number;
  roomSize?: number;
  roomSpacing?: number;
  wallPadding?: number;
}

export class BuildingLayoutEngine implements LayoutEngine {
  readonly type = 'building' as const;

  layout(graph: Graph, config: BuildingLayoutConfig): LayoutResult {
    const positions = new Map<string, Position3D>();
    const {
      floorHeight = 4,
      roomSize = 2,
      roomSpacing = 1,
      wallPadding = 2,
    } = config;

    // Get the building node (file)
    const fileNode = graph.nodes.find(n => n.type === 'file' && !n.isExternal);
    if (!fileNode) return { positions, bounds: this.emptyBounds() };

    // Separate children by type
    const children = graph.nodes.filter(n => n.parentId === fileNode.id);
    const classes = children.filter(n => n.type === 'class');
    const fileLevelItems = children.filter(n => n.type !== 'class');

    // Building origin
    const origin = fileNode.position ?? { x: 0, y: 0, z: 0 };
    positions.set(fileNode.id, origin);

    let currentFloor = 0;
    let maxWidth = 0;
    let maxDepthZ = 0;

    // Ground floor: file-level functions/variables
    if (fileLevelItems.length > 0) {
      const floorResult = this.layoutFloor(
        fileLevelItems,
        origin,
        currentFloor * floorHeight,
        roomSize,
        roomSpacing
      );
      for (const [id, pos] of floorResult.positions) {
        positions.set(id, pos);
      }
      maxWidth = Math.max(maxWidth, floorResult.width);
      maxDepthZ = Math.max(maxDepthZ, floorResult.depth);
      currentFloor++;
    }

    // Upper floors: one per class
    const sortedClasses = [...classes].sort((a, b) =>
      a.label.localeCompare(b.label)
    );

    for (const classNode of sortedClasses) {
      const floorY = currentFloor * floorHeight;

      // Position the class node at floor level
      positions.set(classNode.id, {
        x: origin.x,
        y: origin.y + floorY,
        z: origin.z,
      });

      // Get methods/properties of this class
      const classChildren = graph.nodes.filter(
        n => n.parentId === classNode.id
      );

      if (classChildren.length > 0) {
        const floorResult = this.layoutFloor(
          classChildren,
          origin,
          floorY,
          roomSize,
          roomSpacing
        );
        for (const [id, pos] of floorResult.positions) {
          positions.set(id, pos);
        }
        maxWidth = Math.max(maxWidth, floorResult.width);
        maxDepthZ = Math.max(maxDepthZ, floorResult.depth);
      }

      currentFloor++;
    }

    const totalHeight = currentFloor * floorHeight;
    const buildingWidth = maxWidth + wallPadding * 2;
    const buildingDepth = maxDepthZ + wallPadding * 2;

    return {
      positions,
      bounds: {
        min: {
          x: origin.x - wallPadding,
          y: origin.y,
          z: origin.z - wallPadding,
        },
        max: {
          x: origin.x + buildingWidth - wallPadding,
          y: origin.y + totalHeight,
          z: origin.z + buildingDepth - wallPadding,
        },
      },
      metadata: {
        floorCount: currentFloor,
        floorHeight,
        buildingWidth,
        buildingDepth,
        totalHeight,
        floors: sortedClasses.map((c, i) => ({
          classId: c.id,
          floorIndex: fileLevelItems.length > 0 ? i + 1 : i,
          y: (fileLevelItems.length > 0 ? i + 1 : i) * floorHeight,
        })),
      },
    };
  }

  canHandle(graph: Graph): boolean {
    // Building layout needs parent-child relationships within a file
    return graph.nodes.some(
      n => n.parentId !== undefined && (n.type === 'class' || n.type === 'function')
    );
  }

  private layoutFloor(
    nodes: GraphNode[],
    origin: Position3D,
    floorY: number,
    roomSize: number,
    roomSpacing: number
  ): { positions: Map<string, Position3D>; width: number; depth: number } {
    const positions = new Map<string, Position3D>();
    const sorted = [...nodes].sort((a, b) => a.label.localeCompare(b.label));
    const gridSize = Math.ceil(Math.sqrt(sorted.length));
    const spacing = roomSize + roomSpacing;

    for (let i = 0; i < sorted.length; i++) {
      const col = i % gridSize;
      const row = Math.floor(i / gridSize);

      positions.set(sorted[i].id, {
        x: origin.x + col * spacing + roomSize / 2,
        y: origin.y + floorY + roomSize / 2,
        z: origin.z + row * spacing + roomSize / 2,
      });
    }

    return {
      positions,
      width: gridSize * spacing,
      depth: Math.ceil(sorted.length / gridSize) * spacing,
    };
  }

  private emptyBounds(): BoundingBox {
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 },
    };
  }
}
```

---

## Tasks/Subtasks

### Task 1: Implement floor stacking
- [x] Classes as separate floors
- [x] Consistent floor height
- [x] File-level items on ground floor

### Task 2: Implement room layout within floors
- [x] Grid layout for methods/properties
- [x] Consistent room sizing
- [x] Sort for determinism

### Task 3: Calculate building envelope
- [x] Width from widest floor
- [x] Wall padding
- [x] Total height

### Task 4: Track floor metadata
- [x] Floor-to-class mapping
- [x] Floor Y positions
- [x] Room positions

### Task 5: Write unit tests
- [x] Test single class file
- [x] Test multi-class file
- [x] Test file with only functions
- [x] Test empty file
- [x] Test deterministic output

---

## Files to Create

- `packages/ui/src/features/canvas/layout/engines/buildingLayout.ts` - Building layout engine
- `packages/ui/src/features/canvas/layout/engines/buildingLayout.test.ts` - Unit tests

## Files to Modify

- `packages/ui/src/features/canvas/layout/engines/index.ts` - Export
- `packages/ui/src/features/canvas/layout/index.ts` - Re-export

---

## Dependencies

- Story 8-5 (Layout engine interface)
- Story 8-4 (Parent-child relationships)

---

## Definition of Done

- [x] Classes as floors with correct Y positions
- [x] Methods/functions as rooms within floors
- [x] Building envelope calculated
- [x] Floor metadata tracked
- [x] Deterministic layout
- [x] Unit tests pass

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All 15 tests pass on first GREEN attempt. No bugs encountered.
- Method nodes don't exist as separate DependencyNodes currently (stored as class metadata). The engine handles class children if present, gracefully ignoring when empty.

### Completion Notes List

All 5 tasks completed:
- **Task 1 (Floor stacking):** Classes sorted alphabetically, each assigned a floor. File-level functions on ground floor (Y=0). Each floor at `floorIndex * floorHeight`.
- **Task 2 (Room layout):** `layoutFloor()` arranges nodes in a square grid within each floor. Rooms offset by `roomSize/2` for centering. Sorted alphabetically for determinism.
- **Task 3 (Building envelope):** Bounds calculated from origin ± wallPadding, max floor width/depth, totalHeight.
- **Task 4 (Floor metadata):** Metadata includes `floorCount`, `floorHeight`, `buildingWidth`, `buildingDepth`, `totalHeight`, and `floors[]` array mapping classId → floorIndex → Y.
- **Task 5 (Tests):** 15 tests: type identity, canHandle (parentId/no-parentId/empty), file at origin, classes as floors, functions on ground floor, functions-only, classes-only, no file node, determinism, bounds, metadata, custom origin, custom config.

### File List

**New Files:**
- `packages/ui/src/features/canvas/layout/engines/buildingLayout.ts` — BuildingLayoutEngine class
- `packages/ui/src/features/canvas/layout/engines/buildingLayout.test.ts` — 15 unit tests

**Modified Files:**
- `packages/ui/src/features/canvas/layout/engines/index.ts` — Export BuildingLayoutEngine
- `packages/ui/src/features/canvas/layout/index.ts` — Re-export BuildingLayoutEngine

---

## Change Log
- 2026-02-02: Implemented building layout engine with floor stacking, room grids, building envelope, and floor metadata. 15 unit tests, all passing.
