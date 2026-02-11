# Story 10.24: Add Atmosphere Toggle Panel

Status: not-started

## Story

**ID:** 10-24
**Key:** 10-24-atmosphere-toggle-panel
**Title:** Add Atmosphere Toggle Panel
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-E: Configurability (Phase 4)
**Priority:** MEDIUM - User control for atmospheric indicators

**As a** developer viewing the city,
**I want** a checkbox panel to toggle individual atmospheric indicators on/off,
**So that** I can control which code health metrics are visually overlaid.

---

## Acceptance Criteria

- **AC-1:** Checkbox group in canvas toolbar for each indicator: Cranes (churn), Lighting (coverage), Smog (complexity), Deprecated
- **AC-2:** Each checkbox shows indicator name + descriptive icon
- **AC-3:** Checkboxes with unavailable data are disabled with explanation
- **AC-4:** Toggling updates `atmosphereOverlays` in store
- **AC-5:** Visual feedback is immediate (indicator appears/disappears)
- **AC-6:** Follows existing toolbar/panel component patterns

---

## Tasks/Subtasks

### Task 1: Create toggle panel (AC: 1, 2, 6)
- [ ] Create atmosphere toggle panel component
- [ ] Four checkboxes with labels and icons
- [ ] Follow existing panel styling

### Task 2: Wire to store (AC: 4, 5)
- [ ] Each checkbox calls `toggleAtmosphereOverlay(key)` action
- [ ] Immediate visual response

### Task 3: Handle data availability (AC: 3)
- [ ] Check if required metadata exists in current graph
- [ ] Disable checkbox + show tooltip when data unavailable

---

## Dev Notes

### Scope Boundaries

- **DO:** Create the UI panel
- **DO NOT:** Modify indicator components (stories 10-18 through 10-22)

### References

- Story 10-5: `atmosphereOverlays` store state
- Stories 10-18 through 10-22: indicator components
- Existing toolbar/panel patterns

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
