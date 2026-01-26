/**
 * ProgressBar Component
 *
 * Progress indicator for long-running operations like import/parsing.
 *
 * Per UX Design Specification:
 * - 0-100% progress with percentage text
 * - Status message (e.g., "Parsing 342 files...")
 * - Accessible: role="progressbar" with aria-valuenow/min/max
 * - Animated fill transition
 */

interface ProgressBarProps {
  progress: number; // 0-100
  status?: string;
  className?: string;
}

export function ProgressBar({ progress, status, className = '' }: ProgressBarProps) {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div data-testid="progressbar-container" className={className}>
      <div
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${clampedProgress}%`}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
      >
        <div
          data-testid="progress-fill"
          className="h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>

      <div className="flex justify-between items-center mt-2 text-sm">
        {status && <span className="text-gray-600 dark:text-gray-400">{status}</span>}
        <span className="text-gray-500 dark:text-gray-400 ml-auto">{clampedProgress}%</span>
      </div>
    </div>
  );
}
