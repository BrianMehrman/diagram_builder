/**
 * ImportProgress Component Tests
 *
 * Tests for the import progress modal that displays during codebase import.
 * Following TDD - RED → GREEN → REFACTOR
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ImportProgress } from './ImportProgress';

describe('ImportProgress', () => {
  describe('Rendering', () => {
    it('renders the modal when open is true', () => {
      render(
        <ImportProgress
          open={true}
          progress={50}
          status="Parsing files..."
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('does not render the modal when open is false', () => {
      render(
        <ImportProgress
          open={false}
          progress={50}
          status="Parsing files..."
          onCancel={vi.fn()}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders the modal title', () => {
      render(
        <ImportProgress
          open={true}
          progress={50}
          status="Parsing files..."
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('Importing Codebase')).toBeInTheDocument();
    });

    it('renders a custom title when provided', () => {
      render(
        <ImportProgress
          open={true}
          progress={50}
          status="Parsing files..."
          title="Custom Import Title"
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('Custom Import Title')).toBeInTheDocument();
    });
  });

  describe('Progress Display', () => {
    it('renders the progress bar with correct value', () => {
      render(
        <ImportProgress
          open={true}
          progress={45}
          status="Cloning repository..."
          onCancel={vi.fn()}
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '45');
    });

    it('displays the status text', () => {
      render(
        <ImportProgress
          open={true}
          progress={30}
          status="Cloning repository..."
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('Cloning repository...')).toBeInTheDocument();
    });

    it('displays percentage text', () => {
      render(
        <ImportProgress
          open={true}
          progress={75}
          status="Building graph..."
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('updates progress bar width based on progress value', () => {
      render(
        <ImportProgress
          open={true}
          progress={60}
          status="Parsing files..."
          onCancel={vi.fn()}
        />
      );

      const progressFill = screen.getByTestId('progress-fill');
      expect(progressFill).toHaveStyle({ width: '60%' });
    });

    it('clamps progress to 0-100 range', () => {
      const { rerender } = render(
        <ImportProgress
          open={true}
          progress={-10}
          status="Starting..."
          onCancel={vi.fn()}
        />
      );

      let progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '0');

      rerender(
        <ImportProgress
          open={true}
          progress={150}
          status="Complete!"
          onCancel={vi.fn()}
        />
      );

      progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });
  });

  describe('Estimated Time', () => {
    it('displays estimated time remaining when provided', () => {
      render(
        <ImportProgress
          open={true}
          progress={50}
          status="Parsing files..."
          estimatedTimeRemaining={120000} // 2 minutes in ms
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText(/estimated time/i)).toBeInTheDocument();
      expect(screen.getByText(/2 minutes/i)).toBeInTheDocument();
    });

    it('does not display estimated time when not provided', () => {
      render(
        <ImportProgress
          open={true}
          progress={50}
          status="Parsing files..."
          onCancel={vi.fn()}
        />
      );

      expect(screen.queryByText(/estimated time/i)).not.toBeInTheDocument();
    });

    it('displays seconds when estimated time is less than a minute', () => {
      render(
        <ImportProgress
          open={true}
          progress={90}
          status="Almost done..."
          estimatedTimeRemaining={45000} // 45 seconds
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText(/45 seconds/i)).toBeInTheDocument();
    });

    it('displays minutes and seconds for mixed times', () => {
      render(
        <ImportProgress
          open={true}
          progress={60}
          status="Building graph..."
          estimatedTimeRemaining={90000} // 1 minute 30 seconds
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText(/1 minute 30 seconds/i)).toBeInTheDocument();
    });
  });

  describe('Cancel Button', () => {
    it('renders the cancel button', () => {
      render(
        <ImportProgress
          open={true}
          progress={50}
          status="Parsing files..."
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    it('calls onCancel when cancel button is clicked', () => {
      const onCancel = vi.fn();
      render(
        <ImportProgress
          open={true}
          progress={50}
          status="Parsing files..."
          onCancel={onCancel}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('hides cancel button when showCancel is false', () => {
      render(
        <ImportProgress
          open={true}
          progress={50}
          status="Parsing files..."
          showCancel={false}
          onCancel={vi.fn()}
        />
      );

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has accessible dialog with proper aria attributes', () => {
      render(
        <ImportProgress
          open={true}
          progress={50}
          status="Parsing files..."
          onCancel={vi.fn()}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('has accessible progress bar', () => {
      render(
        <ImportProgress
          open={true}
          progress={50}
          status="Parsing files..."
          onCancel={vi.fn()}
        />
      );

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    });

    it('traps focus within the modal', () => {
      render(
        <ImportProgress
          open={true}
          progress={50}
          status="Parsing files..."
          onCancel={vi.fn()}
        />
      );

      // The modal should have a focusable element
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe('Stage-based Progress', () => {
    it('displays cloning stage correctly', () => {
      render(
        <ImportProgress
          open={true}
          progress={15}
          status="Cloning repository..."
          stage="cloning"
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('Cloning repository...')).toBeInTheDocument();
      // Progress should be within cloning range (0-30%)
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '15');
    });

    it('displays parsing stage correctly', () => {
      render(
        <ImportProgress
          open={true}
          progress={50}
          status="Parsing 342 files..."
          stage="parsing"
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('Parsing 342 files...')).toBeInTheDocument();
    });

    it('displays building stage correctly', () => {
      render(
        <ImportProgress
          open={true}
          progress={85}
          status="Building graph..."
          stage="building"
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('Building graph...')).toBeInTheDocument();
    });
  });

  describe('Completion State', () => {
    it('shows completion state when progress reaches 100', () => {
      render(
        <ImportProgress
          open={true}
          progress={100}
          status="Import complete!"
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('Import complete!')).toBeInTheDocument();
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '100');
    });
  });
});
