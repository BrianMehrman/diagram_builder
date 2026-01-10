/**
 * Codebase Status Indicator
 *
 * Shows parsing/processing status for codebases being imported
 */

interface CodebaseStatusIndicatorProps {
  status: 'pending' | 'processing' | 'completed' | 'failed'
  message?: string
}

export function CodebaseStatusIndicator({ status, message }: CodebaseStatusIndicatorProps) {
  if (status === 'completed') {
    return null // Don't show indicator when completed
  }

  const statusConfig = {
    pending: {
      color: 'bg-yellow-500',
      icon: (
        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      ),
      text: message || 'Preparing to parse codebase...',
    },
    processing: {
      color: 'bg-blue-500',
      icon: (
        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ),
      text: message || 'Parsing codebase and building graph...',
    },
    failed: {
      color: 'bg-red-500',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      text: message || 'Failed to parse codebase',
    },
  }

  const config = statusConfig[status]

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl px-4 py-3 flex items-center gap-3 min-w-[320px]">
        {/* Status Icon */}
        <div className={`flex-shrink-0 w-10 h-10 ${config.color} rounded-full flex items-center justify-center text-white`}>
          {config.icon}
        </div>

        {/* Status Text */}
        <div className="flex-1">
          <p className="text-white text-sm font-medium">{config.text}</p>
          {status === 'processing' && (
            <p className="text-gray-400 text-xs mt-0.5">This may take a few seconds...</p>
          )}
        </div>
      </div>
    </div>
  )
}
