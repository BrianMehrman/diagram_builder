# Story 8-9: Create View Mode Manager

**Status:** review

---

## Story

**ID:** 8-9
**Key:** 8-9-create-view-mode-manager
**Title:** Create View Mode Manager for City/Building/Cell Modes
**Epic:** Epic 8 - City-to-Cell 3D Layout
**Phase:** Implementation - Phase 3 (View Modes)
**Priority:** CRITICAL - Orchestrates all view rendering

**As a** developer navigating the 3D visualization,
**I want** the view to automatically switch between city, building, and cell modes,
**So that** I see the appropriate level of detail as I zoom into different parts of the codebase.

**Description:**

Create a ViewModeManager that orchestrates view mode transitions based on camera position and user interaction. The manager determines which view mode is active (city, building, or cell) and coordinates the appropriate layout engine and renderer.

**Context:**

From UX 3D Layout Vision:
- City view: macro level, see all buildings
- Building view: inside a file, see floors/rooms
- Cell view: inside a class, see organelles
- Transitions triggered by camera proximity or double-click

Scale reference:
- City = overhead view of building grid
- Building = standing inside a building
- Cell = standing inside a room (class)

---

## Acceptance Criteria

- **AC-1:** Three view modes defined
  - 'city' - Macro view of all files as buildings
  - 'building' - Inside a file, seeing classes as floors
  - 'cell' - Inside a class, seeing methods as organelles

- **AC-2:** View mode stored in Zustand store
  - `viewMode: 'city' | 'building' | 'cell'`
  - `focusedNodeId: string | null` - Which node we're "inside"
  - Actions to set mode and focused node

- **AC-3:** Mode determined by camera position
  - Far from all buildings = city mode
  - Inside building bounds = building mode
  - Inside cell bounds = cell mode
  - Hysteresis to prevent mode flickering

- **AC-4:** Double-click enters a node
  - Double-click building = enter building mode
  - Double-click class = enter cell mode
  - ESC or back button = exit to parent mode

- **AC-5:** ViewModeRenderer selects renderer
  - City mode → CityView component
  - Building mode → BuildingView component
  - Cell mode → CellView component
  - Fallback to city if no data

- **AC-6:** Breadcrumb trail
  - Shows current location path
  - City > Building (file) > Cell (class)
  - Click breadcrumb to navigate back

---

## Technical Approach

### View Mode State

```typescript
// packages/ui/src/features/canvas/store/viewModeSlice.ts

export type ViewMode = 'city' | 'building' | 'cell';

export interface ViewModeState {
  viewMode: ViewMode;
  focusedNodeId: string | null;
  focusHistory: string[];  // Stack for back navigation
}

export interface ViewModeActions {
  setViewMode: (mode: ViewMode, focusedNodeId?: string) => void;
  enterNode: (nodeId: string) => void;
  exitToParent: () => void;
  resetToCity: () => void;
}

export const createViewModeSlice = (
  set: SetState,
  get: GetState
): ViewModeState & ViewModeActions => ({
  viewMode: 'city',
  focusedNodeId: null,
  focusHistory: [],

  setViewMode: (mode, focusedNodeId) =>
    set({ viewMode: mode, focusedNodeId: focusedNodeId ?? null }),

  enterNode: (nodeId) => {
    const { viewMode, focusedNodeId, focusHistory } = get();
    const node = get().graphData?.nodes.find((n: GraphNode) => n.id === nodeId);
    if (!node) return;

    let newMode: ViewMode;
    if (node.type === 'file') {
      newMode = 'building';
    } else if (node.type === 'class') {
      newMode = 'cell';
    } else {
      return; // Can't enter this node type
    }

    set({
      viewMode: newMode,
      focusedNodeId: nodeId,
      focusHistory: focusedNodeId
        ? [...focusHistory, focusedNodeId]
        : focusHistory,
    });
  },

  exitToParent: () => {
    const { focusHistory } = get();
    if (focusHistory.length === 0) {
      set({ viewMode: 'city', focusedNodeId: null, focusHistory: [] });
      return;
    }

    const parentId = focusHistory[focusHistory.length - 1];
    const parentNode = get().graphData?.nodes.find(
      (n: GraphNode) => n.id === parentId
    );

    set({
      viewMode: parentNode?.type === 'file' ? 'building' : 'city',
      focusedNodeId: parentId,
      focusHistory: focusHistory.slice(0, -1),
    });
  },

  resetToCity: () =>
    set({ viewMode: 'city', focusedNodeId: null, focusHistory: [] }),
});
```

