# Story 7-4: Add Keyboard Navigation Shortcuts

## Story

**ID:** 7-4
**Key:** 7-4-add-keyboard-navigation-shortcuts
**Title:** Implement Global Keyboard Shortcuts for Navigation
**Epic:** Epic 7 - "Search-First Command Center" UX Implementation
**Phase:** Implementation - Phase 2 (Core Interaction)
**Priority:** HIGH - Power User Experience

**Description:**

Implement global keyboard shortcuts for all core actions: ⌘K (search), ESC (close/deselect), Home (fly to root), C (toggle Orbit/Fly mode), arrow keys (navigate search results).

**Context:**

From UX Design Specification:
- **Keyboard-First Navigation:** All core actions accessible via keyboard
- **Global shortcuts:** ⌘K, ESC, Home, C, Ctrl+Shift+S (share viewpoint)
- **No keyboard traps:** ESC closes all modals

---

## Acceptance Criteria

- **AC-1:** ⌘K opens search (global shortcut)
- **AC-2:** ESC closes modals, deselects nodes
- **AC-3:** Home key flies to root node
- **AC-4:** C key toggles Orbit/Fly control mode
- **AC-5:** Ctrl+Shift+S shares viewpoint (copy link)
- **AC-6:** All shortcuts work globally (not just when focused)
- **AC-7:** Shortcuts documented in help modal

---

## Tasks/Subtasks

### Task 1: Implement global keyboard listener
- [ ] Add document-level event listener
- [ ] Dispatch actions based on key combinations
- [ ] Prevent default browser behavior when needed
- [ ] Clean up on unmount

### Task 2: Implement individual shortcuts
- [ ] ⌘K - Open search modal (already in 7-1)
- [ ] ESC - Close active modal or deselect node
- [ ] Home - Fly to root/entry point
- [ ] C - Toggle between Orbit and Fly control modes
- [ ] Ctrl+Shift+S - Copy viewpoint link to clipboard

### Task 3: Create keyboard shortcut help modal
- [ ] List all shortcuts with descriptions
- [ ] ? key or Help button opens modal
- [ ] Group by category (Navigation, Search, Controls)

---

## Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 3-4 hours
- **Priority:** HIGH

**Status:** not-started
**Created:** 2026-01-24
