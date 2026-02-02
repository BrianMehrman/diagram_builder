# Story 8-17: Implement Underground Mode

**Status:** not-started

---

## Story

**ID:** 8-17
**Key:** 8-17-implement-underground-mode
**Title:** Implement Underground Dependency Visualization Mode
**Epic:** Epic 8 - City-to-Cell 3D Layout
**Phase:** Implementation - Phase 5 (Visibility Modes)
**Priority:** LOW - Enhancement for dependency exploration

**As a** developer exploring dependencies,
**I want** to toggle an underground view showing dependency connections as subway tunnels,
**So that** I can visualize how files and packages depend on each other.

**Description:**

Implement the underground mode that reveals dependency connections as tunnel-like structures below the ground plane. External library connections appear as subway tunnels connecting buildings to their dependency buildings.

**Context:**

From UX 3D Layout Vision:
- Dependencies = underground subway system
- Tunnels connect buildings
- Tunnel thickness = import frequency
- Not navigable yet (future feature)
- Toggle mode to make visible

---

## Acceptance Criteria

- **AC-1:** Toggle underground mode
  - Keyboard shortcut (U key)
  - Button in HUD/toolbar
  - State in Zustand store

- **AC-2:** Ground plane becomes transparent
  - Ground fades to see below
  - Buildings remain visible above
  - Below-ground space revealed

- **AC-3:** Dependency tunnels rendered
  - Curved tubes below ground plane
  - Connect from building base to building base
  - Follow smooth path underground

- **AC-4:** Tunnel properties
  - Thickness based on import count
  - Color based on dependency type (prod/dev)
  - Subtle glow for visibility

- **AC-5:** External library connections highlighted
  - Tunnels to external library buildings
  - Distinct from internal connections
  - Show package name on hover

---

## Technical Approach

### Underground State

```typescript
// packages/ui/src/features/canvas/store/undergroundSlice.ts

export interface UndergroundState {
  isUndergroundMode: boolean;
  groundOpacity: number;      // 1.0 normal, 0.2 underground
  tunnelOpacity: number;
  showTransitive: boolean;    // Show transitive dependencies
}

export interface UndergroundActions {
  toggleUnderground: () => void;
}

export const createUndergroundSlice = (
  set: SetState
): UndergroundState & UndergroundActions => ({
  isUndergroundMode: false,
  groundOpacity: 1.0,
  tunnelOpacity: 0.7,
  showTransitive: false,

  toggleUnderground: () =>
    set(s => ({
      isUndergroundMode: !s.isUndergroundMode,
      groundOpacity: s.isUndergroundMode ? 1.0 : 0.2,
    })),
});
```

### Underground Layer Component

```typescript
// packages/ui/src/features/canvas/views/UndergroundLayer.tsx

import React, { useMemo } from 'react';
import { DependencyTunnel } from './DependencyTunnel';
import { useCanvasStore } from '../store';
import type { Graph, GraphEdge, Position3D } from '../../../shared/types';

interface UndergroundLayerProps {
  graph: Graph;
  positions: Map<string, Position3D>;
}

export function UndergroundLayer({ graph, positions }: UndergroundLayerProps) {
  const isUndergroundMode = useCanvasStore(s => s.isUndergroundMode);

  // Get import edges
  const importEdges = useMemo(() => {
    return graph.edges.filter(
      e => e.type === 'imports' || e.type === 'external_import'
    );
  }, [graph]);

  if (!isUndergroundMode) return null;

  return (
    <group name="underground-layer">
      {importEdges.map(edge => {
        const sourcePos = positions.get(edge.source);
        const targetPos = positions.get(edge.target);
        if (!sourcePos || !targetPos) return null;

        return (
          <DependencyTunnel
            key={edge.id}
            edge={edge}
            sourcePosition={sourcePos}
            targetPosition={targetPos}
            importCount={
              (edge.metadata?.importCount as number) ?? 1
            }
          />
        );
      })}
    </group>
  );
}
```

### Dependency Tunnel Component

