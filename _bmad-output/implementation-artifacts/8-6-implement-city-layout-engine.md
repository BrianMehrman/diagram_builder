# Story 8-6: Implement City Layout Engine

**Status:** review

---

## Story

**ID:** 8-6
**Key:** 8-6-implement-city-layout-engine
**Title:** Implement City Layout Algorithm with Building Silhouettes
**Epic:** Epic 8 - City-to-Cell 3D Layout
**Phase:** Implementation - Phase 2 (Layout System)
**Priority:** HIGH - Primary macro-level layout

**As a** developer viewing the full codebase,
**I want** files laid out as buildings in a city grid,
**So that** I can see the overall architecture with building height representing abstraction depth.

**Description:**

Implement the city layout engine that positions file-level nodes as buildings on a 2D grid. Building height (Y-axis) is determined by the node's abstraction depth. External libraries are positioned as neighboring buildings in a separate district.

**Context:**

From UX 3D Layout Vision:
- Each file = a building
- Building height = abstraction depth (deeper = taller)
- External libraries = separate district
- Grid layout with spacing for streets
- Scale: city block = building-sized

Layout strategy:
- Group files by directory (neighborhoods)
- Space neighborhoods apart
- External libraries in a ring around the main city
- Ground plane at Y=0

---

## Acceptance Criteria

- **AC-1:** Files positioned on X-Z grid
  - Files arranged in a grid pattern
  - Spacing between buildings (streets)
  - Consistent building footprint

- **AC-2:** Building height from depth
  - Y position = depth * floorHeight
  - Entry points at ground level
  - Deeper abstractions rise higher

- **AC-3:** Directory grouping (neighborhoods)
  - Files in same directory clustered together
  - Gap between directory clusters
  - Visual district boundaries

- **AC-4:** External libraries positioned separately
  - Ring or district around main city
  - Smaller building size for externals
  - Clear visual separation

- **AC-5:** Consistent, deterministic layout
  - Same graph = same positions
  - Stable across re-layouts
  - Alphabetical sort within groups

- **AC-6:** Ground plane reference
  - Layout includes ground plane bounds
  - Y=0 is ground level
  - Metadata includes city bounds

---

## Technical Approach

### City Layout Engine

```typescript
// packages/ui/src/features/canvas/layout/engines/cityLayout.ts

import type { LayoutEngine, LayoutConfig, LayoutResult, BoundingBox } from '../types';
import type { Graph, GraphNode, Position3D } from '../../../../shared/types';

interface CityLayoutConfig extends LayoutConfig {
  buildingSize?: number;
  streetWidth?: number;
  floorHeight?: number;
  neighborhoodGap?: number;
  externalRingRadius?: number;
}

export class CityLayoutEngine implements LayoutEngine {
  readonly type = 'city' as const;

  layout(graph: Graph, config: CityLayoutConfig): LayoutResult {
    const positions = new Map<string, Position3D>();
    const {
      buildingSize = 2,
      streetWidth = 1,
      floorHeight = 3,
      neighborhoodGap = 5,
      externalRingRadius = 50,
    } = config;

    // Separate internal and external nodes
    const fileNodes = graph.nodes.filter(
      n => n.type === 'file' && !n.isExternal
    );
    const externalNodes = graph.nodes.filter(n => n.isExternal);

    // Group by directory (neighborhood)
    const neighborhoods = this.groupByDirectory(fileNodes);

    // Layout neighborhoods
    let offsetX = 0;
    const gridSpacing = buildingSize + streetWidth;

    for (const [dir, nodes] of neighborhoods) {
      // Sort for determinism
      const sorted = [...nodes].sort((a, b) => a.label.localeCompare(b.label));
      const gridSize = Math.ceil(Math.sqrt(sorted.length));

      for (let i = 0; i < sorted.length; i++) {
        const node = sorted[i];
        const col = i % gridSize;
        const row = Math.floor(i / gridSize);

        positions.set(node.id, {
          x: offsetX + col * gridSpacing,
          y: node.depth * floorHeight,
          z: row * gridSpacing,
        });
      }

      offsetX += gridSize * gridSpacing + neighborhoodGap;
    }

    // Layout external libraries in a ring
    if (externalNodes.length > 0) {
      const angleStep = (2 * Math.PI) / externalNodes.length;
      const sorted = [...externalNodes].sort((a, b) =>
        a.label.localeCompare(b.label)
      );

      sorted.forEach((node, i) => {
        const angle = i * angleStep;
        positions.set(node.id, {
          x: Math.cos(angle) * externalRingRadius,
          y: 0,
          z: Math.sin(angle) * externalRingRadius,
        });
      });
    }

    // Calculate bounds
    const bounds = this.calculateBounds(positions);

    return {
      positions,
      bounds,
      metadata: {
        buildingSize,
        floorHeight,
        neighborhoodCount: neighborhoods.size,
        externalCount: externalNodes.length,
        groundPlane: { y: 0, width: bounds.max.x - bounds.min.x, depth: bounds.max.z - bounds.min.z },
      },
    };
  }

  canHandle(graph: Graph): boolean {
    // City layout handles file-level graphs
    return graph.nodes.some(n => n.type === 'file');
  }

  private groupByDirectory(nodes: GraphNode[]): Map<string, GraphNode[]> {
    const groups = new Map<string, GraphNode[]>();

    for (const node of nodes) {
      const dir = this.extractDirectory(node.label);
      if (!groups.has(dir)) groups.set(dir, []);
      groups.get(dir)!.push(node);
    }

    return new Map(
      [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
    );
  }

  private extractDirectory(label: string): string {
    const lastSlash = label.lastIndexOf('/');
    return lastSlash >= 0 ? label.substring(0, lastSlash) : 'root';
  }

  private calculateBounds(positions: Map<string, Position3D>): BoundingBox {
    let min = { x: Infinity, y: Infinity, z: Infinity };
    let max = { x: -Infinity, y: -Infinity, z: -Infinity };

    for (const pos of positions.values()) {
      min = {
        x: Math.min(min.x, pos.x),
        y: Math.min(min.y, pos.y),
        z: Math.min(min.z, pos.z),
      };
      max = {
        x: Math.max(max.x, pos.x),
        y: Math.max(max.y, pos.y),
        z: Math.max(max.z, pos.z),
      };
    }

    return { min, max };
  }
}
```

