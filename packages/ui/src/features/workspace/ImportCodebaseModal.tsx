/**
 * Import Codebase Modal
 *
 * Modal form for importing codebases (local or Git)
 */

import { useState } from 'react'
import { codebases } from '../../shared/api/endpoints'
import type { CodebaseType, CreateCodebaseRequest } from '../../shared/types/api'

interface ImportCodebaseModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId?: string
  onSuccess?: () => void
}

export function ImportCodebaseModal({
  isOpen,
  onClose,
  workspaceId = 'default',
  onSuccess,
}: ImportCodebaseModalProps) {
  const [type, setType] = useState<CodebaseType>('local')
  const [source, setSource] = useState('')
  const [branch, setBranch] = useState('main')
  const [token, setToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!source.trim()) {
      errors.source = 'Source is required'
    } else if (type === 'git') {
      // Validate Git URL format
      const gitUrlPattern =
        /^(https?:\/\/|git@).+\.git$|^(https?:\/\/)(github|gitlab|bitbucket)\.(com|org)\/.+\/.+/
      if (!gitUrlPattern.test(source)) {
        errors.source = 'Invalid Git repository URL'
      }
    } else if (type === 'local') {
      // Validate local path format (basic check)
      if (source.includes('http://') || source.includes('https://')) {
        errors.source = 'Local path cannot be a URL'
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const request: CreateCodebaseRequest = {
        source: source.trim(),
        type,
        ...(type === 'git' && branch && { branch }),
        ...(token && {
          credentials: {
            type: 'oauth',
            token,
          },
        }),
      }

      await codebases.create(workspaceId, request)

      setSuccess(true)
      setSource('')
      setBranch('main')
      setToken('')

      // Notify parent of success
      if (onSuccess) {
        onSuccess()
      }

      // Close modal after brief success message (3s for better UX and test stability)
      setTimeout(() => {
        onClose()
      }, 3000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import codebase'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setSource('')
      setBranch('main')
      setToken('')
      setShowToken(false)
      setError(null)
      setSuccess(false)
      setValidationErrors({})
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      data-testid="import-codebase-modal"
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-modal-title"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="import-modal-title" className="text-xl font-semibold">
            Import Codebase
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
            data-testid="close-modal-button"
          >
            <span className="sr-only">Close</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center" data-testid="success-message">
            <svg
              className="w-16 h-16 text-green-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="text-lg font-medium text-gray-900">Codebase import started!</p>
            <p className="text-sm text-gray-600 mt-2">Processing in background...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Type Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Source Type</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="local"
                    checked={type === 'local'}
                    onChange={(e) => setType(e.target.value as CodebaseType)}
                    className="mr-2"
                    disabled={isLoading}
                    data-testid="type-local"
                  />
                  Local Path
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="git"
                    checked={type === 'git'}
                    onChange={(e) => setType(e.target.value as CodebaseType)}
                    className="mr-2"
                    disabled={isLoading}
                    data-testid="type-git"
                  />
                  Git Repository
                </label>
              </div>
            </div>

            {/* Source Input */}
            <div className="mb-4">
              <label htmlFor="source" className="block text-sm font-medium text-gray-700 mb-1">
                {type === 'local' ? 'Local Path' : 'Git Repository URL'}
              </label>
              <input
                id="source"
                type="text"
                value={source}
                onChange={(e) => {
                  setSource(e.target.value)
                  setValidationErrors({ ...validationErrors, source: '' })
                }}
                placeholder={
                  type === 'local' ? '/path/to/repository' : 'https://github.com/user/repo.git'
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.source ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
                data-testid="source-input"
              />
              {validationErrors.source && (
                <p className="text-red-500 text-sm mt-1" data-testid="source-error">
                  {validationErrors.source}
                </p>
              )}
            </div>

            {/* Branch Input (Git only) */}
            {type === 'git' && (
              <div className="mb-4">
                <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
                  Branch (optional)
                </label>
                <input
                  id="branch"
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                  data-testid="branch-input"
                />
              </div>
            )}

            {/* Access Token Toggle */}
            {type === 'git' && (
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={showToken}
                    onChange={(e) => {
                      setShowToken(e.target.checked)
                      if (!e.target.checked) {
                        setToken('')
                      }
                    }}
                    className="mr-2"
                    disabled={isLoading}
                    data-testid="show-token-checkbox"
                  />
                  <span className="text-sm text-gray-700">
                    Use access token (for private repositories)
                  </span>
                </label>
              </div>
            )}

            {/* Access Token Input (shown only when checkbox is checked) */}
            {type === 'git' && showToken && (
              <div className="mb-4">
                <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
                  Access Token
                </label>
                <input
                  id="token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                  data-testid="token-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  GitHub: Personal Access Token, GitLab: Access Token
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div
                className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md"
                data-testid="error-message"
              >
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
                data-testid="submit-button"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Importing...
                  </span>
                ) : (
                  'Import'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
