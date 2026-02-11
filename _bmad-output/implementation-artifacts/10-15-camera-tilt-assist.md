# Story 10.15: Implement Camera Tilt-Assist

Status: not-started

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
- [ ] On node selection: calculate target pitch to show highest outgoing sky edge
- [ ] Animate camera pitch over 0.5s with ease-out curve
- [ ] Use existing camera animation infrastructure (from Epic 7 camera flight)

### Task 2: Implement cancellation (AC: 2)
- [ ] Detect user camera input during animation
- [ ] Cancel tilt animation immediately on user input
- [ ] Return camera control to user

### Task 3: Add preference (AC: 3, 4)
- [ ] Add `cameraTiltAssist` to store (or citySettings)
- [ ] Gate tilt behavior behind preference
- [ ] Default: true

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
_To be filled during implementation_

### Completion Notes
_To be filled on completion_

## File List
_To be filled during implementation_

---

## Change Log
- 2026-02-10: Story created from tech-spec-city-metaphor-rethink.md
