/**
 * FocusToggleButton Tests
 *
 * Tests the FocusToggleButton component which appears when a node is selected
 * and toggles the radial overlay on/off.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FocusToggleButton } from './FocusToggleButton';
import { useCanvasStore } from '../store';

beforeEach(() => {
  useCanvasStore.getState().reset();
});

describe('FocusToggleButton', () => {
  it('renders nothing when no node is selected', () => {
    const { container } = render(<FocusToggleButton />);
    expect(container.firstChild).toBeNull();
  });

  it('renders "Show Map" when a node is selected and overlay is off', () => {
    useCanvasStore.getState().selectNode('node-1');
    render(<FocusToggleButton />);
    expect(screen.getByText('Show Map')).toBeTruthy();
  });

  it('renders "Close Map" when overlay is on', () => {
    useCanvasStore.getState().selectNode('node-1');
    useCanvasStore.getState().toggleRadialOverlay();
    render(<FocusToggleButton />);
    expect(screen.getByText('Close Map')).toBeTruthy();
  });

  it('calls toggleRadialOverlay on click', () => {
    useCanvasStore.getState().selectNode('node-1');
    render(<FocusToggleButton />);
    fireEvent.click(screen.getByText('Show Map'));
    expect(useCanvasStore.getState().showRadialOverlay).toBe(true);
  });
});
