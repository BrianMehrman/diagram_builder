/**
 * Success Notification
 *
 * Shows success messages (e.g., graph loaded)
 */

interface SuccessNotificationProps {
  message: string
  onDismiss?: () => void
  autoHide?: boolean
}

export function SuccessNotification({ message, onDismiss, autoHide = true }: SuccessNotificationProps) {
  // Auto-hide after 3 seconds if enabled
  if (autoHide && onDismiss) {
    setTimeout(onDismiss, 3000)
  }

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-green-900/90 border border-green-700 rounded-lg shadow-xl px-4 py-3 flex items-center gap-3 min-w-[320px]">
        {/* Success Icon */}
        <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Success Text */}
        <div className="flex-1">
          <p className="text-white text-sm font-medium">{message}</p>
        </div>

        {/* Dismiss Button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-green-800 rounded text-white transition-colors"
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
  )
}
