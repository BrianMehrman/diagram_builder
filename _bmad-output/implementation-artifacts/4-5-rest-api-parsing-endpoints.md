# Story 4-5: REST API - Parsing Endpoints

## Story

**ID:** 4-5
**Key:** 4-5-rest-api-parsing-endpoints
**Title:** Implement REST API endpoints for repository parsing, metadata retrieval, deletion, and refresh
**Epic:** Epic 4 - API Package (@diagram-builder/api)
**Phase:** Phase 4 - API Package

**Description:**

Implement REST API endpoints for repository parsing operations. These endpoints integrate the parser package (Phase 3) with Neo4j storage (Story 4.3) to enable parsing repositories, retrieving metadata, deleting repositories, and refreshing parsed data.

All endpoints require JWT authentication (Story 4.2) and return RFC 7807 formatted errors. Parsing operations run asynchronously for large repositories.

---

## Acceptance Criteria

- **AC-1:** POST /api/repositories - Parse new repository
  - Accepts JSON body: `{ url?: string, path?: string, branch?: string, token?: string }`
  - Validates required fields (either url or path)
  - Invokes parser package to parse repository
  - Stores IVM results in Neo4j
  - Returns repository ID and parsing status (202 Accepted for async)
  - Requires authentication

- **AC-2:** GET /api/repositories/:id - Get repository metadata
  - Returns repository metadata from Neo4j
  - Includes: id, name, url/path, branch, createdAt, lastUpdated, fileCount, nodeCount
  - Returns 404 if repository not found (RFC 7807 format)
  - Requires authentication

- **AC-3:** DELETE /api/repositories/:id - Delete repository
  - Deletes repository and all associated nodes from Neo4j
  - Returns 204 No Content on success
  - Returns 404 if repository not found (RFC 7807 format)
  - Invalidates related Redis cache entries
  - Requires authentication

- **AC-4:** POST /api/repositories/:id/refresh - Re-parse repository
  - Re-parses repository and updates Neo4j data
  - Invalidates cached query results
  - Returns parsing status (202 Accepted for async)
  - Returns 404 if repository not found
  - Requires authentication

- **AC-5:** Comprehensive test coverage
  - Integration tests for all endpoints
  - Tests for authentication enforcement
  - Tests for validation errors (RFC 7807 format)
  - Tests for successful parsing operations
  - Tests for error scenarios (invalid URL, parsing failures)
  - All tests pass 100%

---

## Tasks/Subtasks

### Task 1: Create parsing endpoints router
- [ ] Create `src/routes/repositories.ts` router module
- [ ] Set up Express router with authentication middleware
- [ ] Define route handlers for all 4 endpoints
- [ ] Register router in main Express app (`/api/repositories`)
- [ ] Import parser package functions from @diagram-builder/parser

### Task 2: Implement POST /api/repositories - Parse repository
- [ ] Create request validation (Joi or Zod schema)
- [ ] Validate url XOR path is provided (exactly one required)
- [ ] Invoke parser package: `parseRepository({ url?, path?, branch?, token? })`
- [ ] Store IVM result in Neo4j using query utilities
- [ ] Generate unique repository ID (UUID)
- [ ] Return 202 Accepted with repository ID and status: "parsing"
- [ ] Add error handling for parser failures (RFC 7807 format)
- [ ] Write integration tests in `repositories.test.ts`

### Task 3: Implement GET /api/repositories/:id - Get metadata
- [ ] Query Neo4j for repository node by ID
- [ ] Count related file nodes (fileCount)
- [ ] Count total IVM nodes (nodeCount)
- [ ] Return repository metadata JSON
- [ ] Return 404 NotFoundError if repository doesn't exist
- [ ] Write integration tests for successful and not-found cases

### Task 4: Implement DELETE /api/repositories/:id - Delete repository
- [ ] Query Neo4j to verify repository exists
- [ ] Delete repository node and all connected nodes (DETACH DELETE)
- [ ] Invalidate Redis cache for repository: `invalidatePattern('diagram-builder:graph:${id}:*')`
- [ ] Return 204 No Content on success
- [ ] Return 404 NotFoundError if repository doesn't exist
- [ ] Write integration tests for successful deletion and not-found

### Task 5: Implement POST /api/repositories/:id/refresh - Re-parse
- [ ] Query Neo4j to verify repository exists
- [ ] Retrieve repository URL/path from Neo4j
- [ ] Delete existing repository data (same as DELETE endpoint logic)
- [ ] Re-parse repository using parser package
- [ ] Store updated IVM in Neo4j
- [ ] Invalidate all related cache entries
- [ ] Return 202 Accepted with parsing status
- [ ] Write integration tests for refresh operation

### Task 6: Add validation and error handling
- [ ] Create request validation schemas for POST endpoints
- [ ] Validate repository URL format (GitHub/GitLab/Bitbucket)
- [ ] Validate file path exists (for local parsing)
- [ ] Handle parser errors and map to RFC 7807 format
- [ ] Handle Neo4j errors and map to RFC 7807 format
- [ ] Write tests for validation errors (400 Bad Request)

