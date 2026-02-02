# Story 7-7: Enhance HUD with Real-Time Stats

## Story

**ID:** 7-7
**Key:** 7-7-enhance-hud-real-time-stats
**Title:** Enhance HUD with Real-Time Workspace Statistics
**Epic:** Epic 7 - "Search-First Command Center" UX Implementation
**Phase:** Implementation - Phase 1 (Core Journey)
**Priority:** MEDIUM - Data Visibility

**Description:**

Enhance the existing HUD (Story 5-8) with real-time stats: Nodes, Files, FPS, Control Mode. Display in dark glass panel (200px, top-left) with semantic HTML and accessibility.

**Context:**

From UX Design Specification:
- **HUD Purpose:** Constant awareness of workspace stats and current state
- **Stats:** Nodes (count), Files (count), FPS (green >30, red <30), Mode (Orbit 🔄 or Fly ✈️)
- **Visual:** Dark glass (`rgba(26, 31, 46, 0.95)`), 12px Inter font, semantic `<dl>` markup

---

## Acceptance Criteria

- **AC-1:** Real-time stats display
  - Nodes: Total node count in current graph
  - Files: Total file count in repository
  - FPS: Current rendering FPS (green if >30, red if <30)
  - Mode: Current control mode (Orbit 🔄 or Fly ✈️)

- **AC-2:** Dark glass styling
  - Background: `rgba(26, 31, 46, 0.95)` with backdrop blur
  - Position: Top-left (16px from edges)
  - Size: 200px width, auto height
  - Rounded corners (8px)

- **AC-3:** Semantic HTML
  - Use `<dl>`, `<dt>`, `<dd>` for stats
  - `aria-label="Workspace statistics"`
  - Stats update with `aria-live="polite"`
  - Not keyboard-focusable (display only)

- **AC-4:** Real-time updates
  - Connect to Zustand store for live data
  - FPS updates every frame (throttled to 1s)
  - Node/file counts update when graph changes
  - Mode updates when user toggles control

---

## Tasks/Subtasks

### Task 1: Enhance HUD component
- [x] Update HUD.tsx with all 4 stats (Nodes, Files, FPS, Mode)
- [x] Connect to Zustand store for real-time data
- [x] Style with dark glass background
- [x] Use semantic HTML (`<dl>`, `<dt>`, `<dd>`)

### Task 2: Implement FPS counter
- [x] Track rendering FPS (useFrame hook)
- [x] Throttle updates to 1 second
- [x] Color: green if >30, red if <30
- [x] Display as integer (e.g., "60 FPS")

### Task 3: Add control mode indicator
- [x] Show current mode: "Orbit 🔄" or "Fly ✈️"
- [x] Update when user presses C key
- [x] Connect to camera control store

### Task 4: Add accessibility
- [x] `aria-label="Workspace statistics"`
- [x] `aria-live="polite"` for stat updates
- [x] Not focusable (tabindex="-1")

---

## Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 2-3 hours
- **Priority:** MEDIUM

**Status:** review
**Created:** 2026-01-24

---

## Dev Agent Record

### Implementation Plan
- Restructure HUD markup from divs to semantic `<dl>`/`<dt>`/`<dd>` with aria attributes
- Add Files count (count nodes of type 'file')
- Apply dark glass styling per UX spec (`rgba(26, 31, 46, 0.95)`, 200px, backdrop blur)
- Add FPS color coding (green >30, red <30)
- Keep selected node info section as secondary display
- Update existing tests to match new markup

### Debug Log

### Completion Notes
- Restructured HUD from generic divs to semantic `<dl>`/`<dt>`/`<dd>` markup
- Added Files count (filters nodes by type === 'file')
- Applied UX spec dark glass styling: `rgba(26, 31, 46, 0.95)` with backdrop-blur-md, 200px width, rounded-lg
- FPS color coding: green-400 when >30, red-400 when <30
- Added accessibility: aria-label="Workspace statistics", aria-live="polite" on dl, tabIndex=-1
- Control mode shows "Orbit 🔄" or "Fly ✈️" connected to canvas store
- Removed camera position/target/LOD display (not in UX spec); kept selected node info
- Removed wrapper div in WorkspacePage, HUD now self-positions
- 20 tests passing covering all 4 ACs

---

## File List
- packages/ui/src/features/navigation/HUD.tsx (modified)
- packages/ui/src/features/navigation/HUD.test.tsx (modified)
- packages/ui/src/pages/WorkspacePage.tsx (modified - HUD wrapper removed)

---

## Change Log
- 2026-02-01: Enhanced HUD with real-time stats, semantic HTML, dark glass styling, accessibility
