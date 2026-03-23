# Story 12-13: Complete Winston Logging Foundation

## Story

**ID:** 12-13
**Key:** 12-13-complete-winston-logging-foundation
**Title:** Complete Winston Logging Foundation
**Epic:** Epic 12 - Observability & Infrastructure (Group: 12-C Prerequisite)
**Phase:** Implementation
**Priority:** HIGH - Prerequisite for OTEL instrumentation (Stories 12-5, 12-6, 12-7)

**Description:**

Complete the structured logging implementation deferred from Epic 6, Story 6-2. The MVP in 6-2 added Winston to the parser and API packages with basic pipeline logging. This story fills the remaining gaps — `convertToIVM()` logging, graph endpoint and middleware logging, progress tracking, full error instrumentation, and test validation — before OpenTelemetry is layered on top in Stories 12-5 through 12-7.

**Migrated From:** Epic 6, Story 6-2 — Tasks 3 (partial), 4, 5, and 6 were explicitly deferred as "not critical for MVP."

**Context:**

Story 12-7 adds `@opentelemetry/winston-transport` to the existing `logger.ts` files, enabling log-to-trace correlation in Grafana. That work assumes a complete, well-instrumented logger. Completing this story first ensures 12-7 has solid ground to build on.

**Foundation already in place (from Story 6-2 MVP):**
- Winston installed in `packages/parser` and `packages/api`
- `packages/parser/src/logger.ts` and `packages/api/src/logger.ts` created
- `loadRepository()` and `buildDependencyGraph()` logging done
- `importCodebase()` and `triggerParserImport()` pipeline logging done

---

## Acceptance Criteria

- **AC-1:** Parser package fully instrumented
  - `convertToIVM()` logs entry, node/edge counts, and timing
  - All parser errors logged with full context and stack traces

- **AC-2:** API package fully instrumented
  - Graph endpoints (`GET /api/repositories/:id/graph`, etc.) log request, query timing, and result counts
  - Request/response middleware logs method, route, status, duration for all requests
  - All API errors logged with context (inputs, route, status code)

- **AC-3:** Error instrumentation complete
  - All try/catch blocks reviewed — no silent failures
  - Errors categorized (parser error, db error, validation error, etc.)
  - Diagnostic context included (config, inputs, current state) in every error log

- **AC-4:** Progress tracking implemented (log-based)
  - Parser logs milestones: start, files discovered, 25%/50%/75%/100% files processed, graph built, IVM complete
  - Files processed vs. total tracked and logged
  - No API endpoint required (deferred to future story if UX demands it)

- **AC-5:** Logging validated
  - Logs verified to appear during a real import (manual smoke test)
  - Log levels confirmed correct (debug/info/warn/error in right places)
  - Error paths verified to capture full context
  - No measurable performance impact from logging

---

## Tasks/Subtasks

### Task 1: Complete parser logging

- [ ] Add logging to `convertToIVM()` in `packages/parser/src/graph/ivm-converter.ts`:
  - Entry with input node/edge counts
  - Exit with IVM node/edge counts and timing
  - Errors with full context
- [ ] Review all try/catch blocks in parser package for silent failures
- [ ] Ensure every error path logs with: message, stack, relevant inputs

### Task 2: Complete API logging

- [ ] Add logging to graph endpoints in `packages/api/src/routes/graph.ts`:
  - Inbound request (repositoryId, query params)
  - Neo4j query timing
  - Result summary (node/edge counts returned)
  - Empty graph warning (WARN level)
  - Errors with route context
- [ ] Create `packages/api/src/middleware/request-logger.ts`:
  - Log every request: method, route, status code, duration (ms)
  - Use `res.on('finish', ...)` pattern to capture status + timing
  - Skip health check endpoint (`/health`) to avoid log noise
- [ ] Register middleware in `packages/api/src/server.ts`

### Task 3: Error instrumentation audit

