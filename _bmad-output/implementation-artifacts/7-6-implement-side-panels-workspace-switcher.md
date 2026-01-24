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
- [ ] Create LeftPanel.tsx with slide-in animation
- [ ] Add toggle button to header (hamburger icon)
- [ ] Implement overlay backdrop
- [ ] ESC closes panel
- [ ] Click outside closes panel

### Task 2: Build RightPanel component
- [ ] Create RightPanel.tsx with slide-in animation
- [ ] Add toggle button to header (tools icon)
- [ ] Same backdrop and close behavior

### Task 3: Implement WorkspaceSwitcher
- [ ] Create WorkspaceSwitcher.tsx
- [ ] Fetch all workspaces from API
- [ ] Display as dropdown or list
- [ ] Highlight current workspace
- [ ] Switch workspace on click (reload graph)

### Task 4: Organize panel sections
- [ ] Left Panel: Workspace, Actions, Collaboration
- [ ] Right Panel: Export, Viewpoints, Users
- [ ] Section headers styled per UX spec
- [ ] Integrate existing components (ExportButton, ViewpointPanel, etc.)

---

## Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 5-6 hours
- **Priority:** MEDIUM

**Status:** not-started
**Created:** 2026-01-24
