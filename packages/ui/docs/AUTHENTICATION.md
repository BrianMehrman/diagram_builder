# Authentication Guide - UI Package

## Overview

The UI package implements a dual-mode authentication system:
- **Development Mode**: Auto-authenticated as `dev-user` (matches API pattern)
- **Production Mode**: JWT token-based authentication with memory-only storage

## Development Mode Authentication

### How It Works

In development mode (`NODE_ENV=development`), authentication is automatically bypassed:

1. **ProtectedRoute** allows access without a token
2. **isAuthenticated()** always returns `true`
3. **getCurrentUserId()** returns `'dev-user'`
4. **API requests** are sent without Authorization header
5. **API middleware** auto-assigns `dev-user` when no token provided

This matches the API's development mode pattern for consistency.

### Configuration

Development mode authentication is controlled by environment variables:

```bash
# Enable dev mode auth (default in development)
# No VITE_DEV_AUTH variable needed

# Disable dev mode auth to test real authentication flows
VITE_DEV_AUTH=false
```

### Visual Indicators

When dev mode authentication is enabled:
- Login page shows blue info banner
- "Skip Login (Development)" button visible
- Console warning: "🔓 Development Mode: Auto-authenticated as dev-user"
- Login can be skipped entirely

### When to Disable Dev Mode Auth

Disable dev mode authentication when you need to:
- Test the real login flow
- Debug JWT token handling
- Verify authentication error handling
- Test unauthorized access scenarios

To disable:
```bash
# In packages/ui/.env or packages/ui/.env.local
VITE_DEV_AUTH=false
```

## Production Mode Authentication

### JWT Token Management

In production mode, JWT tokens are:
- **Stored in memory only** (module-level variable)
- **Never persisted** to localStorage or sessionStorage
- **Cleared on page refresh** (expected security behavior)
- **Validated before use** (expiration check)

### Security Rationale

**Why memory-only storage?**
- Prevents XSS attacks from stealing tokens
- Tokens expire naturally on page refresh
- Follows security best practices for SPAs
- Trade-off: Users must re-authenticate after refresh

### Login Flow

1. User enters credentials on `/login` page
2. API `/auth/login` endpoint called with email/password
3. JWT token received in response
4. Token stored in memory via `setToken(token)`
5. User redirected to intended route (or home)
6. Subsequent API requests include `Authorization: Bearer <token>` header

### Protected Routes

Protected routes use the `<ProtectedRoute>` component:

```tsx
<Route path="/workspace" element={
  <ProtectedRoute>
    <WorkspacePage />
  </ProtectedRoute>
} />
```

Behavior:
- Checks `isAuthenticated()` before rendering children
- Redirects to `/login` if not authenticated
- In dev mode, always allows access
- Can skip auth with `skipAuth={true}` prop (tests only)

### Logout Flow

1. User clicks logout button
2. `clearToken()` called to remove token from memory
3. User redirected to `/login`
4. All protected routes now inaccessible

### Token Expiration

**Current Behavior:**
- Token expiration checked client-side in `isAuthenticated()`
- Expired tokens treated as invalid
- User redirected to `/login`

**API Integration:**
- API returns 401 Unauthorized for expired tokens
- API client catches 401 and redirects to `/login`
- Token automatically cleared from memory

**Token Refresh:**
- Not currently implemented
- Tokens expire and require re-login
- Future enhancement: Implement refresh token flow

## Authentication API

### Functions

#### `setToken(token: string): void`
Store JWT token in memory.

```typescript
import { setToken } from '@/shared/api/auth'

// After successful login
const response = await auth.login({ email, password })
setToken(response.token)
```

#### `getToken(): string | null`
Get current JWT token from memory.

```typescript
import { getToken } from '@/shared/api/auth'

const token = getToken()
if (token) {
  // Use token for API request
}
```

In development mode with dev auth enabled, returns `null` (API will auto-assign dev-user).

#### `clearToken(): void`
Clear JWT token from memory.

```typescript
import { clearToken } from '@/shared/api/auth'

// On logout
clearToken()
navigate('/login')
```

#### `isAuthenticated(): boolean`
Check if user is authenticated.

```typescript
import { isAuthenticated } from '@/shared/api/auth'

if (isAuthenticated()) {
  // User has valid token or is in dev mode
}
```

Returns:
- `true` in development mode (dev auth enabled)
- `true` if valid token exists in production mode
- `false` otherwise

#### `getCurrentUserId(): string | null`
Get current user ID.

```typescript
import { getCurrentUserId } from '@/shared/api/auth'

const userId = getCurrentUserId()
// Returns 'dev-user' in dev mode
// Returns decoded JWT userId in production
```

#### `isDevModeAuth(): boolean`
Check if development mode authentication is enabled.

```typescript
import { isDevModeAuth } from '@/shared/api/auth'

if (isDevModeAuth()) {
  console.log('Running in dev mode with auto-auth')
}
```

## Testing Authentication

### Unit Tests

Test auth utilities directly:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { setToken, getToken, clearToken, isAuthenticated } from './auth'

