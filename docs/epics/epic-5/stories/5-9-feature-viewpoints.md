# Story 5-9: Feature Viewpoints

## Story

**ID:** 5-9
**Key:** 5-9-feature-viewpoints
**Title:** Create viewpoint UI for saving camera positions, filters, annotations with sharing
**Epic:** Epic 5 - UI Package (@diagram-builder/ui)
**Phase:** Phase 5 - UI Package

**Description:**

Implement viewpoint feature UI for creating, managing, and sharing saved visualization states. Integrates with viewpoint API endpoints (Story 4.7).

---

## Acceptance Criteria

- **AC-1:** Viewpoint creation UI
- **AC-2:** Save camera position, filters, annotations
- **AC-3:** Viewpoint list component
- **AC-4:** Load saved viewpoints
- **AC-5:** Generate share URLs
- **AC-6:** Component tests

---

## Tasks/Subtasks

### Task 1: Create viewpoint creation UI
- [ ] Create src/features/viewpoints/CreateViewpoint.tsx
- [ ] Capture current camera position
- [ ] Add filter/annotation inputs

### Task 2: Create viewpoint list
- [ ] Create ViewpointList.tsx
- [ ] Fetch viewpoints from API
- [ ] Display as list/grid

### Task 3: Load viewpoints
- [ ] Click viewpoint to load
- [ ] Apply camera position
- [ ] Apply filters and annotations

### Task 4: Sharing functionality
- [ ] Generate share URL button
- [ ] Copy to clipboard
- [ ] Show shareable link

### Task 5: Integration with API
- [ ] Use API client to save/load viewpoints
- [ ] Handle loading states
- [ ] Error handling

---

## Status

**Current Status:** ready-for-dev
**Created:** 2025-12-29
