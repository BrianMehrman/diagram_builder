/**
 * Toast Store
 *
 * Zustand store for managing toast notifications.
 * Provides centralized toast state and actions following project conventions.
 */

import { create } from 'zustand';

/**
 * Toast type definition
 */
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

/**
 * Toast input (without ID, which is auto-generated)
 */
type ToastInput = Omit<Toast, 'id'>;

/**
 * Toast store state and actions
 */
interface ToastStore {
  // State
  toasts: Toast[];

  // Actions (verb-first naming per project-context.md)
  showToast: (toast: ToastInput) => string;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;

  // Helper actions
  showSuccess: (title: string, message?: string) => string;
  showError: (title: string, message?: string) => string;
}

/**
 * Generate unique ID for toast
 */
function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Toast store
 */
export const useToastStore = create<ToastStore>((set) => ({
  // Initial state
  toasts: [],

  // Actions
  showToast: (toast) => {
    const id = generateId();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    return id;
  },

  hideToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearAllToasts: () => set({ toasts: [] }),

  // Helper actions
  showSuccess: (title, message) => {
    const id = generateId();
    const toast: Toast = { id, type: 'success', title };
    if (message !== undefined) toast.message = message;
    set((state) => ({
      toasts: [...state.toasts, toast],
    }));
    return id;
  },

  showError: (title, message) => {
    const id = generateId();
    const toast: Toast = { id, type: 'error', title };
    if (message !== undefined) toast.message = message;
    set((state) => ({
      toasts: [...state.toasts, toast],
    }));
    return id;
  },
}));
