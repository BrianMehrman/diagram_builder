# Story 7-3: Implement Camera Flight Animations with Feedback

## Story

**ID:** 7-3
**Key:** 7-3-implement-camera-flight-animations
**Title:** Implement Smooth Camera Flight Animations with Visual Feedback
**Epic:** Epic 7 - "Search-First Command Center" UX Implementation
**Phase:** Implementation - Phase 2 (Core Interaction)
**Priority:** HIGH - Core Interaction Polish

**Description:**

Implement smooth, eased camera flight animations (1-2 seconds) with visual feedback on arrival: highlighted nodes, pulsing edges, tooltips, and breadcrumb updates.

**Context:**

From UX Design Specification:
- **Camera Flight Pattern:** 1-2s smooth eased animation, target pulses, breadcrumb updates, minimap FOV animates
- **On Arrival:** Element centered, highlighted, tooltip appears
- **Accessibility:** Respect `prefers-reduced-motion` (instant teleport)

Current state: Basic camera positioning exists but no smooth animations or arrival feedback.

---

## Acceptance Criteria

- **AC-1:** Smooth camera flight (1-2s eased animation)
- **AC-2:** On arrival: node highlighted, edges pulse, tooltip appears
- **AC-3:** Breadcrumb updates during flight
- **AC-4:** `prefers-reduced-motion` support (instant teleport)
- **AC-5:** ESC cancels flight mid-animation

---

## Tasks/Subtasks

### Task 1: Implement camera animation
- [x] Use GSAP or Three.js animation for smooth camera movement (using requestAnimationFrame)
- [x] Power2.inOut easing (1.5s duration)
- [x] Update camera lookAt target during flight
- [x] Cancel on ESC key or user interaction

### Task 2: Add arrival feedback
- [x] Highlight target node (glow effect with pulse animation)
- [ ] Pulse connected edges (scale animation) - deferred (requires EdgeRenderer changes)
- [x] Show tooltip with node details (NodeTooltip component)
- [x] Fade out highlight after 2s

### Task 3: Update breadcrumb during flight
- [x] Track camera position → node hierarchy (flight state in store)
- [x] Update breadcrumb text during flight (shows flight target path)
- [x] Make breadcrumb clickable (fly to clicked level, disabled during flight)

### Task 4: Respect reduced motion
- [x] Detect `prefers-reduced-motion` media query
- [x] Instant camera position update (no animation)
- [x] Still show arrival feedback (highlight, tooltip)

---

## Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 4-6 hours
- **Priority:** HIGH

**Status:** review
**Created:** 2026-01-24
**Completed:** 2026-01-26

---

## Dev Agent Record

### Session 2026-01-26

**Implementation Approach:**
- Enhanced existing `useCameraFlight` hook with new features
- Added state to canvas store for highlighted node and flight tracking
- Added pulse animation to NodeRenderer for arrival feedback

**Changes Made:**

1. **Canvas Store** (`packages/ui/src/features/canvas/store.ts`):
   - Added `highlightedNodeId` state for arrival glow effect
   - Added `isFlying` and `flightTargetNodeId` for breadcrumb tracking
   - Added `setHighlightedNode()` and `setFlightState()` actions
   - Updated `reset()` to clear new states

2. **useCameraFlight Hook** (`packages/ui/src/features/navigation/useCameraFlight.ts`):
   - Changed animation duration from 800ms to 1500ms (per UX spec)
   - Added `cancelFlight()` function and `isFlying` state to return value
   - Added ESC key listener to cancel flight mid-animation
   - Added highlight on arrival (sets highlightedNodeId)
   - Added auto-clear highlight after 2 seconds
   - Added flight state tracking for breadcrumb updates
   - Added cleanup on unmount

3. **NodeRenderer** (`packages/ui/src/features/canvas/components/NodeRenderer.tsx`):
   - Added pulse animation using `useFrame` from react-three-fiber
   - Added emissive glow effect for highlighted nodes (white glow)
   - Added pulsing ring around highlighted node (blue)
   - Smooth fade-out when unhighlighted

**Tests:**
- Updated 7 existing tests for new 1500ms duration
- Added 7 new tests for:
  - `cancelFlight` function
  - `isFlying` state
  - Flight state management
  - ESC key cancellation
  - Highlighted node on arrival
  - Auto-clear highlight after 2s
- Added 9 new tests for canvas store:
  - `highlightedNodeId` state
  - `isFlying` and `flightTargetNodeId` state
  - `setHighlightedNode()` and `setFlightState()` actions
  - Reset behavior

**Additional Implementation (continued):**

4. **NodeTooltip** (`packages/ui/src/features/canvas/components/NodeTooltip.tsx`):
   - Shows node details when highlighted (after camera arrival)
   - Displays type icon, label, path, language, LOC, complexity, LOD
   - Accessible with `role="tooltip"` and `aria-live="polite"`
   - 11 unit tests

5. **Breadcrumbs** (`packages/ui/src/features/navigation/Breadcrumbs.tsx`):
   - Shows flight target path during flight (not just selected node)
   - Displays "Flying..." indicator during flight
   - Disables clicks during flight
   - Shows animated arrow icon during flight
   - 5 new flight state tests

**Remaining Work:**
- Task 2: Pulse connected edges → Deferred to **Story 7-9** (requires EdgeRenderer changes)

---

## File List

**Created:**
- `packages/ui/src/features/canvas/components/NodeTooltip.tsx` - Tooltip for highlighted nodes
- `packages/ui/src/features/canvas/components/NodeTooltip.test.tsx` - 11 tests

**Modified:**
- `packages/ui/src/features/canvas/store.ts` - Added highlightedNodeId, isFlying, flightTargetNodeId
- `packages/ui/src/features/canvas/store.test.ts` - Added 9 new tests
- `packages/ui/src/features/navigation/useCameraFlight.ts` - Enhanced with cancel, highlight, flight state
- `packages/ui/src/features/navigation/useCameraFlight.test.ts` - Updated + 7 new tests
- `packages/ui/src/features/canvas/components/NodeRenderer.tsx` - Added pulse animation for highlight
- `packages/ui/src/features/navigation/Breadcrumbs.tsx` - Flight state support, target path during flight
- `packages/ui/src/features/navigation/Breadcrumbs.test.tsx` - Added 5 flight state tests