---

## Tasks/Subtasks

### Task 1: Implement directory grouping
- [x] Extract directory from file path/label
- [x] Group nodes by directory
- [x] Sort groups for determinism

### Task 2: Implement grid positioning
- [x] Square grid per neighborhood
- [x] Y-axis from depth
- [x] Street spacing between buildings

### Task 3: Implement external ring layout
- [x] Position externals in circle
- [x] Configurable ring radius
- [x] Sort for determinism

### Task 4: Calculate bounds and metadata
- [x] Compute bounding box (using boundsFromPositions from 8-5)
- [x] Ground plane metadata
- [x] Neighborhood count

### Task 5: Register with LayoutRegistry
- [x] Exported as 'city' engine
- [x] Implement canHandle for file-level graphs

### Task 6: Write unit tests
- [x] Test single directory
- [x] Test multiple directories
- [x] Test with external nodes
- [x] Test deterministic output
- [x] Test empty graph

---

## Files to Create

- `packages/ui/src/features/canvas/layout/engines/cityLayout.ts` - City layout engine
- `packages/ui/src/features/canvas/layout/engines/cityLayout.test.ts` - Unit tests

## Files to Modify

- `packages/ui/src/features/canvas/layout/engines/index.ts` - Export CityLayoutEngine
- `packages/ui/src/features/canvas/layout/index.ts` - Re-export from engines

---

## Dependencies

- Story 8-5 (Layout engine interface)
- Story 8-2 (Depth values for Y-axis)
- Story 8-3 (External library detection for ring layout)

---

## Definition of Done

- [x] Files positioned on X-Z grid
- [x] Y position from depth
- [x] Directory neighborhoods clustered
- [x] External libraries in ring
- [x] Deterministic layout
- [x] Exported for LayoutRegistry use
- [x] Unit tests pass

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All 15 tests pass on first GREEN attempt. No bugs encountered.
- Uses `metadata.path` for directory extraction with fallback to `label` for robustness.
- Handles undefined `depth` gracefully (defaults to 0).
- Reuses `boundsFromPositions()` from 8-5 bounds helpers.

### Completion Notes List

All 6 tasks completed:
- **Task 1 (Directory grouping):** `groupByDirectory()` extracts directory from `metadata.path` (fallback to label), groups nodes, sorts alphabetically.
- **Task 2 (Grid positioning):** Square grid per neighborhood. X/Z from grid position (col/row * gridSpacing). Y from `depth * floorHeight`. Configurable `buildingSize`, `streetWidth`, `neighborhoodGap`.
- **Task 3 (External ring):** External nodes positioned in a circle at `externalRingRadius` using trigonometric placement. Sorted alphabetically for determinism.
- **Task 4 (Bounds/metadata):** Uses `boundsFromPositions()`. Metadata includes `buildingSize`, `floorHeight`, `neighborhoodCount`, `externalCount`, `groundPlane`.
- **Task 5 (Registry):** `canHandle()` returns true when graph has file-type nodes. Engine exported for registration.
- **Task 6 (Tests):** 15 tests: type identity, canHandle (file/class/empty), single file, Y from depth, undefined depth, directory grouping, external ring, determinism, empty graph, bounds, metadata, file-only filtering, custom config.

### File List

**New Files:**
- `packages/ui/src/features/canvas/layout/engines/cityLayout.ts` — CityLayoutEngine class
- `packages/ui/src/features/canvas/layout/engines/cityLayout.test.ts` — 15 unit tests

**Modified Files:**
- `packages/ui/src/features/canvas/layout/engines/index.ts` — Export CityLayoutEngine
- `packages/ui/src/features/canvas/layout/index.ts` — Re-export CityLayoutEngine

---

## Change Log
- 2026-02-02: Implemented city layout engine with grid positioning, directory neighborhoods, depth-based Y, external ring, and deterministic output. 15 unit tests, all passing.
