# Story 8-15: Implement Building-to-Cell Transition

**Status:** not-started

---

## Story

**ID:** 8-15
**Key:** 8-15-implement-building-to-cell-transition
**Title:** Implement Smooth Camera Transition from Building to Cell View
**Epic:** Epic 8 - City-to-Cell 3D Layout
**Phase:** Implementation - Phase 4 (Transitions)
**Priority:** MEDIUM - Seamless navigation experience

**As a** developer double-clicking a class floor inside a building,
**I want** a smooth camera transition into the cell interior,
**So that** the transition from building to cell view feels like zooming into a biological cell.

**Description:**

Implement the camera animation and visual transition when entering a class from building view. The camera zooms toward the class floor, the room transforms into a cell membrane, and organelles appear inside.

**Context:**

From UX 3D Layout Vision:
- Double-click floor/class → zoom into cell
- Room box transforms to cell sphere
- Membrane crossing effect (Story 8-13)
- Camera ends inside cell looking at organelles

Transition sequence:
1. User double-clicks class floor
2. Camera flies toward the class position
3. Room geometry morphs toward sphere (membrane)
4. Membrane transition plays (Story 8-13)
5. Organelles fade in
6. Cell view fully active

---

## Acceptance Criteria

- **AC-1:** Camera flight to class center
  - Smooth flight from current building position to class center
  - Target position = inside cell membrane

- **AC-2:** Room-to-cell morph
  - Class room (box) transitions to cell (sphere)
  - Smooth geometry interpolation or crossfade

- **AC-3:** Membrane transition triggers
  - Reuse Story 8-13 membrane effect
  - Coordinated with camera arrival

- **AC-4:** Building context fades
  - Other floors fade out
  - Building walls transition to membrane
  - Only focused class remains

- **AC-5:** Exit transition (cell → building)
  - Reverse the entry sequence
  - Cell contracts back to room
  - Building floors reappear

---

## Technical Approach

### Building-to-Cell Transition

```typescript
// packages/ui/src/features/canvas/transitions/buildingToCellTransition.ts

import type { Position3D } from '../../../shared/types';

interface BuildingToCellParams {
  classPosition: Position3D;
  cellRadius: number;
  currentCameraPosition: Position3D;
}

export function calculateCellEntryTarget(
  params: BuildingToCellParams
): { position: Position3D; target: Position3D } {
  const { classPosition, cellRadius } = params;

  // Position camera inside the cell, slightly off-center
  const entryPosition: Position3D = {
    x: classPosition.x + cellRadius * 0.3,
    y: classPosition.y + cellRadius * 0.2,
    z: classPosition.z + cellRadius * 0.5,
  };

  // Look at the center of the cell
  const lookTarget: Position3D = {
    x: classPosition.x,
    y: classPosition.y,
    z: classPosition.z,
  };

  return { position: entryPosition, target: lookTarget };
}
```

### Floor Fade Component

```typescript
// packages/ui/src/features/canvas/transitions/FloorFade.tsx

import React from 'react';
import type { GraphNode, Position3D } from '../../../shared/types';

interface FloorFadeProps {
  floors: Array<{ classId: string; y: number }>;
  focusedClassId: string;
  transitionProgress: number; // 0 = building, 1 = cell
  children: React.ReactNode;
}

export function FloorFade({
  floors,
  focusedClassId,
  transitionProgress,
  children,
}: FloorFadeProps) {
  // Non-focused floors fade out during transition
  return (
    <group>
      {React.Children.map(children, (child, i) => {
        if (!React.isValidElement(child)) return child;

        const floor = floors[i];
        const isFocused = floor?.classId === focusedClassId;
        const opacity = isFocused ? 1 : 1 - transitionProgress;

        return (
          <group visible={opacity > 0.01}>
            {React.cloneElement(child as React.ReactElement, {
              opacity: opacity,
            })}
          </group>
        );
      })}
    </group>
  );
}
```

---

## Tasks/Subtasks

### Task 1: Calculate cell entry camera position
- [ ] Target inside cell at center
- [ ] Offset camera for viewing angle
- [ ] Account for cell radius

### Task 2: Integrate with TransitionOrchestrator
- [ ] Detect building → cell mode change
- [ ] Trigger camera flight
- [ ] Coordinate with membrane transition

### Task 3: Fade non-focused floors
- [ ] Other floors/rooms fade out
- [ ] Building walls transition
- [ ] Focused class highlighted

### Task 4: Room-to-cell visual transition
- [ ] Box opacity decreases
- [ ] Sphere opacity increases
- [ ] Crossfade effect

### Task 5: Reverse transition
- [ ] Cell → building reversal
- [ ] Rebuild building context
- [ ] Restore floor visibility

### Task 6: Write unit tests
- [ ] Test cell entry position
- [ ] Test floor fade logic
- [ ] Test transition coordination

---

## Files to Create

- `packages/ui/src/features/canvas/transitions/buildingToCellTransition.ts` - Entry calculation
- `packages/ui/src/features/canvas/transitions/FloorFade.tsx` - Floor fade component
- `packages/ui/src/features/canvas/transitions/buildingToCellTransition.test.ts` - Tests

## Files to Modify

- `packages/ui/src/features/canvas/transitions/TransitionOrchestrator.tsx` - Add building→cell
- `packages/ui/src/features/canvas/views/BuildingView.tsx` - Fade integration

---

## Dependencies

- Story 8-13 (Membrane transition effect)
- Story 8-14 (TransitionOrchestrator - extends it)
- Story 8-11 (Building view)
- Story 8-12 (Cell view)

---

## Estimation

**Complexity:** Medium
**Effort:** 4-5 hours
**Risk:** Medium - Visual coordination across components

---

## Definition of Done

- [ ] Camera flies to class center on enter
- [ ] Non-focused floors fade out
- [ ] Membrane transition plays
- [ ] Exit reverses transition
- [ ] No jarring visual break
- [ ] Unit tests pass
