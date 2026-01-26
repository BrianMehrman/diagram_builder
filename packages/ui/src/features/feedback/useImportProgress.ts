/**
 * useImportProgress Hook
 *
 * Polls the API for codebase import status and provides
 * progress tracking for the ImportProgress component.
 *
 * Per UX Design Specification:
 * - Updates every 2 seconds
 * - Tracks stages: cloning (0-30%), parsing (30-70%), building (70-100%)
 * - Calls onComplete when import finishes
 * - Calls onError when import fails
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { codebases } from '../../shared/api/endpoints';

/** Import stage */
type ImportStage = 'pending' | 'processing' | 'complete' | 'failed';

/** Hook options */
interface UseImportProgressOptions {
  /** Workspace ID */
  workspaceId: string;
  /** Codebase ID to track (null to disable) */
  codebaseId: string | null;
  /** Whether polling is enabled */
  enabled: boolean;
  /** Polling interval in ms (default: 2000) */
  pollInterval?: number;
  /** Callback when import completes */
  onComplete?: (repositoryId: string) => void;
  /** Callback when import fails */
  onError?: (error: string) => void;
}

/** Hook return value */
interface UseImportProgressReturn {
  /** Progress percentage (0-100) */
  progress: number;
  /** Current status message */
  status: string;
  /** Current import stage */
  stage: ImportStage;
  /** Whether import is complete */
  isComplete: boolean;
  /** Whether import failed */
  isError: boolean;
  /** Error message if failed */
  error: string | null;
  /** Repository ID when complete */
  repositoryId: string | null;
  /** Cancel the import tracking */
  cancel: () => void;
}

/**
 * Map API status to progress percentage and stage
 */
function mapStatusToProgress(status: string): { progress: number; stage: ImportStage; statusText: string } {
  switch (status) {
    case 'pending':
      return { progress: 5, stage: 'pending', statusText: 'Initializing import...' };
    case 'processing':
      return { progress: 50, stage: 'processing', statusText: 'Parsing codebase...' };
    case 'completed':
      return { progress: 100, stage: 'complete', statusText: 'Import complete!' };
    case 'failed':
      return { progress: 0, stage: 'failed', statusText: 'Import failed' };
    default:
      return { progress: 0, stage: 'pending', statusText: '' };
  }
}

/**
 * Hook to track codebase import progress
 */
export function useImportProgress({
  workspaceId,
  codebaseId,
  enabled,
  pollInterval = 2000,
  onComplete,
  onError,
}: UseImportProgressOptions): UseImportProgressReturn {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [stage, setStage] = useState<ImportStage>('pending');
  const [error, setError] = useState<string | null>(null);
  const [repositoryId, setRepositoryId] = useState<string | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);

  // Refs for callbacks to avoid stale closures
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  onCompleteRef.current = onComplete;
  onErrorRef.current = onError;

  // Track if we've already called callbacks
  const completedRef = useRef(false);
  const erroredRef = useRef(false);

  const isComplete = stage === 'complete';
  const isError = stage === 'failed';

  // Reset state when codebaseId changes to null
  useEffect(() => {
    if (codebaseId === null) {
      setProgress(0);
      setStatus('');
      setStage('pending');
      setError(null);
      setRepositoryId(null);
      setIsCancelled(false);
      completedRef.current = false;
      erroredRef.current = false;
    }
  }, [codebaseId]);

  // Polling effect
  useEffect(() => {
    if (!enabled || !codebaseId || isCancelled) {
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let mounted = true;

    const poll = async () => {
      if (!mounted || isCancelled) return;

      try {
        const codebase = await codebases.get(workspaceId, codebaseId);

        if (!mounted || isCancelled) return;

        const { progress: mappedProgress, stage: mappedStage, statusText } = mapStatusToProgress(codebase.status);

        setProgress(mappedProgress);
        setStage(mappedStage);
        setStatus(statusText);

        if (codebase.status === 'completed' && codebase.repositoryId) {
          setRepositoryId(codebase.repositoryId);

          // Call onComplete callback once
          if (!completedRef.current && onCompleteRef.current) {
            completedRef.current = true;
            onCompleteRef.current(codebase.repositoryId);
          }

          // Stop polling
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }

        if (codebase.status === 'failed') {
          const errorMsg = codebase.error || 'Unknown error';
          setError(errorMsg);

          // Call onError callback once
          if (!erroredRef.current && onErrorRef.current) {
            erroredRef.current = true;
            onErrorRef.current(errorMsg);
          }

          // Stop polling
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      } catch (err) {
        if (!mounted || isCancelled) return;

        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        setStage('failed');

        // Call onError callback once
        if (!erroredRef.current && onErrorRef.current) {
          erroredRef.current = true;
          onErrorRef.current(errorMsg);
        }

        // Stop polling on error
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    };

    // Initial poll
    poll();

    // Start interval polling
    intervalId = setInterval(poll, pollInterval);

    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [workspaceId, codebaseId, enabled, pollInterval, isCancelled]);

  const cancel = useCallback(() => {
    setIsCancelled(true);
  }, []);

  return {
    progress,
    status,
    stage,
    isComplete,
    isError,
    error,
    repositoryId,
    cancel,
  };
}
