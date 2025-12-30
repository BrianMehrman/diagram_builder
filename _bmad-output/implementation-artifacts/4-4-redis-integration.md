# Story 4-4: Redis Integration

## Story

**ID:** 4-4
**Key:** 4-4-redis-integration
**Title:** Install ioredis client, configure Redis connection, implement cache utilities with 5-minute TTL
**Epic:** Epic 4 - API Package (@diagram-builder/api)
**Phase:** Phase 4 - API Package

**Description:**

Integrate Redis caching layer into the API package to improve query performance and reduce Neo4j load. Redis will cache graph query results with a 5-minute TTL (Time To Live), providing sub-100ms response times for repeated queries.

This story implements cache utilities (get, set, invalidate) that Stories 4.6-4.9 will use to cache API responses and improve performance under load.

---

## Acceptance Criteria

- **AC-1:** ioredis client installed and configured
  - ioredis npm package installed
  - Connection configuration loaded from environment variables
  - Redis client instance exported for reuse

- **AC-2:** Redis connection and health check validated
  - Connection established on server startup
  - Health check function verifies Redis connectivity
  - Connection errors logged and handled gracefully
  - Graceful shutdown closes Redis connection

- **AC-3:** Cache utilities implemented
  - `get(key: string): Promise<T | null>` - Retrieve cached value
  - `set(key: string, value: T, ttl?: number): Promise<void>` - Cache value with TTL
  - `invalidate(key: string): Promise<void>` - Remove cached value
  - `invalidatePattern(pattern: string): Promise<void>` - Remove matching keys
  - Default TTL: 5 minutes (300 seconds)

- **AC-4:** Cache key naming conventions defined
  - Namespace-based keys: `diagram-builder:{resource}:{id}`
  - Examples: `diagram-builder:graph:repo-123`, `diagram-builder:query:hash-abc`
  - Documented in code and README

- **AC-5:** Comprehensive test coverage
  - Unit tests for cache utilities
  - Integration tests for Redis connectivity
  - Tests for TTL expiration behavior
  - Tests for pattern-based invalidation
  - All tests pass 100%

---

## Tasks/Subtasks

### Task 1: Install ioredis and configure connection
- [ ] Install ioredis: `npm install ioredis @types/ioredis`
- [ ] Add Redis environment variables to .env.example:
  - REDIS_URL (default: redis://localhost:6379)
  - REDIS_PASSWORD (optional)
  - REDIS_DB (default: 0)
- [ ] Create `src/cache/redis-config.ts` configuration module
- [ ] Load environment variables in config/environment.ts
- [ ] Export Redis client instance for reuse

### Task 2: Implement connection and health check
- [ ] Create `src/cache/redis-client.ts` module
- [ ] Implement `connectRedis()` function to establish connection
- [ ] Implement `checkRedisHealth()` function to verify connectivity
- [ ] Add connection logging (startup, success, errors)
- [ ] Call connectRedis() on server startup
- [ ] Close Redis connection on graceful shutdown (SIGTERM/SIGINT)
- [ ] Write integration tests for connection in `redis-client.test.ts`

### Task 3: Implement cache utilities
- [ ] Create `src/cache/cache-utils.ts` module
- [ ] Implement `get<T>(key: string): Promise<T | null>` with JSON parsing
- [ ] Implement `set<T>(key: string, value: T, ttl: number = 300): Promise<void>` with JSON serialization
- [ ] Implement `invalidate(key: string): Promise<void>` using DEL command
- [ ] Implement `invalidatePattern(pattern: string): Promise<void>` using SCAN + DEL
- [ ] Add error handling and logging
- [ ] Write unit tests for cache utilities in `cache-utils.test.ts`

### Task 4: Define cache key naming conventions
- [ ] Create `src/cache/README.md` documentation
- [ ] Document namespace format: `diagram-builder:{resource}:{id}`
- [ ] Document resource types: graph, query, viewpoint, workspace
- [ ] Add code examples for common cache operations
- [ ] Create helper function: `buildCacheKey(resource: string, id: string): string`

### Task 5: Test and validate Redis integration
- [ ] Run `npm test` and verify all tests pass
- [ ] Start local Redis container: `docker-compose up redis`
- [ ] Verify connection health check succeeds
- [ ] Test cache set and get operations
- [ ] Test TTL expiration (wait 5 minutes or use shorter TTL for test)
- [ ] Test pattern-based invalidation
- [ ] Run TypeScript type checking: `tsc --noEmit`

---

## Dev Notes

### Architecture Context

**Package Location:** `packages/api/`
**Package Name:** `@diagram-builder/api`

**Dependencies:**
- Story 4.1: Express server setup (prerequisite)
- Phase 1: Docker Compose with Redis service (v7.4.x)

**Technology Stack:**
- ioredis: High-performance Redis client for Node.js
- Redis: v7.4.x (from Docker Compose)
- TypeScript: Type safety for cache operations

### Key Architecture Decisions (from architecture.md)

1. **Performance Requirements (NFR-P3, NFR-P9):**
   - Query response time: <1 second (95th percentile)
   - Redis caching provides <100ms response for cached queries
   - 5-minute TTL balances freshness vs. performance

2. **Cache Strategy:**
   - Cache graph query results (Story 4.6)
   - Cache viewpoint data (Story 4.7)
   - Cache export results (Story 4.8)
   - Invalidate on data changes (new parse, repository update)

3. **WebSocket Integration (Story 4.10):**
   - Redis pub/sub for cross-server WebSocket synchronization
   - Support horizontal scaling with multiple WebSocket servers

### Implementation Guidance

**Redis Client Configuration:**
```typescript
// src/cache/redis-config.ts (example)
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

export default redis;
```

**Cache Utilities Example:**
```typescript
// src/cache/cache-utils.ts (example)
import redis from './redis-config';

export async function get<T>(key: string): Promise<T | null> {
  const value = await redis.get(key);
  return value ? JSON.parse(value) : null;
}

export async function set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
  await redis.setex(key, ttl, JSON.stringify(value));
}

export async function invalidate(key: string): Promise<void> {
  await redis.del(key);
}

export async function invalidatePattern(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

export function buildCacheKey(resource: string, id: string): string {
  return `diagram-builder:${resource}:${id}`;
}
```

### Critical Constraints

- **5-minute default TTL:** MUST be configurable but default to 300 seconds
- **JSON serialization:** Cache values MUST be JSON serializable
- **Graceful shutdown:** MUST close Redis connection on SIGTERM/SIGINT
- **Pattern invalidation:** Use SCAN instead of KEYS for production (non-blocking)
- **TypeScript strict mode:** NO `any` types
- **Co-located tests:** Tests next to source files

### Testing Requirements

**Test Coverage:**
- Connection with valid Redis URL
- Connection failure handling (invalid URL)
- Health check with running Redis instance
- Cache get for existing key
- Cache get for non-existent key (returns null)
- Cache set with default TTL
- Cache set with custom TTL
- Cache invalidation (single key)
- Cache invalidation (pattern match)
- TTL expiration behavior

**Integration Test Setup:**
- Requires running Redis instance (Docker Compose)
- Tests should use separate DB (REDIS_DB=1) or flush DB after tests
- Use short TTL values for TTL expiration tests (e.g., 1 second)

### Reference Files

- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Project Context: `_bmad-output/project-context.md`
- Phase Overview: `TASKS.md` (Phase 4.4)
- Docker Compose: `docker-compose.yml` (Redis service)

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
