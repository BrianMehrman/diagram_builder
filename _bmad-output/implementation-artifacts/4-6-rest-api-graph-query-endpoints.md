# Story 4-6: REST API - Graph Query Endpoints

## Story

**ID:** 4-6
**Key:** 4-6-rest-api-graph-query-endpoints
**Title:** Implement REST API endpoints for graph queries with Redis caching
**Epic:** Epic 4 - API Package (@diagram-builder/api)
**Phase:** Phase 4 - API Package

**Description:**

Implement REST API endpoints for querying the codebase graph from Neo4j. These endpoints provide graph data retrieval, node details, dependency queries, and custom Cypher query execution. All queries are cached in Redis with 5-minute TTL for performance.

All endpoints require JWT authentication and return RFC 7807 formatted errors.

---

## Acceptance Criteria

- **AC-1:** GET /api/graph/:repoId - Get full graph
  - Returns complete IVM graph for repository
  - Includes all nodes and edges
  - Cached in Redis with 5-minute TTL
  - Returns 404 if repository not found
  - Requires authentication

- **AC-2:** GET /api/graph/:repoId/node/:nodeId - Get node details
  - Returns detailed information for specific node
  - Includes node properties and metadata
  - Cached in Redis
  - Returns 404 if node not found
  - Requires authentication

- **AC-3:** GET /api/graph/:repoId/dependencies/:nodeId - Get dependencies
  - Returns all dependencies for a node (incoming and outgoing)
  - Includes dependency type and metadata
  - Supports depth parameter (query string: ?depth=3)
  - Cached in Redis
  - Returns 404 if node not found
  - Requires authentication

- **AC-4:** POST /api/graph/:repoId/query - Custom Cypher query
  - Accepts Cypher query in request body
  - Executes query against Neo4j
  - Returns query results as JSON
  - Cached based on query hash
  - Validates query safety (read-only queries only)
  - Requires authentication

- **AC-5:** Redis caching for all queries
  - Cache keys follow naming convention: `diagram-builder:graph:{repoId}:{query-type}:{params-hash}`
  - 5-minute TTL for all cached results
  - Cache hit/miss logged for monitoring
  - Cache invalidation on repository updates (Story 4.5)

- **AC-6:** Comprehensive test coverage
  - Integration tests for all endpoints
  - Tests for Redis caching behavior
  - Tests for authentication enforcement
  - Tests for error scenarios (404, invalid queries)
  - All tests pass 100%

---

## Tasks/Subtasks

### Task 1: Create graph query router
- [ ] Create `src/routes/graph.ts` router module
- [ ] Set up Express router with authentication middleware
- [ ] Define route handlers for all 4 endpoints
- [ ] Register router in main Express app (`/api/graph`)

### Task 2: Implement GET /api/graph/:repoId - Full graph
- [ ] Build cache key: `diagram-builder:graph:${repoId}:full`
- [ ] Check Redis cache first
- [ ] If cache miss, query Neo4j for all nodes and edges
- [ ] Transform Neo4j result to IVM format
- [ ] Cache result in Redis with 5-minute TTL
- [ ] Return IVM graph JSON
- [ ] Return 404 if repository not found
- [ ] Write integration tests in `graph.test.ts`

### Task 3: Implement GET /api/graph/:repoId/node/:nodeId - Node details
- [ ] Build cache key: `diagram-builder:graph:${repoId}:node:${nodeId}`
- [ ] Check Redis cache first
- [ ] If cache miss, query Neo4j for node by ID
- [ ] Return node properties and metadata
- [ ] Cache result in Redis
- [ ] Return 404 if node not found
- [ ] Write integration tests for successful and not-found cases

### Task 4: Implement GET /api/graph/:repoId/dependencies/:nodeId
- [ ] Parse depth parameter from query string (default: 1, max: 5)
- [ ] Build cache key: `diagram-builder:graph:${repoId}:deps:${nodeId}:${depth}`
- [ ] Check Redis cache first
- [ ] If cache miss, run Cypher query for dependencies up to depth
- [ ] Return dependency tree (incoming and outgoing relationships)
- [ ] Cache result in Redis
- [ ] Return 404 if node not found
- [ ] Write integration tests with various depth values

### Task 5: Implement POST /api/graph/:repoId/query - Custom Cypher
- [ ] Parse Cypher query from request body: `{ query: string, params?: object }`
- [ ] Validate query is read-only (no CREATE, DELETE, SET, REMOVE)
- [ ] Generate query hash for cache key
- [ ] Build cache key: `diagram-builder:graph:${repoId}:custom:${queryHash}`
- [ ] Check Redis cache first
- [ ] If cache miss, execute query against Neo4j
- [ ] Return query results as JSON
- [ ] Cache result in Redis
- [ ] Return 400 ValidationError for unsafe queries
- [ ] Write integration tests for valid and invalid queries

