/**
 * Spinner Component
 *
 * Loading spinner with three sizes for different contexts:
 * - sm (20px): Inline loading indicators
 * - md (40px): Modal loading states (default)
 * - lg (60px): Canvas overlay loading
 *
 * Per UX Design Specification:
 * - Blue accent color (#3b82f6)
 * - CSS animation for rotation
 * - Accessible with role="status" and aria-label
 */

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-5 h-5 border-2',
  md: 'w-10 h-10 border-4',
  lg: 'w-15 h-15 border-4',
};

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`${sizeClasses[size]} border-gray-300 border-t-blue-500 rounded-full animate-spin ${className}`}
    />
  );
}

/**
 * Loading Overlay Component
 *
 * Full-screen overlay with spinner for canvas/graph loading states.
 * Prevents interaction while loading.
 */
interface LoadingOverlayProps {
  text?: string;
}

export function LoadingOverlay({ text = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div
      data-testid="loading-overlay"
      className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/50 z-50"
    >
      <Spinner size="lg" />
      <p className="mt-4 text-white text-lg">{text}</p>
    </div>
  );
}
