# Story 12-14: Module Logger Factory and Operation Wrapper

## Story

**ID:** 12-14
**Key:** 12-14-module-logger-factory-and-operation-wrapper
**Title:** Module Logger Factory and Operation Wrapper
**Epic:** Epic 12 - Observability & Infrastructure (Group: 12-F Logging Completeness)
**Phase:** Implementation
**Priority:** HIGH - Prerequisite for Stories 12-15 and 12-17

**As a** developer instrumenting a service or route,
**I want** a shared factory and async wrapper that provide consistent per-module log context and structured start/complete/fail patterns,
**So that** every log line carries a `module` field and service operations log uniformly without boilerplate.

---

## Acceptance Criteria

- **AC-1:** `createModuleLogger(module)` exported from `packages/api/src/logger.ts`
  - Returns a Winston child logger with `{ module }` merged into every entry
  - TypeScript return type is `winston.Logger`

- **AC-2:** `withOperation(log, name, meta, fn)` exported from `packages/api/src/logger.ts`
  - Logs `<name>.start` at DEBUG with `meta`
  - Logs `<name>.complete` at INFO with `meta` and `durationMs`
  - Logs `<name>.failed` at ERROR with `meta`, `error.message`, and `durationMs` on throw
  - Re-throws the original error after logging
  - Return type is generic `Promise<T>` inferred from `fn`

- **AC-3:** Unit tests cover both utilities
  - `createModuleLogger` test: child logger entries contain the `module` field
  - `withOperation` test: emits start, complete, and failed log events correctly; re-throws on failure

- **AC-4:** All existing API tests still pass

---

## Tasks/Subtasks

### Task 1: Add `createModuleLogger` to logger.ts

- [x] Add factory function below the existing `logger` export
- [x] Export from `packages/api/src/logger.ts`

### Task 2: Add `withOperation` to logger.ts

- [x] Add typed async wrapper
- [x] Export from `packages/api/src/logger.ts`

### Task 3: Write unit tests

- [x] Created `packages/api/src/logger.test.ts`
- [x] Test `createModuleLogger`: returns valid logger; entries include module field; different names produce distinct instances
- [x] Test `withOperation`: emits .start, .complete, .failed correctly; returns value; re-throws; does not emit .complete on failure

### Task 4: Verify

- [x] `npm run type-check --workspace=@diagram-builder/api` — clean
- [x] `npm run lint --workspace=@diagram-builder/api` — clean
- [x] `npm test --workspace=@diagram-builder/api` — all tests pass (421/421)

---

## Dev Notes

### Usage Pattern

```ts
// In any service or route file:
import { createModuleLogger, withOperation } from '../logger'

const log = createModuleLogger('workspace-service')

async function createWorkspace(userId: string, name: string) {
  return withOperation(log, 'createWorkspace', { userId }, async () => {
    // ... implementation
  })
}
```

This produces in Loki:
```json
{"level":"debug","message":"createWorkspace.start","module":"workspace-service","userId":"abc"}
{"level":"info","message":"createWorkspace.complete","module":"workspace-service","userId":"abc","durationMs":12}
```

### Scope Boundaries

- **DO:** Add both utilities to the existing `packages/api/src/logger.ts`
- **DO NOT:** Move the logger to a shared package — the API and parser have separate loggers by design
- **DO NOT:** Use these utilities in existing instrumented files (graph-service, codebase-service) — those are already done and working; don't change them

### Dependencies

- **Depends on:** Story 12-13 (Winston logger foundation — done)
- **Must complete before:** Stories 12-15 (infrastructure migration) and 12-17 (service/route instrumentation)

---

## Change Log

## Dev Agent Record

### File List
- `packages/api/src/logger.ts` (MODIFIED) — added `createModuleLogger` and `withOperation` exports
- `packages/api/src/logger.test.ts` (NEW) — 9 tests covering both utilities; 421/421 pass

### Completion Notes
Both utilities added to logger.ts. Winston child loggers share the parent's transport list, so tests use `PassThrough` streams added to individual child loggers and spy directly on child logger methods rather than the parent. 1915/1915 tests pass across all packages; type-check, lint, format:check all clean.

---

- **2026-03-28**: Story created
  - Identified during logging audit against live Loki instance
  - Positioned as prerequisite to 12-15 and 12-17
- **2026-03-28**: Story complete
  - Both utilities implemented and tested
  - All CI checks pass

**Status:** done
**Created:** 2026-03-28
**Last Updated:** 2026-03-28
