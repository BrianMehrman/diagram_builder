# Logging Completeness Plan

**Date:** 2026-03-28
**Context:** Epic 12 — Observability & Infrastructure
**Fits in:** New group 12-F within Epic 12 (extends 12-C)

---

## Current State

Story 12-13 ("Complete Winston Logging Foundation") shipped the Winston logger, Morgan HTTP middleware, and instrumented the graph service and codebase import pipeline. However an audit against the live Loki instance (2026-03-28) revealed three categories of gaps:

### Gap 1 — Infrastructure files using `console.*` (not flowing to Loki)

13 files bypass Winston entirely, sending output to stdout only:

| File | Uses |
|------|------|
| `packages/api/src/server.ts` | `console.warn`, `console.error` — startup, shutdown, CORS |
| `packages/api/src/database/neo4j-client.ts` | `console.warn`, `console.error` — connection, health |
| `packages/api/src/database/init-db.ts` | `console.warn`, `console.error` — constraints, indexes |
| `packages/api/src/database/query-utils.ts` | `console.error` — Neo4j query errors |
| `packages/api/src/database/seed-db.ts` | `console.*` — seed progress |
| `packages/api/src/cache/redis-client.ts` | `console.warn`, `console.error` — connection, health |
| `packages/api/src/cache/redis-config.ts` | `console.*` |
| `packages/api/src/cache/cache-utils.ts` | `console.*` |
| `packages/api/src/middleware/error-handler.ts` | `console.error` — RFC 7807 errors |
| `packages/api/src/websocket/server.ts` | `console.*` |
| `packages/api/src/config.ts` | `console.*` |
| `packages/api/src/auth/jwt.ts` | `console.*` |
| `packages/api/src/services/codebase-service.ts` | `console.error` fallback on line 85–89 |

### Gap 2 — Routes and services with zero logging

8 files have no logger calls at all — not even error logging:

| File | What's missing |
|------|---------------|
| `packages/api/src/routes/auth.ts` | Auth events (login, token refresh, failures) |
| `packages/api/src/routes/repositories.ts` | Repository parse lifecycle |
| `packages/api/src/routes/viewpoints.ts` | Viewpoint CRUD |
| `packages/api/src/routes/export.ts` | Export operations |
| `packages/api/src/services/workspace-service.ts` | Workspace and member management |
| `packages/api/src/services/repository-service.ts` | Parse orchestration |
| `packages/api/src/services/viewpoint-service.ts` | Viewpoint persistence |
| `packages/api/src/services/export-service.ts` | Export rendering |

HTTP request lines from Morgan DO cover these routes globally, but there is no application-level context (no operation IDs, no result counts, no business-logic errors).

### Gap 3 — No logging infrastructure (utilities)

There is no shared pattern for per-module context or consistent operation start/complete/fail logging. Each file that does log invents its own style. This is why some logs have a `category: 'neo4j'` field, others have none, and the metadata schema varies across files.

### Gap 4 — HTTP log format noise in Loki

Morgan in dev mode uses the `'dev'` format which produces coloured strings. These are piped through `loggerStream` → `logger.info(message)`, landing in Loki as:

```
GET /api/workspaces 304 1.1 ms - - {"level":"info","service":"api"}
```

The structured `requestLogger` middleware runs in parallel and produces clean JSON:

```json
{"method":"GET","route":"/","status":304,"durationMs":1,"level":"info","message":"request"}
```

Both entries appear in Loki for every request. The Morgan entry is redundant and noisy.

### Gap 5 — UI has no log shipping

The React UI runs in the browser. Browser errors (uncaught exceptions, React rendering failures) are visible only in devtools. Nothing is shipped to Loki. The previous session's stale-dist bug (3D canvas silently failing) would have been immediately visible in Grafana if UI errors were captured.

---

## Proposed Stories

### Story 12-14: Module Logger Factory and Operation Wrapper

**Group:** 12-C (OTEL Instrumentation — foundation)
**Priority:** HIGH — prerequisite for 12-15 and 12-16
**Effort:** Small (1 file, ~50 lines)

Add two utilities to `packages/api/src/logger.ts` (or a new `logger-utils.ts`):

