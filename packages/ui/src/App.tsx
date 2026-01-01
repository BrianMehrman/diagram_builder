/**
 * App Root Component
 */

import { Suspense } from 'react'
import { ErrorBoundary, GlobalErrorFallback } from './shared/components'
import { AppRouter } from './routes'

function App() {
  return (
    <ErrorBoundary
      fallback={(error, resetError) => (
        <GlobalErrorFallback error={error} resetError={resetError} />
      )}
      onError={(error, errorInfo) => {
        // Log to console in development
        console.error('Global error:', error, errorInfo)

        // In production, you would send to error tracking service
        // Example: Sentry.captureException(error, { extra: errorInfo });
      }}
    >
      <Suspense
        fallback={
          <div className="h-screen flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              <p className="mt-4 text-white">Loading...</p>
            </div>
          </div>
        }
      >
        <AppRouter />
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
