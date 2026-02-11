# Story 10.9: Update RooftopGarden for Dynamic Y-Offset

Status: not-started

## Story

**ID:** 10-9
**Key:** 10-9-rooftop-garden-dynamic-offset
**Title:** Update RooftopGarden for Dynamic Y-Offset
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-B: Core Metaphor (Phase 1)
**Priority:** MEDIUM - Ensures nested types stack correctly on log-scaled buildings

**As a** developer viewing a class with nested types,
**I want** rooftop garden structures to stack on top of the log-scaled building height,
**So that** nested types are positioned correctly regardless of the parent building's floor count.

---

## Acceptance Criteria

- **AC-1:** RooftopGarden Y-offset = `buildingHeight + gap` (dynamically calculated, not hardcoded)
- **AC-2:** Building height is received from parent component (calculated via `calculateBuildingHeight`)
- **AC-3:** Nested types stack on top of the last method floor correctly
- **AC-4:** Works with all building types that support rooftop gardens (ClassBuilding, AbstractBuilding)
- **AC-5:** Co-located unit tests verify correct Y positioning

---

## Tasks/Subtasks

### Task 1: Update RooftopGarden Y-offset (AC: 1, 2, 3)
- [ ] Modify `RooftopGarden.tsx` to accept `parentHeight` prop
- [ ] Calculate Y-offset as `parentHeight + ROOFTOP_GAP`
- [ ] Remove any hardcoded Y-offset values

### Task 2: Update parent building components (AC: 4)
- [ ] Pass `buildingHeight` from ClassBuilding to RooftopGarden
- [ ] Pass `buildingHeight` from AbstractBuilding to RooftopGarden
- [ ] Height comes from `calculateBuildingHeight()` (Story 10-8)

### Task 3: Write unit tests (AC: 5)
- [ ] Test: RooftopGarden positioned at `parentHeight + gap` for various heights
- [ ] Test: works with log-scaled height (5-method class vs 30-method class)

---

## Dev Notes

### Scope Boundaries

- **DO:** Update RooftopGarden positioning
- **DO NOT:** Change RooftopGarden visual appearance or tier logic
- **DO NOT:** Change the nested type detection logic (nestedTypeUtils.ts)

### References

- `packages/ui/src/features/canvas/components/buildings/RooftopGarden.tsx`
- `packages/ui/src/features/canvas/components/buildings/nestedTypeUtils.ts`
- Story 10-8: `calculateBuildingHeight` utility

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
