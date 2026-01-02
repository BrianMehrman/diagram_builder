/**
 * Application Routes
 *
 * React Router configuration with lazy loading and auth guards
 */

import { lazy } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { ProtectedRoute } from './ProtectedRoute'

// Lazy load pages for code splitting
const HomePage = lazy(() => import('../pages/HomePage').then((m) => ({ default: m.HomePage })))
const LoginPage = lazy(() => import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const CanvasPage = lazy(() => import('../pages/CanvasPage').then((m) => ({ default: m.CanvasPage })))
const WorkspacePage = lazy(() =>
  import('../pages/WorkspacePage').then((m) => ({ default: m.WorkspacePage }))
)
const ViewpointPage = lazy(() =>
  import('../pages/ViewpointPage').then((m) => ({ default: m.ViewpointPage }))
)
const NotFoundPage = lazy(() =>
  import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
)

/**
 * Application router
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <HomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/canvas',
    element: (
      <ProtectedRoute>
        <CanvasPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/workspace/:id',
    element: (
      <ProtectedRoute>
        <WorkspacePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/viewpoint/:id',
    element: (
      <ProtectedRoute>
        <ViewpointPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

/**
 * Router component
 */
export function AppRouter() {
  return <RouterProvider router={router} />
}
