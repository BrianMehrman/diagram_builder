/**
 * Authentication Token Management
 *
 * IMPORTANT:
 * - In development mode: Auto-authenticates as 'dev-user' (matches API pattern)
 * - In production: Tokens stored in MEMORY ONLY for security
 * - Tokens cleared on page refresh (expected behavior)
 */

/**
 * JWT token stored in memory (module-level variable)
 * NEVER stored in localStorage or sessionStorage
 */
let jwtToken: string | null = null

/**
 * Development mode flag
 * Automatically set to 'dev-user' in development environment
 */
const isDevelopment = import.meta.env.MODE === 'development'
const devAuthEnabled = import.meta.env.VITE_DEV_AUTH !== 'false'

/**
 * Set JWT token (memory only)
 */
export function setToken(token: string): void {
  jwtToken = token
}

/**
 * Get JWT token from memory
 * In development mode with dev auth enabled, returns special marker
 * that tells the API to use dev-user (no actual token needed)
 */
export function getToken(): string | null {
  // In development mode, API will auto-assign dev-user if no token provided
  if (isDevelopment && devAuthEnabled && !jwtToken) {
    return null // API expects no token in dev mode
  }

  return jwtToken
}

/**
 * Clear JWT token from memory
 */
export function clearToken(): void {
  jwtToken = null
}

/**
 * Check if user is authenticated
 * In development mode with dev auth enabled, always returns true
 * In production, checks for valid token
 */
export function isAuthenticated(): boolean {
  // Development mode: auto-authenticated as dev-user
  if (isDevelopment && devAuthEnabled) {
    return true
  }

  // Production mode: check for token
  return jwtToken !== null
}

/**
 * Get current user ID
 * Returns 'dev-user' in development mode, or decoded token userId in production
 */
export function getCurrentUserId(): string | null {
  if (isDevelopment && devAuthEnabled) {
    return 'dev-user'
  }

  if (!jwtToken) {
    return null
  }

  try {
    // Decode JWT token to get userId
    const payload = JSON.parse(atob(jwtToken.split('.')[1] || ''))
    return payload.userId || payload.sub || null
  } catch {
    return null
  }
}

/**
 * Check if development mode authentication is enabled
 */
export function isDevModeAuth(): boolean {
  return isDevelopment && devAuthEnabled
}
