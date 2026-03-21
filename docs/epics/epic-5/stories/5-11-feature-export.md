# Story 5-11: Feature Export

## Story

**ID:** 5-11
**Key:** 5-11-feature-export
**Title:** Create export dialog for PlantUML, Mermaid, Draw.io, GLTF, PNG, SVG with preview
**Epic:** Epic 5 - UI Package (@diagram-builder/ui)
**Phase:** Phase 5 - UI Package

**Description:**

Implement export feature UI with format selection, LOD level configuration, and export preview. Integrates with export API endpoints (Story 4.8).

---

## Acceptance Criteria

- **AC-1:** Export dialog component
- **AC-2:** Format selection (PlantUML, Mermaid, Draw.io, GLTF, PNG, SVG)
- **AC-3:** LOD level selection
- **AC-4:** Export preview
- **AC-5:** Integration with export API
- **AC-6:** Component tests

---

## Tasks/Subtasks

### Task 1: Create export dialog
- [ ] Create src/features/export/ExportDialog.tsx
- [ ] Modal/dialog UI

### Task 2: Format selection
- [ ] Dropdown or radio buttons for formats
- [ ] Format-specific options

### Task 3: LOD level selection
- [ ] Slider or dropdown for LOD
- [ ] Preview LOD impact

### Task 4: Export preview
- [ ] Show preview of export result
- [ ] Update preview on option changes

### Task 5: API integration
- [ ] Call export API endpoints
- [ ] Download exported file
- [ ] Show progress/loading states

---

## Status

**Current Status:** ready-for-dev
**Created:** 2025-12-29
