# Story 7-6: Implement Side Panels with Workspace Switcher

## Story

**ID:** 7-6
**Key:** 7-6-implement-side-panels-workspace-switcher
**Title:** Implement Left/Right Side Panels with Workspace Switcher and Tools
**Epic:** Epic 7 - "Search-First Command Center" UX Implementation
**Phase:** Implementation - Phase 3 (Spatial Awareness)
**Priority:** MEDIUM - Workspace Management

**Description:**

Implement left and right side panels (320px width) with overlay backdrop, containing workspace switcher, import button, export button, viewpoints, and collaboration tools.

**Context:**

From UX Design Specification:
- **Left Panel:** Workspace switcher, Import button, Collaboration (Session Control, User Presence)
- **Right Panel:** Export button, Viewpoints, Users
- **Behavior:** Overlay canvas with dark backdrop, ESC or click outside closes

Current state: Basic workspace management exists (Story 5-10) but not in side panel layout.

---

## Acceptance Criteria

- **AC-1:** Left side panel (320px)
  - Toggle button in header (hamburger icon)
  - Slides in from left with smooth transition
  - Contains: Workspace switcher, Import button, Collaboration section
  - Dark backdrop overlay (rgba(0,0,0,0.3))
  - ESC or click outside closes

- **AC-2:** Right side panel (320px)
  - Toggle button in header (tools icon)
  - Slides in from right with smooth transition
  - Contains: Export button, Viewpoints, User Presence
  - Same backdrop behavior as left panel

- **AC-3:** Workspace switcher component
  - Dropdown or list of all workspaces
  - Shows current workspace (highlighted)
  - Click workspace → switch → reload graph
  - "Create New Workspace" option

- **AC-4:** Panel sections organized
  - Clear section headers (uppercase, gray, small)
  - Grouped by feature (Workspace, Actions, Collaboration, Tools)
  - Vertical spacing between sections

---

## Tasks/Subtasks

### Task 1: Build LeftPanel component
- [x] Create LeftPanel.tsx with slide-in animation
- [x] Add toggle button to header (hamburger icon)
- [x] Implement overlay backdrop
- [x] ESC closes panel
- [x] Click outside closes panel

### Task 2: Build RightPanel component
- [x] Create RightPanel.tsx with slide-in animation
- [x] Add toggle button to header (tools icon)
- [x] Same backdrop and close behavior

### Task 3: Implement WorkspaceSwitcher
- [x] Create WorkspaceSwitcher.tsx
- [x] Fetch all workspaces from API
- [x] Display as dropdown or list
- [x] Highlight current workspace
- [x] Switch workspace on click (reload graph)

### Task 4: Organize panel sections
- [x] Left Panel: Workspace, Actions, Collaboration
- [x] Right Panel: Export, Viewpoints, Users
- [x] Section headers styled per UX spec
- [x] Integrate existing components (ExportButton, ViewpointPanel, etc.)

---

## Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 5-6 hours
- **Priority:** MEDIUM

**Status:** review
**Created:** 2026-01-24

---

## Dev Agent Record

### Implementation Plan
- Add panel state (leftPanelOpen, rightPanelOpen) to shared uiStore for global access
- Extract LeftPanel.tsx and RightPanel.tsx into features/panels/ directory
- Update ESC handler in useGlobalKeyboardShortcuts to close panels
- WorkspaceSwitcher already works with local store - AC-3 satisfied with existing impl
- Write comprehensive tests for panel behavior
- Refactor WorkspacePage.tsx to use extracted components

### Debug Log

### Completion Notes
- Extracted inline left/right panels from WorkspacePage.tsx into dedicated LeftPanel.tsx and RightPanel.tsx components in features/panels/
- Moved panel state (isLeftPanelOpen, isRightPanelOpen) from local useState into shared uiStore for global access
- Updated useGlobalKeyboardShortcuts ESC handler to close panels (priority 3, after help modal and search modal)
- Updated WorkspaceSwitcher to fetch workspaces from API instead of local Zustand store, navigate via React Router on switch
- Added loading, error, and empty states to WorkspaceSwitcher
- All 50 new/changed tests pass (14 panel + 6 workspace switcher + 24 keyboard shortcuts + 6 uiStore)
- Pre-existing test failures (18) are unrelated to this story (CodebaseList file count display, NodeRenderer Three.js mocks, LOD controls, etc.)

---

## File List
- packages/ui/src/features/panels/LeftPanel.tsx (new)
- packages/ui/src/features/panels/LeftPanel.test.tsx (new)
- packages/ui/src/features/panels/RightPanel.tsx (new)
- packages/ui/src/features/panels/RightPanel.test.tsx (new)
- packages/ui/src/features/panels/index.ts (new)
- packages/ui/src/features/workspace/WorkspaceSwitcher.tsx (modified)
- packages/ui/src/features/workspace/WorkspaceSwitcher.test.tsx (new)
- packages/ui/src/shared/stores/uiStore.ts (modified - added panel state)
- packages/ui/src/shared/hooks/useGlobalKeyboardShortcuts.ts (modified - ESC closes panels)
- packages/ui/src/pages/WorkspacePage.tsx (modified - uses extracted panel components and uiStore)

---

## Change Log
- 2026-02-01: Implemented side panels with workspace switcher - all 4 ACs satisfied
