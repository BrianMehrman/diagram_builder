/**
 * useLocalStorage Hook
 *
 * IMPORTANT: Do NOT use this for authentication tokens.
 * Tokens must be stored in memory only for security.
 *
 * This hook is for non-sensitive user preferences only.
 */

import { useState, useEffect } from 'react';

/**
 * Store and retrieve non-sensitive data from localStorage
 *
 * @param key - Storage key
 * @param initialValue - Initial value if no stored value exists
 * @returns Tuple of [value, setValue]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  // Get initial value from localStorage or use default
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when value changes
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`Error writing localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
