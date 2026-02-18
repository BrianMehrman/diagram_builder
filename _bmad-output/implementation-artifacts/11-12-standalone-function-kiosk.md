# Story 11.12: Standalone Function Kiosk Component

Status: not-started

## Story

**ID:** 11-12
**Key:** 11-12-standalone-function-kiosk
**Title:** Standalone Function Kiosk Component
**Epic:** Epic 11 - Vertical Layering — 3D Semantic City
**Phase:** Epic 11-D: Overhead Wire Layer
**Priority:** MEDIUM - Visual refinement for standalone functions

**As a** developer viewing the city visualization,
**I want** standalone functions (not inside a class) rendered as small kiosks or shops on the file block,
**So that** I can clearly distinguish standalone functions from class buildings.

**Spec Reference:** `city-metaphor-vertical-layering-spec.md` Section 8

---

## Acceptance Criteria

- **AC-1:** Standalone functions render as small kiosk/shop structures — single-story, compact
- **AC-2:** Kiosks sit directly on the file's city block (Z = 0, on the foundation)
- **AC-3:** Kiosks are visually smaller and simpler than class buildings — clearly readable as "not a class"
- **AC-4:** Overhead wires connect to kiosks when other methods call them
- **AC-5:** Kiosk visual is distinct from existing `FunctionShop` component (or updates it)
- **AC-6:** Co-located unit tests

---

## Tasks/Subtasks

### Task 1: Update FunctionShop component to kiosk visual (AC: 1, 3)
- [ ] Modify `packages/ui/src/features/canvas/components/buildings/FunctionShop.tsx`
- [ ] Reduce dimensions: smaller footprint than class buildings (e.g., 1.5 × 1.5 × 1.0 units)
- [ ] Single-story height (no floor bands, no rooms — it IS the function)
- [ ] Material: distinct from class buildings (lighter, more open feel — like a market kiosk)
- [ ] Consider: awning/canopy geometry detail to reinforce "shop" metaphor (optional, if low poly)

### Task 2: Ensure correct positioning on file block (AC: 2)
- [ ] Kiosk Z-base at ground level on the file block
- [ ] Positioned alongside class buildings within the file block layout
- [ ] Smaller footprint means it fits in gaps between larger buildings

### Task 3: Verify overhead wire connectivity (AC: 4)
- [ ] Overhead wires from Story 11-11 should connect to kiosk rooftops
- [ ] Verify connection point is at kiosk roof height (lower than class building rooftops)
- [ ] Wires connecting to kiosks should arc at appropriate height

### Task 4: Update building geometry factory (AC: 5)
- [ ] Update `buildingGeometry.ts` to reflect kiosk dimensions and material
- [ ] Ensure `getBuildingConfig()` returns updated config for `function` node type

### Task 5: Write tests (AC: 6)
- [ ] Test: kiosk dimensions are smaller than class building
- [ ] Test: kiosk is single-story height
- [ ] Test: kiosk positioned at Z = 0 on file block
- [ ] Test: geometry factory returns kiosk config for function nodes
- [ ] Test: kiosk visually distinct from class building (different material/dimensions)

---

## Dev Notes

- The existing `FunctionShop` component from Story 9-9 already renders standalone functions — this story refines it to be more kiosk-like
- The geometry factory already maps `function` → shop config — update the dimensions and material
- Keep the geometry simple — a kiosk is a box with maybe a slight overhang/awning, not complex architecture

## Dependencies
- 11-11 (overhead wire component — wires connect to kiosks)

## Files Expected
- `packages/ui/src/features/canvas/components/buildings/FunctionShop.tsx` (MODIFIED)
- `packages/ui/src/features/canvas/components/buildings/FunctionShop.test.tsx` (MODIFIED)
- `packages/ui/src/features/canvas/components/buildingGeometry.ts` (MODIFIED)
