/**
 * Global Error Fallback
 *
 * Displayed when a critical error occurs at the application level
 */

interface GlobalErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

/**
 * Global error fallback component
 */
export function GlobalErrorFallback({
  error,
  resetError,
}: GlobalErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl p-8">
        <div className="flex items-center mb-6">
          <div className="flex-shrink-0">
            <svg
              className="h-12 w-12 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="ml-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Application Error
            </h1>
            <p className="text-gray-600 mt-1">
              An unexpected error occurred and the application needs to restart
            </p>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-semibold text-red-800 mb-2">
            Error Details
          </h2>
          <p className="text-red-700 font-mono text-sm break-all">
            {error.message}
          </p>
          {error.stack && (
            <details className="mt-3">
              <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                Stack Trace
              </summary>
              <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-48">
                {error.stack}
              </pre>
            </details>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={resetError}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Reload Application
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Go to Home
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            If this problem persists, please contact support or check the{' '}
            <a
              href="https://github.com/diagram-builder/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-600 hover:text-red-800 underline"
            >
              issue tracker
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
