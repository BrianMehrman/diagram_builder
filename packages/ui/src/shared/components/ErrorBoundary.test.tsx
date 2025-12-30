/**
 * ErrorBoundary Tests
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

/**
 * Component that throws an error for testing
 */
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeDefined();
  });

  it('renders default fallback when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeDefined();
    expect(screen.getByText('Test error')).toBeDefined();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary
        fallback={(error) => <div>Custom fallback: {error.message}</div>}
      >
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom fallback: Test error')).toBeDefined();
  });

  it('calls onError handler when error occurs', () => {
    const onError = vi.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Test error' }),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('resets error when reset function is called', () => {
    const { rerender } = render(
      <ErrorBoundary
        fallback={(error, resetError) => (
          <div>
            <div>Error: {error.message}</div>
            <button onClick={resetError}>Reset</button>
          </div>
        )}
      >
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error state is shown
    expect(screen.getByText('Error: Test error')).toBeDefined();

    // Click reset button
    screen.getByText('Reset').click();

    // Re-render with no error
    rerender(
      <ErrorBoundary
        fallback={(error, resetError) => (
          <div>
            <div>Error: {error.message}</div>
            <button onClick={resetError}>Reset</button>
          </div>
        )}
      >
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Should show normal content
    expect(screen.getByText('No error')).toBeDefined();
  });
});
