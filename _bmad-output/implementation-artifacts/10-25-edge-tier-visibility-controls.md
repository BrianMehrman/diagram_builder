# Story 10.25: Add Edge Tier Visibility Controls

Status: not-started

## Story

**ID:** 10-25
**Key:** 10-25-edge-tier-visibility-controls
**Title:** Add Edge Tier Visibility Controls
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-E: Configurability (Phase 4)
**Priority:** MEDIUM - User control for edge visibility and transit map

**As a** developer analyzing dependencies,
**I want** toggle switches for different edge tiers and a transit map mode button,
**So that** I can focus on specific relationship types or switch to a connection-focused view.

---

## Acceptance Criteria

- **AC-1:** Toggle switches for: Cross-district imports, Inheritance/Implementation
- **AC-2:** Prominent transit map mode toggle button (distinct from checkboxes)
- **AC-3:** Toggling updates `edgeTierVisibility` and `transitMapMode` in store
- **AC-4:** Visual feedback is immediate (edges appear/disappear, transit mode activates)
- **AC-5:** Transit map button has distinct visual state when active (highlighted/pressed)
- **AC-6:** Follows existing toolbar component patterns

---

## Tasks/Subtasks

### Task 1: Create edge tier toggles (AC: 1, 3)
- [ ] Toggle switches for cross-district imports and inheritance/implementation
- [ ] Wire to `toggleEdgeTierVisibility(tier)` store action

### Task 2: Create transit map toggle (AC: 2, 5)
- [ ] Prominent button for transit map mode
- [ ] Distinct active state (highlighted background, icon change)
- [ ] Wire to `toggleTransitMapMode()` store action

### Task 3: Verify immediate feedback (AC: 4, 6)
- [ ] Toggling edge tiers → SkyEdges appear/disappear
- [ ] Transit map toggle → building opacity changes, edge emphasis activates
- [ ] Follow existing toolbar styling

---

## Dev Notes

### Scope Boundaries

- **DO:** Create UI controls
- **DO NOT:** Modify SkyEdge or transit map rendering logic (stories 10-12, 10-16)

### References

- Story 10-5: `edgeTierVisibility`, `transitMapMode` store state
- Stories 10-12, 10-16, 10-17: edge and transit map implementation
- Existing toolbar patterns

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
