# Story 13.11: Gardener Indicators (Equal-Citizen Data Facts)

Status: not-started

## Story

**ID:** 13-11
**Key:** 13-11-gardener-indicators
**Title:** Gardener Indicators — Churn, Deprecation, Coverage, Complexity, Exports
**Epic:** Epic 13 - One World, Two Skins
**Phase:** Epic 13-C: Gardener Skin
**Priority:** MEDIUM - Completes "no data fact is second-class"

**As a** user,
**I want** every atmospheric/metadata indicator from the city to have an organic equivalent,
**So that** switching skins never loses information.

**Spec Reference:** `docs/specs/2026-07-07-one-world-two-skins-design.md` — Semantic mapping table
**Visual Reference:** `docs/mockups/one-world-two-skins.html`

---

## Acceptance Criteria

- **AC-1:** Indicator parity, driven by the SAME data sources and thresholds as the city versions (extract shared threshold logic where it is component-local):
  - churn (crane) → bright new-growth leaf tint
  - deprecated (striped overlay) → bare gray branches (no canopy)
  - test coverage (lit windows) → fireflies point cloud
  - complexity hotspot (smog) → blighted/withered canopy colors
  - export (rooftop sign) → fruit spheres
- **AC-2:** All indicators respect `atmosphereOverlays` store toggles exactly as the city does; zero geometry cost when toggled off (same guarantee Epic 10-22 made)
- **AC-3:** Indicators are data-graceful: missing metrics render a plain healthy tree — no errors, no misleading defaults (matches city behavior)
- **AC-4:** `GardenerAtmosphere` orchestrator registered; the last Architect-slot alias is removed — gardener skin is fully self-rendered
- **AC-5:** Full conformance harness passes for both skins
- **AC-6:** Unit tests per indicator: threshold trigger, toggle gating, missing-data fallback
- **AC-7:** All four CI checks pass

---

## Tasks/Subtasks

### Task 1: Extract shared indicator thresholds (AC: 1, 3)
- [ ] Locate the churn/complexity/coverage threshold logic used by CityAtmosphere (e.g. 75th-percentile smog rule); extract to shared pure functions if component-local

### Task 2: Indicator implementations (AC: 1, 2, 3, 6)
- [ ] New-growth tint (leaf color swap in `treeGeometry`), bare-branch mode, fireflies `Points` cloud, blight palette, fruit spheres — each behind its `atmosphereOverlays` flag

### Task 3: Orchestrator + registry completion (AC: 4, 5)
- [ ] `GardenerAtmosphere`; remove final alias; run full harness both skins

### Task 4: Verify (AC: 7)
- [ ] All four CI checks

---

## Dev Notes

- Deprecated-tree interaction with 13-9: bare mode must override canopy density (a deprecated class with 20 methods is still bare — deprecation wins, mirroring how stripes cover any building).
- Fireflies: one `Points` object per tree, positions seeded per node id; do NOT animate (vision doc principle: static, calm).

## Dependencies
- 13-9, 13-10
