/**
 * GlobalErrorFallback Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlobalErrorFallback } from './GlobalErrorFallback';

describe('GlobalErrorFallback', () => {
  it('renders error message', () => {
    const error = new Error('Test global error');
    const resetError = vi.fn();

    render(<GlobalErrorFallback error={error} resetError={resetError} />);

    expect(screen.getByText('Application Error')).toBeDefined();
    expect(screen.getByText('Test global error')).toBeDefined();
  });

  it('calls resetError when reload button is clicked', () => {
    const error = new Error('Test error');
    const resetError = vi.fn();

    render(<GlobalErrorFallback error={error} resetError={resetError} />);

    screen.getByText('Reload Application').click();

    expect(resetError).toHaveBeenCalled();
  });

  it('displays stack trace in details section', () => {
    const error = new Error('Test error');
    error.stack = 'Error: Test error\n    at Component';
    const resetError = vi.fn();

    render(<GlobalErrorFallback error={error} resetError={resetError} />);

    expect(screen.getByText('Stack Trace')).toBeDefined();
  });
});
