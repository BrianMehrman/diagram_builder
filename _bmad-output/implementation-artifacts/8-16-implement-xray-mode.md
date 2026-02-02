# Story 8-16: Implement X-Ray Mode

**Status:** not-started

---

## Story

**ID:** 8-16
**Key:** 8-16-implement-xray-mode
**Title:** Implement X-Ray Mode for See-Through Buildings
**Epic:** Epic 8 - City-to-Cell 3D Layout
**Phase:** Implementation - Phase 5 (Visibility Modes)
**Priority:** LOW - Enhancement for exploration

**As a** developer viewing the city,
**I want** to toggle an X-ray mode that makes building walls transparent,
**So that** I can see inside buildings without entering them.

**Description:**

Implement X-ray mode that makes all building walls transparent/wireframe while keeping internal structures (floors, rooms, organelles) visible. This lets users see the internal structure of multiple buildings simultaneously from the city view.

**Context:**

From UX 3D Layout Vision:
- X-ray = toggle to see through buildings
- Walls become wireframe or highly transparent
- Internal structure visible from outside
- Useful for comparing file structures

---

## Acceptance Criteria

- **AC-1:** Toggle X-ray mode
  - Keyboard shortcut (X key)
  - Button in HUD/toolbar
  - State in Zustand store

- **AC-2:** Building walls become transparent/wireframe
  - Walls switch to wireframe material
  - Internal floors/rooms visible
  - Building outline still visible

- **AC-3:** Internal structure visible
  - Class floors shown as colored planes
  - Room outlines visible
  - Method organelles visible as dots

- **AC-4:** Smooth transition
  - Walls fade to wireframe over ~300ms
  - Not an abrupt switch

- **AC-5:** Performance maintained
  - LOD still applies
  - Distant buildings don't show full interior
  - Only nearby buildings show detail in X-ray

---

## Technical Approach

### X-Ray State

```typescript
// packages/ui/src/features/canvas/store/xraySlice.ts

export interface XRayState {
  isXRayMode: boolean;
  xrayOpacity: number;       // Wall opacity in x-ray (0.05)
  xrayDetailDistance: number; // Max distance to show internal detail
}

export interface XRayActions {
  toggleXRay: () => void;
  setXRayOpacity: (opacity: number) => void;
}

export const createXRaySlice = (set: SetState): XRayState & XRayActions => ({
  isXRayMode: false,
  xrayOpacity: 0.05,
  xrayDetailDistance: 30,

  toggleXRay: () => set(s => ({ isXRayMode: !s.isXRayMode })),
  setXRayOpacity: (opacity) => set({ xrayOpacity: opacity }),
});
```

### X-Ray Building Component

```typescript
// packages/ui/src/features/canvas/views/XRayBuilding.tsx

import React, { useMemo } from 'react';
import { Box, Edges, Plane, Sphere } from '@react-three/drei';
import * as THREE from 'three';
import type { GraphNode, Position3D } from '../../../shared/types';

interface XRayBuildingProps {
  node: GraphNode;
  position: Position3D;
  children: GraphNode[];    // Internal nodes
  xrayOpacity: number;
  showDetail: boolean;       // Based on camera distance
}

export function XRayBuilding({
  node,
  position,
  children,
  xrayOpacity,
  showDetail,
}: XRayBuildingProps) {
  const buildingWidth = 2;
  const buildingDepth = 2;
  const floorHeight = 3;
  const buildingHeight = Math.max(floorHeight, (node.depth + 1) * floorHeight);

  // Group children by class
  const classes = children.filter(n => n.type === 'class');
  const methods = children.filter(n => ['function', 'method'].includes(n.type));

  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Wireframe building outline */}
      <Box
        args={[buildingWidth, buildingHeight, buildingDepth]}
        position={[0, buildingHeight / 2, 0]}
      >
        <meshStandardMaterial
          color="#475569"
          transparent
          opacity={xrayOpacity}
          wireframe
        />
        <Edges color="#64748b" threshold={15} />
      </Box>

      {/* Internal detail (only if nearby) */}
      {showDetail && (
        <group>
          {/* Floor planes for each class */}
          {classes.map((cls, i) => (
            <Plane
              key={cls.id}
              args={[buildingWidth * 0.9, buildingDepth * 0.9]}
              position={[0, (i + 1) * floorHeight, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <meshStandardMaterial
                color="#3b82f6"
                transparent
                opacity={0.3}
                side={THREE.DoubleSide}
              />
            </Plane>
          ))}

          {/* Dots for methods (simplified in x-ray) */}
          {methods.map(method => (
            <Sphere
              key={method.id}
              args={[0.15, 8, 8]}
              position={[
                (Math.random() - 0.5) * buildingWidth * 0.6,
                floorHeight * 1.5,
                (Math.random() - 0.5) * buildingDepth * 0.6,
              ]}
            >
              <meshStandardMaterial
                color="#60a5fa"
                emissive="#60a5fa"
                emissiveIntensity={0.5}
              />
            </Sphere>
          ))}
        </group>
      )}
    </group>
  );
}
```

### X-Ray Toggle in HUD

```typescript
// Integration in HUD or keyboard handler

// Keyboard shortcut
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'x' && !isInputFocused()) {
      toggleXRay();
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [toggleXRay]);
```

---

## Tasks/Subtasks

### Task 1: Create X-ray state slice
- [ ] isXRayMode toggle
- [ ] xrayOpacity setting
- [ ] detailDistance threshold

### Task 2: Create XRayBuilding component
- [ ] Wireframe walls
- [ ] Edge outlines
- [ ] Floor plane indicators
- [ ] Method dot indicators

### Task 3: Integrate with CityView
- [ ] Switch to XRayBuilding when mode active
- [ ] Distance-based LOD for detail
- [ ] Smooth transition

### Task 4: Add keyboard shortcut
- [ ] X key toggles x-ray
- [ ] HUD button toggle
- [ ] Visual indicator of mode

### Task 5: Performance optimization
- [ ] LOD for internal detail
- [ ] Instanced rendering for dots
- [ ] Distance culling

### Task 6: Write unit tests
- [ ] Test toggle state
- [ ] Test building rendering in x-ray
- [ ] Test LOD distance

---

## Files to Create

- `packages/ui/src/features/canvas/store/xraySlice.ts` - X-ray state
- `packages/ui/src/features/canvas/views/XRayBuilding.tsx` - X-ray building component
- `packages/ui/src/features/canvas/views/XRayBuilding.test.tsx` - Tests

## Files to Modify

- `packages/ui/src/features/canvas/store/index.ts` - Add x-ray slice
- `packages/ui/src/features/canvas/views/CityView.tsx` - X-ray rendering
- `packages/ui/src/features/hud/HUD.tsx` - X-ray toggle button

---

## Dependencies

- Story 8-10 (City view renderer - base building to extend)
- Story 8-4 (Parent-child relationships - for internal nodes)

---

## Estimation

**Complexity:** Medium
**Effort:** 5-6 hours
**Risk:** Low-Medium - Visual polish

---

## Definition of Done

- [ ] X key toggles x-ray mode
- [ ] Buildings show wireframe walls
- [ ] Internal floors visible through walls
- [ ] Method dots visible in nearby buildings
- [ ] Smooth transition effect
- [ ] Performance maintained
- [ ] Unit tests pass