**`createModuleLogger(module: string)`** — returns a child logger with `{ module }` added to every log entry. Replaces the current pattern of importing `logger` directly and manually tagging entries.

```ts
// Before
import { logger } from '../logger'
logger.info('workspace created', { workspaceId })

// After
const log = createModuleLogger('workspace-service')
log.info('workspace created', { workspaceId })
// → {"message":"workspace created","module":"workspace-service","workspaceId":"..."}
```

**`withOperation(log, name, meta, fn)`** — wraps an async function with structured start/complete/fail logging and timing.

```ts
return withOperation(log, 'createWorkspace', { userId }, async () => {
  // ... implementation
})
// Emits:
// DEBUG  createWorkspace.start    { userId }
// INFO   createWorkspace.complete { userId, durationMs: 12 }
// ERROR  createWorkspace.failed   { userId, error: "..." }   ← on throw
```

**Acceptance Criteria:**
- `createModuleLogger` exported, returns `winston.Logger` child with `module` field
- `withOperation` typed generically, re-throws errors after logging
- Unit tests for both utilities
- All existing tests still pass

---

### Story 12-15: Infrastructure Logger Migration

**Group:** 12-F (new — Logging Completeness)
**Priority:** HIGH — startup/infra errors are invisible to Loki without this
**Effort:** Medium (many files, mechanical changes)
**Depends on:** 12-14

Replace all `console.*` calls in infrastructure files with child loggers via `createModuleLogger`.

**Modules to migrate:**

| Module | Logger name |
|--------|-------------|
| `server.ts` | `startup` |
| `database/neo4j-client.ts` | `neo4j` |
| `database/init-db.ts` | `neo4j` |
| `database/query-utils.ts` | `neo4j` |
| `database/seed-db.ts` | `seed` |
| `cache/redis-client.ts` | `redis` |
| `cache/redis-config.ts` | `redis` |
| `cache/cache-utils.ts` | `redis` |
| `middleware/error-handler.ts` | `error-handler` |
| `websocket/server.ts` | `websocket` |
| `auth/jwt.ts` | `auth` |
| `services/codebase-service.ts` (console.error fallback) | `codebase-service` |

Log level mapping:
- `console.log` → `log.info`
- `console.warn` → `log.warn`
- `console.error` → `log.error`
- Startup success messages (✓ Neo4j connected) → `log.info`
- Startup error messages → `log.error`

**Acceptance Criteria:**
- Zero `console.log/warn/error` calls in the listed files
- Startup sequence (Neo4j connect, Redis connect, constraints) visible in Loki with `module: "neo4j"` / `module: "redis"`
- All 412 API tests still pass
- No change to user-visible behaviour

---

### Story 12-16: HTTP Log Deduplication

**Group:** 12-F (Logging Completeness)
**Priority:** MEDIUM — reduces Loki noise, makes queries simpler
**Effort:** Small (2 files)

Currently two middleware run per request, both writing to Loki:
1. `loggerMiddleware` (Morgan dev format → `loggerStream`) — noisy string
2. `requestLogger` (structured Winston) — clean JSON

Remove Morgan from the `loggerStream` path for non-production environments. Keep Morgan piped to `loggerStream` in **production only** (where the format is already structured). In development, Morgan writes only to the console (via a separate Console transport or `process.stdout`), not through Winston.

**Changes:**
- `middleware/logger.ts` — dev mode: use `{ stream: process.stdout }` for Morgan instead of `loggerStream`
- `middleware/logger.ts` — production mode: keep `loggerStream` as-is (production format is structured)

**Acceptance Criteria:**
- In dev mode: only one log entry per request in Loki (from `requestLogger`)
- In dev mode: Morgan coloured output still appears in the terminal
- In production mode: no regression (Morgan → loggerStream still active)
- Loki query `{app="diagram-builder-api"} | json` returns parseable entries for all routes

---

### Story 12-17: Service and Route Instrumentation

**Group:** 12-F (Logging Completeness)
**Priority:** MEDIUM — adds application-level context missing from HTTP-only logging
**Effort:** Large (8 files, new log calls throughout)
**Depends on:** 12-14

