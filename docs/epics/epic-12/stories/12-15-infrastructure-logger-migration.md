# Story 12-15: Infrastructure Logger Migration

## Story

**ID:** 12-15
**Key:** 12-15-infrastructure-logger-migration
**Title:** Infrastructure Logger Migration
**Epic:** Epic 12 - Observability & Infrastructure (Group: 12-F Logging Completeness)
**Phase:** Implementation
**Priority:** HIGH - Startup and infra errors are invisible to Loki without this

**As a** developer debugging a production incident,
**I want** server startup, database connection, and infrastructure error messages to flow through Winston to Loki,
**So that** I can see the full startup sequence and infra failures in Grafana alongside application logs.

---

## Acceptance Criteria

- **AC-1:** Zero `console.log`, `console.warn`, or `console.error` calls remain in the listed files
- **AC-2:** All startup messages (Neo4j connected, Redis ready, constraints created, server started) appear in Loki with their respective `module` label
- **AC-3:** Infrastructure errors (connection failure, query error, cache miss) appear in Loki at the correct level (WARN or ERROR)
- **AC-4:** All 412 API tests still pass with no regressions
- **AC-5:** No change to user-visible behaviour or terminal output format

---

## Tasks/Subtasks

### Task 1: Migrate server.ts

- [ ] Import `createModuleLogger` from `../logger`
- [ ] Create `const log = createModuleLogger('startup')`
- [ ] Replace all `console.warn` and `console.error` calls with `log.warn` / `log.error`
- [ ] Keep startup URL/port messages as `log.info`

### Task 2: Migrate database files

- [ ] `database/neo4j-client.ts` — `createModuleLogger('neo4j')`, replace all `console.*`
- [ ] `database/init-db.ts` — `createModuleLogger('neo4j')`, replace all `console.*`
- [ ] `database/query-utils.ts` — `createModuleLogger('neo4j')`, replace `console.error` on query errors
- [ ] `database/seed-db.ts` — `createModuleLogger('seed')`, replace all `console.*`

### Task 3: Migrate cache files

- [ ] `cache/redis-client.ts` — `createModuleLogger('redis')`, replace all `console.*`
- [ ] `cache/redis-config.ts` — `createModuleLogger('redis')`, replace all `console.*`
- [ ] `cache/cache-utils.ts` — `createModuleLogger('redis')`, replace all `console.*`

### Task 4: Migrate remaining files

- [ ] `middleware/error-handler.ts` — `createModuleLogger('error-handler')`, replace `console.error`
- [ ] `websocket/server.ts` — `createModuleLogger('websocket')`, replace all `console.*`
- [ ] `auth/jwt.ts` — `createModuleLogger('auth')`, replace all `console.*`
- [ ] `services/codebase-service.ts` — replace `console.error` fallback (lines ~85–89) with `log.error` using existing service logger

### Task 5: Verify

- [ ] `grep -r "console\." packages/api/src` — must return zero results (excluding test files and comments)
- [ ] `npm run type-check --workspace=@diagram-builder/api` — clean
- [ ] `npm run lint --workspace=@diagram-builder/api` — clean
- [ ] `npm test --workspace=@diagram-builder/api` — all tests pass
- [ ] Smoke test: start API, check Loki for `{module="neo4j"}` and `{module="redis"}` entries

---

## Dev Notes

### Log Level Mapping

| Old call | New call | Notes |
|----------|----------|-------|
| `console.log('✓ Neo4j connected')` | `log.info('connected')` | Drop the emoji — Loki renders plain text |
| `console.warn('Redis not ready')` | `log.warn('not ready')` | |
| `console.error('Query failed', err)` | `log.error('query failed', { error: err.message, stack: err.stack })` | Always include stack |

### Emoji in Log Messages

The existing console output uses emoji for terminal readability (✓, 🚀, ⚠). Drop these from Winston log messages — they don't add value in Grafana and can break log parsing. The terminal will still show structured output via the Console transport.

### Scope Boundaries

- **DO:** Replace `console.*` with `createModuleLogger` child loggers
- **DO NOT:** Refactor the surrounding logic — this is a mechanical substitution only
- **DO NOT:** Change log levels unless the current console call is clearly wrong (e.g. `console.log` for an error should become `log.error`)
- **DO NOT:** Touch `packages/parser/` — parser has its own logger

### Files In Scope

```
packages/api/src/server.ts
packages/api/src/database/neo4j-client.ts
packages/api/src/database/init-db.ts
packages/api/src/database/query-utils.ts
packages/api/src/database/seed-db.ts
packages/api/src/cache/redis-client.ts
packages/api/src/cache/redis-config.ts
packages/api/src/cache/cache-utils.ts
packages/api/src/middleware/error-handler.ts
packages/api/src/websocket/server.ts
packages/api/src/auth/jwt.ts
packages/api/src/services/codebase-service.ts  (console.error fallback only)
```

### Dependencies

- **Depends on:** Story 12-14 (`createModuleLogger` utility)
- **Can run in parallel with:** Story 12-17

---

## Change Log

- **2026-03-28**: Story created
  - Identified 13 files bypassing Winston during Loki audit
  - Scoped as mechanical substitution only — no logic changes

**Status:** backlog
**Created:** 2026-03-28
**Last Updated:** 2026-03-28
