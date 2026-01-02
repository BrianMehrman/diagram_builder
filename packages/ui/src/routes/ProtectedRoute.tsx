/**
 * Protected Route Component
 *
 * Wrapper component that checks authentication before rendering children
 * In development mode with dev auth enabled, authentication is automatic (dev-user)
 * In production mode, requires valid JWT token
 */

import { Navigate } from 'react-router'
import { isAuthenticated } from '../shared/api/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  /**
   * Override for skipping authentication (used in tests)
   * @internal
   */
  skipAuth?: boolean
}

/**
 * Protected route that requires authentication
 *
 * Behavior:
 * - Development mode: Auto-authenticated as dev-user (matches API pattern)
 * - Production mode: Requires valid JWT token
 * - Test mode: Can skip auth with skipAuth prop
 */
export function ProtectedRoute({ children, skipAuth }: ProtectedRouteProps) {
  // Skip auth check when explicitly set (for tests)
  if (skipAuth) {
    return <>{children}</>
  }

  // Check authentication (handles dev mode automatically)
  if (!isAuthenticated()) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
