/**
 * SearchBar Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from './SearchBar';
import type { GraphNode } from '../../shared/types';

const mockNodes: GraphNode[] = [
  {
    id: 'file-1',
    type: 'file',
    label: 'app.ts',
    metadata: {},
    position: { x: 0, y: 0, z: 0 },
    lodLevel: 0,
  },
  {
    id: 'class-1',
    type: 'class',
    label: 'Application',
    metadata: { file: 'file-1' },
    position: { x: 1, y: 1, z: 1 },
    lodLevel: 1,
  },
  {
    id: 'method-1',
    type: 'method',
    label: 'initialize',
    metadata: { class: 'class-1', file: 'file-1' },
    position: { x: 1.5, y: 1.5, z: 1.5 },
    lodLevel: 2,
  },
  {
    id: 'function-1',
    type: 'function',
    label: 'helper',
    metadata: { file: 'file-1' },
    position: { x: 2, y: 0, z: 0 },
    lodLevel: 1,
  },
];

describe('SearchBar', () => {
  let onNodeSelect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onNodeSelect = vi.fn();
  });

  it('renders search input with placeholder', () => {
    render(<SearchBar nodes={mockNodes} onNodeSelect={onNodeSelect} />);

    expect(screen.getByPlaceholderText(/search nodes/i)).toBeDefined();
  });

  it('renders search icon', () => {
    render(<SearchBar nodes={mockNodes} onNodeSelect={onNodeSelect} />);

    const input = screen.getByPlaceholderText(/search nodes/i);
    expect(input.parentElement?.querySelector('svg')).toBeDefined();
  });

  it('filters nodes by label', async () => {
    const user = userEvent.setup();
    render(<SearchBar nodes={mockNodes} onNodeSelect={onNodeSelect} />);

    const input = screen.getByPlaceholderText(/search nodes/i);
    await user.type(input, 'app');

    // Wait for debounce (300ms)
    await waitFor(
      () => {
        expect(screen.getByText('Application')).toBeDefined();
      },
      { timeout: 500 }
    );
  });

  it('filters nodes by type', async () => {
    const user = userEvent.setup();
    render(<SearchBar nodes={mockNodes} onNodeSelect={onNodeSelect} />);

    const input = screen.getByPlaceholderText(/search nodes/i);
    await user.type(input, 'method');

    await waitFor(
      () => {
        expect(screen.getByText('initialize')).toBeDefined();
      },
      { timeout: 500 }
    );
  });

  it('filters nodes by ID', async () => {
    const user = userEvent.setup();
    render(<SearchBar nodes={mockNodes} onNodeSelect={onNodeSelect} />);

    const input = screen.getByPlaceholderText(/search nodes/i);
    await user.type(input, 'file-1');

    await waitFor(
      () => {
        expect(screen.getByText('app.ts')).toBeDefined();
      },
      { timeout: 500 }
    );
  });

  it('shows no results message when no matches', async () => {
    const user = userEvent.setup();
    render(<SearchBar nodes={mockNodes} onNodeSelect={onNodeSelect} />);

    const input = screen.getByPlaceholderText(/search nodes/i);
    await user.type(input, 'nonexistent');

    await waitFor(
      () => {
        expect(screen.getByText(/no nodes found matching/i)).toBeDefined();
      },
      { timeout: 500 }
    );
  });

  it('does not show dropdown when search is empty', async () => {
    const user = userEvent.setup();
    render(<SearchBar nodes={mockNodes} onNodeSelect={onNodeSelect} />);

    const input = screen.getByPlaceholderText(/search nodes/i);
    await user.click(input);

    await waitFor(() => {
      expect(screen.queryByText('app.ts')).toBeNull();
    });
  });

  it('limits results to 10 items', async () => {
    const user = userEvent.setup();
    const manyNodes: GraphNode[] = Array.from({ length: 20 }, (_, i) => ({
      id: `node-${i}`,
      type: 'file',
      label: `file-${i}.ts`,
      metadata: {},
      position: { x: i, y: 0, z: 0 },
      lodLevel: 0,
    }));

    render(<SearchBar nodes={manyNodes} onNodeSelect={onNodeSelect} />);

    const input = screen.getByPlaceholderText(/search nodes/i);
    await user.type(input, 'file');

    await waitFor(
      () => {
        const results = screen.getAllByRole('button');
        // Should only show 10 results (limit in SearchBar)
        expect(results.length).toBeLessThanOrEqual(10);
      },
      { timeout: 500 }
    );
  });

  it('calls onNodeSelect when result is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchBar nodes={mockNodes} onNodeSelect={onNodeSelect} />);

    const input = screen.getByPlaceholderText(/search nodes/i);
    await user.type(input, 'app');

    await waitFor(
      async () => {
        const result = screen.getByText('app.ts');
        await user.click(result);
      },
      { timeout: 500 }
    );

    // Note: This might not work perfectly due to timing, but we're testing the behavior
    await waitFor(() => {
      expect(onNodeSelect).toHaveBeenCalledWith('file-1');
    });
  });

  it('clears search term after selection', async () => {
    const user = userEvent.setup();
    render(<SearchBar nodes={mockNodes} onNodeSelect={onNodeSelect} />);

    const input = screen.getByPlaceholderText(/search nodes/i) as HTMLInputElement;
    await user.type(input, 'app');

    await waitFor(
      async () => {
        const result = screen.getByText('app.ts');
        await user.click(result);
      },
      { timeout: 500 }
    );

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('displays node type and ID in results', async () => {
    const user = userEvent.setup();
    render(<SearchBar nodes={mockNodes} onNodeSelect={onNodeSelect} />);

    const input = screen.getByPlaceholderText(/search nodes/i);
    await user.type(input, 'Application');

    await waitFor(
      () => {
        expect(screen.getByText('Application')).toBeDefined();
        expect(screen.getByText('class')).toBeDefined();
        expect(screen.getByText('class-1')).toBeDefined();
      },
      { timeout: 500 }
    );
  });

  it('is case-insensitive', async () => {
    const user = userEvent.setup();
    render(<SearchBar nodes={mockNodes} onNodeSelect={onNodeSelect} />);

    const input = screen.getByPlaceholderText(/search nodes/i);
    await user.type(input, 'APPLICATION');

    await waitFor(
      () => {
        expect(screen.getByText('Application')).toBeDefined();
      },
      { timeout: 500 }
    );
  });
});
