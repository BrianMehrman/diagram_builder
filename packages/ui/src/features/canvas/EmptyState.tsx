/**
 * Empty State Component
 *
 * Displayed when no codebase is loaded or graph is empty
 */

interface EmptyStateProps {
  onImportClick?: () => void
}

export function EmptyState({ onImportClick }: EmptyStateProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
      <div className="text-center max-w-md px-6">
        {/* Icon */}
        <div className="mb-6">
          <svg
            className="w-24 h-24 mx-auto text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>

        {/* Message */}
        <h2 className="text-2xl font-bold text-white mb-3">No Codebase Loaded</h2>
        <p className="text-gray-400 mb-8">
          Import a codebase to see a 3D visualization of your code structure, dependencies, and
          relationships.
        </p>

        {/* Action Button */}
        {onImportClick && (
          <button
            onClick={onImportClick}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Import Codebase
          </button>
        )}

        {/* Help Text */}
        <div className="mt-8 text-sm text-gray-500">
          <p>Supported sources:</p>
          <ul className="mt-2 space-y-1">
            <li>• Local directories</li>
            <li>• Git repositories (GitHub, GitLab, etc.)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
