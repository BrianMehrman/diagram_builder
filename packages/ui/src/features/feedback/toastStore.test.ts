/**
 * Toast Store Tests
 *
 * Tests for the Zustand toast notification store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useToastStore } from './toastStore';

describe('useToastStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useToastStore.setState({ toasts: [] });
  });

  describe('showToast', () => {
    it('adds a success toast to the queue', () => {
      const { showToast } = useToastStore.getState();

      showToast({ type: 'success', title: 'Success!', message: 'Operation completed' });

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].title).toBe('Success!');
      expect(toasts[0].message).toBe('Operation completed');
    });

    it('adds an error toast to the queue', () => {
      const { showToast } = useToastStore.getState();

      showToast({ type: 'error', title: 'Error', message: 'Something went wrong' });

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('error');
    });

    it('adds an info toast to the queue', () => {
      const { showToast } = useToastStore.getState();

      showToast({ type: 'info', title: 'Info', message: 'FYI' });

      const { toasts } = useToastStore.getState();
      expect(toasts[0].type).toBe('info');
    });

    it('adds a warning toast to the queue', () => {
      const { showToast } = useToastStore.getState();

      showToast({ type: 'warning', title: 'Warning', message: 'Be careful' });

      const { toasts } = useToastStore.getState();
      expect(toasts[0].type).toBe('warning');
    });

    it('generates unique ID for each toast', () => {
      const { showToast } = useToastStore.getState();

      const id1 = showToast({ type: 'success', title: 'First' });
      const id2 = showToast({ type: 'success', title: 'Second' });

      expect(id1).not.toBe(id2);
    });

    it('returns the toast ID', () => {
      const { showToast } = useToastStore.getState();

      const id = showToast({ type: 'success', title: 'Test' });

      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('stacks multiple toasts', () => {
      const { showToast } = useToastStore.getState();

      showToast({ type: 'success', title: 'First' });
      showToast({ type: 'error', title: 'Second' });
      showToast({ type: 'info', title: 'Third' });

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(3);
    });

    it('accepts optional duration', () => {
      const { showToast } = useToastStore.getState();

      showToast({ type: 'success', title: 'Quick', duration: 2000 });

      const { toasts } = useToastStore.getState();
      expect(toasts[0].duration).toBe(2000);
    });
  });

  describe('hideToast', () => {
    it('removes a specific toast by ID', () => {
      const { showToast, hideToast } = useToastStore.getState();

      const id = showToast({ type: 'success', title: 'To be removed' });
      showToast({ type: 'info', title: 'Keep this' });

      hideToast(id);

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].title).toBe('Keep this');
    });

    it('does nothing if ID not found', () => {
      const { showToast, hideToast } = useToastStore.getState();

      showToast({ type: 'success', title: 'Keep' });

      hideToast('non-existent-id');

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
    });
  });

  describe('clearAllToasts', () => {
    it('removes all toasts', () => {
      const { showToast, clearAllToasts } = useToastStore.getState();

      showToast({ type: 'success', title: 'First' });
      showToast({ type: 'error', title: 'Second' });
      showToast({ type: 'info', title: 'Third' });

      clearAllToasts();

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(0);
    });
  });

  describe('helper functions', () => {
    it('showSuccess adds success toast', () => {
      const { showSuccess } = useToastStore.getState();

      showSuccess('It worked!');

      const { toasts } = useToastStore.getState();
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].title).toBe('It worked!');
    });

    it('showError adds error toast', () => {
      const { showError } = useToastStore.getState();

      showError('Failed', 'Check your connection');

      const { toasts } = useToastStore.getState();
      expect(toasts[0].type).toBe('error');
      expect(toasts[0].title).toBe('Failed');
      expect(toasts[0].message).toBe('Check your connection');
    });
  });
});
