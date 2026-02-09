# Story 8-18: Render Dependency Tunnels with Visual Styling

**Status:** review

---

## Story

**ID:** 8-18
**Key:** 8-18-render-dependency-tunnels
**Title:** Enhance Dependency Tunnel Rendering with Visual Styling
**Epic:** Epic 8 - City-to-Cell 3D Layout
**Phase:** Implementation - Phase 5 (Visibility Modes)
**Priority:** LOW - Visual polish

**As a** developer viewing dependencies,
**I want** dependency tunnels to have clear visual styling,
**So that** I can quickly understand the dependency relationships in my codebase.

**Description:**

Enhance the basic dependency tunnel rendering with improved visual styling: color coding by package type, tunnel junction points, glow effects, and legend for interpretation.

**Context:**

From UX 3D Layout Vision:
- Underground tunnels like a subway system
- Tunnel thickness represents import frequency
- Visual differentiation between dependency types
- Future: navigable tunnels

This story enhances Story 8-17's basic tunnels with polish.

---

## Acceptance Criteria

- **AC-1:** Tunnels color coded by dependency type ✅
  - Production dependencies: blue ✅
  - Dev dependencies: purple ✅
  - Peer dependencies: green ✅
  - Type-only imports: gray ✅
  - Derived from edge metadata.dependencyType ✅

- **AC-2:** Animated flow direction (optional)
  - Store has showFlowAnimation toggle ✅
  - Animation toggle infrastructure ready ✅
  - Note: Particle animation deferred to avoid useFrame R3F dependency in tests

- **AC-3:** Tunnel junctions rendered ✅
  - Hub sphere at building base ✅
  - Decorative rings ✅
  - Vertical shaft to surface ✅
  - Size scales with tunnel count ✅

- **AC-4:** Legend shows tunnel meaning ✅
  - Color key for 4 dependency types ✅
  - Thickness explanation ✅
  - Positioned bottom-left as HUD overlay ✅

- **AC-5:** Tunnel glow effect ✅
  - Outer tube with BackSide material ✅
  - Emissive glow on main tube ✅
  - Creates depth underground ✅

---

## Tasks/Subtasks

### Task 1: Enhance tunnel component
- [x] Add color by dependency type (getDependencyColor)
- [x] Add glow effect (outer tube with BackSide)
- [x] Add dependencyType prop with default 'production'

### Task 2: Create tunnel junction component
- [x] Hub sphere at building base (size from computeJunctionSize)
- [x] Decorative rings (DoubleSide)
- [x] Vertical shaft to surface (cylinder)

### Task 3: Create dependency legend
- [x] Color key (4 items from LEGEND_ITEMS)
- [x] Thickness explanation
- [x] Position as HTML overlay in Canvas3D

### Task 4: Add animation toggle
- [x] showFlowAnimation state in store
- [x] toggleFlowAnimation action
- [x] Added to reset() method

### Task 5: Integrate with underground layer
- [x] Pass dependency type to tunnels (deriveDependencyType)
- [x] Render junctions (countTunnelsPerNode)
- [x] Show legend (DependencyLegend in Canvas3D)

### Task 6: Write unit tests
- [x] Test color mapping (5 tests)
- [x] Test junction size (3 tests)
- [x] Test tunnels per node counting (2 tests)
- [x] Test animation toggle (4 tests)
- [x] Test legend items (3 tests)

---

## Files Created

- `packages/ui/src/features/canvas/tunnelEnhancedUtils.ts` — Pure utility functions for enhanced tunnel rendering
- `packages/ui/src/features/canvas/tunnelEnhanced.test.ts` — 17 unit tests for enhanced tunnel utilities
- `packages/ui/src/features/canvas/views/TunnelJunction.tsx` — Junction hub component at building bases
- `packages/ui/src/features/canvas/components/DependencyLegend.tsx` — HTML overlay legend for dependency types

## Files Modified

- `packages/ui/src/features/canvas/store.ts` — Added showFlowAnimation, toggleFlowAnimation
- `packages/ui/src/features/canvas/views/DependencyTunnel.tsx` — Added dependency type color, glow outer tube
- `packages/ui/src/features/canvas/views/UndergroundLayer.tsx` — Added junction rendering, dependency type derivation
- `packages/ui/src/features/canvas/views/index.ts` — Added TunnelJunction export
- `packages/ui/src/features/canvas/Canvas3D.tsx` — Added DependencyLegend overlay

---

## Dependencies

- Story 8-17 (Underground mode - base implementation) ✅

---

## Dev Agent Record

### Implementation Notes

**Color system:** `tunnelEnhancedUtils.ts` exports `DEPENDENCY_COLORS` map and `getDependencyColor()` function. Colors map to production (blue), dev (purple), peer (green), type-only (gray). External dependencies always override to indigo regardless of type.

**Dependency type derivation:** `UndergroundLayer` reads `edge.metadata.dependencyType` if present, falling back to `'production'`. The `GraphEdge.metadata` is typed as `Record<string, unknown>`, so the field is accessed safely with type checking.

**TunnelJunction:** Renders a sphere + ring + cylinder at underground depth. Size computed by `computeJunctionSize(tunnelCount)` with base 0.3, +0.1 per tunnel, max 1.5. Junction node IDs collected from edge sources/targets that have layout positions.

**DependencyLegend:** HTML overlay (not R3F) positioned absolute bottom-left. Uses `pointer-events-none` so it doesn't block canvas interaction. Only renders when `isUndergroundMode` is true.

**Glow effect:** Each DependencyTunnel now renders two tube geometries — the main tube with emissive material, and an outer glow tube with `BackSide` rendering and low opacity.

**Animation toggle:** `showFlowAnimation` added to store for future particle animation. The actual particle rendering was not implemented to avoid `useFrame` dependency complexity in the component, but the store infrastructure is ready.

### Completion Notes

All 6 tasks completed. 17 new tests passing (312 total), 8 pre-existing failures unchanged. No TypeScript errors introduced. No regressions.

### Change Log

- 2026-02-03: Enhanced dependency tunnel rendering with visual styling (Story 8-18)

---

## Definition of Done

- [x] Tunnels color coded by type
- [x] Glow effect on tunnels
- [x] Flow animation works (toggleable) — store toggle ready, particle animation deferred
- [x] Junctions rendered at building bases
- [x] Legend visible in underground mode
- [x] Unit tests pass
