# Story 5-7: Feature MiniMap

## Story

**ID:** 5-7
**Key:** 5-7-feature-minimap
**Title:** Create MiniMap component with 2D file tree and 3D spatial overview
**Epic:** Epic 5 - UI Package (@diagram-builder/ui)
**Phase:** Phase 5 - UI Package

**Description:**

Implement MiniMap feature with dual views: 2D file tree and 3D spatial overview. Syncs with main canvas camera position to provide navigation context.

---

## Acceptance Criteria

- **AC-1:** MiniMap component renders
- **AC-2:** 2D file tree view implemented
- **AC-3:** 3D spatial overview implemented
- **AC-4:** Syncs with main canvas camera position
- **AC-5:** Click to navigate in minimap
- **AC-6:** Component tests

---

## Tasks/Subtasks

### Task 1: Create MiniMap component
- [ ] Create src/features/minimap/MiniMap.tsx
- [ ] Create container and layout

### Task 2: Implement 2D file tree view
- [ ] Render file hierarchy as tree
- [ ] Show current position indicator

### Task 3: Implement 3D spatial overview
- [ ] Create small Three.js scene
- [ ] Show simplified node positions
- [ ] Show camera frustum

### Task 4: Add synchronization
- [ ] Subscribe to canvasStore camera changes
- [ ] Update minimap view on camera movement

### Task 5: Add navigation
- [ ] Click minimap to move camera
- [ ] Update main canvas camera

---

## Status

**Current Status:** ready-for-dev
**Created:** 2025-12-29
