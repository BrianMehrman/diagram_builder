# Story 6-3: Implement User Feedback & Loading States

## Story

**ID:** 6-3
**Key:** 6-3-implement-user-feedback-loading-states
**Title:** Add Parsing Status, Graph Loaded Confirmation, and Empty State Handling
**Epic:** Epic 6 - Fix Parser & Complete Core Integration
**Phase:** Implementation
**Priority:** HIGH - Transforms UX from Broken to Professional

**Description:**

Implement comprehensive user feedback throughout the codebase upload and visualization pipeline. Add parsing status indicators, graph loaded confirmation, empty state handling, and auto-focus on loaded graphs.

**Context:**

From brainstorming session constraint mapping, Stage 7 (UI Rendering) identified critical UX gaps:
- No visual feedback when graph is empty
- No "No codebase loaded" message
- No graph loaded confirmation
- Blank screen provides no feedback to user

Current behavior: User uploads codebase and sees... nothing. No indication if:
- Parsing is in progress
- Parsing completed
- Graph is loading
- Graph is ready
- Graph is empty
- Something failed

This story transforms the UX from "silent and broken" to "informative and professional."

---

## Acceptance Criteria

- **AC-1:** Parsing status indicators implemented
  - Show "Parsing codebase..." message when status = 'processing'
  - Display current status: pending → processing → completed
  - Show spinner/loading animation during parsing
  - Clear visual distinction between states

- **AC-2:** Graph loaded confirmation shown
  - Show success message when graph loads
  - Display node and edge counts: "Graph ready - X nodes, Y edges"
  - Toast notification or status banner
  - Clear indication parsing is complete

- **AC-3:** Empty state handling implemented
  - Detect empty graph (nodes.length === 0)
  - Show "No codebase loaded" message in canvas
  - Display "Import Codebase" button in empty state
  - Helpful text: "Upload a codebase to see 3D visualization"

- **AC-4:** Auto-focus on loaded graph
  - Camera automatically positions to show entire graph
  - Smooth animation/transition to visualization
  - Calculate bounding box of all nodes
  - Set camera distance to fit graph in view

- **AC-5:** Loading progress tracking (optional - if Story 6-2 provides API)
  - Show progress bar or percentage if available
  - Display "Processing file X of Y" if available
  - Estimated time remaining (if feasible)

- **AC-6:** Error state handling
  - Show error message if parsing fails
  - Display "Retry" button
  - Clear error explanation
  - Link to docs/help if appropriate

---

## Tasks/Subtasks

### Task 1: Design state machine for codebase status
- [ ] Map states: none → pending → processing → completed → error
- [ ] Define UI component for each state
- [ ] Design transitions between states
- [ ] Document state flow

### Task 2: Implement parsing status UI
- [ ] Create CodebaseStatusIndicator component
- [ ] Show spinner when status = 'processing'
- [ ] Show "Parsing codebase..." message
- [ ] Update status display when state changes
- [ ] Style status indicator (color, animation)

### Task 3: Implement graph loaded confirmation
- [ ] Add toast notification system (react-hot-toast or similar)
- [ ] Show success toast when graph loads
- [ ] Display node and edge counts in message
- [ ] Auto-dismiss toast after 3-5 seconds
- [ ] OR: Use status banner instead of toast

### Task 4: Implement empty state UI
- [ ] Create EmptyCanvasState component
- [ ] Detect empty graph (nodes.length === 0 && status === 'completed')
- [ ] Show "No codebase loaded" message
- [ ] Display helpful text about importing codebases
- [ ] Add "Import Codebase" button
- [ ] Style empty state (centered, clear typography)