Add structured logging to the 8 unlogged routes and services using `createModuleLogger` and `withOperation`.

**Per-file scope:**

| File | Key operations to log |
|------|-----------------------|
| `routes/auth.ts` | login attempt/success/fail, token refresh, logout |
| `routes/repositories.ts` | parse request received, parse queued/started |
| `routes/viewpoints.ts` | create, read, update, delete |
| `routes/export.ts` | export requested (format, repoId), export complete (size) |
| `services/workspace-service.ts` | create/list/get workspace, add/remove member |
| `services/repository-service.ts` | parse start, parse complete (nodeCount, edgeCount, durationMs) |
| `services/viewpoint-service.ts` | CRUD operations with ids |
| `services/export-service.ts` | render start, format, output size, render complete |

**Standard metadata per operation:**
- Always include: `userId` (from request context where available)
- Include where relevant: `workspaceId`, `repoId`, `viewpointId`, format
- Errors: always include `error.message`, never include stack traces at INFO level

**Acceptance Criteria:**
- All 8 files have a module-scoped logger via `createModuleLogger`
- `withOperation` used for all async service methods
- Auth events (login fail, invalid token) logged at WARN level
- No sensitive data in log lines (no passwords, no raw tokens)
- All existing tests still pass

---

### Story 12-18: UI Error Reporting

**Group:** 12-F (Logging Completeness)
**Priority:** LOW — valuable but not blocking API observability
**Effort:** Medium (new API endpoint + React component)

Capture unhandled React errors and ship them to Loki via a new API endpoint.

**API side:**
- New POST `/api/logs` endpoint (no auth required — errors happen before auth)
- Accepts `{ level, message, context, stack? }`
- Rate-limited (prevents log flooding from looping errors)
- Logs via `createModuleLogger('ui')`

**UI side:**
- React error boundary component wrapping the app root
- On `componentDidCatch`: POST to `/api/logs` with error message + component stack
- Graceful fallback UI shown to user ("Something went wrong, try refreshing")
- Non-blocking: if the POST fails, silently swallow (don't error on error)

**What this gives you:**
- UI rendering failures visible in Loki with `{module="ui"}`
- Correlatable with the API request that preceded the failure (if `traceId` is available)
- The stale-dist 3D canvas failure from the previous session would have appeared here

**Out of scope for this story:**
- OpenTelemetry browser SDK (distributed browser→API traces)
- General `console.log` capture from the UI
- UI performance metrics

**Acceptance Criteria:**
- React error boundary present, wraps `<App />`
- Rendering error appears in Loki within 5 seconds with `module: "ui"`
- `/api/logs` rate-limited to 10 requests per minute per IP
- Fallback UI displays on error
- Unit test for the error boundary component

---

## Execution Order

```
12-14 (utilities)
  ├── 12-15 (infra migration)    — can run in parallel with 12-17
  ├── 12-16 (HTTP dedup)         — small, can be bundled with 12-14
  └── 12-17 (service/route logs) — depends on 12-14
12-18 (UI errors)                — independent, can run any time
```

Recommended order:
1. **12-14 + 12-16** together (small, foundational)
2. **12-15** (mechanical, safe)
3. **12-17** (largest, most value)
4. **12-18** (whenever UI visibility becomes a priority)

---

## What This Gives You in Grafana

After all stories complete, a single Loki query `{app="diagram-builder-api"}` will return:

- Startup sequence (Neo4j connect, Redis connect, constraints) with `module: "neo4j"` / `module: "redis"`
- Every HTTP request (method, route, status, durationMs) — structured, one entry per request
- Every service operation (start, complete, fail) with timing and relevant IDs
- Auth events with userId
- Export operations with format and size
- UI rendering errors

Filterable in Grafana by `module`, `level`, `userId`, `workspaceId`, `repoId`, `status`.

---

## Out of Scope (for this plan)

- OpenTelemetry browser SDK for frontend distributed traces (separate epic/story)
- Custom Loki config for storage path control (already open item from 12-4)
- Grafana dashboard creation (separate story, depends on logs existing first)
- `prepare` script for core/parser auto-build (separate open item)