describe('Authentication', () => {
  it('should store and retrieve token', () => {
    setToken('test-token')
    expect(getToken()).toBe('test-token')
    expect(isAuthenticated()).toBe(true)
  })

  it('should clear token', () => {
    setToken('test-token')
    clearToken()
    expect(getToken()).toBeNull()
    expect(isAuthenticated()).toBe(false)
  })
})
```

### Component Tests

Test ProtectedRoute behavior:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ProtectedRoute } from './ProtectedRoute'

describe('ProtectedRoute', () => {
  it('should render children when skipAuth is true', () => {
    render(
      <MemoryRouter>
        <ProtectedRoute skipAuth={true}>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should redirect to login when not authenticated', () => {
    // Mock isAuthenticated to return false
    vi.mock('./shared/api/auth', () => ({
      isAuthenticated: () => false
    }))

    render(
      <MemoryRouter initialEntries={['/workspace']}>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/workspace" element={
          <ProtectedRoute>
            <div>Workspace</div>
          </ProtectedRoute>
        } />
      </MemoryRouter>
    )

    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })
})
```

### E2E Tests

Test complete authentication flows:

```typescript
import { test, expect } from '@playwright/test'

test('login flow', async ({ page }) => {
  // Disable dev mode auth for this test
  await page.goto('/login')

  // Fill login form
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'testpassword123')
  await page.click('button[type="submit"]')

  // Should redirect to home
  await expect(page).toHaveURL('/')
})

test('protected route access', async ({ page }) => {
  // Try to access protected route without login
  await page.goto('/workspace')

  // Should redirect to login
  await expect(page).toHaveURL('/login')
})

test('dev mode bypass', async ({ page }) => {
  // In dev mode, should access protected route directly
  await page.goto('/workspace')

  // Should NOT redirect to login
  await expect(page).not.toHaveURL('/login')
})
```

## Troubleshooting

### Issue: Cannot access protected routes in development

**Symptoms:**
- Redirected to login page
- Dev mode should allow access

**Solution:**
1. Verify `NODE_ENV=development` is set
2. Check `VITE_DEV_AUTH` is not set to `'false'`
3. Restart Vite dev server after env changes
4. Check console for "🔓 Development Mode" warning

### Issue: Token lost on page refresh

**Symptoms:**
- User logs in successfully
- After refresh, user logged out

**Solution:**
This is **expected behavior** for security. Tokens are stored in memory only.

To persist auth across refreshes (future enhancement):
- Implement refresh token flow
- Use httpOnly cookies (requires API changes)
- Accept security trade-offs of localStorage

### Issue: 401 Unauthorized errors

**Symptoms:**
- API requests fail with 401
- "Token expired" or "Invalid token" errors

**Solution:**
1. Check token exists: `getToken()` returns value
2. Verify token not expired (decode JWT and check exp)
3. Ensure API is running and accepting tokens
4. In dev mode, check API middleware is active
5. Try clearing token and re-logging in

### Issue: E2E tests fail with auth errors

**Symptoms:**
- Tests cannot access protected routes
- 401 errors in test runs

**Solution:**
1. **Option 1**: Use `skipAuth` prop in test routes
2. **Option 2**: Set up test authentication:
   ```typescript
   import { setToken } from '@/shared/api/auth'
   
   test.beforeEach(() => {
     setToken('test-token')
   })
   ```
3. **Option 3**: Run tests in dev mode (auto-authenticated)

### Issue: Login form doesn't work

**Symptoms:**
- Cannot submit login form
- No errors shown

**Solution:**
1. Check API is running (default: http://localhost:3001)
2. Verify API auth endpoints exist: `POST /auth/login`
3. Check network tab for CORS errors
4. Verify credentials match test data in API
5. Check console for error messages

### Issue: Dev mode not detected

**Symptoms:**
- Dev mode features not working
- Login required in development

**Solution:**
1. Check `import.meta.env.MODE === 'development'`
2. Verify Vite is running in dev mode: `npm run dev`
3. Check `VITE_DEV_AUTH` environment variable
4. Restart Vite after env changes

## Environment Variables

### VITE_API_BASE_URL
API base URL for requests.

```bash
# Default
VITE_API_BASE_URL=http://localhost:3001

# Production
VITE_API_BASE_URL=https://api.yourdomain.com
```

### VITE_DEV_AUTH
Control development mode authentication.

```bash
# Enabled (default) - auto-authenticate as dev-user
# VITE_DEV_AUTH not set

# Disabled - require real authentication
VITE_DEV_AUTH=false
```

**When to disable:**
- Testing authentication flows
- Debugging JWT issues
- Validating error handling
- E2E tests that need real auth

## Security Considerations

### Memory-Only Tokens

**Advantages:**
- XSS attack protection
- No persistent tokens on disk
- Natural token expiration

**Disadvantages:**
- Lost on page refresh
- Cannot persist sessions
- Users must re-login

### Development Mode Risks

**⚠️ WARNING:** Development mode authentication bypasses all security.

**Never enable in production:**
- `NODE_ENV=production` disables dev mode
- No `VITE_DEV_AUTH` variable in production
- Build process should remove dev mode code

### Future Enhancements

1. **Refresh Token Flow**
   - Long-lived refresh token
   - Short-lived access token
   - Auto-refresh before expiration

2. **httpOnly Cookies**
   - Server-side token storage
   - Automatic inclusion in requests
   - Better XSS protection

3. **Persistent Sessions**
   - Optional localStorage with encryption
   - User preference for "Remember me"
   - Security warnings

4. **Multi-Factor Authentication**
   - TOTP (Time-based One-Time Password)
   - SMS verification
   - Email verification
