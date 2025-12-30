/**
 * CameraControls Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { act } from 'react';
import { CameraControls } from './CameraControls';
import { useCanvasStore } from './store';

describe('CameraControls', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('renders camera control buttons', () => {
    render(<CameraControls />);

    expect(screen.getByTitle('Top View')).toBeDefined();
    expect(screen.getByTitle('Front View')).toBeDefined();
    expect(screen.getByTitle('Side View')).toBeDefined();
    expect(screen.getByTitle('Zoom In')).toBeDefined();
    expect(screen.getByTitle('Zoom Out')).toBeDefined();
    expect(screen.getByTitle('Reset Camera')).toBeDefined();
  });

  it('changes camera position on top view click', () => {
    render(<CameraControls />);

    act(() => {
      screen.getByTitle('Top View').click();
    });

    const { camera } = useCanvasStore.getState();
    expect(camera.position).toEqual({ x: 0, y: 20, z: 0 });
    expect(camera.target).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('changes camera position on front view click', () => {
    render(<CameraControls />);

    act(() => {
      screen.getByTitle('Front View').click();
    });

    const { camera } = useCanvasStore.getState();
    expect(camera.position).toEqual({ x: 0, y: 5, z: 15 });
  });

  it('changes camera position on side view click', () => {
    render(<CameraControls />);

    act(() => {
      screen.getByTitle('Side View').click();
    });

    const { camera } = useCanvasStore.getState();
    expect(camera.position).toEqual({ x: 15, y: 5, z: 0 });
  });

  it('increases zoom on zoom in click', () => {
    render(<CameraControls />);

    act(() => {
      screen.getByTitle('Zoom In').click();
    });

    const { camera } = useCanvasStore.getState();
    expect(camera.zoom).toBeGreaterThan(1);
  });

  it('decreases zoom on zoom out click', () => {
    render(<CameraControls />);

    act(() => {
      screen.getByTitle('Zoom Out').click();
    });

    const { camera } = useCanvasStore.getState();
    expect(camera.zoom).toBeLessThan(1);
  });

  it('resets camera on reset click', () => {
    render(<CameraControls />);

    // Change camera state
    useCanvasStore.getState().setCameraPosition({ x: 100, y: 100, z: 100 });

    // Click reset
    act(() => {
      screen.getByTitle('Reset Camera').click();
    });

    const { camera } = useCanvasStore.getState();
    expect(camera.position).toEqual({ x: 0, y: 5, z: 10 });
  });
});
