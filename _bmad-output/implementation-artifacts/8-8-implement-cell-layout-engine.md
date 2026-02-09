# Story 8-8: Implement Cell Layout Engine

**Status:** review

---

## Story

**ID:** 8-8
**Key:** 8-8-implement-cell-layout-engine
**Title:** Implement Cell Layout Algorithm for Class Interior View
**Epic:** Epic 8 - City-to-Cell 3D Layout
**Phase:** Implementation - Phase 2 (Layout System)
**Priority:** HIGH - Required for cell view

**As a** developer exploring inside a class,
**I want** methods and properties laid out as floating organelles,
**So that** I can see the internal structure of a class in an organic, biological visualization.

**Description:**

Implement the cell layout algorithm that positions methods, properties, and nested functions as organelles floating within a cell membrane. This creates an organic, biological feel inside classes.

**Context:**

From UX 3D Layout Vision:
- Inside a class = organic cell with floating organelles
- Organelles = methods, properties, event handlers
- Connections = data flow, call relationships
- No animation (static positioning)

Organelle types:
- Function/Method = blob/sphere
- State/Variable = pulsing core (visual only)
- Constant = crystal/gem
- Event handler = shape with receptor

---

## Acceptance Criteria

- **AC-1:** Child nodes positioned within parent bounds
  - All organelles inside cell membrane
  - Membrane is spherical/ellipsoid boundary

- **AC-2:** Organelles spread with organic distribution
  - Not grid-based, more natural spacing
  - Slight randomization for organic feel
  - Seeded random for deterministic results

- **AC-3:** Organelle size reflects importance
  - Larger methods = larger organelles
  - Based on line count or complexity

- **AC-4:** Central nucleus for state
  - State/props positioned near center
  - Methods arranged around state

- **AC-5:** Connection points on organelle surfaces
  - Organelles have positions for edge endpoints
  - Enables smooth edge rendering

---

## Technical Approach

### Cell Layout Algorithm

