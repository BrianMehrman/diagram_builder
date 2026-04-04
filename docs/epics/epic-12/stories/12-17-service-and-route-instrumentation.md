# Story 12-17: Service and Route Instrumentation

## Story

**ID:** 12-17
**Key:** 12-17-service-and-route-instrumentation
**Title:** Service and Route Instrumentation
**Epic:** Epic 12 - Observability & Infrastructure (Group: 12-F Logging Completeness)
**Phase:** Implementation
**Priority:** MEDIUM - Adds application-level context absent from HTTP-only logging

**As a** developer investigating a bug or performance issue,
**I want** structured log entries for workspace, auth, export, viewpoint, and repository operations,
**So that** I can see what happened inside the application (not just that an HTTP request was made) and correlate failures with specific users and resources.

---

## Acceptance Criteria

- **AC-1:** All 8 files have a module-scoped logger via `createModuleLogger`
- **AC-2:** Every async service method is wrapped with `withOperation`, emitting start/complete/fail entries
- **AC-3:** Key metadata is included per operation:
  - Auth: `userId`, failure reason
  - Workspaces: `workspaceId`, `userId`
  - Repositories: `repoId`, `workspaceId`, node/edge counts on complete
  - Viewpoints: `viewpointId`, `workspaceId`
  - Export: `repoId`, format, output size in bytes on complete
- **AC-4:** No sensitive data in any log line (no passwords, no raw JWT tokens, no full request bodies)
- **AC-5:** Auth failures logged at WARN (not ERROR — they are expected events)
- **AC-6:** All existing route and service tests pass

---

## Tasks/Subtasks

### Task 1: Auth route and JWT

- [ ] `routes/auth.ts` — add `createModuleLogger('auth')`
  - Log login attempt (userId or email, no password)
  - Log login success (userId)
  - Log login failure at WARN (reason: invalid credentials, user not found)
  - Log token refresh (userId)
- [ ] `auth/jwt.ts` — already has console calls migrated in 12-15; confirm no additional log calls needed

### Task 2: Repository route and service

- [ ] `routes/repositories.ts` — add `createModuleLogger('repositories')`
  - Log parse request received (repoId, workspaceId)
  - Log parse queued/started
- [ ] `services/repository-service.ts` — add `createModuleLogger('repository-service')`
  - Wrap `parseRepository()` (or equivalent) with `withOperation`
  - Log complete with: nodeCount, edgeCount, durationMs
  - Log failure with: error.message

### Task 3: Workspace service

- [ ] `services/workspace-service.ts` — add `createModuleLogger('workspace-service')`
  - Wrap `createWorkspace`, `getWorkspace`, `listWorkspaces`, `deleteWorkspace` with `withOperation`
  - Include `workspaceId` and `userId` in meta where available
  - Wrap member management methods (`addMember`, `removeMember`) — include `targetUserId`

### Task 4: Viewpoint route and service

- [ ] `routes/viewpoints.ts` — add `createModuleLogger('viewpoints')`
  - Log CRUD request received (viewpointId where available, workspaceId)
- [ ] `services/viewpoint-service.ts` — add `createModuleLogger('viewpoint-service')`
  - Wrap create, get, update, delete with `withOperation`
  - Include `viewpointId` and `workspaceId` in meta

### Task 5: Export route and service

- [ ] `routes/export.ts` — add `createModuleLogger('export')`
  - Log export request (repoId, format)
- [ ] `services/export-service.ts` — add `createModuleLogger('export-service')`
  - Wrap export render method with `withOperation`
  - Log complete with: format, outputBytes, durationMs
  - Log failure with: format, error.message

### Task 6: Verify

- [ ] `grep -r "console\." packages/api/src/routes packages/api/src/services` — zero results in newly touched files
- [ ] `npm run type-check --workspace=@diagram-builder/api` — clean
- [ ] `npm run lint --workspace=@diagram-builder/api` — clean
- [ ] `npm test --workspace=@diagram-builder/api` — all tests pass
- [ ] Smoke test: perform a workspace create and a codebase import; confirm entries in Loki for `{module="workspace-service"}` and `{module="repository-service"}`

---

## Dev Notes

### Standard Pattern

```ts
import { createModuleLogger, withOperation } from '../logger'

const log = createModuleLogger('workspace-service')

export async function createWorkspace(userId: string, name: string): Promise<Workspace> {
  return withOperation(log, 'createWorkspace', { userId }, async () => {
    // ... implementation unchanged
  })
}
```

### Auth Failure Log Level

Auth failures (wrong password, expired token, unknown user) are WARN — they are expected events, not application errors. Only log at ERROR if the auth system itself fails unexpectedly (e.g. JWT library throws, database unreachable during auth check).

### Sensitive Data — Do Not Log

- Passwords (any field named `password`, `secret`, `credential`)
- Raw JWT tokens
- Full request bodies (log individual extracted fields only)
- PII beyond userId (no email addresses, no names)

If a field is uncertain, omit it. It can always be added later; removing it from existing logs is harder.

### Scope Boundaries

- **DO:** Add `createModuleLogger` and `withOperation` to the 8 unlogged files
- **DO NOT:** Refactor the business logic inside those files
- **DO NOT:** Re-instrument files already done in 12-13 (graph-service, codebase-service route/service)
- **DO NOT:** Add logging to test files

### Files In Scope

```
packages/api/src/routes/auth.ts
packages/api/src/routes/repositories.ts
packages/api/src/routes/viewpoints.ts
packages/api/src/routes/export.ts
packages/api/src/services/workspace-service.ts
packages/api/src/services/repository-service.ts
packages/api/src/services/viewpoint-service.ts
packages/api/src/services/export-service.ts
```

### Dependencies

- **Depends on:** Story 12-14 (`createModuleLogger` and `withOperation`)
- **Can run in parallel with:** Story 12-15

---

## Change Log

- **2026-03-28**: Story created
  - 8 files identified with zero logging during Loki audit
  - Scoped to service/route layer only; infrastructure files handled in 12-15

**Status:** done
**Created:** 2026-03-28
**Last Updated:** 2026-03-28
