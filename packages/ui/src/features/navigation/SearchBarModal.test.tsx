/**
 * SearchBarModal Tests
 *
 * Tests for SearchBarModal component - the modal search interface
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBarModal } from './SearchBarModal';
import { useSearchStore } from './searchStore';
import { initializeSearchIndex, clearSearchIndex } from './fuzzySearch';
import type { GraphNode } from '../../shared/types';

// Mock nodes for testing
const mockNodes: GraphNode[] = [
  {
    id: 'node-1',
    type: 'file',
    label: 'AuthService.ts',
    metadata: { path: 'src/services/AuthService.ts' },
    lod: 1,
    position: { x: 0, y: 0, z: 0 },
  },
  {
    id: 'node-2',
    type: 'class',
    label: 'AuthController',
    metadata: { path: 'src/controllers/AuthController.ts' },
    lod: 1,
    position: { x: 10, y: 0, z: 0 },
  },
  {
    id: 'node-3',
    type: 'function',
    label: 'authenticate',
    metadata: { path: 'src/utils/auth.ts' },
    lod: 2,
    position: { x: 20, y: 0, z: 0 },
  },
];

// Helper to render component with store already in desired state
function renderSearchModal(
  options: {
    isOpen?: boolean;
    query?: string;
    results?: GraphNode[];
    selectedIndex?: number;
    onNodeSelect?: (nodeId: string, position?: { x: number; y: number; z: number }) => void;
  } = {}
) {
  const {
    isOpen = true,
    query,
    results,
    selectedIndex,
    onNodeSelect = vi.fn(),
  } = options;

  // Set store state
  if (isOpen) {
    useSearchStore.getState().openSearch();
  }
  if (query !== undefined) {
    useSearchStore.getState().setQuery(query);
  }
  if (results !== undefined) {
    useSearchStore.getState().setResults(results);
  }
  if (selectedIndex !== undefined) {
    useSearchStore.getState().selectByIndex(selectedIndex);
  }

  return render(<SearchBarModal nodes={mockNodes} onNodeSelect={onNodeSelect} />);
}

describe('SearchBarModal', () => {
  beforeEach(() => {
    // Reset search store
    useSearchStore.getState().closeSearch();
    useSearchStore.getState().clearHistory();
    // Initialize fuzzy search index
    initializeSearchIndex(mockNodes);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearSearchIndex();
  });

  describe('rendering', () => {
    it('renders when isOpen is true', () => {
      renderSearchModal({ isOpen: true });

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      useSearchStore.getState().closeSearch();
      render(<SearchBarModal nodes={mockNodes} onNodeSelect={vi.fn()} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('has required accessibility attributes', () => {
      renderSearchModal({ isOpen: true });

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });

    it('renders visually hidden title for accessibility', () => {
      renderSearchModal({ isOpen: true });

      // Title should exist but be sr-only
      const title = screen.getByText('Search code elements');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('sr-only');
    });

    it('renders search input with combobox role', () => {
      renderSearchModal({ isOpen: true });

      const input = screen.getByRole('combobox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
    });
  });

  describe('focus management', () => {
    it('focuses search input when modal opens', async () => {
      renderSearchModal({ isOpen: true });

      await waitFor(() => {
        const input = screen.getByRole('combobox');
        expect(document.activeElement).toBe(input);
      });
    });
  });

  describe('search input', () => {
    it('updates query in store when typing', async () => {
      renderSearchModal({ isOpen: true });
      const user = userEvent.setup();

      const input = screen.getByRole('combobox');
      await user.type(input, 'auth');

      expect(useSearchStore.getState().query).toBe('auth');
    });

    it('shows clear button when query is not empty', () => {
      renderSearchModal({ isOpen: true, query: 'test' });

      const clearButton = screen.getByLabelText('Clear search');
      expect(clearButton).toBeInTheDocument();
    });

    it('clears query when clear button is clicked', async () => {
      renderSearchModal({ isOpen: true, query: 'test' });
      const user = userEvent.setup();

      const clearButton = screen.getByLabelText('Clear search');
      await user.click(clearButton);

      expect(useSearchStore.getState().query).toBe('');
    });
  });

  describe('results display', () => {
    it('displays results when available', () => {
      renderSearchModal({ isOpen: true, query: 'auth', results: mockNodes });

      expect(screen.getByText('AuthService.ts')).toBeInTheDocument();
      expect(screen.getByText('AuthController')).toBeInTheDocument();
    });

    it('displays node icons based on type', () => {
      renderSearchModal({ isOpen: true, query: 'auth', results: mockNodes });

      // File icon should be present
      expect(screen.getByText('📄')).toBeInTheDocument();
      // Class icon
      expect(screen.getByText('🏛️')).toBeInTheDocument();
      // Function icon
      expect(screen.getByText('⚡')).toBeInTheDocument();
    });

    it('displays node type and id as secondary info', () => {
      renderSearchModal({ isOpen: true, query: 'auth', results: [mockNodes[0]] });

      expect(screen.getByText(/file/i)).toBeInTheDocument();
      expect(screen.getByText(/node-1/i)).toBeInTheDocument();
    });

    it('highlights selected result', () => {
      renderSearchModal({ isOpen: true, query: 'auth', results: mockNodes });
      // setResults auto-selects first item (index 0)

      const results = screen.getAllByRole('option');
      expect(results[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('shows results listbox with role', () => {
      renderSearchModal({ isOpen: true, query: 'auth', results: mockNodes });

      const listbox = screen.getByRole('listbox');
      expect(listbox).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('shows empty state when query has no matches', () => {
      renderSearchModal({
        isOpen: true,
        query: 'xyznonexistent',
        results: [],
      });

      expect(screen.getByText(/no matches found/i)).toBeInTheDocument();
    });

    it('shows query in empty state message', () => {
      renderSearchModal({
        isOpen: true,
        query: 'xyztest',
        results: [],
      });

      // Use more specific query - the visible empty state message
      expect(screen.getByText(/No matches found for "xyztest"/)).toBeInTheDocument();
    });
  });

  describe('keyboard navigation', () => {
    it('navigates down with ArrowDown', async () => {
      renderSearchModal({ isOpen: true, query: 'auth', results: mockNodes });
      const user = userEvent.setup();

      const input = screen.getByRole('combobox');
      await user.type(input, '{ArrowDown}');

      expect(useSearchStore.getState().selectedIndex).toBe(1);
    });

    it('navigates up with ArrowUp', async () => {
      renderSearchModal({
        isOpen: true,
        query: 'auth',
        results: mockNodes,
      });
      const user = userEvent.setup();

      // Move down twice first to get to index 2
      const input = screen.getByRole('combobox');
      await user.type(input, '{ArrowDown}{ArrowDown}');
      expect(useSearchStore.getState().selectedIndex).toBe(2);

      // Now navigate up
      await user.type(input, '{ArrowUp}');
      expect(useSearchStore.getState().selectedIndex).toBe(1);
    });

    it('selects node with Enter key', async () => {
      const onNodeSelect = vi.fn();
      renderSearchModal({
        isOpen: true,
        query: 'auth',
        results: mockNodes,
        onNodeSelect,
      });
      const user = userEvent.setup();

      const input = screen.getByRole('combobox');
      await user.type(input, '{Enter}');

      expect(onNodeSelect).toHaveBeenCalledWith('node-1', mockNodes[0].position);
    });

    it('closes modal with Escape key', async () => {
      renderSearchModal({ isOpen: true });
      const user = userEvent.setup();

      const input = screen.getByRole('combobox');
      await user.type(input, '{Escape}');

      expect(useSearchStore.getState().isOpen).toBe(false);
    });

    it('jumps to first result with Home key', async () => {
      renderSearchModal({
        isOpen: true,
        query: 'auth',
        results: mockNodes,
        selectedIndex: 2,
      });
      const user = userEvent.setup();

      const input = screen.getByRole('combobox');
      await user.type(input, '{Home}');

      expect(useSearchStore.getState().selectedIndex).toBe(0);
    });

    it('jumps to last result with End key', async () => {
      renderSearchModal({ isOpen: true, query: 'auth', results: mockNodes });
      const user = userEvent.setup();

      const input = screen.getByRole('combobox');
      await user.type(input, '{End}');

      expect(useSearchStore.getState().selectedIndex).toBe(2);
    });
  });

  describe('node selection', () => {
    it('calls onNodeSelect when result is clicked', async () => {
      const onNodeSelect = vi.fn();
      renderSearchModal({
        isOpen: true,
        query: 'auth',
        results: mockNodes,
        onNodeSelect,
      });
      const user = userEvent.setup();

      const results = screen.getAllByRole('option');
      await user.click(results[0]);

      expect(onNodeSelect).toHaveBeenCalledWith('node-1', mockNodes[0].position);
    });

    it('closes modal after selection', async () => {
      renderSearchModal({ isOpen: true, query: 'auth', results: mockNodes });
      const user = userEvent.setup();

      const results = screen.getAllByRole('option');
      await user.click(results[0]);

      expect(useSearchStore.getState().isOpen).toBe(false);
    });

    it('adds query to history on selection', async () => {
      renderSearchModal({
        isOpen: true,
        query: 'auth',
        results: mockNodes,
      });
      const user = userEvent.setup();

      const results = screen.getAllByRole('option');
      await user.click(results[0]);

      expect(useSearchStore.getState().searchHistory).toContain('auth');
    });
  });

  describe('overlay and closing', () => {
    it('closes when overlay is clicked', async () => {
      renderSearchModal({ isOpen: true });
      const user = userEvent.setup();

      const overlay = screen.getByTestId('search-modal-overlay');
      await user.click(overlay);

      expect(useSearchStore.getState().isOpen).toBe(false);
    });
  });

  describe('screen reader announcements', () => {
    it('announces result count with aria-live region', () => {
      renderSearchModal({
        isOpen: true,
        query: 'auth',
        results: mockNodes,
      });

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveTextContent(/3 results/i);
    });
  });
});
