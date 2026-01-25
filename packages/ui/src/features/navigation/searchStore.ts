/**
 * Search Store
 *
 * Zustand store for SearchBarModal state management
 */

import { create } from 'zustand';
import type { GraphNode } from '../../shared/types';

/**
 * Search store state and actions
 */
interface SearchStore {
  // State
  isOpen: boolean;
  query: string;
  results: GraphNode[];
  selectedIndex: number;
  searchHistory: string[];

  // Actions (verb-first naming per project-context.md)
  openSearch: () => void;
  closeSearch: () => void;
  setQuery: (query: string) => void;
  setResults: (results: GraphNode[]) => void;
  selectNext: () => void;
  selectPrevious: () => void;
  selectFirst: () => void;
  selectLast: () => void;
  selectByIndex: (index: number) => void;
  addToHistory: (query: string) => void;
  clearHistory: () => void;
  resetSearch: () => void;
}

/**
 * Search store
 */
export const useSearchStore = create<SearchStore>((set) => ({
  // Initial state
  isOpen: false,
  query: '',
  results: [],
  selectedIndex: -1,
  searchHistory: [],

  // Actions
  openSearch: () => set({ isOpen: true }),

  closeSearch: () =>
    set({
      isOpen: false,
      query: '',
      results: [],
      selectedIndex: -1,
    }),

  setQuery: (query) => set({ query, selectedIndex: -1 }),

  setResults: (results) =>
    set({
      results,
      selectedIndex: results.length > 0 ? 0 : -1,
    }),

  selectNext: () =>
    set((state) => ({
      selectedIndex:
        state.results.length > 0
          ? (state.selectedIndex + 1) % state.results.length
          : -1,
    })),

  selectPrevious: () =>
    set((state) => ({
      selectedIndex:
        state.results.length > 0
          ? (state.selectedIndex - 1 + state.results.length) %
            state.results.length
          : -1,
    })),

  selectFirst: () => set({ selectedIndex: 0 }),

  selectLast: () =>
    set((state) => ({
      selectedIndex:
        state.results.length > 0 ? state.results.length - 1 : -1,
    })),

  selectByIndex: (index) => set({ selectedIndex: index }),

  addToHistory: (query) =>
    set((state) => ({
      searchHistory: [
        query,
        ...state.searchHistory.filter((q) => q !== query),
      ].slice(0, 5),
    })),

  clearHistory: () => set({ searchHistory: [] }),

  resetSearch: () =>
    set({
      query: '',
      results: [],
      selectedIndex: -1,
    }),
}));
