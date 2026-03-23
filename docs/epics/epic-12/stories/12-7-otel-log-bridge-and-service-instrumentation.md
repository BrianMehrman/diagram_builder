# Story 12-7: OTEL Log Bridge and Service-Level Instrumentation

## Story

**ID:** 12-7
**Key:** 12-7-otel-log-bridge-and-service-instrumentation
**Title:** OTEL Log Bridge and Service-Level Instrumentation
**Epic:** Epic 12 - Observability & Infrastructure (Group: 12-C OTEL Instrumentation)
**Phase:** Implementation
**Priority:** HIGH - Connects logs to traces and instruments all key services

**Description:**

Add the OpenTelemetry Winston transport to bridge structured logs into traces (enabling log-to-trace correlation in Grafana). Instrument all key services to record metrics and create spans: HTTP middleware, Neo4j queries, Redis cache, parser duration, and WebSocket sessions.

**Prerequisite:** Stories 12-5 and 12-6 must be complete (tracer and metric instruments must exist). Story 12-13 must be complete (Winston logger.ts must be finalized before adding OTEL transport).

---

## Acceptance Criteria

- **AC-1:** `@opentelemetry/winston-transport` added; `logger.ts` conditionally includes it when `OTEL_ENABLED=true`
- **AC-2:** `trace_id` and `span_id` fields appear in log records
- **AC-3:** HTTP middleware records metrics (`httpRequestsTotal`, `httpRequestDuration`) on every request
- **AC-4:** Neo4j queries wrapped in spans; `dbQueryDuration` histogram populated
- **AC-5:** Cache operations increment `cacheOperationsTotal` with hit/miss result
- **AC-6:** Parser import records `parserDuration` histogram
- **AC-7:** WebSocket session join/leave updates `wsActiveSessions`
- **AC-8:** Integration tests verify metric increments; zero new test failures; zero TypeScript errors

---

## Tasks/Subtasks

### Task 1: Winston log bridge

- [ ] Install `@opentelemetry/winston-transport` in `packages/api/package.json`
- [ ] Update `packages/api/src/logger.ts`
  - Conditionally add `OpenTelemetryTransportV3` to Winston transports when `OTEL_ENABLED=true`
  - Ensure `trace_id` and `span_id` fields are injected into log records (enables log-to-trace correlation in Grafana)

### Task 2: HTTP middleware instrumentation

- [ ] Update `packages/api/src/middleware/logger.ts`
  - Add `trace_id` token to Morgan format string: extract from active span via `trace.getActiveSpan()`
  - Call `recordHttpMetrics()` on `res.on('finish', ...)` — record method, route (from `req.route?.path`), status code, duration

### Task 3: Neo4j query instrumentation

- [ ] Update `packages/api/src/services/graph-service.ts`
  - Wrap Neo4j query execution in `withSpan('neo4j.query', { 'db.operation': operationName }, fn)`
  - Record `dbQueryDuration` histogram on completion

### Task 4: Cache instrumentation

- [ ] Update `packages/api/src/cache/cache-utils.ts`
  - Increment `cacheOperationsTotal` on cache hit (`result: 'hit'`) and miss (`result: 'miss'`)

### Task 5: Parser duration instrumentation

- [ ] Update `packages/api/src/services/codebase-service.ts`
  - Record `parserDuration` histogram wrapping the `parser.loadRepository()` call

### Task 6: WebSocket session instrumentation

- [ ] Update `packages/api/src/websocket/session-manager.ts`
  - Increment `wsActiveSessions` on session join, decrement on leave

### Task 7: Tests and validation

- [ ] Write integration tests verifying:
  - HTTP request increments `httpRequestsTotal`
  - Cache operations update `cacheOperationsTotal`
  - DB calls appear in `dbQueryDuration` histogram
- [ ] Run `npm test` — zero new failures
- [ ] Run `npm run type-check` — zero TypeScript errors

---

## Dev Notes

### Files Involved

- `packages/api/package.json` (modify — add winston-transport)
- `packages/api/src/logger.ts` (modify — add OTEL transport conditionally)
- `packages/api/src/middleware/logger.ts` (modify — add trace_id + recordHttpMetrics)
- `packages/api/src/services/graph-service.ts` (modify — withSpan + dbQueryDuration)
- `packages/api/src/cache/cache-utils.ts` (modify — cacheOperationsTotal)
- `packages/api/src/services/codebase-service.ts` (modify — parserDuration)
- `packages/api/src/websocket/session-manager.ts` (modify — wsActiveSessions)

### Dependencies

- **Depends On:** Story 12-13 (Winston logger.ts finalized)
- **Depends On:** Story 12-5 (`tracer` and `withSpan` available)
- **Depends On:** Story 12-6 (metric instruments available)
- **Completes:** Epic 12-C OTEL instrumentation

### Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 4-6 hours

---

## Change Log

- **2026-03-22**: Story created from TASKS.md Phase 9 Epic 12-C

**Status:** backlog
**Created:** 2026-03-22
**Last Updated:** 2026-03-22
