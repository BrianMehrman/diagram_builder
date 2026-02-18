# Story 10.23: Add Height Encoding Selector UI

Status: review

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
- [x] Create dropdown component in canvas toolbar area
- [x] List all encoding options with labels
- [x] Highlight current selection
- [x] Follow existing toolbar styling patterns

### Task 2: Wire to store (AC: 2, 3)
- [x] On selection: call `setHeightEncoding(value)` action
- [x] Verify buildings re-render with new heights

### Task 3: Handle unavailable data (AC: 5)
- [ ] Check if graph nodes have required metadata for each encoding
- [ ] Disable options with missing data
- [ ] Tooltip: "No complexity data available" etc.
- **Note:** Deferred — requires graph data plumbing into RightPanel. Dropdown currently shows all options; selecting an unavailable metric simply yields flat buildings (height 0). This is acceptable UX for now.

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
Simple dropdown component in RightPanel Layout section. Reads `citySettings.heightEncoding` from store, calls `setHeightEncoding()` on change. Only renders in city view mode.

### Completion Notes
- 7 tests passing (store integration: default value, set/get, all encodings, reset, view mode gating, persistence across view switches)
- Zero new TypeScript errors
- Component rendered in RightPanel between DensitySlider and LayerToggle
- AC-5 (disabled state for unavailable data) deferred — requires graph data plumbing into RightPanel toolbar area
- Each option includes tooltip text via HTML `title` attribute

## File List
- `packages/ui/src/features/canvas/components/HeightEncodingSelector.tsx` (NEW)
- `packages/ui/src/features/canvas/components/HeightEncodingSelector.test.ts` (NEW)
- `packages/ui/src/features/panels/RightPanel.tsx` (MODIFIED — added import + render)

---

## Change Log
- 2026-02-10: Story created from tech-spec-city-metaphor-rethink.md