- [ ] Grep all `catch` blocks in parser and API packages
- [ ] For each silent or minimal catch, add:
  - Log level: ERROR
  - Message: descriptive action that failed
  - Context: relevant inputs (file path, query, config values)
  - Stack trace via `{ err }` or `{ error: err.message, stack: err.stack }`
- [ ] Categorize errors with a `category` field: `'parser'`, `'neo4j'`, `'redis'`, `'validation'`, `'unknown'`

### Task 4: Progress tracking

- [ ] In `packages/parser/src/repository/repository-loader.ts`:
  - Log total file count after discovery
  - Track files processed as parsing runs
  - Log at 25%, 50%, 75% thresholds (only if total > 20 files to avoid noise)
  - Log 100% / completion with final count and timing
- [ ] In `packages/api/src/services/codebase-service.ts`:
  - Log import status transitions (pending → processing → complete/failed)

### Task 5: Test validation

- [ ] Smoke test: trigger a full import against the test fixture repo and verify:
  - Parser logs appear at INFO level (files discovered, graph built, IVM complete)
  - API logs show the import pipeline stages
  - Error paths produce ERROR logs with context (test with a bad repo path)
- [ ] Verify log levels: `LOG_LEVEL=debug` produces debug output; `LOG_LEVEL=info` suppresses it
- [ ] Confirm no test regressions: `npm test` passes in parser and api packages

---

## Dev Notes

### Log Format Reminder

From `packages/parser/src/logger.ts` and `packages/api/src/logger.ts` (established in 6-2):

```typescript
logger.info('convertToIVM complete', {
  inputNodes: graph.nodes.length,
  inputEdges: graph.edges.length,
  ivmNodes: ivm.nodes.length,
  ivmEdges: ivm.edges.length,
  durationMs: Date.now() - start,
});

logger.error('convertToIVM failed', {
  category: 'parser',
  inputNodes: graph.nodes.length,
  error: err.message,
  stack: err.stack,
});
```

### Request Logger Pattern

```typescript
// packages/api/src/middleware/request-logger.ts
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path === '/health') return;
    logger.info('request', {
      method: req.method,
      route: req.route?.path ?? req.path,
      status: res.statusCode,
      durationMs: Date.now() - start,
    });
  });
  next();
});
```

### Files Involved

**Parser Package:**
- `packages/parser/src/graph/ivm-converter.ts` — add convertToIVM() logging (Task 1)
- `packages/parser/src/repository/repository-loader.ts` — add progress tracking (Task 4)

**API Package:**
- `packages/api/src/routes/graph.ts` — add graph endpoint logging (Task 2)
- `packages/api/src/middleware/request-logger.ts` — create (Task 2)
- `packages/api/src/server.ts` — register middleware (Task 2)
- `packages/api/src/services/codebase-service.ts` — add status transition logging (Task 4)

**Both Packages:**
- All `catch` blocks — error instrumentation audit (Task 3)

### Dependencies

- **Depends On:** Story 6-2 (MVP Winston setup — already complete)
- **Must complete before:** Stories 12-5, 12-6, 12-7 (OTEL instrumentation)
- **Enables:** Story 12-7 — `@opentelemetry/winston-transport` bridges these logs to Jaeger traces

### Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 3-5 hours
- **Priority:** HIGH - Must complete before OTEL stories begin

---

## Change Log

- **2026-03-22**: Story created
  - Migrated deferred Tasks 3 (partial), 4, 5, 6 from Epic 6 Story 6-2
  - Added Task 2 (complete API logging) migrated from 6-2 Task 3 deferred items
  - Positioned as prerequisite to Epic 12-C OTEL instrumentation stories
  - Reframed progress tracking as log-based only (API endpoint deferred further)

**Status:** backlog
**Created:** 2026-03-22
**Last Updated:** 2026-03-22
**Migrated From:** Epic 6, Story 6-2 (Tasks 3-partial, 4, 5, 6)
