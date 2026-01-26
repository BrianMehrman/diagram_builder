/**
 * ProgressBar Tests
 *
 * Tests for the progress bar component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  describe('rendering', () => {
    it('renders progress bar element', () => {
      render(<ProgressBar progress={50} />);

      expect(screen.getByRole('progressbar')).toBeDefined();
    });

    it('displays progress percentage', () => {
      render(<ProgressBar progress={45} />);

      expect(screen.getByText('45%')).toBeDefined();
    });

    it('displays status text when provided', () => {
      render(<ProgressBar progress={30} status="Parsing files..." />);

      expect(screen.getByText('Parsing files...')).toBeDefined();
    });
  });

  describe('accessibility', () => {
    it('has aria-valuenow with current progress', () => {
      render(<ProgressBar progress={75} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar.getAttribute('aria-valuenow')).toBe('75');
    });

    it('has aria-valuemin of 0', () => {
      render(<ProgressBar progress={50} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar.getAttribute('aria-valuemin')).toBe('0');
    });

    it('has aria-valuemax of 100', () => {
      render(<ProgressBar progress={50} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar.getAttribute('aria-valuemax')).toBe('100');
    });

    it('has aria-label for screen readers', () => {
      render(<ProgressBar progress={50} />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar.getAttribute('aria-label')).toContain('Progress');
    });
  });

  describe('visual progress', () => {
    it('sets width based on progress percentage', () => {
      render(<ProgressBar progress={60} />);

      const fill = screen.getByTestId('progress-fill');
      expect(fill.style.width).toBe('60%');
    });

    it('handles 0% progress', () => {
      render(<ProgressBar progress={0} />);

      const fill = screen.getByTestId('progress-fill');
      expect(fill.style.width).toBe('0%');
    });

    it('handles 100% progress', () => {
      render(<ProgressBar progress={100} />);

      const fill = screen.getByTestId('progress-fill');
      expect(fill.style.width).toBe('100%');
    });

    it('clamps progress above 100', () => {
      render(<ProgressBar progress={150} />);

      const fill = screen.getByTestId('progress-fill');
      expect(fill.style.width).toBe('100%');
    });

    it('clamps progress below 0', () => {
      render(<ProgressBar progress={-10} />);

      const fill = screen.getByTestId('progress-fill');
      expect(fill.style.width).toBe('0%');
    });
  });

  describe('styling', () => {
    it('has blue fill color', () => {
      render(<ProgressBar progress={50} />);

      const fill = screen.getByTestId('progress-fill');
      expect(fill.className).toContain('bg-blue');
    });

    it('has transition animation', () => {
      render(<ProgressBar progress={50} />);

      const fill = screen.getByTestId('progress-fill');
      expect(fill.className).toContain('transition');
    });

    it('has rounded corners', () => {
      render(<ProgressBar progress={50} />);

      const container = screen.getByRole('progressbar');
      expect(container.className).toContain('rounded');
    });

    it('accepts custom className', () => {
      render(<ProgressBar progress={50} className="custom-class" />);

      const container = screen.getByTestId('progressbar-container');
      expect(container.className).toContain('custom-class');
    });
  });
});
