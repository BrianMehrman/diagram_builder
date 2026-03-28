/**
 * App Root Component
 */

import { Suspense } from 'react'
import { ErrorBoundary, GlobalErrorFallback, KeyboardShortcutsModal } from './shared/components'
import { AppRouter } from './routes'
import { ToastProvider } from './features/feedback'

function App() {
  return (
    <ErrorBoundary
      fallback={(error, resetError) => (
        <GlobalErrorFallback error={error} resetError={resetError} />
      )}
      onError={(error, errorInfo) => {
        // Send to API log endpoint so errors appear in Loki alongside API logs.
        // Fire-and-forget — swallow any POST failure silently.
        fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level: 'error',
            message: error.message,
            context: { componentStack: errorInfo.componentStack },
          }),
        }).catch(() => undefined)
      }}
    >
      <ToastProvider>
        {/* Skip Links for keyboard navigation */}
        <a href="#main-content" className="skip-link">
          Skip to canvas
        </a>
        <a href="#search" className="skip-link">
          Skip to search
        </a>

        <Suspense
          fallback={
            <div
              className="h-screen flex items-center justify-center bg-gray-900"
              role="status"
              aria-label="Loading application"
            >
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                <p className="mt-4 text-white">Loading...</p>
              </div>
            </div>
          }
        >
          <AppRouter />
        </Suspense>
        {/* Global Keyboard Shortcuts Help Modal (Press ? to open) */}
        <KeyboardShortcutsModal />
      </ToastProvider>
    </ErrorBoundary>
  )
}

export default App