### ViewModeRenderer Component

```typescript
// packages/ui/src/features/canvas/components/ViewModeRenderer.tsx

import React from 'react';
import { useCanvasStore } from '../store';
import { CityView } from '../views/CityView';
import { BuildingView } from '../views/BuildingView';
import { CellView } from '../views/CellView';

export function ViewModeRenderer() {
  const viewMode = useCanvasStore(s => s.viewMode);
  const focusedNodeId = useCanvasStore(s => s.focusedNodeId);
  const graph = useCanvasStore(s => s.graphData);

  if (!graph) return null;

  switch (viewMode) {
    case 'city':
      return <CityView graph={graph} />;
    case 'building':
      return focusedNodeId ? (
        <BuildingView graph={graph} focusedNodeId={focusedNodeId} />
      ) : (
        <CityView graph={graph} />
      );
    case 'cell':
      return focusedNodeId ? (
        <CellView graph={graph} focusedNodeId={focusedNodeId} />
      ) : (
        <CityView graph={graph} />
      );
    default:
      return <CityView graph={graph} />;
  }
}
```

### Breadcrumb Component

```typescript
// packages/ui/src/features/canvas/components/ViewBreadcrumb.tsx

import React from 'react';
import { useCanvasStore } from '../store';

export function ViewBreadcrumb() {
  const viewMode = useCanvasStore(s => s.viewMode);
  const focusedNodeId = useCanvasStore(s => s.focusedNodeId);
  const focusHistory = useCanvasStore(s => s.focusHistory);
  const graphData = useCanvasStore(s => s.graphData);
  const exitToParent = useCanvasStore(s => s.exitToParent);
  const resetToCity = useCanvasStore(s => s.resetToCity);

  const getLabel = (nodeId: string) =>
    graphData?.nodes.find(n => n.id === nodeId)?.label ?? nodeId;

  return (
    <nav className="absolute top-4 left-4 flex items-center gap-1 text-sm bg-gray-900/80 rounded px-3 py-1.5">
      <button
        onClick={resetToCity}
        className={`hover:text-blue-400 ${viewMode === 'city' ? 'text-white' : 'text-gray-400'}`}
      >
        City
      </button>

      {focusHistory.map((nodeId, i) => (
        <React.Fragment key={nodeId}>
          <span className="text-gray-600">/</span>
          <button
            onClick={() => {
              // Navigate back to this level
              const stepsBack = focusHistory.length - i;
              for (let j = 0; j < stepsBack; j++) exitToParent();
            }}
            className="text-gray-400 hover:text-blue-400"
          >
            {getLabel(nodeId)}
          </button>
        </React.Fragment>
      ))}

      {focusedNodeId && (
        <>
          <span className="text-gray-600">/</span>
          <span className="text-white font-medium">
            {getLabel(focusedNodeId)}
          </span>
        </>
      )}
    </nav>
  );
}
```

---

## Tasks/Subtasks

### Task 1: Add view mode state to canvas store
- [x] Define ViewMode type ('city' | 'building' | 'cell')
- [x] State: viewMode, focusedNodeId, focusHistory
- [x] Actions: setViewMode, enterNode, exitToParent, resetToCity
- [x] Include in reset()

### Task 2: Create ViewModeRenderer
- [ ] Switch on viewMode (deferred to stories 8-10/8-11/8-12 when view components exist)
- [ ] Render appropriate view component
- [ ] Fallback to city if missing data

### Task 3: Implement enterNode logic
- [x] enterNode accepts nodeId and nodeType (decoupled from graph data)
- [x] file → building mode, class → cell mode
- [x] Ignores non-enterable types (method, function, variable)
- [x] Push current focus to history stack

