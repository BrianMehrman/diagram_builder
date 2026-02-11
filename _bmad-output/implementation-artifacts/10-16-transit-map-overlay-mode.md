# Story 10.16: Implement Transit Map Overlay Mode

Status: not-started

## Story

**ID:** 10-16
**Key:** 10-16-transit-map-overlay-mode
**Title:** Implement Transit Map Overlay Mode
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-C: Sky Layer (Phase 2)
**Priority:** MEDIUM - Alternative view emphasizing connections

**As a** developer analyzing dependency structure,
**I want** a "transit map" mode that fades buildings and emphasizes edges,
**So that** I can see the codebase's connectivity as a subway-map-style network.

---

## Acceptance Criteria

- **AC-1:** Toggle: `citySettings.transitMapMode`
- **AC-2:** When active: building opacity drops to 0.15
- **AC-3:** When active: edge opacity increases to 1.0, edge width doubles
- **AC-4:** Ground shadows become fully opaque in transit map mode
- **AC-5:** District ground planes remain at normal opacity for context
- **AC-6:** Toggle off restores normal rendering immediately

---

## Tasks/Subtasks

### Task 1: Implement building opacity change (AC: 2)
- [ ] All building components read `transitMapMode` from store
- [ ] When active: set material opacity to 0.15, transparent = true
- [ ] When inactive: restore original opacity

### Task 2: Implement edge emphasis (AC: 3, 4)
- [ ] SkyEdge: increase line width and opacity when transit map active
- [ ] GroundShadow: set opacity to 1.0 when transit map active

### Task 3: Preserve context (AC: 5, 6)
- [ ] DistrictGround planes: do NOT change opacity in transit map mode
- [ ] Toggle off: all materials return to normal immediately (no animation needed)

---

## Dev Notes

### Scope Boundaries

- **DO:** Implement the visual mode toggle behavior
- **DO NOT:** Add the UI toggle button (that's story 10-25)

### References

- Story 10-5: `transitMapMode` store state
- Story 10-12: SkyEdge component
- Story 10-13: GroundShadow component

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
