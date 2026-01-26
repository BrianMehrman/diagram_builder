/**
 * Spinner Tests
 *
 * Tests for the loading spinner component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  describe('rendering', () => {
    it('renders spinner element', () => {
      render(<Spinner />);

      expect(screen.getByRole('status')).toBeDefined();
    });

    it('has aria-label for accessibility', () => {
      render(<Spinner />);

      const spinner = screen.getByRole('status');
      expect(spinner.getAttribute('aria-label')).toBe('Loading');
    });
  });

  describe('sizes', () => {
    it('renders small size (20px)', () => {
      render(<Spinner size="sm" />);

      const spinner = screen.getByRole('status');
      expect(spinner.className).toContain('w-5');
      expect(spinner.className).toContain('h-5');
    });

    it('renders medium size (40px) by default', () => {
      render(<Spinner />);

      const spinner = screen.getByRole('status');
      expect(spinner.className).toContain('w-10');
      expect(spinner.className).toContain('h-10');
    });

    it('renders large size (60px)', () => {
      render(<Spinner size="lg" />);

      const spinner = screen.getByRole('status');
      expect(spinner.className).toContain('w-15');
      expect(spinner.className).toContain('h-15');
    });
  });

  describe('styling', () => {
    it('has blue accent color', () => {
      render(<Spinner />);

      const spinner = screen.getByRole('status');
      expect(spinner.className).toContain('border-t-blue-500');
    });

    it('has spin animation', () => {
      render(<Spinner />);

      const spinner = screen.getByRole('status');
      expect(spinner.className).toContain('animate-spin');
    });

    it('has rounded shape', () => {
      render(<Spinner />);

      const spinner = screen.getByRole('status');
      expect(spinner.className).toContain('rounded-full');
    });

    it('accepts custom className', () => {
      render(<Spinner className="custom-class" />);

      const spinner = screen.getByRole('status');
      expect(spinner.className).toContain('custom-class');
    });
  });
});

describe('LoadingOverlay', () => {
  it('renders spinner with text', async () => {
    const { LoadingOverlay } = await import('./Spinner');
    render(<LoadingOverlay text="Loading graph..." />);

    expect(screen.getByRole('status')).toBeDefined();
    expect(screen.getByText('Loading graph...')).toBeDefined();
  });

  it('has backdrop overlay', async () => {
    const { LoadingOverlay } = await import('./Spinner');
    render(<LoadingOverlay />);

    const overlay = screen.getByTestId('loading-overlay');
    expect(overlay.className).toContain('bg-gray-900/50');
  });

  it('uses large spinner by default', async () => {
    const { LoadingOverlay } = await import('./Spinner');
    render(<LoadingOverlay />);

    const spinner = screen.getByRole('status');
    expect(spinner.className).toContain('w-15');
  });

  it('has proper z-index for overlay', async () => {
    const { LoadingOverlay } = await import('./Spinner');
    render(<LoadingOverlay />);

    const overlay = screen.getByTestId('loading-overlay');
    expect(overlay.className).toContain('z-50');
  });
});
