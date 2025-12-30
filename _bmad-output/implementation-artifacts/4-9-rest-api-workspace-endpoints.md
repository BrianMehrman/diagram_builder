# Story 4-9: REST API - Workspace Endpoints

## Story

**ID:** 4-9
**Key:** 4-9-rest-api-workspace-endpoints
**Title:** Implement REST API endpoints for workspace CRUD operations
**Epic:** Epic 4 - API Package (@diagram-builder/api)
**Phase:** Phase 4 - API Package

**Description:**

Implement REST API endpoints for workspace management. Workspaces contain multi-codebase configurations, parsing settings, and session persistence data.

All endpoints require JWT authentication and store workspace data in Neo4j.

---

## Acceptance Criteria

- **AC-1:** POST /api/workspaces - Create workspace
- **AC-2:** GET /api/workspaces/:id - Get workspace
- **AC-3:** PUT /api/workspaces/:id - Update workspace
- **AC-4:** DELETE /api/workspaces/:id - Delete workspace
- **AC-5:** Workspace schema includes: repositories[], settings, sessionState
- **AC-6:** Integration tests for all CRUD operations

---

## Tasks/Subtasks

### Task 1: Create workspaces router
- [ ] Create `src/routes/workspaces.ts`
- [ ] Define Workspace TypeScript interface
- [ ] Register router (`/api/workspaces`)

### Task 2-5: Implement CRUD endpoints
- [ ] POST /api/workspaces
- [ ] GET /api/workspaces/:id
- [ ] PUT /api/workspaces/:id
- [ ] DELETE /api/workspaces/:id

### Task 6: Test and validate
- [ ] Test all CRUD operations
- [ ] Run `npm test`

---

## Status

**Current Status:** ready-for-dev
**Created:** 2025-12-29
