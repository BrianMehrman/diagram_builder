# Story 5-14: Routing

## Story

**ID:** 5-14
**Key:** 5-14-routing
**Title:** Configure React Router routes with code splitting and auth guards
**Epic:** Epic 5 - UI Package (@diagram-builder/ui)
**Phase:** Phase 5 - UI Package

**Description:**

Configure comprehensive routing for the application using React Router v7. Implements code splitting per route and route guards for authentication.

---

## Acceptance Criteria

- **AC-1:** React Router routes configured
- **AC-2:** Code splitting per route (lazy loading)
- **AC-3:** Route guards for authentication
- **AC-4:** Route structure: /, /workspace/:id, /login, /viewpoint/:id
- **AC-5:** 404 Not Found page
- **AC-6:** Routing tests

---

## Tasks/Subtasks

### Task 1: Define route structure
- [ ] Create src/routes/routes.tsx
- [ ] Define all application routes
- [ ] Use lazy loading for code splitting

### Task 2: Create route components
- [ ] HomePage (/)
- [ ] WorkspacePage (/workspace/:id)
- [ ] LoginPage (/login)
- [ ] ViewpointPage (/viewpoint/:id)
- [ ] NotFoundPage (404)

### Task 3: Implement auth guards
- [ ] Create ProtectedRoute component
- [ ] Check JWT token presence
- [ ] Redirect to /login if not authenticated

### Task 4: Configure router
- [ ] Set up RouterProvider in main.tsx
- [ ] Browser history mode
- [ ] Link all routes

### Task 5: Test routing
- [ ] Test navigation between routes
- [ ] Test auth guard redirects
- [ ] Test 404 handling
- [ ] Test code splitting (separate chunks)

---

## Status

**Current Status:** ready-for-dev
**Created:** 2025-12-29
