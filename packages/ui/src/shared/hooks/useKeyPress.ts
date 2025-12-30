/**
 * useKeyPress Hook
 *
 * Detects when a specific key or key combination is pressed
 */

import { useEffect, useState } from 'react';

/**
 * Key combination
 */
export interface KeyCombination {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
}

/**
 * Check if a key combination matches the event
 */
function matchesKeyCombination(
  event: KeyboardEvent,
  combination: KeyCombination
): boolean {
  return (
    event.key === combination.key &&
    !!event.ctrlKey === !!combination.ctrl &&
    !!event.shiftKey === !!combination.shift &&
    !!event.altKey === !!combination.alt &&
    !!event.metaKey === !!combination.meta
  );
}

/**
 * Detect key press
 *
 * @param targetKey - Key or key combination to detect
 * @returns Whether the key is currently pressed
 */
export function useKeyPress(
  targetKey: string | KeyCombination
): boolean {
  const [keyPressed, setKeyPressed] = useState(false);

  useEffect(() => {
    const downHandler = (event: KeyboardEvent) => {
      const matches =
        typeof targetKey === 'string'
          ? event.key === targetKey
          : matchesKeyCombination(event, targetKey);

      if (matches) {
        setKeyPressed(true);
      }
    };

    const upHandler = (event: KeyboardEvent) => {
      const matches =
        typeof targetKey === 'string'
          ? event.key === targetKey
          : matchesKeyCombination(event, targetKey);

      if (matches) {
        setKeyPressed(false);
      }
    };

    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [targetKey]);

  return keyPressed;
}
