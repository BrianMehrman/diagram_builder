# Story 13.1: Verify Phase A Foundations (was: Close Epic 10/11 Review Backlog)

Status: ready-for-dev

> **Rescoped 2026-07-08.** This story was written against a stale local `main`
> that still showed ~38 Epic 10/11 stories in `review`. PR #15 (merged
> 2026-04-13) had already flipped Epic 4/10/11 statuses to `done` — a
> confirmation that the stories were implemented on main, not a code-review
> pass. The status-closure half of this story is therefore superseded; what
> remains is verifying the foundations Phase A refactors on top of.

## Story

**ID:** 13-1
**Key:** 13-1-close-review-backlog
**Title:** Verify Phase A Foundations
**Epic:** Epic 13 - One World, Two Skins
**Phase:** Epic 13-A: Skin Seam (Phase 0 prerequisite)
**Priority:** CRITICAL - Epic 13 builds directly on Epic 10/11 code; its safety net must be verified first

**As a** maintainer,
**I want** the Epic 10/11 code Phase A builds on verified — CI green and the Epic 10-1 regression suite confirmed as adequate coverage,
**So that** the skin-seam refactor (13-2 … 13-5) starts from a known-good baseline with a working regression net.

**Spec Reference:** `docs/specs/2026-07-07-one-world-two-skins-design.md` — Phasing, Phase 0

---

## Acceptance Criteria

- **AC-1:** All four CI checks pass on main: `npm run type-check`, `npm run lint`, `npm run format:check`, `npm test`
- **AC-2:** The Epic 10-1 CityView interaction test suite passes and demonstrably covers CityBlocks/CitySky/CityAtmosphere orchestration — it is the regression net for all of Phase A
- **AC-3:** A spot-check code review of the Phase A touchpoints (CityView, ViewModeRenderer, canvas store city settings, `cityVersion` branching) finds no defect that would change the Phase A plan — or any finding is noted in `docs/specs/2026-07-07-one-world-two-skins-plan.md` before Story 13-2 starts
- ~~Every Epic 10/11 story reviewed and moved to `done`~~ — superseded by PR #15 (statuses closed 2026-04-13)

---

## Tasks/Subtasks

### Task 1: Verify CI baseline (AC: 1)
- [ ] Run all four CI checks on current main; fix or file anything broken

### Task 2: Verify the regression net (AC: 2)
- [ ] Run the Epic 10-1 CityView interaction suite; confirm it covers the CityBlocks/CitySky/CityAtmosphere orchestration seams Phase A will cut along
- [ ] File a follow-up story if coverage gaps would leave Phase A refactoring unprotected

### Task 3: Spot-check Phase A touchpoints (AC: 3)
- [ ] Review CityView, ViewModeRenderer, canvas store `citySettings`, and `cityVersion` v1/v2 branching for defects that would alter the Phase A plan
- [ ] Note any findings affecting Phase A in `docs/specs/2026-07-07-one-world-two-skins-plan.md`

---

## Dev Notes

- This is a process story — no feature code.
- Original scope (batch two-stage review of all 38 stories) was superseded by PR #15; do not re-review stories wholesale. The spot-check targets only the files Phase A modifies.
- CI baseline was verified green on 2026-07-08 (2014 tests, 148 files) as part of the epic-13 docs PR; re-verify on the commit Story 13-2 branches from.

## Dependencies
- None (gate for all other Epic 13 stories)
