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
- [ ] Update HUD.tsx with all 4 stats (Nodes, Files, FPS, Mode)
- [ ] Connect to Zustand store for real-time data
- [ ] Style with dark glass background
- [ ] Use semantic HTML (`<dl>`, `<dt>`, `<dd>`)

### Task 2: Implement FPS counter
- [ ] Track rendering FPS (useFrame hook)
- [ ] Throttle updates to 1 second
- [ ] Color: green if >30, red if <30
- [ ] Display as integer (e.g., "60 FPS")

### Task 3: Add control mode indicator
- [ ] Show current mode: "Orbit 🔄" or "Fly ✈️"
- [ ] Update when user presses C key
- [ ] Connect to camera control store

### Task 4: Add accessibility
- [ ] `aria-label="Workspace statistics"`
- [ ] `aria-live="polite"` for stat updates
- [ ] Not focusable (tabindex="-1")

---

## Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 2-3 hours
- **Priority:** MEDIUM

**Status:** not-started
**Created:** 2026-01-24
