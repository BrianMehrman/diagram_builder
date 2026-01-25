/**
 * SearchBarModal Component
 *
 * Modal search interface with Radix UI Dialog, fuzzy autocomplete,
 * and camera flight integration
 */

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useSearchStore } from './searchStore';
import { searchNodes, initializeSearchIndex } from './fuzzySearch';
import { useDebounce } from '../../shared/hooks';
import type { GraphNode, Position3D } from '../../shared/types';

/**
 * Props for SearchBarModal
 */
interface SearchBarModalProps {
  nodes: GraphNode[];
  onNodeSelect: (nodeId: string, position?: Position3D) => void;
}

/**
 * Get icon for node type
 */
function getNodeIcon(type: GraphNode['type']): string {
  switch (type) {
    case 'file':
      return '📄';
    case 'class':
      return '🏛️';
    case 'function':
      return '⚡';
    case 'method':
      return '🔧';
    case 'variable':
      return '📦';
    default:
      return '•';
  }
}

/**
 * SearchBarModal Component
 *
 * A modal dialog for searching code elements with fuzzy matching,
 * keyboard navigation, and camera flight on selection.
 */
export function SearchBarModal({
  nodes,
  onNodeSelect,
}: SearchBarModalProps): React.ReactElement | null {
  const inputRef = useRef<HTMLInputElement>(null);

  // Store state
  const isOpen = useSearchStore((state) => state.isOpen);
  const query = useSearchStore((state) => state.query);
  const results = useSearchStore((state) => state.results);
  const selectedIndex = useSearchStore((state) => state.selectedIndex);

  // Store actions
  const closeSearch = useSearchStore((state) => state.closeSearch);
  const setQuery = useSearchStore((state) => state.setQuery);
  const setResults = useSearchStore((state) => state.setResults);
  const selectNext = useSearchStore((state) => state.selectNext);
  const selectPrevious = useSearchStore((state) => state.selectPrevious);
  const selectFirst = useSearchStore((state) => state.selectFirst);
  const selectLast = useSearchStore((state) => state.selectLast);
  const addToHistory = useSearchStore((state) => state.addToHistory);

  // Debounce query for performance
  const debouncedQuery = useDebounce(query, 50);

  // Initialize search index when nodes change
  useEffect(() => {
    if (nodes.length > 0) {
      initializeSearchIndex(nodes);
    }
  }, [nodes]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      const searchResults = searchNodes(debouncedQuery);
      setResults(searchResults);
    } else {
      setResults([]);
    }
  }, [debouncedQuery, setResults]);

  // Handle node selection
  const handleNodeSelect = useCallback(
    (node: GraphNode) => {
      if (query.trim()) {
        addToHistory(query);
      }
      closeSearch();
      onNodeSelect(node.id, node.position);
    },
    [query, addToHistory, closeSearch, onNodeSelect]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          selectNext();
          break;
        case 'ArrowUp':
          event.preventDefault();
          selectPrevious();
          break;
        case 'Enter':
          event.preventDefault();
          if (results[selectedIndex]) {
            handleNodeSelect(results[selectedIndex]);
          }
          break;
        case 'Home':
          event.preventDefault();
          selectFirst();
          break;
        case 'End':
          event.preventDefault();
          selectLast();
          break;
        // Escape is handled by Radix Dialog
      }
    },
    [
      results,
      selectedIndex,
      selectNext,
      selectPrevious,
      selectFirst,
      selectLast,
      handleNodeSelect,
    ]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value);
    },
    [setQuery]
  );

  // Handle clear button
  const handleClear = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, [setQuery]);

  // Handle result click
  const handleResultClick = useCallback(
    (node: GraphNode) => {
      handleNodeSelect(node);
    },
    [handleNodeSelect]
  );

  // Handle dialog open/close change
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeSearch();
      }
    },
    [closeSearch]
  );

  // Compute aria-activedescendant
  const activeDescendant = useMemo(() => {
    if (selectedIndex >= 0 && results[selectedIndex]) {
      return `search-result-${selectedIndex}`;
    }
    return undefined;
  }, [selectedIndex, results]);

  // Show empty state?
  const showEmptyState = query.trim() && results.length === 0;

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-200"
          data-testid="search-modal-overlay"
        />

        {/* Content */}
        <Dialog.Content
          role="dialog"
          className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/4 max-w-2xl w-full mx-4 bg-white dark:bg-gray-900 rounded-lg shadow-xl z-50 transition-all duration-200"
          aria-modal="true"
          aria-labelledby="search-modal-title"
          aria-describedby={undefined}
          onKeyDown={handleKeyDown}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
        >
          {/* Visually hidden title for accessibility */}
          <Dialog.Title id="search-modal-title" className="sr-only">
            Search code elements
          </Dialog.Title>

          {/* Search input */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              {/* Search icon */}
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              {/* Input */}
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-autocomplete="list"
                aria-controls="search-results"
                aria-expanded={results.length > 0}
                aria-activedescendant={activeDescendant}
                aria-label="Search for files, classes, methods"
                value={query}
                onChange={handleInputChange}
                placeholder="Search files, classes, methods..."
                className="w-full py-3 pl-10 pr-10 text-gray-900 dark:text-white bg-transparent border-0 focus:outline-none focus:ring-0 placeholder-gray-400"
              />

              {/* Clear button */}
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Clear search"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Results list */}
          {results.length > 0 && (
            <div
              id="search-results"
              role="listbox"
              aria-label={`${results.length} results found`}
              className="max-h-96 overflow-y-auto"
            >
              {results.map((node, index) => (
                <div
                  key={node.id}
                  id={`search-result-${index}`}
                  role="option"
                  aria-selected={index === selectedIndex}
                  tabIndex={-1}
                  onClick={() => handleResultClick(node)}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl flex-shrink-0">
                      {getNodeIcon(node.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {node.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <span className="capitalize">{node.type}</span>
                        <span>·</span>
                        <span className="truncate">{node.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {showEmptyState && (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              <p>No matches found for "{query}"</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          )}

          {/* Screen reader announcement */}
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {results.length > 0
              ? `${results.length} results for "${query}"`
              : query.trim()
                ? `No results for "${query}"`
                : ''}
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 flex items-center gap-4">
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-300">
                ↑↓
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-300">
                Enter
              </kbd>{' '}
              Select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-300">
                Esc
              </kbd>{' '}
              Close
            </span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
