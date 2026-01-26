/**
 * ImportProgress Component
 *
 * Modal dialog showing import progress with progress bar,
 * status text, and optional cancel button.
 *
 * Per UX Design Specification:
 * - Modal with progress bar (0-100%)
 * - Status text updates: "Cloning repository...", "Parsing 342 files...", "Building graph..."
 * - Estimated time remaining (optional)
 * - Cancel button (for operations >30s)
 * - Updates every 2 seconds from API
 * - On complete: modal closes, camera flies to root, success toast
 */

import * as Dialog from '@radix-ui/react-dialog';

interface ImportProgressProps {
  /** Whether the modal is open */
  open: boolean;
  /** Progress value (0-100) */
  progress: number;
  /** Current status message */
  status: string;
  /** Modal title (default: "Importing Codebase") */
  title?: string;
  /** Current stage of import */
  stage?: 'cloning' | 'parsing' | 'building' | 'complete';
  /** Estimated time remaining in milliseconds */
  estimatedTimeRemaining?: number;
  /** Whether to show the cancel button (default: true) */
  showCancel?: boolean;
  /** Callback when cancel is clicked */
  onCancel: () => void;
}

/**
 * Format milliseconds to human-readable time string
 */
function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds} seconds`;
  }
  if (seconds === 0) {
    return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  }
  return `${minutes} minute${minutes > 1 ? 's' : ''} ${seconds} seconds`;
}

export function ImportProgress({
  open,
  progress,
  status,
  title = 'Importing Codebase',
  estimatedTimeRemaining,
  showCancel = true,
  onCancel,
}: ImportProgressProps) {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, progress));

  // Generate unique IDs for accessibility
  const titleId = 'import-progress-title';
  const descriptionId = 'import-progress-description';

  return (
    <Dialog.Root open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className="fixed top-1/4 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg p-6 w-[500px] max-w-[90vw] z-50 shadow-xl"
        >
          {/* Title */}
          <Dialog.Title id={titleId} className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {title}
          </Dialog.Title>

          {/* Description for accessibility */}
          <Dialog.Description id={descriptionId} className="sr-only">
            Import progress: {clampedProgress}% complete. {status}
          </Dialog.Description>

          {/* Progress Bar */}
          <div className="mb-4">
            <div
              role="progressbar"
              aria-valuenow={clampedProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Import progress: ${clampedProgress}%`}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
            >
              <div
                data-testid="progress-fill"
                className="h-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${clampedProgress}%` }}
              />
            </div>
          </div>

          {/* Status Text and Percentage */}
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600 dark:text-gray-400">{status}</p>
            <span className="text-gray-500 dark:text-gray-400 font-medium">{clampedProgress}%</span>
          </div>

          {/* Estimated Time (optional) */}
          {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
              Estimated time remaining: {formatTime(estimatedTimeRemaining)}
            </p>
          )}

          {/* Cancel Button */}
          {showCancel && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm px-4 py-2 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
