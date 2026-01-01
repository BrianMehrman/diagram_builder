/**
 * Protected Route Component
 *
 * Wrapper component that checks authentication before rendering children
 * In development mode, authentication is optional
 */

import { Navigate } from 'react-router'
import { isAuthenticated } from '../shared/api/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Protected route that requires authentication
 * Auth is bypassed in development mode
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Skip auth check in development mode
  const skipAuth = import.meta.env.DEV

  if (!skipAuth && !isAuthenticated()) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
