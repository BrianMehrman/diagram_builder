# Story 5-13: API Client

## Story

**ID:** 5-13
**Key:** 5-13-api-client
**Title:** Create REST API client utilities with JWT token management and request interceptors
**Epic:** Epic 5 - UI Package (@diagram-builder/ui)
**Phase:** Phase 5 - UI Package

**Description:**

Implement API client utilities for communicating with the backend API. Handles JWT token storage (memory only), request interceptors for auth headers, and WebSocket connection management.

CRITICAL: JWT tokens stored in MEMORY ONLY, NEVER in localStorage (security requirement).

---

## Acceptance Criteria

- **AC-1:** REST API client utilities
- **AC-2:** JWT token storage in MEMORY ONLY
- **AC-3:** Request interceptors for auth headers
- **AC-4:** WebSocket connection manager
- **AC-5:** Error handling for API errors
- **AC-6:** Unit tests for API client

---

## Tasks/Subtasks

### Task 1: Create API client
- [ ] Create src/shared/api/client.ts
- [ ] Set up fetch wrapper or axios
- [ ] Configure base URL from environment

### Task 2: JWT token management
- [ ] Store token in memory (module variable)
- [ ] NEVER use localStorage
- [ ] Token cleared on page refresh (expected behavior)

### Task 3: Request interceptors
- [ ] Add Authorization: Bearer header
- [ ] Add Content-Type headers
- [ ] Handle 401 responses (redirect to login)

### Task 4: WebSocket connection manager
- [ ] Create src/shared/websocket/manager.ts
- [ ] Connect/disconnect methods
- [ ] Pass JWT token in handshake

### Task 5: Error handling
- [ ] Parse RFC 7807 error responses
- [ ] Show user-friendly error messages
- [ ] Retry logic for network errors

### Task 6: API method wrappers
- [ ] Create methods for each API endpoint
- [ ] Type-safe request/response interfaces
- [ ] Export as apiClient object

---

## Dev Notes

**Token Storage (CRITICAL):**
```typescript
// ✅ CORRECT - Memory only
let jwtToken: string | null = null;

export function setToken(token: string) {
  jwtToken = token; // Memory only
}

// ❌ WRONG - NEVER do this
localStorage.setItem('token', token); // Security vulnerability!
```

---

## Status

**Current Status:** ready-for-dev
**Created:** 2025-12-29
