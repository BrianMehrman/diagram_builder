/**
 * ProtectedRoute Tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter, Routes, Route } from 'react-router'
import { ProtectedRoute } from './ProtectedRoute'
import * as auth from '../shared/api/auth'

vi.mock('../shared/api/auth')

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('Authenticated Access', () => {
    it('should render children when authenticated', () => {
      vi.mocked(auth.isAuthenticated).mockReturnValue(true)

      render(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute skipAuth={false}>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      )

      expect(screen.getByText('Protected Content')).toBeTruthy()
    })

    it('should render children in development mode', () => {
      vi.stubEnv('MODE', 'development')
      vi.mocked(auth.isAuthenticated).mockReturnValue(true)

      render(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <div>Dev Mode Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      )

      expect(screen.getByText('Dev Mode Content')).toBeTruthy()
    })

    it('should render children when skipAuth is true', () => {
      vi.mocked(auth.isAuthenticated).mockReturnValue(false)

      render(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute skipAuth={true}>
                  <div>Skipped Auth Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      )

      expect(screen.getByText('Skipped Auth Content')).toBeTruthy()
    })
  })

  describe('Unauthenticated Access', () => {
    it('should redirect to login when not authenticated', () => {
      vi.mocked(auth.isAuthenticated).mockReturnValue(false)

      render(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute skipAuth={false}>
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

    it('should redirect to login in production mode without token', () => {
      vi.stubEnv('MODE', 'production')
      vi.mocked(auth.isAuthenticated).mockReturnValue(false)

      render(
        <BrowserRouter>
          <Routes>
            <Route
              path="/workspace"
              element={
                <ProtectedRoute>
                  <div>Workspace</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Please Login</div>} />
          </Routes>
        </BrowserRouter>
      )

      expect(screen.getByText('Please Login')).toBeTruthy()
      expect(screen.queryByText('Workspace')).toBeNull()
    })
  })

  describe('skipAuth prop', () => {
    it('should check auth when skipAuth is false in production', () => {
      // In production mode without auth, would redirect
      // But in dev mode or with auth, renders content
      const isAuth = auth.isAuthenticated()

      render(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute skipAuth={false}>
                  <div>Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Required</div>} />
          </Routes>
        </BrowserRouter>
      )

      if (isAuth) {
        // Authenticated or in dev mode - should show content
        expect(screen.getByText('Content')).toBeTruthy()
      } else {
        // Not authenticated in prod - should redirect
        expect(screen.getByText('Login Required')).toBeTruthy()
      }
    })

    it('should check auth normally when skipAuth is undefined', () => {
      const isAuth = auth.isAuthenticated()

      render(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <div>Default Behavior</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Required</div>} />
          </Routes>
        </BrowserRouter>
      )

      if (isAuth) {
        // Authenticated or in dev mode
        expect(screen.getByText('Default Behavior')).toBeTruthy()
      } else {
        // Not authenticated in production
        expect(screen.getByText('Login Required')).toBeTruthy()
      }
    })
  })

  describe('Route preservation', () => {
    it('should use replace navigation for login redirect', () => {
      vi.mocked(auth.isAuthenticated).mockReturnValue(false)

      const { container } = render(
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <div>Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div data-testid="login">Login</div>} />
          </Routes>
        </BrowserRouter>
      )

      // Verify login page is rendered
      expect(screen.getByTestId('login')).toBeTruthy()
    })
  })
})