```typescript
// packages/ui/src/features/canvas/views/DependencyTunnel.tsx

import React, { useMemo } from 'react';
import { Tube } from '@react-three/drei';
import * as THREE from 'three';
import type { GraphEdge, Position3D } from '../../../shared/types';

interface DependencyTunnelProps {
  edge: GraphEdge;
  sourcePosition: Position3D;
  targetPosition: Position3D;
  importCount: number;
}

export function DependencyTunnel({
  edge,
  sourcePosition,
  targetPosition,
  importCount,
}: DependencyTunnelProps) {
  const undergroundY = -3; // Below ground plane
  const radius = Math.min(0.1 + importCount * 0.02, 0.5);
  const isExternal = edge.type === 'external_import';

  // Create curved path underground
  const path = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(sourcePosition.x, 0, sourcePosition.z),
      new THREE.Vector3(
        sourcePosition.x,
        undergroundY,
        sourcePosition.z
      ),
      new THREE.Vector3(
        (sourcePosition.x + targetPosition.x) / 2,
        undergroundY - 1,
        (sourcePosition.z + targetPosition.z) / 2
      ),
      new THREE.Vector3(
        targetPosition.x,
        undergroundY,
        targetPosition.z
      ),
      new THREE.Vector3(targetPosition.x, 0, targetPosition.z),
    ]);
  }, [sourcePosition, targetPosition]);

  return (
    <Tube args={[path, 32, radius, 8, false]}>
      <meshStandardMaterial
        color={isExternal ? '#6366f1' : '#3b82f6'}
        transparent
        opacity={0.6}
        emissive={isExternal ? '#6366f1' : '#3b82f6'}
        emissiveIntensity={0.2}
      />
    </Tube>
  );
}
```

---

## Tasks/Subtasks

### Task 1: Create underground state slice
- [ ] isUndergroundMode toggle
- [ ] Ground opacity control
- [ ] Tunnel visibility settings

### Task 2: Create UndergroundLayer component
- [ ] Filter import/external_import edges
- [ ] Render DependencyTunnel per edge
- [ ] Only visible in underground mode

### Task 3: Create DependencyTunnel component
- [ ] CatmullRom curve underground
- [ ] Tube geometry along curve
- [ ] Radius from import count
- [ ] Color for internal vs external

### Task 4: Ground plane transparency
- [ ] Reduce ground opacity in underground mode
- [ ] Smooth transition
- [ ] Buildings stay visible

### Task 5: Keyboard shortcut
- [ ] U key toggles underground
- [ ] HUD button
- [ ] Visual indicator

### Task 6: Write unit tests
- [ ] Test toggle state
- [ ] Test edge filtering
- [ ] Test tunnel path generation
- [ ] Test radius calculation

---

## Files to Create

- `packages/ui/src/features/canvas/store/undergroundSlice.ts` - Underground state
- `packages/ui/src/features/canvas/views/UndergroundLayer.tsx` - Underground layer
- `packages/ui/src/features/canvas/views/DependencyTunnel.tsx` - Tunnel component
- `packages/ui/src/features/canvas/views/UndergroundLayer.test.tsx` - Tests

## Files to Modify

- `packages/ui/src/features/canvas/store/index.ts` - Add underground slice
- `packages/ui/src/features/canvas/views/CityView.tsx` - Add underground layer
- `packages/ui/src/features/canvas/views/GroundPlane.tsx` - Variable opacity
- `packages/ui/src/features/hud/HUD.tsx` - Underground toggle

---

## Dependencies

- Story 8-3 (External library detection - external_import edges)
- Story 8-10 (City view - ground plane and building positions)

---

## Estimation

**Complexity:** Medium
**Effort:** 5-6 hours
**Risk:** Medium - 3D tunnel rendering complexity

---

## Definition of Done

- [ ] U key toggles underground mode
- [ ] Ground becomes transparent
- [ ] Dependency tunnels render below ground
- [ ] Thickness reflects import count
- [ ] Internal vs external color distinction
- [ ] Smooth toggle transition
- [ ] Unit tests pass