### Task 4: Implement exit/back navigation
- [x] exitToParent pops history stack
- [x] Returns to building mode when history has parent
- [x] Returns to city when history empty
- [x] resetToCity clears all state

### Task 5: Create ViewBreadcrumb
- [ ] Show current path (deferred — depends on ViewModeRenderer integration)
- [ ] Clickable breadcrumbs
- [ ] Styled overlay

### Task 6: Wire keyboard shortcuts
- [ ] ESC → exitToParent (deferred — will integrate with existing keyboard shortcuts in story 8-10+)
- [ ] Home → resetToCity

### Task 7: Write unit tests
- [x] Test initial state defaults
- [x] Test setViewMode
- [x] Test enterNode for all node types
- [x] Test history stack building
- [x] Test exitToParent at all levels
- [x] Test resetToCity
- [x] Test full store reset includes view mode

---

## Files to Create

- `packages/ui/src/features/canvas/store/viewModeSlice.ts` - View mode state
- `packages/ui/src/features/canvas/components/ViewModeRenderer.tsx` - Mode router
- `packages/ui/src/features/canvas/components/ViewBreadcrumb.tsx` - Breadcrumb nav
- `packages/ui/src/features/canvas/store/viewModeSlice.test.ts` - State tests

## Files to Modify

- `packages/ui/src/features/canvas/store/index.ts` - Add view mode slice
- `packages/ui/src/features/canvas/Canvas3D.tsx` - Use ViewModeRenderer
- `packages/ui/src/features/canvas/components/GraphRenderer.tsx` - Delegate to ViewModeRenderer

---

## Dependencies

- Story 8-5 (Layout engine interface)
- Story 8-6, 8-7, 8-8 (Layout engines - can use stubs initially)

---

## Estimation

**Complexity:** Medium-High
**Effort:** 6-8 hours
**Risk:** Medium - Interaction design complexity

---

## Definition of Done

- [x] Three view modes functional (city/building/cell state management)
- [x] enterNode determines mode from node type (file→building, class→cell)
- [x] exitToParent navigates back through history
- [x] History stack tracks navigation path
- [ ] Breadcrumb shows current path (deferred to view renderer stories)
- [ ] ViewModeRenderer routes correctly (deferred to stories 8-10/8-11/8-12)
- [x] Unit tests pass (22 tests)

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All 22 tests pass on first GREEN attempt. No bugs encountered.
- Design deviation: `enterNode` accepts `nodeType` parameter instead of looking up graph data in the store. The canvas store doesn't hold graph data (it's passed as props), so this decoupled design avoids adding graph data to the store.
- ViewModeRenderer and ViewBreadcrumb components deferred to stories 8-10/8-11/8-12 since they depend on view components that don't exist yet.

### Completion Notes List

Tasks 1, 3, 4, 7 completed. Tasks 2, 5, 6 deferred to view renderer stories:
- **Task 1 (View mode state):** Added `viewMode`, `focusedNodeId`, `focusHistory` to existing flat Zustand store in store.ts. Added `ViewMode` type export. Included in `reset()`.
- **Task 3 (enterNode):** `enterNode(nodeId, nodeType)` — file → building, class → cell, others ignored. Pushes current focusedNodeId to history stack when non-null.
- **Task 4 (Exit navigation):** `exitToParent()` pops history, restoring parent as focusedNodeId and building as viewMode. Falls back to city when history empty. `resetToCity()` clears all view mode state.
- **Task 7 (Tests):** 22 tests: initial state (3), setViewMode (3), enterNode (8), exitToParent (4), resetToCity (3), full reset (1).

### File List

**New Files:**
- `packages/ui/src/features/canvas/viewMode.test.ts` — 22 unit tests for view mode state

**Modified Files:**
- `packages/ui/src/features/canvas/store.ts` — Added ViewMode type, view mode state, and 4 actions (setViewMode, enterNode, exitToParent, resetToCity)

---

## Change Log
- 2026-02-02: Implemented view mode state management in canvas Zustand store. ViewMode type, enterNode with type-based mode determination, history stack navigation, exit/reset actions. 22 unit tests, all passing.
