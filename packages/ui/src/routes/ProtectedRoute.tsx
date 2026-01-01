/**
 * Protected Route Component
 *
 * Wrapper component that checks authentication before rendering children
 */

import { Navigate } from 'react-router'
import { isAuthenticated } from '../shared/api/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Protected route that requires authentication
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  if (!isAuthenticated()) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
