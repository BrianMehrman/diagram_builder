/**
 * Toast Component
 *
 * Toast notifications using Radix UI Toast primitive.
 *
 * Per UX Design Specification:
 * - Success: Green toast, checkmark icon, 3-5s auto-dismiss
 * - Error: Red toast, warning icon, persists until dismissed
 * - Position: Top-right corner (z-index: 50)
 * - Accessible: role="status"/"alert", aria-live
 */

import * as ToastPrimitive from '@radix-ui/react-toast';
import { useToastStore, type Toast as ToastType } from './toastStore';

/**
 * Toast styling based on type
 */
const toastStyles = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-blue-600',
  warning: 'bg-yellow-600',
};

/**
 * Toast icons based on type
 */
const toastIcons = {
  success: '✓',
  error: '⚠',
  info: 'ℹ',
  warning: '⚠',
};

/**
 * Default durations (error persists until dismissed)
 */
const defaultDurations = {
  success: 5000,
  error: Infinity,
  info: 5000,
  warning: 7000,
};

/**
 * Individual Toast component
 */
interface ToastProps {
  toast: ToastType;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  const isError = toast.type === 'error';
  const duration = toast.duration ?? defaultDurations[toast.type];

  return (
    <ToastPrimitive.Root
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      duration={duration}
      onOpenChange={(open) => {
        if (!open) onDismiss();
      }}
      className={`
        ${toastStyles[toast.type]}
        text-white px-4 py-3 rounded-lg shadow-lg
        flex items-center gap-3
        data-[state=open]:animate-slideIn
        data-[state=closed]:animate-slideOut
        data-[swipe=end]:animate-slideOut
      `}
    >
      {/* Icon */}
      <span className="text-lg flex-shrink-0">{toastIcons[toast.type]}</span>

      {/* Content */}
      <div className="flex-1">
        <ToastPrimitive.Title className="font-semibold">{toast.title}</ToastPrimitive.Title>
        {toast.message && (
          <ToastPrimitive.Description className="text-sm opacity-90 mt-0.5">
            {toast.message}
          </ToastPrimitive.Description>
        )}
      </div>

      {/* Dismiss Button (always show for error, optional for others) */}
      {isError && (
        <ToastPrimitive.Close
          aria-label="Dismiss notification"
          onClick={onDismiss}
          className="text-white/80 hover:text-white p-1 rounded transition-colors"
        >
          ✕
        </ToastPrimitive.Close>
      )}
    </ToastPrimitive.Root>
  );
}

/**
 * Toast Provider Component
 *
 * Wraps the app to provide toast notifications.
 * Renders toasts from the Zustand store.
 */
interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const toasts = useToastStore((state) => state.toasts);
  const hideToast = useToastStore((state) => state.hideToast);

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {children}

      {/* Render all active toasts */}
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={() => hideToast(toast.id)} />
      ))}

      {/* Toast Viewport - where toasts appear */}
      <ToastPrimitive.Viewport
        data-testid="toast-viewport"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-96 max-w-[calc(100vw-2rem)] outline-none"
      />
    </ToastPrimitive.Provider>
  );
}
