/**
 * Feature Error Fallback
 *
 * Displayed when an error occurs in a specific feature
 * Less intrusive than global error, allows rest of app to continue working
 */

interface FeatureErrorFallbackProps {
  error: Error;
  featureName: string;
  resetError: () => void;
}

/**
 * Feature-level error fallback component
 */
export function FeatureErrorFallback({
  error,
  featureName,
  resetError,
}: FeatureErrorFallbackProps) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 m-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-yellow-600"
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
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-semibold text-yellow-900">
            {featureName} Error
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            This feature encountered an error and could not be displayed.
          </p>
          <div className="mt-3 bg-yellow-100 rounded p-3">
            <p className="text-xs font-mono text-yellow-800 break-all">
              {error.message}
            </p>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={resetError}
              className="text-sm bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
