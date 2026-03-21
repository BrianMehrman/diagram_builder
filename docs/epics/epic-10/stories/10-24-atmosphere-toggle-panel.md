# Story 10.24: Add Atmosphere Toggle Panel

Status: review

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
- [x] Create atmosphere toggle panel component
- [x] Four checkboxes with labels and descriptions
- [x] Follow existing panel styling (Tailwind, same patterns as LayerToggle)

### Task 2: Wire to store (AC: 4, 5)
- [x] Each checkbox calls `toggleAtmosphereOverlay(key)` action
- [x] Immediate visual response (store-driven, CityAtmosphere reacts to overlay state)

### Task 3: Handle data availability (AC: 3)
- [ ] Check if required metadata exists in current graph
- [ ] Disable checkbox + show tooltip when data unavailable
- **Note:** Deferred — requires graph data plumbing into RightPanel. Each checkbox has a descriptive tooltip via `title` attribute. Indicators themselves are already data-graceful (no data = no render) per story 10-22.

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
Checkbox group component in RightPanel Atmosphere section. Each checkbox reads from `citySettings.atmosphereOverlays[key]` and calls `toggleAtmosphereOverlay(key)` on change. Only renders in city view mode. Descriptive tooltips on each label.

### Completion Notes
- 9 tests passing (default state, toggle on/off, independent toggles, isolation, reset, view mode gating, state persistence)
- Zero new TypeScript errors
- Component rendered in RightPanel in its own "Atmosphere" section between Layout and Export
- AC-3 (disabled state for unavailable data) deferred — indicators are already data-graceful per story 10-22

## File List
- `packages/ui/src/features/canvas/components/AtmosphereTogglePanel.tsx` (NEW)
- `packages/ui/src/features/canvas/components/AtmosphereTogglePanel.test.ts` (NEW)
- `packages/ui/src/features/panels/RightPanel.tsx` (MODIFIED — added import + Atmosphere section)

---

## Change Log
- 2026-02-10: Story created from tech-spec-city-metaphor-rethink.md