### Task 7: Test and validate endpoints
- [ ] Run `npm test` and verify all tests pass
- [ ] Test POST /api/repositories with local path
- [ ] Test POST /api/repositories with GitHub URL
- [ ] Test GET /api/repositories/:id with valid ID
- [ ] Test DELETE /api/repositories/:id
- [ ] Test POST /api/repositories/:id/refresh
- [ ] Test authentication enforcement (401 without token)
- [ ] Test validation errors (400 for invalid input)
- [ ] Run TypeScript type checking: `tsc --noEmit`

---

## Dev Notes

### Architecture Context

**Package Location:** `packages/api/`
**Package Name:** `@diagram-builder/api`

**Dependencies:**
- Story 4.1: Express server setup
- Story 4.2: JWT authentication middleware
- Story 4.3: Neo4j integration
- Story 4.4: Redis caching
- Phase 3: Parser package (@diagram-builder/parser)

**Technology Stack:**
- Express: REST API routing
- @diagram-builder/parser: Repository parsing
- Neo4j: IVM storage
- Redis: Cache invalidation

### Key Architecture Decisions

1. **Asynchronous Parsing:**
   - Large repositories may take minutes to parse
   - Return 202 Accepted immediately with parsing status
   - Client polls GET /api/repositories/:id to check completion
   - Future enhancement: WebSocket notifications (Story 4.10+)

2. **IVM Storage Pattern:**
   - Parser produces IVM (Phase 3.5)
   - API stores IVM in Neo4j as nodes/relationships
   - Follow Neo4j naming conventions (PascalCase labels, camelCase properties)

3. **Cache Invalidation:**
   - DELETE and refresh operations invalidate cache
   - Pattern-based invalidation: `diagram-builder:graph:${repoId}:*`
   - Ensures fresh data after repository updates

### Implementation Guidance

**POST /api/repositories Example:**
```typescript
router.post('/', authenticate, async (req, res) => {
  const { url, path, branch, token } = req.body;

  // Validate input
  if (!url && !path) {
    throw new ValidationError('Either url or path is required');
  }

  // Parse repository
  const ivm = await parseRepository({ url, path, branch, token });

  // Store in Neo4j
  const repoId = uuidv4();
  await storeRepositoryInNeo4j(repoId, ivm);

  res.status(202).json({
    id: repoId,
    status: 'parsing',
    message: 'Repository parsing initiated'
  });
});
```

**Neo4j Storage Example:**
```typescript
async function storeRepositoryInNeo4j(repoId: string, ivm: IVM) {
  const session = driver.session();
  try {
    // Create Repository node
    await session.run(
      'CREATE (r:Repository {id: $id, name: $name, createdAt: datetime()})',
      { id: repoId, name: ivm.metadata.name }
    );

    // Create File nodes and relationships
    for (const file of ivm.nodes.filter(n => n.type === 'file')) {
      await session.run(
        'MATCH (r:Repository {id: $repoId}) CREATE (f:File {id: $id, fileName: $fileName})-[:BELONGS_TO]->(r)',
        { repoId, id: file.id, fileName: file.metadata.fileName }
      );
    }
  } finally {
    await session.close();
  }
}
```

### Critical Constraints

- **RFC 7807 errors:** ALL errors use Problem Details format
- **Authentication required:** ALL endpoints use authenticate middleware
- **Async parsing:** Use 202 Accepted for long-running operations
- **Cache invalidation:** DELETE/refresh MUST invalidate cache
- **TypeScript strict mode:** NO `any` types
- **Co-located tests:** Tests next to source files

### Testing Requirements

**Test Coverage:**
- POST /api/repositories with valid local path
- POST /api/repositories with valid GitHub URL
- POST /api/repositories with missing url AND path (validation error)
- POST /api/repositories without authentication (401)
- GET /api/repositories/:id with existing repository
- GET /api/repositories/:id with non-existent ID (404)
- DELETE /api/repositories/:id with existing repository
- DELETE /api/repositories/:id with non-existent ID (404)
- POST /api/repositories/:id/refresh with existing repository
- Verify cache invalidation after DELETE
- Verify cache invalidation after refresh

### Reference Files

- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Project Context: `_bmad-output/project-context.md`
- Phase Overview: `TASKS.md` (Phase 4.5)
- Parser Package: `packages/parser/` (Phase 3)

---

## Dev Agent Record

### Implementation Plan

_This section will be populated by the dev agent during implementation_

### Debug Log

_This section will be populated by the dev agent during implementation_

### Completion Notes

_This section will be populated by the dev agent after completion_

---

## File List

_This section will be populated by the dev agent with all new, modified, or deleted files_

---

## Change Log

_This section will be populated by the dev agent with implementation changes_

---

## Status

**Current Status:** ready-for-dev
**Created:** 2025-12-29
**Last Updated:** 2025-12-29
