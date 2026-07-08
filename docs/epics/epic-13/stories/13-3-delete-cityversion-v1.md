# Story 13.3: Delete cityVersion v1 Rendering Paths

Status: not-started

## Story

**ID:** 13-3
**Key:** 13-3-delete-cityversion-v1
**Title:** Delete cityVersion v1 Rendering Paths
**Epic:** Epic 13 - One World, Two Skins
**Phase:** Epic 13-A: Skin Seam
**Priority:** HIGH - Removes a whole state axis before the skin seam is cut

**As a** developer,
**I want** the `cityVersion` v1/v2 axis removed with v2 as the only city,
**So that** the skin extraction (13-4) has one rendering path to move, not two.

**Spec Reference:** `docs/specs/2026-07-07-one-world-two-skins-design.md` — Store changes

---

## Acceptance Criteria

- **AC-1:** `citySettings.cityVersion` removed from the canvas store (field, default, setter action)
- **AC-2:** All v1 branches removed; v2 behavior is unconditional in: `CityView.tsx` (ground opacity + underground layer), `CityBlocks.tsx` (flat rendering path at ~line 179), `CitySky.tsx`, `useCityFiltering.ts`, `LayerToggle.tsx`
- **AC-3:** v1-only component `UndergroundLayer` deleted along with its tests (v2 `CityUnderground` remains)
- **AC-4:** `cityVersion` removed from `visualization/types.ts`
- **AC-5:** Epic 10-1 CityView interaction regression suite passes unchanged (v2 assertions); v1-specific tests deleted
- **AC-6:** All four CI checks pass; no `cityVersion` references remain (`grep -rn cityVersion packages/ui/src` is empty)

---

## Tasks/Subtasks

### Task 1: Remove store + types axis (AC: 1, 4)
- [ ] Remove `cityVersion` from `store.ts` (interface line ~89, default line ~253, setter line ~437) and `visualization/types.ts:14`

### Task 2: Remove component branches (AC: 2, 3)
- [ ] `CityView.tsx`: ground opacity always `computeUndergroundGroundOpacity(undergroundVisible)`; remove `UndergroundLayer` branch, keep `CityUnderground`
- [ ] `CityBlocks.tsx`: delete the `!isV2` flat path; drop `isV2` gating
- [ ] `CitySky.tsx`, `useCityFiltering.ts`: keep v2 branch bodies, remove conditionals
- [ ] `LayerToggle.tsx`: remove v1/v2 toggle UI, keep v2 controls
- [ ] Delete `layouts/city/UndergroundLayer.tsx` (+ test file)

### Task 3: Tests + verify (AC: 5, 6)
- [ ] Update/delete tests referencing `cityVersion`; run the CityView interaction suite
- [ ] `grep -rn cityVersion packages/ui/src` returns nothing; run all four CI checks

---

## Dev Notes

- Behavior change for users who had v1 selected: they get v2. This is intended — v2 has been the default since Epic 10 closed.
- If `computeGroundOpacity` in `undergroundUtils.ts` becomes unreferenced after this story, delete it too (check with grep first).

## Dependencies
- 13-1
