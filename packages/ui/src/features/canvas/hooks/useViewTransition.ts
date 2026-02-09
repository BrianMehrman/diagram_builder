/**
 * useViewTransition Hook
 *
 * Manages animated transitions between view modes (building ↔ cell).
 * Uses useFrame for frame-by-frame progress updates.
 * Pure math is delegated to viewTransitionUtils for testability.
 */

import { useState, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { stepProgress } from './viewTransitionUtils';

export interface ViewTransitionState {
  /** Transition progress: 0 = source view, 1 = target view */
  progress: number;
  /** Whether a transition is currently animating */
  isTransitioning: boolean;
  /** Direction of the current transition */
  direction: 'forward' | 'backward';
}

interface UseViewTransitionReturn {
  progress: number;
  isTransitioning: boolean;
  direction: 'forward' | 'backward';
  startForward: () => void;
  startBackward: () => void;
}

/**
 * Hook for animating view mode transitions.
 *
 * @param duration - Transition duration in seconds (default 0.5)
 * @returns Transition state and controls
 */
export function useViewTransition(duration = 0.5): UseViewTransitionReturn {
  const [state, setState] = useState<ViewTransitionState>({
    progress: 0,
    isTransitioning: false,
    direction: 'forward',
  });

  const targetRef = useRef(0);

  const startForward = useCallback(() => {
    targetRef.current = 1;
    setState((prev) => ({
      ...prev,
      isTransitioning: true,
      direction: 'forward',
    }));
  }, []);

  const startBackward = useCallback(() => {
    targetRef.current = 0;
    setState((prev) => ({
      ...prev,
      isTransitioning: true,
      direction: 'backward',
    }));
  }, []);

  useFrame((_, delta) => {
    if (!state.isTransitioning) return;

    setState((prev) => {
      const target = targetRef.current;
      const newProgress = stepProgress(prev.progress, target, delta, duration);
      const done = newProgress === target;

      return {
        progress: newProgress,
        isTransitioning: !done,
        direction: prev.direction,
      };
    });
  });

  return {
    progress: state.progress,
    isTransitioning: state.isTransitioning,
    direction: state.direction,
    startForward,
    startBackward,
  };
}
