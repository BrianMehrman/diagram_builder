# Story 4-8: REST API - Export Endpoints

## Story

**ID:** 4-8
**Key:** 4-8-rest-api-export-endpoints
**Title:** Implement REST API endpoints for diagram exports (PlantUML, Mermaid, Draw.io, GLTF, PNG/SVG)
**Epic:** Epic 4 - API Package (@diagram-builder/api)
**Phase:** Phase 4 - API Package

**Description:**

Implement REST API endpoints for exporting graph visualizations to various formats. Integrates with export pipeline from Phase 2 (Core Package) to generate PlantUML, Mermaid, Draw.io, GLTF, and image exports with LOD filtering.

All endpoints require JWT authentication.

---

## Acceptance Criteria

- **AC-1:** POST /api/export/plantuml - Export as PlantUML
- **AC-2:** POST /api/export/mermaid - Export as Mermaid
- **AC-3:** POST /api/export/drawio - Export as Draw.io XML
- **AC-4:** POST /api/export/gltf - Export as GLTF 3D model
- **AC-5:** POST /api/export/image - Export as PNG or SVG
- **AC-6:** All endpoints accept: `{ repoId, lodLevel?, filters? }`
- **AC-7:** All endpoints return generated file content or download URL
- **AC-8:** Integration tests for all export formats

---

## Tasks/Subtasks

### Task 1: Create exports router
- [ ] Create `src/routes/exports.ts`
- [ ] Import export functions from @diagram-builder/core
- [ ] Register router (`/api/export`)

### Task 2-6: Implement each export endpoint
- [ ] POST /api/export/plantuml
- [ ] POST /api/export/mermaid
- [ ] POST /api/export/drawio
- [ ] POST /api/export/gltf
- [ ] POST /api/export/image

### Task 7: Test and validate
- [ ] Test all export formats
- [ ] Verify LOD filtering works
- [ ] Run `npm test`

---

## Status

**Current Status:** ready-for-dev
**Created:** 2025-12-29
