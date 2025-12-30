/**
 * FeatureErrorFallback Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeatureErrorFallback } from './FeatureErrorFallback';

describe('FeatureErrorFallback', () => {
  it('renders feature name and error message', () => {
    const error = new Error('Test feature error');
    const resetError = vi.fn();

    render(
      <FeatureErrorFallback
        error={error}
        featureName="Canvas"
        resetError={resetError}
      />
    );

    expect(screen.getByText('Canvas Error')).toBeDefined();
    expect(screen.getByText('Test feature error')).toBeDefined();
  });

  it('calls resetError when try again button is clicked', () => {
    const error = new Error('Test error');
    const resetError = vi.fn();

    render(
      <FeatureErrorFallback
        error={error}
        featureName="MiniMap"
        resetError={resetError}
      />
    );

    screen.getByText('Try Again').click();

    expect(resetError).toHaveBeenCalled();
  });

  it('displays descriptive message about feature error', () => {
    const error = new Error('Test error');
    const resetError = vi.fn();

    render(
      <FeatureErrorFallback
        error={error}
        featureName="Export"
        resetError={resetError}
      />
    );

    expect(
      screen.getByText(
        'This feature encountered an error and could not be displayed.'
      )
    ).toBeDefined();
  });
});
