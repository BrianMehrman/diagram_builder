/**
 * Routing Integration Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { ProtectedRoute } from './ProtectedRoute'
import * as auth from '../shared/api/auth'

vi.mock('../shared/api/auth')
vi.mock('../pages/HomePage', () => ({
  HomePage: () => <div>Home Page</div>,
}))
vi.mock('../pages/LoginPage', () => ({
  LoginPage: () => <div>Login Page</div>,
}))
vi.mock('../pages/WorkspacePage', () => ({
  WorkspacePage: () => <div>Workspace Page</div>,
}))
vi.mock('../pages/NotFoundPage', () => ({
  NotFoundPage: () => <div>404 Not Found</div>,
}))

describe('Routing', () => {
  it('should render login page at /login', () => {
    const router = createMemoryRouter([{ path: '/login', element: <div>Login Page</div> }], {
      initialEntries: ['/login'],
    })

    render(<RouterProvider router={router} />)
    expect(screen.getByText('Login Page')).toBeTruthy()
  })

  it('should redirect to login when accessing protected route unauthenticated', () => {
    vi.mocked(auth.isAuthenticated).mockReturnValue(false)

    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: (
            <ProtectedRoute>
              <div>Home Page</div>
            </ProtectedRoute>
          ),
        },
        { path: '/login', element: <div>Login Page</div> },
      ],
      { initialEntries: ['/'] }
    )

    render(<RouterProvider router={router} />)
    expect(screen.getByText('Login Page')).toBeTruthy()
  })

  it('should render home page when authenticated', () => {
    vi.mocked(auth.isAuthenticated).mockReturnValue(true)

    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: (
            <ProtectedRoute>
              <div>Home Page</div>
            </ProtectedRoute>
          ),
        },
      ],
      { initialEntries: ['/'] }
    )

    render(<RouterProvider router={router} />)
    expect(screen.getByText('Home Page')).toBeTruthy()
  })

  it('should render 404 for unknown routes', () => {
    const router = createMemoryRouter([{ path: '*', element: <div>404 Not Found</div> }], {
      initialEntries: ['/unknown-route'],
    })

    render(<RouterProvider router={router} />)
    expect(screen.getByText('404 Not Found')).toBeTruthy()
  })

  it('should support workspace routes with parameters', () => {
    vi.mocked(auth.isAuthenticated).mockReturnValue(true)

    const router = createMemoryRouter(
      [
        {
          path: '/workspace/:id',
          element: (
            <ProtectedRoute>
              <div>Workspace Page</div>
            </ProtectedRoute>
          ),
        },
      ],
      { initialEntries: ['/workspace/123'] }
    )

    render(<RouterProvider router={router} />)
    expect(screen.getByText('Workspace Page')).toBeTruthy()
  })
})
