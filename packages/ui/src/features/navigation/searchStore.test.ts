/**
 * Search Store Tests
 *
 * Tests for useSearchStore - Zustand store for SearchBarModal state
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useSearchStore } from './searchStore';

describe('useSearchStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useSearchStore.getState().resetSearch();
    useSearchStore.getState().closeSearch();
    useSearchStore.getState().clearHistory();
  });

  describe('initial state', () => {
    it('has correct initial state', () => {
      const state = useSearchStore.getState();

      expect(state.isOpen).toBe(false);
      expect(state.query).toBe('');
      expect(state.results).toEqual([]);
      expect(state.selectedIndex).toBe(-1);
      expect(state.searchHistory).toEqual([]);
    });
  });

  describe('openSearch action', () => {
    it('sets isOpen to true', () => {
      useSearchStore.getState().openSearch();

      expect(useSearchStore.getState().isOpen).toBe(true);
    });
  });

  describe('closeSearch action', () => {
    it('sets isOpen to false and resets state', () => {
      // First open and set some state
      useSearchStore.getState().openSearch();
      useSearchStore.getState().setQuery('test query');
      useSearchStore.getState().setResults([
        {
          id: 'node-1',
          type: 'file',
          label: 'TestFile.ts',
          metadata: {},
          lod: 1,
        },
      ]);

      // Close search
      useSearchStore.getState().closeSearch();

      const state = useSearchStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.query).toBe('');
      expect(state.results).toEqual([]);
      expect(state.selectedIndex).toBe(-1);
    });
  });

  describe('setQuery action', () => {
    it('sets query and resets selectedIndex', () => {
      useSearchStore.getState().setQuery('auth');

      const state = useSearchStore.getState();
      expect(state.query).toBe('auth');
      expect(state.selectedIndex).toBe(-1);
    });

    it('can set empty query', () => {
      useSearchStore.getState().setQuery('auth');
      useSearchStore.getState().setQuery('');

      expect(useSearchStore.getState().query).toBe('');
    });
  });

  describe('setResults action', () => {
    it('sets results and selects first item', () => {
      const mockResults = [
        {
          id: 'node-1',
          type: 'file' as const,
          label: 'AuthService.ts',
          metadata: {},
          lod: 1,
        },
        {
          id: 'node-2',
          type: 'class' as const,
          label: 'AuthController',
          metadata: {},
          lod: 1,
        },
      ];

      useSearchStore.getState().setResults(mockResults);

      const state = useSearchStore.getState();
      expect(state.results).toEqual(mockResults);
      expect(state.selectedIndex).toBe(0);
    });

    it('sets selectedIndex to -1 when results are empty', () => {
      // First set some results
      useSearchStore.getState().setResults([
        {
          id: 'node-1',
          type: 'file',
          label: 'File.ts',
          metadata: {},
          lod: 1,
        },
      ]);

      // Then set empty results
      useSearchStore.getState().setResults([]);

      const state = useSearchStore.getState();
      expect(state.results).toEqual([]);
      expect(state.selectedIndex).toBe(-1);
    });
  });

  describe('selectNext action', () => {
    const mockResults = [
      { id: 'node-1', type: 'file' as const, label: 'File1', metadata: {}, lod: 1 },
      { id: 'node-2', type: 'file' as const, label: 'File2', metadata: {}, lod: 1 },
      { id: 'node-3', type: 'file' as const, label: 'File3', metadata: {}, lod: 1 },
    ];

    it('increments selectedIndex', () => {
      useSearchStore.getState().setResults(mockResults);
      expect(useSearchStore.getState().selectedIndex).toBe(0);

      useSearchStore.getState().selectNext();
      expect(useSearchStore.getState().selectedIndex).toBe(1);

      useSearchStore.getState().selectNext();
      expect(useSearchStore.getState().selectedIndex).toBe(2);
    });

    it('wraps around to first item', () => {
      useSearchStore.getState().setResults(mockResults);
      useSearchStore.getState().selectNext(); // 1
      useSearchStore.getState().selectNext(); // 2
      useSearchStore.getState().selectNext(); // Should wrap to 0

      expect(useSearchStore.getState().selectedIndex).toBe(0);
    });

    it('does nothing when results are empty', () => {
      useSearchStore.getState().setResults([]);
      useSearchStore.getState().selectNext();

      expect(useSearchStore.getState().selectedIndex).toBe(-1);
    });
  });

  describe('selectPrevious action', () => {
    const mockResults = [
      { id: 'node-1', type: 'file' as const, label: 'File1', metadata: {}, lod: 1 },
      { id: 'node-2', type: 'file' as const, label: 'File2', metadata: {}, lod: 1 },
      { id: 'node-3', type: 'file' as const, label: 'File3', metadata: {}, lod: 1 },
    ];

    it('decrements selectedIndex', () => {
      useSearchStore.getState().setResults(mockResults);
      useSearchStore.getState().selectByIndex(2);

      useSearchStore.getState().selectPrevious();
      expect(useSearchStore.getState().selectedIndex).toBe(1);

      useSearchStore.getState().selectPrevious();
      expect(useSearchStore.getState().selectedIndex).toBe(0);
    });

    it('wraps around to last item', () => {
      useSearchStore.getState().setResults(mockResults);
      // selectedIndex starts at 0 after setResults
      useSearchStore.getState().selectPrevious(); // Should wrap to 2

      expect(useSearchStore.getState().selectedIndex).toBe(2);
    });

    it('does nothing when results are empty', () => {
      useSearchStore.getState().setResults([]);
      useSearchStore.getState().selectPrevious();

      expect(useSearchStore.getState().selectedIndex).toBe(-1);
    });
  });

  describe('selectFirst action', () => {
    const mockResults = [
      { id: 'node-1', type: 'file' as const, label: 'File1', metadata: {}, lod: 1 },
      { id: 'node-2', type: 'file' as const, label: 'File2', metadata: {}, lod: 1 },
    ];

    it('sets selectedIndex to 0', () => {
      useSearchStore.getState().setResults(mockResults);
      useSearchStore.getState().selectByIndex(1);

      useSearchStore.getState().selectFirst();

      expect(useSearchStore.getState().selectedIndex).toBe(0);
    });
  });

  describe('selectLast action', () => {
    const mockResults = [
      { id: 'node-1', type: 'file' as const, label: 'File1', metadata: {}, lod: 1 },
      { id: 'node-2', type: 'file' as const, label: 'File2', metadata: {}, lod: 1 },
      { id: 'node-3', type: 'file' as const, label: 'File3', metadata: {}, lod: 1 },
    ];

    it('sets selectedIndex to last item', () => {
      useSearchStore.getState().setResults(mockResults);

      useSearchStore.getState().selectLast();

      expect(useSearchStore.getState().selectedIndex).toBe(2);
    });

    it('handles empty results', () => {
      useSearchStore.getState().setResults([]);

      useSearchStore.getState().selectLast();

      expect(useSearchStore.getState().selectedIndex).toBe(-1);
    });
  });

  describe('selectByIndex action', () => {
    const mockResults = [
      { id: 'node-1', type: 'file' as const, label: 'File1', metadata: {}, lod: 1 },
      { id: 'node-2', type: 'file' as const, label: 'File2', metadata: {}, lod: 1 },
    ];

    it('sets selectedIndex to specified value', () => {
      useSearchStore.getState().setResults(mockResults);

      useSearchStore.getState().selectByIndex(1);

      expect(useSearchStore.getState().selectedIndex).toBe(1);
    });
  });

  describe('search history', () => {
    it('adds query to search history', () => {
      useSearchStore.getState().addToHistory('auth');

      expect(useSearchStore.getState().searchHistory).toEqual(['auth']);
    });

    it('keeps only last 5 queries', () => {
      useSearchStore.getState().addToHistory('query1');
      useSearchStore.getState().addToHistory('query2');
      useSearchStore.getState().addToHistory('query3');
      useSearchStore.getState().addToHistory('query4');
      useSearchStore.getState().addToHistory('query5');
      useSearchStore.getState().addToHistory('query6');

      const history = useSearchStore.getState().searchHistory;
      expect(history).toHaveLength(5);
      expect(history[0]).toBe('query6'); // Most recent first
      expect(history[4]).toBe('query2'); // query1 was removed
    });

    it('deduplicates queries and moves to front', () => {
      useSearchStore.getState().addToHistory('query1');
      useSearchStore.getState().addToHistory('query2');
      useSearchStore.getState().addToHistory('query1'); // Duplicate

      const history = useSearchStore.getState().searchHistory;
      expect(history).toEqual(['query1', 'query2']);
    });

    it('clears search history', () => {
      useSearchStore.getState().addToHistory('query1');
      useSearchStore.getState().addToHistory('query2');

      useSearchStore.getState().clearHistory();

      expect(useSearchStore.getState().searchHistory).toEqual([]);
    });
  });

  describe('resetSearch action', () => {
    it('resets query, results, and selectedIndex but keeps isOpen and history', () => {
      useSearchStore.getState().openSearch();
      useSearchStore.getState().setQuery('test');
      useSearchStore.getState().setResults([
        { id: 'node-1', type: 'file', label: 'File1', metadata: {}, lod: 1 },
      ]);
      useSearchStore.getState().addToHistory('previous');

      useSearchStore.getState().resetSearch();

      const state = useSearchStore.getState();
      expect(state.query).toBe('');
      expect(state.results).toEqual([]);
      expect(state.selectedIndex).toBe(-1);
      expect(state.isOpen).toBe(true); // Unchanged
      expect(state.searchHistory).toEqual(['previous']); // Unchanged
    });
  });
});