### Task 5: Implement auto-focus on graph
- [ ] Calculate bounding box of all nodes
- [ ] Determine camera position to fit graph
- [ ] Animate camera transition smoothly
- [ ] Trigger auto-focus when graph loads
- [ ] Handle edge case: single node (don't zoom too close)

### Task 6: Add error state handling
- [ ] Create ErrorState component
- [ ] Show error message when status = 'error'
- [ ] Display error details if available
- [ ] Add "Retry Import" button
- [ ] Log error to console for debugging
- [ ] Link to documentation if helpful

### Task 7: Integrate with WorkspacePage
- [ ] Update WorkspacePage to use new status components
- [ ] Pass graph data to Canvas3D
- [ ] Pass status state to status indicator
- [ ] Handle state transitions in loadGraphData()
- [ ] Test all state transitions

### Task 8: Testing
- [ ] Test pending state (upload just started)
- [ ] Test processing state (parsing in progress)
- [ ] Test completed with data (graph renders)
- [ ] Test completed with empty graph (empty state shown)
- [ ] Test error state (parsing failed)
- [ ] Test auto-focus on graph load

---

## Dev Notes

### UI State Machine

**States:**

1. **NONE** - No codebase uploaded yet
   - **UI:** Empty state with "Import Codebase" button
   - **Action:** Show import dialog on button click

2. **PENDING** - Upload request sent, waiting for parser
   - **UI:** "Preparing to parse codebase..." message
   - **Action:** Show spinner

3. **PROCESSING** - Parser actively working
   - **UI:** "Parsing codebase..." with spinner
   - **Optional:** Progress bar if API provides progress
   - **Action:** Poll for status changes

4. **COMPLETED (with data)** - Parsing done, graph has nodes
   - **UI:** Success toast "Graph ready - X nodes, Y edges"
   - **Action:** Auto-focus camera, render graph, dismiss toast

5. **COMPLETED (empty)** - Parsing done, graph has 0 nodes
   - **UI:** "No code elements found" message
   - **Action:** Show helpful text, keep import button visible

6. **ERROR** - Parsing failed
   - **UI:** "Parsing failed: [error message]"
   - **Action:** Show retry button, log error

### Component Architecture

```typescript
// New Components

// Status indicator in header/sidebar
<CodebaseStatusIndicator
  status={codebase?.status}
  nodeCount={graphData?.nodes.length}
  edgeCount={graphData?.edges.length}
/>

// Empty state overlay in canvas
<EmptyCanvasState
  onImportClick={() => setShowImportDialog(true)}
/>

// Error state overlay
<ErrorState
  error={errorMessage}
  onRetry={() => handleRetry()}
/>

// Success toast
toast.success(`Graph ready - ${nodes.length} nodes, ${edges.length} edges`);
```

### Auto-Focus Algorithm

```typescript
// Calculate bounding box
const bounds = {
  minX: Math.min(...nodes.map(n => n.position.x)),
  maxX: Math.max(...nodes.map(n => n.position.x)),
  minY: Math.min(...nodes.map(n => n.position.y)),
  maxY: Math.max(...nodes.map(n => n.position.y)),
  minZ: Math.min(...nodes.map(n => n.position.z)),
  maxZ: Math.max(...nodes.map(n => n.position.z)),
};

// Calculate center and size
const center = {
  x: (bounds.minX + bounds.maxX) / 2,
  y: (bounds.minY + bounds.maxY) / 2,
  z: (bounds.minZ + bounds.maxZ) / 2,
};

const size = Math.max(
  bounds.maxX - bounds.minX,
  bounds.maxY - bounds.minY,
  bounds.maxZ - bounds.minZ
);

// Position camera to see entire graph
const distance = size * 2; // Adjust multiplier as needed
camera.position.set(
  center.x + distance,
  center.y + distance,
  center.z + distance
);
camera.lookAt(center.x, center.y, center.z);

// Animate transition
controls.target.set(center.x, center.y, center.z);
controls.update();
```

### Progress Tracking Integration

**If Story 6-2 provides progress API:**

```typescript
// Poll for progress
const checkProgress = async () => {
  const progress = await api.getCodebaseProgress(codebaseId);
  setProgress({
    filesProcessed: progress.filesProcessed,
    totalFiles: progress.totalFiles,
    percentage: progress.percentage,
  });
};

// Show in UI
<ProgressBar
  value={progress.percentage}
  label={`Processing ${progress.filesProcessed} of ${progress.totalFiles} files`}
/>
```

**If no progress API available:**
- Just show indeterminate spinner
- "Parsing codebase..." message
- No percentage or file counts

### Files Involved

**UI Package:**
- `packages/ui/src/features/workspace/WorkspacePage.tsx` (update state handling)
- `packages/ui/src/features/workspace/CodebaseStatusIndicator.tsx` (create)
- `packages/ui/src/features/canvas/EmptyCanvasState.tsx` (create)
- `packages/ui/src/features/canvas/ErrorState.tsx` (create)
- `packages/ui/src/features/canvas/Canvas3D.tsx` (add auto-focus)
- `packages/ui/src/hooks/useAutoFocus.ts` (create - optional)
- `packages/ui/package.json` (add react-hot-toast if using toasts)

**Styling:**
- Update Tailwind classes for status components
- Add animations for state transitions
- Ensure responsive design

### Dependencies

- **Depends On:** Story 6-1 (parser must work to have data to show)
- **Integrates With:** Story 6-2 (uses progress API if available)
- **Enables:** Better UX, user confidence in system

### Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 6-8 hours
- **Priority:** HIGH - Critical for professional UX

---

## Dev Agent Record

*Implementation notes will be added here during development*

---

## File List

*Modified/created files will be listed here after implementation*

---

## Change Log

- **2026-01-04**: Story created from Epic 6 planning
  - Brainstorming session identified critical UX gaps
  - Constraint mapping revealed missing loading states
  - User feedback needed throughout pipeline
  - Auto-focus on graph improves discoverability

**Status:** backlog
**Created:** 2026-01-04
**Last Updated:** 2026-01-04
