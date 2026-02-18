# Story 10.25: Add Edge Tier Visibility Controls

Status: review

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
- [x] Toggle switches for cross-district imports and inheritance/implementation
- [x] Wire to `toggleEdgeTierVisibility(tier)` store action

### Task 2: Create transit map toggle (AC: 2, 5)
- [x] Prominent button for transit map mode
- [x] Distinct active state (blue background + ring when active, gray when inactive)
- [x] Wire to `toggleTransitMapMode()` store action

### Task 3: Verify immediate feedback (AC: 4, 6)
- [x] Toggling edge tiers → store updates drive SkyEdge visibility
- [x] Transit map toggle → store updates drive building opacity / edge emphasis
- [x] Follow existing toolbar styling (Tailwind, same patterns as LayerToggle/AtmosphereTogglePanel)

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
Two-part component: (1) checkbox group for edge tier visibility (crossDistrict, inheritance), (2) prominent toggle button for transit map mode. All wired to store actions. City-view-only.

### Completion Notes
- 14 tests passing (edge tier defaults, toggle on/off, independence, reset; transit map toggle on/off, reset, independence; view mode gating, state persistence)
- Zero new TypeScript errors
- Component rendered in RightPanel in "Edges" section between Atmosphere and Export
- Transit map button: blue bg + ring when active, gray when inactive, `aria-pressed` for accessibility
- Edge tiers default to ON (both visible), transit map defaults to OFF

## File List
- `packages/ui/src/features/canvas/components/EdgeTierControls.tsx` (NEW)
- `packages/ui/src/features/canvas/components/EdgeTierControls.test.ts` (NEW)
- `packages/ui/src/features/panels/RightPanel.tsx` (MODIFIED — added import + Edges section)

---

## Change Log
- 2026-02-10: Story created from tech-spec-city-metaphor-rethink.md
