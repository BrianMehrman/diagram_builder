# Story 10.23: Add Height Encoding Selector UI

Status: not-started

## Story

**ID:** 10-23
**Key:** 10-23-height-encoding-selector-ui
**Title:** Add Height Encoding Selector UI
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-E: Configurability (Phase 4)
**Priority:** MEDIUM - User control for skyline diagnostic

**As a** developer analyzing a codebase,
**I want** a dropdown in the canvas toolbar to switch what building height represents,
**So that** I can ask different questions of the skyline (complexity? dependencies? churn?).

---

## Acceptance Criteria

- **AC-1:** Dropdown in canvas toolbar with options: Method Count, Dependencies, Lines of Code, Complexity, Change Frequency
- **AC-2:** Selecting an option updates `citySettings.heightEncoding` in store
- **AC-3:** Building heights visually update within 100ms of selection
- **AC-4:** Current selection is visually indicated (selected state)
- **AC-5:** Options with unavailable data show disabled state with explanation tooltip
- **AC-6:** Follows existing toolbar component patterns (Tailwind CSS)

---

## Tasks/Subtasks

### Task 1: Create selector component (AC: 1, 4, 6)
- [ ] Create dropdown component in canvas toolbar area
- [ ] List all encoding options with labels
- [ ] Highlight current selection
- [ ] Follow existing toolbar styling patterns

### Task 2: Wire to store (AC: 2, 3)
- [ ] On selection: call `setHeightEncoding(value)` action
- [ ] Verify buildings re-render with new heights

### Task 3: Handle unavailable data (AC: 5)
- [ ] Check if graph nodes have required metadata for each encoding
- [ ] Disable options with missing data
- [ ] Tooltip: "No complexity data available" etc.

---

## Dev Notes

### Scope Boundaries

- **DO:** Create the UI control
- **DO NOT:** Modify height calculation logic (that's story 10-11)

### References

- Story 10-5: `citySettings.heightEncoding` store state
- Story 10-11: height encoding implementation
- Existing toolbar components for styling patterns

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
