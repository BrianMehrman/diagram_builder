# Story 4-7: REST API - Viewpoint Endpoints

## Story

**ID:** 4-7
**Key:** 4-7-rest-api-viewpoint-endpoints
**Title:** Implement REST API endpoints for viewpoint CRUD operations and sharing
**Epic:** Epic 4 - API Package (@diagram-builder/api)
**Phase:** Phase 4 - API Package

**Description:**

Implement REST API endpoints for viewpoint management. Viewpoints capture camera position, filters, annotations, and LOD settings for saved visualization states that can be shared via URL.

All endpoints require JWT authentication and store viewpoint data in Neo4j with Redis caching.

---

## Acceptance Criteria

- **AC-1:** POST /api/viewpoints - Create viewpoint
  - Accepts JSON body with viewpoint data (camera, filters, annotations, lodLevel)
  - Stores viewpoint in Neo4j
  - Generates unique viewpoint ID
  - Returns viewpoint ID and created timestamp
  - Requires authentication

- **AC-2:** GET /api/viewpoints/:id - Get viewpoint
  - Returns viewpoint data from Neo4j
  - Cached in Redis
  - Returns 404 if not found
  - Requires authentication

- **AC-3:** PUT /api/viewpoints/:id - Update viewpoint
  - Updates viewpoint in Neo4j
  - Invalidates cache
  - Returns updated viewpoint
  - Returns 404 if not found
  - Requires authentication

- **AC-4:** DELETE /api/viewpoints/:id - Delete viewpoint
  - Deletes viewpoint from Neo4j
  - Invalidates cache
  - Returns 204 No Content
  - Returns 404 if not found
  - Requires authentication

- **AC-5:** GET /api/viewpoints/share/:id - Generate share URL
  - Generates shareable URL for viewpoint
  - URL includes viewpoint ID for client-side loading
  - Returns 404 if not found
  - Requires authentication

- **AC-6:** Comprehensive test coverage
  - Integration tests for all CRUD operations
  - Tests for share URL generation
  - Tests for caching behavior
  - All tests pass 100%

---

## Tasks/Subtasks

### Task 1: Create viewpoints router and define schema
- [ ] Create `src/routes/viewpoints.ts` router module
- [ ] Define Viewpoint TypeScript interface (camera, filters, annotations, lodLevel)
- [ ] Create validation schema for viewpoint data
- [ ] Register router in Express app (`/api/viewpoints`)

### Task 2: Implement POST /api/viewpoints - Create
- [ ] Validate request body against schema
- [ ] Generate unique viewpoint ID (UUID)
- [ ] Store viewpoint in Neo4j as :Viewpoint node
- [ ] Return viewpoint ID and createdAt timestamp
- [ ] Write integration tests

### Task 3: Implement GET /api/viewpoints/:id - Read
- [ ] Build cache key: `diagram-builder:viewpoint:${id}`
- [ ] Check Redis cache first
- [ ] If cache miss, query Neo4j
- [ ] Cache result in Redis
- [ ] Return viewpoint JSON
- [ ] Return 404 if not found

### Task 4: Implement PUT /api/viewpoints/:id - Update
- [ ] Validate request body
- [ ] Update viewpoint in Neo4j
- [ ] Invalidate cache for viewpoint
- [ ] Return updated viewpoint
- [ ] Return 404 if not found

### Task 5: Implement DELETE /api/viewpoints/:id - Delete
- [ ] Delete viewpoint from Neo4j
- [ ] Invalidate cache
- [ ] Return 204 No Content
- [ ] Return 404 if not found

### Task 6: Implement GET /api/viewpoints/share/:id - Share URL
- [ ] Verify viewpoint exists in Neo4j
- [ ] Generate share URL: `${FRONTEND_URL}/viewpoint/${id}`
- [ ] Return JSON: `{ shareUrl: string }`
- [ ] Return 404 if not found

### Task 7: Test and validate
- [ ] Test all CRUD operations
- [ ] Test share URL generation
- [ ] Test caching behavior
- [ ] Run `npm test`

---

## Dev Notes

### Viewpoint Schema
```typescript
interface Viewpoint {
  id: string;
  userId: string;
  camera: {
    position: [number, number, number];
    target: [number, number, number];
  };
  filters?: Record<string, unknown>;
  annotations?: Array<{text: string, position: [number, number, number]}>;
  lodLevel: number;
  createdAt: string;
  updatedAt: string;
}
```

---

## Status

**Current Status:** ready-for-dev
**Created:** 2025-12-29
