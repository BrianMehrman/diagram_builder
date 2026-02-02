# Story 8-13: Implement Membrane Threshold Transition

**Status:** not-started

---

## Story

**ID:** 8-13
**Key:** 8-13-implement-membrane-threshold-transition
**Title:** Implement Membrane Threshold Transition Effect
**Epic:** Epic 8 - City-to-Cell 3D Layout
**Phase:** Implementation - Phase 4 (Transitions)
**Priority:** MEDIUM - Visual polish for cell entry

**As a** developer entering a class in the visualization,
**I want** to experience a membrane-crossing visual effect,
**So that** the transition from building to cell view feels like entering a biological cell.

**Description:**

Implement the membrane threshold effect that triggers when the camera crosses into a class boundary. The building walls dissolve into a semi-transparent membrane, and the interior transitions to the organic cell view with organelles.

**Context:**

From UX 3D Layout Vision:
- Crossing into a class = crossing a membrane
- Walls become semi-transparent → permeable
- Interior shifts from architectural to organic
- Smooth transition, not abrupt switch

Transition sequence:
1. Camera approaches class boundary
2. Walls start to dissolve (opacity decreases)
3. Membrane sphere fades in
4. Interior organelles appear
5. Cell view fully active

---

## Acceptance Criteria

- **AC-1:** Membrane effect on class entry
  - Visual transition when entering cell mode
  - Walls dissolve over ~500ms
  - Membrane fades in

- **AC-2:** Smooth opacity crossfade
  - Building walls opacity: 1.0 → 0.0
  - Cell membrane opacity: 0.0 → 0.1
  - Organelles fade in from 0.0 → 1.0

- **AC-3:** Transition triggered by enterNode action
  - No camera position detection needed (explicit action)
  - Transition plays forward on enter
  - Transition plays backward on exit

- **AC-4:** Exit transition (cell → building)
  - Membrane fades out
  - Building walls reappear
  - Smooth reverse of entry

- **AC-5:** Transition interruptible
  - Can exit mid-transition
  - No visual glitches on interrupt

---

## Technical Approach

### Transition Hook

```typescript
// packages/ui/src/features/canvas/hooks/useViewTransition.ts

import { useState, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';

interface TransitionState {
  progress: number;       // 0 = source view, 1 = target view
  isTransitioning: boolean;
  direction: 'forward' | 'backward';
}

export function useViewTransition(duration = 0.5) {
  const [state, setState] = useState<TransitionState>({
    progress: 0,
    isTransitioning: false,
    direction: 'forward',
  });

  const targetProgress = useRef(0);
  const speed = 1 / duration;

  const startTransition = useCallback((forward: boolean) => {
    targetProgress.current = forward ? 1 : 0;
    setState(prev => ({
      ...prev,
      isTransitioning: true,
      direction: forward ? 'forward' : 'backward',
    }));
  }, []);

  useFrame((_, delta) => {
    if (!state.isTransitioning) return;

    setState(prev => {
      const target = targetProgress.current;
      const step = speed * delta;
      let newProgress: number;

      if (prev.progress < target) {
        newProgress = Math.min(prev.progress + step, target);
      } else {
        newProgress = Math.max(prev.progress - step, target);
      }

      const done = Math.abs(newProgress - target) < 0.01;

      return {
        progress: done ? target : newProgress,
        isTransitioning: !done,
        direction: prev.direction,
      };
    });
  });

  return {
    progress: state.progress,
    isTransitioning: state.isTransitioning,
    startForward: () => startTransition(true),
    startBackward: () => startTransition(false),
  };
}
```

### Membrane Transition Component

```typescript
// packages/ui/src/features/canvas/views/MembraneTransition.tsx

import React from 'react';
import { Sphere, Box } from '@react-three/drei';
import * as THREE from 'three';
import type { Position3D } from '../../../shared/types';

interface MembraneTransitionProps {
  center: Position3D;
  buildingBounds: { width: number; height: number; depth: number };
  membraneRadius: number;
  progress: number;  // 0 = building, 1 = cell
}

export function MembraneTransition({
  center,
  buildingBounds,
  membraneRadius,
  progress,
}: MembraneTransitionProps) {
  // Walls dissolve as progress increases
  const wallOpacity = Math.max(0, 0.08 * (1 - progress));

  // Membrane fades in as progress increases
  const membraneOpacity = 0.1 * progress;

  // Easing for smooth feel
  const easedProgress = easeInOutCubic(progress);

  return (
    <group position={[center.x, center.y, center.z]}>
      {/* Dissolving building walls */}
      {progress < 1 && (
        <Box
          args={[
            buildingBounds.width,
            buildingBounds.height,
            buildingBounds.depth,
          ]}
        >
          <meshStandardMaterial
            color="#475569"
            transparent
            opacity={wallOpacity}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </Box>
      )}

      {/* Forming membrane */}
      {progress > 0 && (
        <Sphere args={[membraneRadius, 32, 32]}>
          <meshStandardMaterial
            color="#3b82f6"
            transparent
            opacity={membraneOpacity}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </Sphere>
      )}
    </group>
  );
}

function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
```

---

## Tasks/Subtasks

### Task 1: Create useViewTransition hook
- [ ] Progress tracking (0 to 1)
- [ ] Forward and backward transitions
- [ ] Frame-based animation
- [ ] Configurable duration

### Task 2: Create MembraneTransition component
- [ ] Wall dissolve effect
- [ ] Membrane fade-in
- [ ] Easing function

### Task 3: Integrate with view mode changes
- [ ] Trigger on enterNode
- [ ] Trigger reverse on exitToParent
- [ ] Handle interruption

### Task 4: Organelle fade-in
- [ ] Organelles opacity tied to progress
- [ ] Staggered appearance (optional)

### Task 5: Write unit tests
- [ ] Test transition progress
- [ ] Test forward/backward
- [ ] Test interruption
- [ ] Test opacity calculations

---

## Files to Create

- `packages/ui/src/features/canvas/hooks/useViewTransition.ts` - Transition hook
- `packages/ui/src/features/canvas/views/MembraneTransition.tsx` - Transition visual
- `packages/ui/src/features/canvas/hooks/useViewTransition.test.ts` - Tests

## Files to Modify

- `packages/ui/src/features/canvas/views/CellView.tsx` - Use transition
- `packages/ui/src/features/canvas/views/BuildingView.tsx` - Dissolve walls

---

## Dependencies

- Story 8-11 (Building view - walls to dissolve)
- Story 8-12 (Cell view - membrane to show)
- Story 8-9 (View mode manager - triggers)

---

## Estimation

**Complexity:** Medium
**Effort:** 4-5 hours
**Risk:** Medium - Animation timing and visual feel

---

## Definition of Done

- [ ] Wall dissolve plays on cell entry
- [ ] Membrane fades in smoothly
- [ ] Exit reverses the effect
- [ ] Interruptible transitions
- [ ] Easing for natural feel
- [ ] Unit tests pass
