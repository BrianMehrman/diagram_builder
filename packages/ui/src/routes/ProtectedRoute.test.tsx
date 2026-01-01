/**
 * ProtectedRoute Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter, Routes, Route } from 'react-router'
import { ProtectedRoute } from './ProtectedRoute'
import * as auth from '../shared/api/auth'

vi.mock('../shared/api/auth')

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children when authenticated', () => {
    vi.mocked(auth.isAuthenticated).mockReturnValue(true)

    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    )

    expect(screen.getByText('Protected Content')).toBeTruthy()
  })

  it('should redirect to login when not authenticated', () => {
    vi.mocked(auth.isAuthenticated).mockReturnValue(false)

    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </BrowserRouter>
    )

    expect(screen.getByText('Login Page')).toBeTruthy()
    expect(screen.queryByText('Protected Content')).toBeNull()
  })
})
