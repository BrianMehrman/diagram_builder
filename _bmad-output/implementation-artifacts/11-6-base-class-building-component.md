# Story 11.6: Base Class Building Component

Status: not-started

## Story

**ID:** 11-6
**Key:** 11-6-base-class-building-component
**Title:** Base Class Building Component
**Epic:** Epic 11 - Vertical Layering — 3D Semantic City
**Phase:** Epic 11-B: Base Class Visual Differentiation
**Priority:** HIGH - Visual distinction for foundational classes

**As a** developer viewing the city visualization,
**I want** base classes (classes that other classes inherit from) to have a visually distinct building with a different color scheme and box profile,
**So that** I can immediately identify foundational classes at a glance even from city-level zoom.

**Spec Reference:** `city-metaphor-vertical-layering-spec.md` Sections 4.1, 4.2

---

## Acceptance Criteria

- **AC-1:** Base class buildings use a distinct color scheme that differs from regular class buildings (e.g., warmer tones, stone/marble palette)
- **AC-2:** Base class buildings have a different box profile/geometry than regular classes (e.g., wider base, tapered/stepped/pyramidal shape, or beveled edges)
- **AC-3:** Both color AND profile differ — base classes are unmistakable even at city-level zoom (LOD 1-2)
- **AC-4:** The distinct visual reads as "foundational" — communicating that other code depends on this class
- **AC-5:** Base class building still supports method rooms at LOD 3+ (same containment behavior as regular ClassBuilding)
- **AC-6:** Co-located unit tests

---

## Tasks/Subtasks

### Task 1: Design base class color palette (AC: 1)
- [ ] Define base class color constants in `cityViewUtils.ts`
- [ ] Warmer/earthier tones to contrast with regular class colors (e.g., sandstone, warm gray, terracotta)
- [ ] Must remain distinguishable from existing building type colors (interface=glass, abstract=dashed, etc.)

### Task 2: Create base class geometry (AC: 2, 4)
- [ ] Extend `buildingGeometry.ts` factory with base class config
- [ ] Different profile: wider base tapering upward, beveled edges, or stepped profile
- [ ] Geometry should read as "solid, foundational, load-bearing" at a glance
- [ ] Keep geometry efficient (low poly count for city-level performance)

### Task 3: Create or modify BaseClassBuilding component (AC: 3, 5)
- [ ] Option A: New `BaseClassBuilding.tsx` component
- [ ] Option B: Modify `ClassBuilding.tsx` to accept `isBaseClass` prop and swap geometry/material
- [ ] Apply base class color palette as material
- [ ] Apply base class geometry profile
- [ ] Support method room rendering at LOD 3+ (reuse room layout from Stories 11-2/11-3)

### Task 4: Integrate into type-switched rendering (AC: 3)
- [ ] Update CityView type-switching logic to check `isBaseClass` flag (from Story 11-5)
- [ ] Route base classes to the distinct building component/config
- [ ] Ensure district coloring still applies as tint over base class palette

### Task 5: Write tests (AC: 6)
- [ ] Test: base class building uses distinct color (not regular class color)
- [ ] Test: base class building uses distinct geometry profile
- [ ] Test: base class building still renders method rooms at LOD 3+
- [ ] Test: regular class does NOT get base class treatment
- [ ] Test: geometry factory returns correct config for base class

---

## Dev Notes

- Consider whether base class buildings should also be slightly larger in footprint to reinforce "foundational" reading
- The building geometry factory (`buildingGeometry.ts`) already maps node types to configs — extend this with a `isBaseClass` branch
- Keep the profile simple enough for LOD 1-2 readability — complex geometry is wasted at distance

## Dependencies
- 11-5 (base class detection utility — provides the `isBaseClass` flag)
- 11-2 (method room component — rooms must work inside base class buildings too)

## Files Expected
- `packages/ui/src/features/canvas/components/buildings/ClassBuilding.tsx` (MODIFIED or new BaseClassBuilding.tsx)
- `packages/ui/src/features/canvas/components/buildingGeometry.ts` (MODIFIED)
- `packages/ui/src/features/canvas/views/cityViewUtils.ts` (MODIFIED — color constants)
- `packages/ui/src/features/canvas/views/CityView.tsx` or `CityBlocks.tsx` (MODIFIED — type switching)
