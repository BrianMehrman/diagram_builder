# Story 7-5: Enhance MiniMap with Click-to-Jump and FOV Indicator

## Story

**ID:** 7-5
**Key:** 7-5-enhance-minimap-click-to-jump
**Title:** Enhance MiniMap with Click-to-Jump Navigation and FOV Indicator
**Epic:** Epic 7 - "Search-First Command Center" UX Implementation
**Phase:** Implementation - Phase 3 (Spatial Awareness)
**Priority:** MEDIUM - Spatial Navigation Enhancement

**Description:**

Enhance the existing minimap (Story 5-7) with click-to-jump functionality, FOV (Field of View) indicator showing current viewport, and collapsible panel.

**Context:**

From UX Design Specification:
- **MiniMap Purpose:** Spatial overview with "You Are Here" confidence
- **Click-to-Jump:** Click minimap → camera flies to location (smooth, not jarring)
- **FOV Indicator:** Camera frustum cone shows what you're looking at in main canvas
- **Collapsible:** Minimize to save space, always accessible

---

## Acceptance Criteria

- **AC-1:** Click-to-jump navigation
  - Click anywhere on minimap → camera flies to that location
  - Smooth 1-2s camera flight (not instant jump)
  - Crosshair cursor on hover
  - Works with entire minimap area (200x150px)

- **AC-2:** FOV indicator
  - Draw camera frustum cone on minimap
  - Updates in real-time as camera moves
  - Visual: translucent white rectangle or triangle
  - Shows current viewport boundaries

- **AC-3:** Collapsible panel
  - Collapse button with ▼ icon (toggles to ▲)
  - Collapsed: header only (~40px height)
  - Expanded: full minimap (200x150px)
  - State persists across sessions (localStorage)

- **AC-4:** Accessibility
  - `role="img"` with `aria-label="Minimap overview"`
  - Collapse button has `aria-expanded="true/false"`
  - Click-to-jump has descriptive aria-label

---

## Tasks/Subtasks

### Task 1: Implement click-to-jump
- [ ] Add click event listener to minimap canvas
- [ ] Convert click coordinates to 3D world position
- [ ] Trigger camera flight to clicked position
- [ ] Show crosshair cursor on hover

### Task 2: Add FOV indicator
- [ ] Calculate camera frustum boundaries
- [ ] Project frustum to minimap 2D coordinates
- [ ] Draw translucent rectangle/triangle on minimap
- [ ] Update FOV indicator every frame

### Task 3: Add collapse/expand functionality
- [ ] Add collapse button to minimap header
- [ ] Toggle minimap visibility (CSS height transition)
- [ ] Store collapsed state in localStorage
- [ ] Animate collapse/expand (smooth transition)

---

## Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 4-5 hours
- **Priority:** MEDIUM

**Status:** not-started
**Created:** 2026-01-24
