/**
 * Authentication Token Management
 *
 * CRITICAL: Tokens stored in MEMORY ONLY for security.
 * Never use localStorage - tokens cleared on page refresh (expected behavior).
 */

/**
 * JWT token stored in memory (module-level variable)
 * NEVER stored in localStorage or sessionStorage
 */
let jwtToken: string | null = null

/**
 * Set JWT token (memory only)
 */
export function setToken(token: string): void {
  jwtToken = token
}

/**
 * Get JWT token from memory
 */
export function getToken(): string | null {
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
 */
export function isAuthenticated(): boolean {
  return jwtToken !== null
}
