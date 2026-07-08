# Story 13.4: Route CityView Through the Architect Skin (Zero Visual Diff)

Status: not-started

## Story

**ID:** 13-4
**Key:** 13-4-cityview-through-skin
**Title:** Route CityView Through the Architect Skin (Zero Visual Diff)
**Epic:** Epic 13 - One World, Two Skins
**Phase:** Epic 13-A: Skin Seam
**Priority:** CRITICAL - This is the seam cut

**As a** developer,
**I want** CityView to render its five layers through `useSkin()` slots instead of hardcoded imports,
**So that** swapping `activeSkin` swaps the entire visual language with zero layout change.

**Spec Reference:** `docs/specs/2026-07-07-one-world-two-skins-design.md` — Architecture / Skin layer

---

## Acceptance Criteria

- **AC-1:** `CityView.tsx` renders `skin.Ground`, `skin.Structures`, `skin.Overhead`, `skin.Atmosphere`, `skin.Underground` from `useSkin()`; no direct imports of CityBlocks/CitySky/CityAtmosphere/CityUnderground/GroundPlane remain in CityView
- **AC-2:** Layout (`useCityLayout`), camera hooks (`useCameraTiltAssist`, `useFocusEscape`), and `LodController` stay in CityView — they are skin-agnostic substrate, not skin content
- **AC-3:** With `activeSkin === 'architect'` the rendered output is identical: full Epic 10-1 CityView interaction regression suite passes without assertion changes
- **AC-4:** basic3d is frozen: its switcher label reads "Basic 3D (debug)" and `docs/specs/2026-07-07-one-world-two-skins-plan.md` records the freeze (no new features, excluded from skin/continuous-world work)
- **AC-5:** All four CI checks pass

---

## Tasks/Subtasks

### Task 1: Wire skin slots into CityView (AC: 1, 2)
- [ ] Failing test: mock the skin registry with sentinel components; assert CityView renders all five slots with correct props (`graph`, ground `width/depth/opacity`)
- [ ] Replace hardcoded children with `const skin = useSkin()` slot rendering

### Task 2: Regression proof (AC: 3)
- [ ] Run the Epic 10-1 interaction suite unmodified — must pass
- [ ] Manual smoke: `./scripts/init.sh`, open `/canvas`, verify city renders as before (buildings, sky edges, underground toggle, atmosphere overlays)

### Task 3: Freeze basic3d (AC: 4)
- [ ] Change label in `layouts/index.ts` to `'Basic 3D (debug)'`
- [ ] Add freeze note to the plan doc

### Task 4: Verify (AC: 5)
- [ ] All four CI checks

---

## Dev Notes

- Rename decision deferred: CityView keeps its name until Phase D (13-13) retires ViewModeRenderer; renaming to WorldView now would churn the regression suite for no behavioral gain.
- The `visibleLayers.aboveGround` gate currently wraps CityBlocks+CitySky — preserve exact gating semantics around the equivalent skin slots.

## Dependencies
- 13-2 (skin registry), 13-3 (single rendering path)
