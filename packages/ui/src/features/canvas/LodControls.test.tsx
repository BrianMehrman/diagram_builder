/**
 * LodControls Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { LodControls } from './LodControls';
import { useCanvasStore } from './store';

describe('LodControls', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('renders all LOD level buttons', () => {
    render(<LodControls />);

    expect(screen.getByText('Files Only')).toBeDefined();
    expect(screen.getByText('Files + Classes')).toBeDefined();
    expect(screen.getByText('+ Functions')).toBeDefined();
    expect(screen.getByText('+ Methods')).toBeDefined();
    expect(screen.getByText('All Details')).toBeDefined();
  });

  it('shows current LOD level', () => {
    render(<LodControls />);

    expect(screen.getByText('Current Level: 2')).toBeDefined();
  });

  it('changes LOD level on button click', () => {
    render(<LodControls />);

    act(() => {
      screen.getByText('Files Only').click();
    });

    expect(useCanvasStore.getState().lodLevel).toBe(0);
  });

  it('highlights active LOD level', () => {
    render(<LodControls />);

    const activeButton = screen.getByText('+ Functions');
    expect(activeButton.className).toContain('bg-primary-600');
  });

  it('updates when LOD level changes', () => {
    render(<LodControls />);

    act(() => {
      screen.getByText('All Details').click();
    });

    expect(screen.getByText('Current Level: 4')).toBeDefined();
  });
});
