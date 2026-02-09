/**
 * View Transition Utilities
 *
 * Pure math functions for view mode transitions.
 * Extracted for testability without React Three Fiber dependencies.
 */

/**
 * Cubic ease-in-out function for smooth transition feel.
 * Slow at start and end, fast in the middle.
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Wall opacity during building → cell transition.
 * Walls start at 0.08 opacity and dissolve to 0.
 */
export function computeWallOpacity(progress: number): number {
  return Math.max(0, 0.08 * (1 - progress));
}

/**
 * Membrane opacity during building → cell transition.
 * Membrane fades in from 0 to 0.1.
 */
export function computeMembraneOpacity(progress: number): number {
  return 0.1 * progress;
}

/**
 * Organelle opacity during building → cell transition.
 * Organelles fade in from 0 to their target opacity (0.85).
 */
export function computeOrganelleOpacity(progress: number): number {
  return 0.85 * progress;
}

/**
 * Step the transition progress toward a target value.
 * Returns the new progress value, snapping to target when close.
 *
 * @param current - Current progress (0..1)
 * @param target - Target progress (0 or 1)
 * @param delta - Frame delta time in seconds
 * @param duration - Total transition duration in seconds
 * @returns New progress value
 */
export function stepProgress(
  current: number,
  target: number,
  delta: number,
  duration: number
): number {
  const speed = 1 / duration;
  const step = speed * delta;

  let next: number;
  if (current < target) {
    next = Math.min(current + step, target);
  } else {
    next = Math.max(current - step, target);
  }

  // Snap when very close to avoid floating point drift
  if (Math.abs(next - target) < 0.01) {
    return target;
  }

  return next;
}
