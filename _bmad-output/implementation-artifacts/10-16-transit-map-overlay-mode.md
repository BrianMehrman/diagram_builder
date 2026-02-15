# Story 10.16: Implement Transit Map Overlay Mode

Status: review

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
- [x] All building components read `transitMapMode` from store
- [x] When active: set material opacity to 0.15, transparent = true
- [x] When inactive: restore original opacity

### Task 2: Implement edge emphasis (AC: 3, 4)
- [x] SkyEdge: increase line width and opacity when transit map active
- [x] GroundShadow: set opacity to 1.0 when transit map active

### Task 3: Preserve context (AC: 5, 6)
- [x] DistrictGround planes: do NOT change opacity in transit map mode
- [x] Toggle off: all materials return to normal immediately (no animation needed)

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
- Created `useTransitMapStyle` hook returning opacity/transparent overrides (0.15 opacity when transit map active)
- Applied the hook to all 8 building components via import + material props
- For AbstractBuilding/InterfaceBuilding (which have config opacity), transit map opacity takes precedence
- SkyEdge: added `transitMapMode` store read — opacity goes from 0.6 to 1.0, linewidth from 1 to 2
- GroundShadow: already handled in Story 10-13 (opacity 1.0 in transit map mode)
- DistrictGround: intentionally NOT modified — its fixed 0.35 opacity provides spatial context

### Completion Notes
- 6 tests passing (3 hook style tests, 2 store integration, 1 district ground contract)
- No new TypeScript errors
- Toggle off restores all materials immediately (reactive via React re-render)
- No UI toggle button added (deferred to Story 10-25)

## File List
- `packages/ui/src/features/canvas/hooks/useTransitMapStyle.ts` (NEW)
- `packages/ui/src/features/canvas/hooks/useTransitMapStyle.test.ts` (NEW)
- `packages/ui/src/features/canvas/components/SkyEdge.tsx` (MODIFIED — transit map opacity + linewidth)
- `packages/ui/src/features/canvas/components/buildings/ClassBuilding.tsx` (MODIFIED)
- `packages/ui/src/features/canvas/components/buildings/FunctionShop.tsx` (MODIFIED)
- `packages/ui/src/features/canvas/components/buildings/VariableCrate.tsx` (MODIFIED)
- `packages/ui/src/features/canvas/components/buildings/EnumCrate.tsx` (MODIFIED)
- `packages/ui/src/features/canvas/components/buildings/AbstractBuilding.tsx` (MODIFIED)
- `packages/ui/src/features/canvas/components/buildings/InterfaceBuilding.tsx` (MODIFIED)
- `packages/ui/src/features/canvas/views/Building.tsx` (MODIFIED)
- `packages/ui/src/features/canvas/views/ExternalBuilding.tsx` (MODIFIED)

---

## Change Log
- 2026-02-10: Story created from tech-spec-city-metaphor-rethink.md