### Task 6: Add caching utilities and monitoring
- [ ] Create helper function: `getCachedOrQuery<T>(key, queryFn): Promise<T>`
- [ ] Log cache hit/miss for monitoring
- [ ] Add cache statistics endpoint (optional): GET /api/cache/stats
- [ ] Write unit tests for caching utilities

### Task 7: Test and validate endpoints
- [ ] Run `npm test` and verify all tests pass
- [ ] Test full graph retrieval with populated repository
- [ ] Test node details retrieval
- [ ] Test dependency queries with depth=1, depth=3
- [ ] Test custom Cypher query (read-only)
- [ ] Test custom Cypher query validation (reject writes)
- [ ] Verify Redis caching (cache hit on second request)
- [ ] Test authentication enforcement (401 without token)
- [ ] Run TypeScript type checking: `tsc --noEmit`

---

## Dev Notes

### Architecture Context

**Package Location:** `packages/api/`
**Package Name:** `@diagram-builder/api`

**Dependencies:**
- Story 4.1: Express server setup
- Story 4.2: JWT authentication
- Story 4.3: Neo4j integration
- Story 4.4: Redis caching
- Story 4.5: Repository parsing (data source)

**Technology Stack:**
- Express: REST API routing
- Neo4j: Graph database queries
- Redis: Query result caching (5-minute TTL)

### Key Architecture Decisions

1. **Performance Requirements (NFR-P3):**
   - Query response time: <1 second (95th percentile)
   - Redis caching provides <100ms for cached queries
   - Neo4j indexes ensure fast query execution

2. **Caching Strategy:**
   - Cache all graph query results
   - 5-minute TTL balances freshness vs performance
   - Invalidate cache on repository updates (DELETE, refresh)

3. **Cypher Query Safety:**
   - Only allow read-only queries (MATCH, RETURN, WHERE, WITH)
   - Reject queries with CREATE, DELETE, SET, REMOVE, MERGE
   - Prevents accidental data modification through custom queries

### Implementation Guidance

**Cached Query Pattern:**
```typescript
async function getCachedOrQuery<T>(cacheKey: string, queryFn: () => Promise<T>): Promise<T> {
  // Check cache first
  const cached = await get<T>(cacheKey);
  if (cached) {
    console.log(`Cache HIT: ${cacheKey}`);
    return cached;
  }

  // Cache miss - execute query
  console.log(`Cache MISS: ${cacheKey}`);
  const result = await queryFn();

  // Store in cache with 5-minute TTL
  await set(cacheKey, result, 300);
  return result;
}
```

**Dependency Query Example:**
```typescript
router.get('/:repoId/dependencies/:nodeId', authenticate, async (req, res) => {
  const { repoId, nodeId } = req.params;
  const depth = parseInt(req.query.depth as string) || 1;

  const cacheKey = buildCacheKey('graph', `${repoId}:deps:${nodeId}:${depth}`);

  const dependencies = await getCachedOrQuery(cacheKey, async () => {
    const session = driver.session();
    try {
      const result = await session.run(
        `MATCH (n {id: $nodeId})-[r*1..${depth}]-(dep)
         RETURN n, r, dep`,
        { nodeId }
      );
      return transformToDependencyTree(result.records);
    } finally {
      await session.close();
    }
  });

  res.json(dependencies);
});
```

**Cypher Query Validation:**
```typescript
function isReadOnlyQuery(query: string): boolean {
  const dangerous = ['CREATE', 'DELETE', 'SET', 'REMOVE', 'MERGE', 'DROP'];
  const upperQuery = query.toUpperCase();
  return !dangerous.some(keyword => upperQuery.includes(keyword));
}
```

### Critical Constraints

- **5-minute TTL:** MUST cache with 300-second expiration
- **Read-only Cypher:** MUST validate custom queries
- **Cache invalidation:** DELETE/refresh MUST invalidate cache
- **RFC 7807 errors:** ALL errors use Problem Details format
- **Authentication required:** ALL endpoints use authenticate middleware
- **TypeScript strict mode:** NO `any` types

### Testing Requirements

**Test Coverage:**
- GET /api/graph/:repoId with valid repository
- GET /api/graph/:repoId with non-existent repository (404)
- GET /api/graph/:repoId/node/:nodeId with valid node
- GET /api/graph/:repoId/node/:nodeId with non-existent node (404)
- GET /api/graph/:repoId/dependencies/:nodeId with depth=1
- GET /api/graph/:repoId/dependencies/:nodeId with depth=3
- POST /api/graph/:repoId/query with valid read-only query
- POST /api/graph/:repoId/query with write query (validation error)
- Verify cache hit on second identical request
- Verify authentication enforcement (401 without token)

### Reference Files

- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Project Context: `_bmad-output/project-context.md`
- Phase Overview: `TASKS.md` (Phase 4.6)

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
