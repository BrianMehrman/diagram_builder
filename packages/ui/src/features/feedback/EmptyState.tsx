/**
 * EmptyState Component
 *
 * Displayed when no codebase is loaded. Provides a welcoming first-visit experience
 * with clear call-to-action to import a codebase.
 *
 * Per UX Design Specification:
 * - Large icon (3D cube or upload illustration)
 * - Headline: "Start exploring your codebase in 3D"
 * - Subheading: "Import a repository to visualize its architecture"
 * - Primary button: "Import Codebase"
 * - Inviting tone (not intimidating)
 */

interface EmptyStateProps {
  onImportClick?: () => void;
}

export function EmptyState({ onImportClick }: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state-container"
      className="absolute inset-0 flex items-center justify-center bg-gray-900"
    >
      <div className="text-center max-w-lg px-6">
        {/* Icon - 3D Cube */}
        <div data-testid="empty-state-icon" className="mb-8">
          <svg
            className="w-24 h-24 mx-auto text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {/* 3D Cube icon */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 16.5V7.875a.375.375 0 0 0-.187-.325l-8.25-4.714a.375.375 0 0 0-.376 0L4.187 7.55A.375.375 0 0 0 4 7.875V16.5m17 0-.188.075-8.25 4.714a.375.375 0 0 1-.374 0l-8.25-4.714L4 16.5m17 0-8.438-4.812M4 16.5l8.438-4.812m0 0L12 7.125m.438 4.563L21 7.125M12.438 11.688L4 7.125"
            />
          </svg>
        </div>

        {/* Headline */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Start exploring your codebase in 3D
        </h1>

        {/* Subheading */}
        <p className="text-gray-400 text-lg mb-8 leading-relaxed">
          Import a repository to visualize its architecture, understand dependencies, and navigate
          code spatially.
        </p>

        {/* Primary CTA Button */}
        {onImportClick && (
          <button
            type="button"
            onClick={onImportClick}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg transition-colors shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Import Codebase
          </button>
        )}

        {/* Supported sources */}
        <div className="mt-12 text-sm text-gray-500">
          <p className="mb-2">Supported sources:</p>
          <div className="flex justify-center gap-6">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 3h18v18H3V3zm16.5 16.5v-12h-15v12h15zM6 13.5h3v3H6v-3zm4.5 0h7.5v3H10.5v-3zM6 9h12v3H6V9z" />
              </svg>
              Local Directory
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
