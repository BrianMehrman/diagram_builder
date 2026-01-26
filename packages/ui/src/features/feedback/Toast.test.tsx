/**
 * Toast Component Tests
 *
 * Tests for Toast notification component using Radix UI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Toast, ToastProvider } from './Toast';
import { useToastStore, type Toast as ToastType } from './toastStore';

describe('Toast', () => {
  const mockToast: ToastType = {
    id: 'test-1',
    type: 'success',
    title: 'Test Toast',
    message: 'Test message',
  };

  describe('individual Toast component', () => {
    it('renders toast title', () => {
      render(
        <ToastProvider>
          <Toast toast={mockToast} onDismiss={vi.fn()} />
        </ToastProvider>
      );

      expect(screen.getByText('Test Toast')).toBeDefined();
    });

    it('renders toast message', () => {
      render(
        <ToastProvider>
          <Toast toast={mockToast} onDismiss={vi.fn()} />
        </ToastProvider>
      );

      expect(screen.getByText('Test message')).toBeDefined();
    });

    it('renders checkmark icon for success', () => {
      render(
        <ToastProvider>
          <Toast toast={mockToast} onDismiss={vi.fn()} />
        </ToastProvider>
      );

      expect(screen.getByText('✓')).toBeDefined();
    });

    it('renders warning icon for error', () => {
      const errorToast: ToastType = { ...mockToast, type: 'error' };
      render(
        <ToastProvider>
          <Toast toast={errorToast} onDismiss={vi.fn()} />
        </ToastProvider>
      );

      expect(screen.getByText('⚠')).toBeDefined();
    });

    it('has role="status" for success toast', () => {
      render(
        <ToastProvider>
          <Toast toast={mockToast} onDismiss={vi.fn()} />
        </ToastProvider>
      );

      // Radix adds multiple status elements, get the one with our content
      const statuses = screen.getAllByRole('status');
      const toastElement = statuses.find((el) => el.textContent?.includes('Test Toast'));
      expect(toastElement).toBeDefined();
    });

    it('has role="alert" for error toast', () => {
      const errorToast: ToastType = { ...mockToast, type: 'error' };
      render(
        <ToastProvider>
          <Toast toast={errorToast} onDismiss={vi.fn()} />
        </ToastProvider>
      );

      expect(screen.getByRole('alert')).toBeDefined();
    });

    it('has dismiss button for error toasts', () => {
      const errorToast: ToastType = { ...mockToast, type: 'error' };
      render(
        <ToastProvider>
          <Toast toast={errorToast} onDismiss={vi.fn()} />
        </ToastProvider>
      );

      expect(screen.getByRole('button', { name: /dismiss/i })).toBeDefined();
    });

    it('calls onDismiss when dismiss button clicked', async () => {
      const onDismiss = vi.fn();
      const errorToast: ToastType = { ...mockToast, type: 'error' };
      render(
        <ToastProvider>
          <Toast toast={errorToast} onDismiss={onDismiss} />
        </ToastProvider>
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await act(async () => {
        dismissButton.click();
      });

      expect(onDismiss).toHaveBeenCalled();
    });

    it('has green styling for success', () => {
      render(
        <ToastProvider>
          <Toast toast={mockToast} onDismiss={vi.fn()} />
        </ToastProvider>
      );

      // Radix adds multiple status elements, get the one with our class
      const statuses = screen.getAllByRole('status');
      const toastElement = statuses.find((el) => el.className.includes('bg-green'));
      expect(toastElement).toBeDefined();
    });

    it('has red styling for error', () => {
      const errorToast: ToastType = { ...mockToast, type: 'error' };
      render(
        <ToastProvider>
          <Toast toast={errorToast} onDismiss={vi.fn()} />
        </ToastProvider>
      );

      const toast = screen.getByRole('alert');
      expect(toast.className).toContain('bg-red');
    });
  });

  describe('ToastProvider', () => {
    beforeEach(() => {
      useToastStore.setState({ toasts: [] });
    });

    it('renders children', () => {
      render(
        <ToastProvider>
          <div data-testid="child">Child content</div>
        </ToastProvider>
      );

      expect(screen.getByTestId('child')).toBeDefined();
    });

    it('renders toast viewport in top-right corner', () => {
      render(
        <ToastProvider>
          <div>App</div>
        </ToastProvider>
      );

      const viewport = screen.getByTestId('toast-viewport');
      expect(viewport.className).toContain('top-4');
      expect(viewport.className).toContain('right-4');
    });

    it('viewport has proper z-index (50)', () => {
      render(
        <ToastProvider>
          <div>App</div>
        </ToastProvider>
      );

      const viewport = screen.getByTestId('toast-viewport');
      expect(viewport.className).toContain('z-50');
    });

    it('viewport has flex-col for stacking toasts', () => {
      render(
        <ToastProvider>
          <div>App</div>
        </ToastProvider>
      );

      const viewport = screen.getByTestId('toast-viewport');
      expect(viewport.className).toContain('flex-col');
    });

    it('renders toasts from store', async () => {
      render(
        <ToastProvider>
          <div>App</div>
        </ToastProvider>
      );

      // Add toast to store
      await act(async () => {
        useToastStore.getState().showSuccess('Test Success');
      });

      expect(screen.getByText('Test Success')).toBeDefined();
    });
  });
});
