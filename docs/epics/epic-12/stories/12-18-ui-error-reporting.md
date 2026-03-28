# Story 12-18: UI Error Reporting

## Story

**ID:** 12-18
**Key:** 12-18-ui-error-reporting
**Title:** UI Error Reporting
**Epic:** Epic 12 - Observability & Infrastructure (Group: 12-F Logging Completeness)
**Phase:** Implementation
**Priority:** LOW - Valuable once API logging is solid; not blocking

**As a** developer diagnosing a UI crash in production,
**I want** unhandled React rendering errors to appear in Loki alongside API logs,
**So that** I can see UI failures in Grafana without needing access to a user's browser devtools.

---

## Background

The UI is a React application running in the browser. Browser errors are currently visible only in devtools. The stale-dist 3D canvas failure (March 2026) — where `setParseResult` threw silently and the canvas never rendered — would have appeared immediately in Grafana had this been in place.

---

## Acceptance Criteria

- **AC-1:** A React error boundary wraps `<App />` and catches all unhandled rendering errors
- **AC-2:** On error, the boundary POSTs to `POST /api/logs` within 3 seconds
- **AC-3:** The error appears in Loki within 10 seconds with label `module: "ui"` and `level: "error"`
- **AC-4:** The boundary renders a graceful fallback UI (not a blank screen or raw error stack)
- **AC-5:** `POST /api/logs` is rate-limited to 20 requests per minute per IP to prevent flooding
- **AC-6:** If the POST fails (network error, server down), the boundary silently swallows the failure — no error-on-error
- **AC-7:** The endpoint does not require authentication — errors must be capturable before auth state is established
- **AC-8:** Unit test covers the error boundary: renders fallback on error, calls the log endpoint

---

## Tasks/Subtasks

### Task 1: Add POST /api/logs endpoint

- [ ] Create `packages/api/src/routes/logs.ts`
  - Accept `POST /api/logs` with body `{ level: string, message: string, context?: Record<string, unknown> }`
  - Validate body with Zod (same pattern as other routes)
  - Log via `createModuleLogger('ui')` at the requested level (default: `error`)
  - Respond `204 No Content` on success
- [ ] Register route in `packages/api/src/index.ts`: `app.use('/api/logs', logsRouter)` (no auth middleware — must be public)
- [ ] Apply rate limiter middleware (`express-rate-limit` — already a dependency or add it):
  - 20 requests per minute per IP
  - Return `429` when exceeded

### Task 2: Create React error boundary component

- [ ] Create `packages/ui/src/components/ErrorBoundary.tsx`
  - Class component extending `React.Component` (error boundaries must be class components)
  - `componentDidCatch(error, info)`:
    - POST to `/api/logs` with `{ level: 'error', message: error.message, context: { componentStack: info.componentStack } }`
    - Fire-and-forget (do not await, do not surface POST failures to user)
  - `render()`: if `this.state.hasError`, render fallback UI; otherwise render children

### Task 3: Add fallback UI

- [ ] Design a simple fallback component:
  - Heading: "Something went wrong"
  - Body: "An unexpected error occurred. Try refreshing the page."
  - Button: "Refresh" (`window.location.reload()`)
  - Styled to match the app's existing design tokens (no inline styles)
- [ ] No raw error messages or stack traces in the fallback — browser devtools has those

### Task 4: Wrap App with error boundary

- [ ] Open `packages/ui/src/main.tsx`
- [ ] Wrap `<App />` with `<ErrorBoundary>`:
  ```tsx
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
  ```

### Task 5: Write unit tests

- [ ] `packages/ui/src/components/ErrorBoundary.test.tsx`
  - Test: renders children when no error
  - Test: renders fallback UI when a child throws
  - Test: calls `/api/logs` endpoint when a child throws
  - Test: does not rethrow or crash if the POST fails

### Task 6: Add route test

- [ ] `packages/api/src/routes/logs.test.ts`
  - Test: `POST /api/logs` with valid body returns 204
  - Test: `POST /api/logs` with invalid body returns 400
  - Test: rate limit returns 429 after 20 requests

### Task 7: Verify

- [ ] `npm run type-check` — clean (both packages)
- [ ] `npm run lint` — clean (both packages)
- [ ] `npm run format:check` — clean
- [ ] `npm test` — all tests pass
- [ ] Smoke test: trigger a React error (throw in a component), confirm entry in Loki with `{module="ui"}`

---

## Dev Notes

### Why a Class Component

React error boundaries must be class components — functional components with hooks cannot implement `componentDidCatch`. This is a React constraint, not a project preference.

### Rate Limiting

Rate limiting protects against a looping render error (component throws → error boundary renders → throws again) from flooding Loki with thousands of entries per second. The boundary itself sets `state.hasError = true` to prevent the loop, but the rate limiter is a server-side backstop.

Check if `express-rate-limit` is already installed before adding it:
```
grep express-rate-limit packages/api/package.json
```

### Endpoint Authorization

`POST /api/logs` must NOT be behind the auth middleware. Errors in the auth flow itself, or errors that occur before the user is authenticated, would never be reported if auth is required.

Mitigate abuse via rate limiting (Task 1) and by validating log level against an allowlist (`['debug', 'info', 'warn', 'error']`).

### Out of Scope

- Capturing `console.log` / `console.warn` output from the UI browser context
- OpenTelemetry browser SDK for distributed frontend traces (separate story)
- User session context in log entries (would require passing auth token to the endpoint — deferred)
- Log retention / PII policy for UI error logs

### Scope Boundaries

- **DO:** Catch unhandled React rendering errors only
- **DO NOT:** Wrap individual components — one top-level boundary is sufficient
- **DO NOT:** Log every user interaction or state change — errors only
- **DO NOT:** Include user-identifying information in the log body

### Dependencies

- **Depends on:** Story 12-14 (`createModuleLogger` for the API endpoint)
- **Independent of:** Stories 12-15, 12-16, 12-17

---

## Change Log

- **2026-03-28**: Story created
  - Motivated by March 2026 stale-dist incident: 3D canvas silently failed with no server-side visibility
  - Scoped to rendering errors only; browser console capture and OTEL browser SDK deferred

**Status:** backlog
**Created:** 2026-03-28
**Last Updated:** 2026-03-28
