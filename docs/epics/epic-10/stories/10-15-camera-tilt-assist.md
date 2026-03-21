# Story 10.15: Implement Camera Tilt-Assist

Status: review

## Story

**ID:** 10-15
**Key:** 10-15-camera-tilt-assist
**Title:** Implement Camera Tilt-Assist
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-C: Sky Layer (Phase 2)
**Priority:** MEDIUM - UX enhancement for sky edge discoverability

**As a** developer selecting a building,
**I want** the camera to smoothly tilt upward to reveal outgoing sky edges,
**So that** I can discover dependencies without manually adjusting the camera.

---

## Acceptance Criteria

- **AC-1:** On node selection, camera smoothly animates pitch upward (0.5s ease) to show outgoing edges
- **AC-2:** User can cancel animation by moving camera during tilt
- **AC-3:** `cameraTiltAssist: boolean` preference in store (default: true)
- **AC-4:** When disabled, selection does not affect camera pitch
- **AC-5:** Animation is smooth (eased, not jarring)

---

## Tasks/Subtasks

### Task 1: Implement tilt animation (AC: 1, 5)
- [x] On node selection: calculate target pitch to show highest outgoing sky edge
- [x] Animate camera pitch over 0.5s with ease-out curve
- [x] Use existing camera animation infrastructure (from Epic 7 camera flight)

### Task 2: Implement cancellation (AC: 2)
- [x] Detect user camera input during animation
- [x] Cancel tilt animation immediately on user input
- [x] Return camera control to user

### Task 3: Add preference (AC: 3, 4)
- [x] Add `cameraTiltAssist` to store (or citySettings)
- [x] Gate tilt behavior behind preference
- [x] Default: true

---

## Dev Notes

### Scope Boundaries

- **DO:** Add camera tilt behavior on selection
- **DO NOT:** Change the existing camera flight system
- **DO NOT:** Add UI for the preference toggle (defer to Phase 4 or settings)

### References

- `packages/ui/src/features/canvas/` — camera system
- Story 7-3: Camera flight animations (reuse animation infrastructure)

---

## Dev Agent Record

### Implementation Plan
- New `useCameraTiltAssist` hook following the same `requestAnimationFrame` + easing pattern as `useCameraFlight`
- On selection change: tilts camera target Y upward by 8 units over 0.5s with ease-out cubic
- Cancellation: snapshots camera position at start, if position drifts >0.01 (user input), cancels immediately
- Gated by: `cameraTiltAssist` preference (default true), city view mode, not during flight
- Respects `prefers-reduced-motion`: instant tilt (no animation)
- Wired into CityView as a hook call

### Completion Notes
- 15 tests passing (4 easing, 8 hook behavior, 3 store preference)
- No new TypeScript errors
- Does NOT modify existing camera flight system — independent hook
- `cameraTiltAssist` added to `CitySettings` interface with `toggleCameraTiltAssist` action

## File List
- `packages/ui/src/features/canvas/hooks/useCameraTiltAssist.ts` (NEW)
- `packages/ui/src/features/canvas/hooks/useCameraTiltAssist.test.ts` (NEW)
- `packages/ui/src/features/canvas/store.ts` (MODIFIED — added cameraTiltAssist to CitySettings)
- `packages/ui/src/features/canvas/views/CityView.tsx` (MODIFIED — wired useCameraTiltAssist hook)

---

## Change Log
- 2026-02-10: Story created from tech-spec-city-metaphor-rethink.md
