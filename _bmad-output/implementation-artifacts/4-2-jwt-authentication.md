# Story 4-2: JWT Authentication

## Story

**ID:** 4-2
**Key:** 4-2-jwt-authentication
**Title:** Implement JWT token generation, validation, and authentication middleware
**Epic:** Epic 4 - API Package (@diagram-builder/api)
**Phase:** Phase 4 - API Package

**Description:**

Implement JWT-based authentication for the API server. This includes token generation, validation, and middleware to protect API endpoints. JWT authentication will be used across REST API, WebSocket connections, and CLI tool access.

Tokens are stored in memory only (NEVER in localStorage for security) with 24-hour expiration. All authenticated endpoints require a valid JWT token in the Authorization header.

This story establishes the authentication layer that Stories 4.5-4.13 will use to protect endpoints.

---

## Acceptance Criteria

- **AC-1:** JWT token generation implemented
  - jsonwebtoken library installed
  - Token generation function with user payload
  - 24-hour token expiration configured
  - Secret key loaded from environment variable (JWT_SECRET)
  - Tokens include user ID and issued-at timestamp

- **AC-2:** Token validation middleware created
  - Authentication middleware function validates JWT tokens
  - Tokens extracted from Authorization: Bearer header
  - Invalid/expired tokens return 401 Unauthorized (RFC 7807 format)
  - Valid tokens populate req.user with decoded payload
  - Middleware can be applied to protected routes

- **AC-3:** Authentication endpoints implemented
  - POST /api/auth/login - Generate JWT token (placeholder, real auth in future)
  - POST /api/auth/refresh - Refresh expiring token
  - POST /api/auth/logout - Invalidate token (optional)
  - Endpoints return tokens in response body

- **AC-4:** Comprehensive test coverage
  - Unit tests for token generation
  - Unit tests for token validation
  - Integration tests for authentication middleware
  - Tests for expired tokens
  - Tests for malformed tokens
  - All tests pass 100%

---

## Tasks/Subtasks

### Task 1: Install JWT dependencies and configure secret
- [ ] Install jsonwebtoken: `npm install jsonwebtoken @types/jsonwebtoken`
- [ ] Add JWT_SECRET to .env.example
- [ ] Load JWT_SECRET from environment in config/environment.ts
- [ ] Validate JWT_SECRET exists on server startup
- [ ] Configure 24-hour token expiration constant

### Task 2: Implement JWT token generation
- [ ] Create `src/auth/jwt.ts` module
- [ ] Define JWT payload interface (userId, iat, exp)
- [ ] Implement `generateToken(userId: string): string` function
- [ ] Set expiration to 24 hours (expiresIn: '24h')
- [ ] Sign tokens with JWT_SECRET
- [ ] Write unit tests for token generation in `jwt.test.ts`

### Task 3: Implement token validation middleware
- [ ] Create `src/middleware/auth.ts` authentication middleware
- [ ] Extract token from Authorization: Bearer header
- [ ] Verify token signature and expiration with jsonwebtoken.verify()
- [ ] Decode token payload and attach to req.user
- [ ] Return 401 Unauthorized for missing/invalid/expired tokens
- [ ] Use RFC 7807 format for error responses
- [ ] Write unit tests for auth middleware in `auth.test.ts`

### Task 4: Create authentication endpoints
- [ ] Create `src/routes/auth.ts` router module
- [ ] Implement POST /api/auth/login endpoint (placeholder authentication)
- [ ] Implement POST /api/auth/refresh endpoint (token refresh)
- [ ] Return tokens in response: { token: string, expiresIn: number }
- [ ] Add auth router to Express app
- [ ] Write integration tests for auth endpoints in `auth.test.ts`

### Task 5: Test and validate authentication flow
- [ ] Run `npm test` and verify all tests pass
- [ ] Test token generation and validation manually
- [ ] Test expired token handling
- [ ] Test malformed token handling
- [ ] Test protected route with valid token
- [ ] Test protected route with invalid token
- [ ] Run TypeScript type checking: `tsc --noEmit`

---

## Dev Notes

### Architecture Context

**Package Location:** `packages/api/`
**Package Name:** `@diagram-builder/api`

**Dependencies:**
- Story 4.1: Express server setup (prerequisite)

**Technology Stack:**
- jsonwebtoken: JWT token generation and validation
- TypeScript: Type safety for auth middleware
- Express: Middleware integration

### Key Architecture Decisions (from architecture.md and project-context.md)

1. **JWT Authentication Everywhere:**
   - REST API: Authorization: Bearer <token> header
   - WebSocket: Token in connection handshake (Story 4.10)
   - CLI: --token flag or environment variable (Phase 6)
   - NEVER use session cookies or other auth methods

2. **Token Storage (CRITICAL Security Requirement):**
   - Frontend: Memory only, NEVER localStorage
   - 24-hour expiration to limit exposure
   - Refresh tokens for long-lived sessions

3. **RFC 7807 Error Format:**
   - 401 Unauthorized for missing/invalid tokens
   - Include "type", "title", "status", "detail", "instance"
   - No stack traces in error responses

### Implementation Guidance

**JWT Token Generation:**
```typescript
// src/auth/jwt.ts (example)
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  iat: number;
  exp: number;
}

export function generateToken(userId: string): string {
  const payload = { userId };
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '24h' });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
}
```

**Authentication Middleware:**
```typescript
// src/middleware/auth.ts (example)
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../auth/jwt';
import { UnauthorizedError } from '../errors';

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyToken(token);
    req.user = payload; // Attach user to request
    next();
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}
```

**Protected Route Example:**
```typescript
// Usage in routes
app.get('/api/protected', authenticate, (req, res) => {
  res.json({ message: `Hello ${req.user.userId}` });
});
```

### Critical Constraints

- **24-hour expiration:** MUST be enforced
- **Environment variable:** JWT_SECRET MUST be loaded from env
- **RFC 7807 errors:** All auth errors use Problem Details format
- **TypeScript strict mode:** NO `any` types
- **Co-located tests:** Tests next to source files

### Testing Requirements

**Test Coverage:**
- Token generation with valid userId
- Token verification with valid token
- Token verification with expired token
- Token verification with malformed token
- Middleware with missing Authorization header
- Middleware with valid token
- Middleware with invalid token
- Auth endpoints return correct token format

### Reference Files

- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Project Context: `_bmad-output/project-context.md`
- Phase Overview: `TASKS.md` (Phase 4.2)

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
