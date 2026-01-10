/**
 * Error Notification
 *
 * Shows error messages with optional retry action
 */

interface ErrorNotificationProps {
  message: string
  onRetry?: () => void
  onDismiss?: () => void
}

export function ErrorNotification({ message, onRetry, onDismiss }: ErrorNotificationProps) {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-red-900/90 border border-red-700 rounded-lg shadow-xl px-4 py-3 flex items-center gap-3 min-w-[320px] max-w-md">
        {/* Error Icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Error Text */}
        <div className="flex-1">
          <p className="text-white text-sm font-medium">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded transition-colors"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-red-800 rounded text-white transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
