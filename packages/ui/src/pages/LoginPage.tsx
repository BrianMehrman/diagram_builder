/**
 * Login Page
 *
 * User authentication page
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { auth, setToken } from '../shared/api'
import { getErrorMessage } from '../shared/api/errors'
import { isDevModeAuth } from '../shared/api/auth'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const devMode = isDevModeAuth()

  // If in dev mode, show helpful message
  useEffect(() => {
    if (devMode) {
      console.warn('🔓 Development Mode: Auto-authenticated as dev-user')
    }
  }, [devMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      setError('Please enter email and password')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await auth.login({ email, password })
      setToken(response.token)

      navigate('/')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Diagram Builder
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">3D Codebase Visualization Tool</p>
          {devMode && (
            <div className="mt-4 rounded-md bg-blue-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Development Mode</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Authentication is bypassed. You are automatically logged in as{' '}
                      <code className="font-mono bg-blue-100 px-1 rounded">dev-user</code>.
                    </p>
                    <p className="mt-1">
                      Click "Skip Login" below to continue, or test the login flow with real
                      credentials.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {!devMode && (
            <p className="mt-2 text-center text-xs text-gray-500">
              Test credentials: test@example.com / testpassword123
            </p>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            {devMode && (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Skip Login (Development)
              </button>
            )}

            {devMode && (
              <p className="text-xs text-center text-gray-500 mt-2">
                Set <code className="font-mono bg-gray-100 px-1 rounded">VITE_DEV_AUTH=false</code>{' '}
                to disable auto-authentication
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
