/**
 * EmptyState Tests
 *
 * Tests for the empty state component displayed when no codebase is loaded
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  describe('rendering', () => {
    it('renders headline text', () => {
      render(<EmptyState />);

      expect(screen.getByText('Start exploring your codebase in 3D')).toBeDefined();
    });

    it('renders subheading text', () => {
      render(<EmptyState />);

      expect(screen.getByText(/Import a repository to visualize/i)).toBeDefined();
    });

    it('renders icon', () => {
      render(<EmptyState />);

      // Should have an SVG icon or emoji
      const container = screen.getByTestId('empty-state-icon');
      expect(container).toBeDefined();
    });

    it('renders Import Codebase button when onImportClick provided', () => {
      const onImportClick = vi.fn();
      render(<EmptyState onImportClick={onImportClick} />);

      expect(screen.getByRole('button', { name: /import codebase/i })).toBeDefined();
    });

    it('does not render Import button when onImportClick not provided', () => {
      render(<EmptyState />);

      expect(screen.queryByRole('button', { name: /import codebase/i })).toBeNull();
    });
  });

  describe('styling', () => {
    it('has centered layout', () => {
      render(<EmptyState />);

      const container = screen.getByTestId('empty-state-container');
      expect(container.className).toContain('flex');
      expect(container.className).toContain('items-center');
      expect(container.className).toContain('justify-center');
    });

    it('has dark background', () => {
      render(<EmptyState />);

      const container = screen.getByTestId('empty-state-container');
      expect(container.className).toContain('bg-gray-900');
    });

    it('headline has proper styling (large, bold, white)', () => {
      render(<EmptyState />);

      const headline = screen.getByRole('heading', { level: 1 });
      expect(headline.className).toContain('font-bold');
      expect(headline.className).toContain('text-white');
    });

    it('button has primary blue styling', () => {
      render(<EmptyState onImportClick={vi.fn()} />);

      const button = screen.getByRole('button', { name: /import codebase/i });
      expect(button.className).toContain('bg-blue-600');
    });
  });

  describe('interactions', () => {
    it('calls onImportClick when button is clicked', async () => {
      const user = userEvent.setup();
      const onImportClick = vi.fn();
      render(<EmptyState onImportClick={onImportClick} />);

      const button = screen.getByRole('button', { name: /import codebase/i });
      await user.click(button);

      expect(onImportClick).toHaveBeenCalledOnce();
    });
  });

  describe('accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<EmptyState />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeDefined();
    });

    it('button is keyboard accessible', () => {
      const onImportClick = vi.fn();
      render(<EmptyState onImportClick={onImportClick} />);

      const button = screen.getByRole('button', { name: /import codebase/i });
      expect(button).toBeDefined();
      expect(button.getAttribute('type')).toBe('button');
    });
  });
});
