/**
 * useGlobalSearchShortcut Hook
 *
 * Global keyboard shortcut hook for opening the search modal with ⌘K (Mac) or Ctrl+K (Windows/Linux)
 */

import { useEffect } from 'react';
import { useSearchStore } from '../../features/navigation/searchStore';

/**
 * Hook to listen for global ⌘K/Ctrl+K keyboard shortcut to open search modal
 *
 * - Prevents default browser behavior (e.g., Cmd+K opens address bar in some browsers)
 * - Ignores shortcuts when typing in input/textarea/contentEditable elements
 * - Cleans up event listener on unmount
 */
export function useGlobalSearchShortcut(): void {
  const openSearch = useSearchStore((state) => state.openSearch);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      // Only respond to Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if (!((event.metaKey || event.ctrlKey) && event.key === 'k')) {
        return;
      }

      // Don't trigger if user is typing in input/textarea/contentEditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      // Prevent default browser behavior (e.g., open address bar)
      event.preventDefault();

      // Open the search modal
      openSearch();
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openSearch]);
}
