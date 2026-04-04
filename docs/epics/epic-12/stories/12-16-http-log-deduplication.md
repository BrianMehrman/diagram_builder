# Story 12-16: HTTP Log Deduplication

## Story

**ID:** 12-16
**Key:** 12-16-http-log-deduplication
**Title:** HTTP Log Deduplication
**Epic:** Epic 12 - Observability & Infrastructure (Group: 12-F Logging Completeness)
**Phase:** Implementation
**Priority:** MEDIUM - Reduces Loki noise; makes HTTP log queries reliable

**As a** developer querying HTTP logs in Grafana,
**I want** exactly one structured log entry per request in Loki,
**So that** query results are clean and I can count requests, filter by route, and build dashboards without deduplicating.

---

## Acceptance Criteria

- **AC-1:** In development mode, only one log entry per request appears in Loki — the structured entry from `requestLogger` (`method`, `route`, `status`, `durationMs`)
- **AC-2:** In development mode, Morgan coloured output still appears in the terminal (stdout)
- **AC-3:** In production mode, behaviour is unchanged — Morgan structured format continues to flow through `loggerStream`
- **AC-4:** Loki query `{app="diagram-builder-api"} | json` returns parseable JSON for all route entries
- **AC-5:** All existing middleware tests pass

---

## Tasks/Subtasks

### Task 1: Split Morgan transport by environment

- [ ] Open `packages/api/src/middleware/logger.ts`
- [ ] In development mode, route Morgan to `process.stdout` directly instead of `loggerStream`:
  ```ts
  const stream = process.env.NODE_ENV === 'production'
    ? loggerStream
    : process.stdout
  export const loggerMiddleware = morgan(format, { stream })
  ```
- [ ] Verify Morgan still produces coloured output in the dev terminal after this change

### Task 2: Verify no duplicate entries

- [ ] Start the API in development mode
- [ ] Make a request to any non-health endpoint
- [ ] Query Loki: `{app="diagram-builder-api"} | json | route != ""`
- [ ] Confirm exactly one entry per request, with `method`, `route`, `status`, `durationMs` fields

### Task 3: Verify production format unaffected

- [ ] Review the production Morgan format string in `middleware/logger.ts` — confirm it produces structured output suitable for `loggerStream`
- [ ] No code change required for production path — add a comment confirming intent

### Task 4: Update middleware test

- [ ] Check `middleware/logger.test.ts` — update any assertions that assumed Morgan writes to `loggerStream` in dev mode

### Task 5: Verify

- [ ] `npm run type-check --workspace=@diagram-builder/api` — clean
- [ ] `npm run lint --workspace=@diagram-builder/api` — clean
- [ ] `npm test --workspace=@diagram-builder/api` — all tests pass

---

## Dev Notes

### Why This Happens

Two middleware are registered in `index.ts`:

1. `loggerMiddleware` (Morgan) — writes to `loggerStream` in all environments. In dev, Morgan uses the `'dev'` format which produces ANSI-coloured strings like `GET /api/workspaces 304 1.1ms`. These land in Loki as noisy string values.

2. `requestLogger` — writes structured JSON on `res.finish`. Clean, parseable, one entry per request.

Both fire for every request. The fix keeps Morgan for the terminal and reserves `loggerStream` / Loki for the structured logger only.

### What Loki Entries Look Like After Fix

Before (two entries per request):
```
GET /api/workspaces 304 1.1 ms - - {"level":"info","service":"api"}   ← Morgan
{"method":"GET","route":"/","status":304,"durationMs":1}               ← requestLogger
```

After (one entry):
```
{"method":"GET","route":"/","status":304,"durationMs":1,"module":"api"}
```

### Scope Boundaries

- **DO:** Change the `stream` target for Morgan in development mode only
- **DO NOT:** Remove Morgan — it provides useful coloured output in the dev terminal
- **DO NOT:** Change `requestLogger` — it is the correct Loki source
- **DO NOT:** Touch production behaviour

### Can be bundled with Story 12-14

This story is small enough to implement in the same PR as 12-14 if convenient.

### Dependencies

- **Depends on:** Story 12-13 (Morgan + requestLogger both established there)
- **No dependency on:** 12-14 — can be done independently

---

## Change Log

- **2026-03-28**: Story created
  - Identified duplicate HTTP log entries in Loki during logging audit
  - Root cause: Morgan dev format writing to loggerStream in all environments

**Status:** done
**Created:** 2026-03-28
**Last Updated:** 2026-03-28