```typescript
// packages/ui/src/features/canvas/layout/engines/cellLayout.ts

import type { LayoutEngine, LayoutConfig, LayoutResult } from '../types';
import type { Graph, GraphNode, Position3D } from '../../../../shared/types';

// Seeded random for deterministic results
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  return () => {
    hash = Math.sin(hash) * 10000;
    return hash - Math.floor(hash);
  };
}

export class CellLayoutEngine implements LayoutEngine {
  readonly type = 'cell' as const;

  layout(graph: Graph, config: LayoutConfig): LayoutResult {
    const positions = new Map<string, Position3D>();
    const {
      membraneRadius = 10,
      organelleSpacing = 1.5,
      nucleusRadius = 3,
    } = config;

    // Get the parent node (cell)
    const cellNode = graph.nodes.find(n => n.type === 'class' || n.type === 'file');
    if (!cellNode) {
      return { positions, bounds: this.emptyBounds() };
    }

    // Get child nodes (organelles)
    const organelles = graph.nodes.filter(n => n.parentId === cellNode.id);

    // Separate by type for positioning strategy
    const stateNodes = organelles.filter(n => n.type === 'variable');
    const methodNodes = organelles.filter(n => ['function', 'method'].includes(n.type));

    // Create seeded random for this cell
    const random = seededRandom(cellNode.id);

    // Position cell center
    const cellCenter: Position3D = cellNode.position ?? { x: 0, y: 0, z: 0 };
    positions.set(cellNode.id, cellCenter);

    // Position state nodes near nucleus (center)
    this.positionNucleus(stateNodes, cellCenter, nucleusRadius, random, positions);

    // Position method nodes in outer region
    this.positionOrganelles(
      methodNodes,
      cellCenter,
      nucleusRadius + organelleSpacing,
      membraneRadius - organelleSpacing,
      random,
      positions
    );

    return {
      positions,
      bounds: this.calculateBounds(cellCenter, membraneRadius),
      metadata: {
        cellCenter,
        membraneRadius,
        nucleusRadius,
      },
    };
  }

  canHandle(graph: Graph): boolean {
    // Cell layout needs parent-child relationships
    return graph.nodes.some(n => n.parentId !== undefined);
  }

  private positionNucleus(
    nodes: GraphNode[],
    center: Position3D,
    radius: number,
    random: () => number,
    positions: Map<string, Position3D>
  ): void {
    if (nodes.length === 0) return;

    // Distribute in small cluster at center
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    nodes.forEach((node, i) => {
      const t = i / Math.max(nodes.length - 1, 1);
      const r = radius * Math.sqrt(t) * 0.8; // Keep within nucleus
      const theta = i * goldenAngle;
      const phi = Math.acos(1 - 2 * (random() * 0.3 + 0.35)); // Cluster near equator

      positions.set(node.id, {
        x: center.x + r * Math.sin(phi) * Math.cos(theta),
        y: center.y + r * Math.cos(phi),
        z: center.z + r * Math.sin(phi) * Math.sin(theta),
      });
    });
  }

  private positionOrganelles(
    nodes: GraphNode[],
    center: Position3D,
    innerRadius: number,
    outerRadius: number,
    random: () => number,
    positions: Map<string, Position3D>
  ): void {
    if (nodes.length === 0) return;

    // Use Fibonacci sphere distribution for even spacing
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    nodes.forEach((node, i) => {
      // Radius varies between inner and outer
      const t = (i + 0.5) / nodes.length;
      const r = innerRadius + (outerRadius - innerRadius) * (0.3 + t * 0.7);

      // Spherical coordinates
      const theta = i * goldenAngle;
      const phi = Math.acos(1 - 2 * t);

      // Add slight randomization for organic feel
      const jitter = 0.2;
      const rx = (random() - 0.5) * jitter * r;
      const ry = (random() - 0.5) * jitter * r;
      const rz = (random() - 0.5) * jitter * r;

      positions.set(node.id, {
        x: center.x + r * Math.sin(phi) * Math.cos(theta) + rx,
        y: center.y + r * Math.cos(phi) + ry,
        z: center.z + r * Math.sin(phi) * Math.sin(theta) + rz,
      });
    });
  }

  private calculateBounds(center: Position3D, radius: number): BoundingBox {
    return {
      min: {
        x: center.x - radius,
        y: center.y - radius,
        z: center.z - radius,
      },
      max: {
        x: center.x + radius,
        y: center.y + radius,
        z: center.z + radius,
      },
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

### Task 1: Implement seeded random
- [x] Create deterministic random from node ID
- [x] Ensure same graph = same layout

### Task 2: Implement nucleus positioning
- [x] Position state nodes near center
- [x] Cluster for visual grouping

### Task 3: Implement organelle positioning
- [x] Use Fibonacci sphere distribution
- [x] Add jitter for organic feel
- [x] Keep within membrane bounds

### Task 4: Track cell metadata
- [x] Return membrane radius
- [x] Return nucleus center
- [x] Enable membrane rendering

### Task 5: Write unit tests
- [x] Test deterministic positioning
- [x] Test all organelles within bounds
- [x] Test type-based positioning

---

## Files to Create

- `packages/ui/src/features/canvas/layout/engines/cellLayout.ts` - Cell layout engine
- `packages/ui/src/features/canvas/layout/engines/cellLayout.test.ts` - Unit tests

## Files to Modify

- `packages/ui/src/features/canvas/layout/engines/index.ts` - Export new engine

---

## Dependencies

- Story 8-5 (Layout engine interface)
- Story 8-4 (Parent-child relationships)

---

## Estimation

**Complexity:** Medium
**Effort:** 5-6 hours
**Risk:** Medium - Organic feel is subjective

---

## Definition of Done

- [x] Organelles positioned within membrane
- [x] State nodes near center
- [x] Method nodes in outer region
- [x] Organic distribution with jitter
- [x] Deterministic layout
- [x] Unit tests pass

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All 14 tests pass on first GREEN attempt. No bugs encountered.
- Seeded random uses sin-hash approach for deterministic results from node ID.
- Fibonacci sphere distribution with golden angle ensures even spacing of organelles.

### Completion Notes List

All 5 tasks completed:
- **Task 1 (Seeded random):** `seededRandom(seed)` creates a closure with hash-based PRNG. Same cell ID always produces same positions.
- **Task 2 (Nucleus positioning):** `positionNucleus()` places variable/state nodes within `nucleusRadius * 0.8` of center using golden angle spiral with equatorial clustering.
- **Task 3 (Organelle positioning):** `positionOrganelles()` distributes method/function nodes between `nucleusRadius + organelleSpacing` and `membraneRadius - organelleSpacing` using Fibonacci sphere. 20% jitter for organic feel.
- **Task 4 (Cell metadata):** Returns `membraneRadius`, `nucleusRadius`, and `cellCenter` in metadata. Bounds are spherical around cell center.
- **Task 5 (Tests):** 14 tests: type identity, canHandle (3 cases), cell positioning (2), organelles within membrane, variables closer to center, deterministic output, no cell node, empty class, metadata, spherical bounds, many organelles (20).

### File List

**New Files:**
- `packages/ui/src/features/canvas/layout/engines/cellLayout.ts` — CellLayoutEngine class
- `packages/ui/src/features/canvas/layout/engines/cellLayout.test.ts` — 14 unit tests

**Modified Files:**
- `packages/ui/src/features/canvas/layout/engines/index.ts` — Export CellLayoutEngine
- `packages/ui/src/features/canvas/layout/index.ts` — Re-export CellLayoutEngine

---

## Change Log
- 2026-02-02: Implemented cell layout engine with seeded random, nucleus positioning, Fibonacci sphere organelle distribution, and cell metadata. 14 unit tests, all passing. 71 total layout tests.
