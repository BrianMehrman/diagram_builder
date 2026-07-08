# Story 13.12: Skin Toggle UI with Camera and Selection Preservation

Status: not-started

## Story

**ID:** 13-12
**Key:** 13-12-skin-toggle-ui
**Title:** Skin Toggle UI with Camera and Selection Preservation
**Epic:** Epic 13 - One World, Two Skins
**Phase:** Epic 13-C: Gardener Skin
**Priority:** HIGH - The signature feature ships here

**As a** user,
**I want** an Architect ⇄ Gardener toggle that swaps the visual language without moving anything,
**So that** my spatial memory, selection, and camera survive the swap.

**Spec Reference:** `docs/specs/2026-07-07-one-world-two-skins-design.md` — Concept; Testing strategy

---

## Acceptance Criteria

- **AC-1:** Toggle control in the canvas toolbar (pattern-matched to the height-encoding selector from 10-23): 🏙 Architect / 🌳 Gardener, keyboard shortcut `S`, ARIA-labeled (WCAG AA per Epic 7-8 standards)
- **AC-2:** Toggling preserves exactly: camera position/target, selected node, focused node, active LOD level, all layer/atmosphere toggles, URL state (skin joins the URL-sync params from the canvas-url-sync work)
- **AC-3:** Node world positions are identical in both skins — asserted by a conformance test comparing rendered position maps
- **AC-4:** Behavioral conformance cases added to the 13-5 harness and passing for BOTH skins: selection works, search fly-to works, LOD transitions at same camera distances, toggle round-trip is lossless
- **AC-5:** E2E: toggle via `data-testid="active-skin"`, assert camera + selection unchanged via `window.__canvasStore`
- **AC-6:** Skin choice persists across sessions (URL param takes precedence; localStorage fallback)
- **AC-7:** All four CI checks pass

---

## Tasks/Subtasks

### Task 1: Toggle UI (AC: 1)
- [ ] Toolbar control + `S` shortcut (register alongside Epic 7-4 global shortcuts) + ARIA

### Task 2: Preservation guarantees (AC: 2, 6)
- [ ] Audit that no skin component writes camera/selection on mount (mount effects are the likely leak)
- [ ] Add `skin` to URL sync (respect the "skip replaceState when URL unchanged" fix) + localStorage fallback

### Task 3: Conformance behavioral cases (AC: 3, 4)
- [ ] Position-map equality across skins; selection/fly-to/LOD cases parameterized over both skins

### Task 4: E2E + verify (AC: 5, 7)
- [ ] Playwright toggle test; all four CI checks

---

## Dev Notes

- Gate: 13-9/13-10/13-11 aliases must all be gone — shipping a toggle where half the gardener is secretly city components undermines the whole feature.
- Zustand: keep the store `activeSkin` selector primitive (string), never select the skin object.

## Dependencies
- 13-9, 13-10, 13-11 (complete gardener), 13-5 (harness to extend)
