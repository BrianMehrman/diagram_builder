# Story 13.2: SceneSkin Interface, Registry, and activeSkin Store Field

Status: not-started

## Story

**ID:** 13-2
**Key:** 13-2-sceneskin-interface-registry
**Title:** SceneSkin Interface, Registry, and activeSkin Store Field
**Epic:** Epic 13 - One World, Two Skins
**Phase:** Epic 13-A: Skin Seam
**Priority:** CRITICAL - Foundation for all skin work

**As a** developer,
**I want** a `SceneSkin` interface, a skin registry with a `useSkin()` hook, and an `activeSkin` store field,
**So that** the canvas can render the world through a pluggable visual language.

**Spec Reference:** `docs/specs/2026-07-07-one-world-two-skins-design.md` — Architecture / Skin layer

---

## Acceptance Criteria

- **AC-1:** New `packages/ui/src/features/canvas/skins/types.ts` defines `SkinId = 'architect' | 'gardener'` and `SceneSkin` with five component slots: `Structures`, `Overhead`, `Underground`, `Atmosphere` (all `{ graph: IVMGraph }`), and `Ground` (`{ width: number; depth: number; opacity: number }`)
- **AC-2:** `packages/ui/src/features/canvas/skins/index.ts` exports `architectSkin` (wrapping the existing CityBlocks, CitySky, CityUnderground, CityAtmosphere, GroundPlane — unchanged) plus a `skins` registry and `useSkin()` hook
- **AC-3:** Canvas store gains `activeSkin: SkinId` (default `'architect'`) and `setActiveSkin(skin: SkinId)`
- **AC-4:** `store.reset()` restores `activeSkin` to `'architect'` (reset enumerates fields manually — this field MUST be added there)
- **AC-5:** Co-located unit tests for the store field and `useSkin()` resolution
- **AC-6:** All four CI checks pass

---

## Tasks/Subtasks

### Task 1: SceneSkin types (AC: 1)
- [ ] Create `skins/types.ts` with `SkinId` and `SceneSkin`
- [ ] JSDoc each slot with its semantic role (structures = nodes, overhead = calls, underground = imports/inheritance)

### Task 2: Store field (AC: 3, 4, 5)
- [ ] Failing test: `activeSkin` defaults to `'architect'`, `setActiveSkin('gardener')` updates it, `reset()` restores it
- [ ] Add field + action to `packages/ui/src/features/canvas/store.ts`, including `reset()`

### Task 3: Registry + hook (AC: 2, 5)
- [ ] Failing test: `useSkin()` returns architect skin by default and resolves registry by `activeSkin`
- [ ] Implement `skins/index.ts` with `architectSkin`, `skins` map, `useSkin()`

### Task 4: Verify (AC: 6)
- [ ] `npm run type-check && npm run lint && npm run format:check && npm test`

---

## Dev Notes

- Zero rendering changes in this story — the skin is defined but not yet consumed (Story 13-4 wires it in).
- Zustand gotcha: whole-object selectors cause re-render loops — `useSkin()` should select the primitive `activeSkin` string and look up the skin object outside the selector.
- Detailed TDD steps with code are in `docs/specs/2026-07-07-one-world-two-skins-plan.md` (Task 2–3).

## Dependencies
- 13-1 (Phase A foundations verified)
