/**
 * Canvas Feature Error Fallback
 *
 * Example of feature-level error boundary fallback
 */

import { FeatureErrorFallback } from '../../shared/components';

interface CanvasErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

/**
 * Canvas-specific error fallback
 * Wraps the shared FeatureErrorFallback with canvas-specific feature name
 */
export function CanvasErrorFallback({
  error,
  resetError,
}: CanvasErrorFallbackProps) {
  return (
    <FeatureErrorFallback
      error={error}
      featureName="Canvas"
      resetError={resetError}
    />
  );
}
