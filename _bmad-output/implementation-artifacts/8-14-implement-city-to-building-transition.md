# Story 8-14: Implement City-to-Building Transition

**Status:** not-started

---

## Story

**ID:** 8-14
**Key:** 8-14-implement-city-to-building-transition
**Title:** Implement Smooth Camera Transition from City to Building View
**Epic:** Epic 8 - City-to-Cell 3D Layout
**Phase:** Implementation - Phase 4 (Transitions)
**Priority:** MEDIUM - Seamless navigation experience

**As a** developer double-clicking a building in the city view,
**I want** a smooth camera flight into the building interior,
**So that** the transition from city to building feels natural and spatially grounded.

**Description:**

Implement the camera animation and visual transition that plays when the user enters a building from the city view. The camera flies from its current position down to the building entrance, the building walls become transparent, and the interior floor/room layout fades in.

**Context:**

From UX 3D Layout Vision:
- Double-click building → fly to entrance → enter
- City fades, building interior appears
- Camera ends inside building looking at first floor
- Existing camera flight animation (Story 7-3) can be extended

Transition sequence:
1. User double-clicks building
2. Camera begins flight toward building
3. Surrounding buildings fade/LOD reduce
4. Target building walls become transparent
5. Interior layout appears
6. Camera arrives at building interior position

---

## Acceptance Criteria

- **AC-1:** Camera flight to building
  - Smooth flight from current position to building interior
  - Use existing camera flight system (Story 7-3)
  - Target position = center of building ground floor

- **AC-2:** City fade during transition
  - Non-target buildings fade to low opacity
  - Ground plane stays visible during flight
  - Target building highlighted

- **AC-3:** Building walls dissolve
  - Target building walls go transparent as camera approaches
  - Interior becomes visible before arrival

- **AC-4:** Interior fade-in
  - Floors and rooms fade in as camera enters
  - Progressive reveal during flight

- **AC-5:** View mode change at arrival
  - View mode switches from city to building on arrival
  - ViewModeRenderer picks up the change
  - No jarring visual break

---

## Technical Approach

### City-to-Building Transition

```typescript
// packages/ui/src/features/canvas/transitions/cityToBuildingTransition.ts

import type { Position3D } from '../../../shared/types';

interface CityToBuildingParams {
  buildingPosition: Position3D;
  buildingBounds: { width: number; height: number; depth: number };
  currentCameraPosition: Position3D;
}

export function calculateBuildingEntryTarget(
  params: CityToBuildingParams
): { position: Position3D; target: Position3D } {
  const { buildingPosition, buildingBounds } = params;

  // Target: inside building, looking at center of ground floor
  const entryPosition: Position3D = {
    x: buildingPosition.x + buildingBounds.width / 2,
    y: buildingPosition.y + buildingBounds.height * 0.3,  // 30% up
    z: buildingPosition.z + buildingBounds.depth + 2,       // Just outside front
  };

  const lookTarget: Position3D = {
    x: buildingPosition.x + buildingBounds.width / 2,
    y: buildingPosition.y + buildingBounds.height * 0.3,
    z: buildingPosition.z + buildingBounds.depth / 2,
  };

  return { position: entryPosition, target: lookTarget };
}
```

### Transition Orchestrator

```typescript
// packages/ui/src/features/canvas/transitions/TransitionOrchestrator.tsx

import React, { useEffect, useRef } from 'react';
import { useCanvasStore } from '../store';
import { calculateBuildingEntryTarget } from './cityToBuildingTransition';

export function TransitionOrchestrator() {
  const viewMode = useCanvasStore(s => s.viewMode);
  const prevMode = useRef(viewMode);
  const focusedNodeId = useCanvasStore(s => s.focusedNodeId);
  const setCameraTarget = useCanvasStore(s => s.setCameraTarget);
  const setCamera = useCanvasStore(s => s.setCamera);

  useEffect(() => {
    const wasCity = prevMode.current === 'city';
    const isBuilding = viewMode === 'building';

    if (wasCity && isBuilding && focusedNodeId) {
      // Trigger camera flight to building
      // Layout positions would be retrieved from store
      const buildingPos = useCanvasStore.getState().layoutPositions?.get(focusedNodeId);
      if (buildingPos) {
        const entry = calculateBuildingEntryTarget({
          buildingPosition: buildingPos,
          buildingBounds: { width: 4, height: 12, depth: 4 },
          currentCameraPosition: { x: 0, y: 50, z: 50 },
        });

        setCamera(entry.position);
        setCameraTarget(entry.target);
      }
    }

    prevMode.current = viewMode;
  }, [viewMode, focusedNodeId]);

  return null; // Orchestrator is logic-only
}
```

---

## Tasks/Subtasks

### Task 1: Calculate building entry camera position
- [ ] Target inside building at ground floor
- [ ] Look direction toward center
- [ ] Account for building size

### Task 2: Trigger camera flight on enter
- [ ] Detect city → building mode change
- [ ] Use existing camera flight animation
- [ ] Set target position and look-at

### Task 3: Fade non-target buildings
- [ ] Reduce opacity of other buildings
- [ ] Keep ground plane visible
- [ ] Highlight target building

### Task 4: Progressive interior reveal
- [ ] Interior elements fade in during approach
- [ ] Tied to camera distance
- [ ] Smooth transition

### Task 5: Create TransitionOrchestrator
- [ ] Mode change detection
- [ ] Camera coordination
- [ ] Layout position retrieval

### Task 6: Write unit tests
- [ ] Test entry position calculation
- [ ] Test mode change detection
- [ ] Test camera target coordinates

---

## Files to Create

- `packages/ui/src/features/canvas/transitions/cityToBuildingTransition.ts` - Entry calculation
- `packages/ui/src/features/canvas/transitions/TransitionOrchestrator.tsx` - Orchestrator
- `packages/ui/src/features/canvas/transitions/index.ts` - Exports
- `packages/ui/src/features/canvas/transitions/cityToBuildingTransition.test.ts` - Tests

## Files to Modify

- `packages/ui/src/features/canvas/Canvas3D.tsx` - Add TransitionOrchestrator
- `packages/ui/src/features/canvas/views/CityView.tsx` - Fade non-target buildings

---

## Dependencies

- Story 8-9 (View mode manager)
- Story 8-10 (City view renderer)
- Story 8-11 (Building view renderer)
- Story 7-3 (Camera flight animations)

---

## Estimation

**Complexity:** Medium
**Effort:** 4-5 hours
**Risk:** Medium - Camera animation coordination

---

## Definition of Done

- [ ] Camera flies to building on enter
- [ ] Non-target buildings fade
- [ ] Interior progressively reveals
- [ ] View mode switches at arrival
- [ ] No jarring visual break
- [ ] Unit tests pass
